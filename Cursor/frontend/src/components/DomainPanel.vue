<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  token: string | null;
}>();

const entityTypes = ref<string[]>([]);
const loading = ref(false);
const msg = ref<string | null>(null);
const lastResult = ref<string | null>(null);

const actions: Record<string, { action: string; payload: Record<string, number> }> = {
  Contract: { action: "sign", payload: { amount: 100 } },
  Invoice: { action: "issue", payload: { total: 50 } },
  Customer: { action: "activate", payload: { credit_score: 80 } },
};

async function loadTypes() {
  loading.value = true;
  msg.value = null;
  try {
    const r = await fetch("/api/domain/entity-types", {
      headers: props.token ? { Authorization: `Bearer ${props.token}` } : {},
    });
    const j = await r.json();
    if (!r.ok) {
      msg.value = j.error_code ?? "无法加载实体类型（需先发布元模型）";
      entityTypes.value = [];
      return;
    }
    entityTypes.value = j.entity_types ?? [];
  } catch (e) {
    msg.value = String(e);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.token,
  () => {
    loadTypes();
  },
  { immediate: true }
);

async function runDemo(et: string) {
  lastResult.value = null;
  const cfg = actions[et] ?? { action: "save", payload: {} };
  const id = `demo-${et}-${Date.now().toString(36)}`;
  const r = await fetch("/api/domain/validate-and-transition", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(props.token ? { Authorization: `Bearer ${props.token}` } : {}),
    },
    body: JSON.stringify({
      entity_type: et,
      entity_id: id,
      action: cfg.action,
      payload: cfg.payload,
    }),
  });
  const j = await r.json();
  lastResult.value = JSON.stringify(j, null, 2);
  if (!r.ok) msg.value = j.error_code ?? r.statusText;
  else msg.value = null;
}
</script>

<template>
  <div class="domain">
    <h2>领域写路径（多实体）</h2>
    <p class="hint">
      需已发布含 Contract / Invoice / Customer 的快照。operator 以上角色可执行；
      viewer 仅只读（无写权限）。
    </p>
    <p v-if="loading">加载实体类型…</p>
    <p v-else-if="msg && !entityTypes.length" class="warn">{{ msg }}</p>
    <ul v-else class="et-list">
      <li v-for="et in entityTypes" :key="et">
        <span>{{ et }}</span>
        <button type="button" @click="runDemo(et)">试转一步</button>
      </li>
    </ul>
    <p v-if="msg && entityTypes.length" class="warn">{{ msg }}</p>
    <pre v-if="lastResult" class="out">{{ lastResult }}</pre>
  </div>
</template>

<style scoped>
.domain {
  margin-top: 16px;
  padding: 12px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: #fafafa;
}
h2 {
  margin: 0 0 8px;
  font-size: 16px;
}
.hint {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 12px;
}
.et-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.et-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
}
.et-list button {
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid #6366f1;
  background: #eef2ff;
  cursor: pointer;
}
.warn {
  color: #b45309;
  font-size: 12px;
}
.out {
  font-size: 11px;
  overflow: auto;
  max-height: 160px;
  background: #1e293b;
  color: #e2e8f0;
  padding: 8px;
  border-radius: 6px;
}
</style>
