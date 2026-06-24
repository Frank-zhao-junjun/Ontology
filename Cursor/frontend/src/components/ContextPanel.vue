<script setup lang="ts">
defineProps<{
  focus: { type?: string; id?: string } | null;
  degraded: boolean;
  snippets: string[];
  traceId: string | null;
  role?: string;
}>();
</script>

<template>
  <div class="ctx">
    <h2>上下文</h2>
    <p v-if="role" class="role">角色：{{ role }}</p>
    <p v-if="degraded" class="banner">降级模式：结构化操作仍可用。</p>
    <div v-if="focus" class="box">
      <div class="label">聚焦实体</div>
      <code>{{ focus.type }} / {{ focus.id }}</code>
    </div>
    <div v-if="traceId" class="box">
      <div class="label">Trace</div>
      <code>{{ traceId }}</code>
    </div>
    <div class="box">
      <div class="label">最近消息</div>
      <ul>
        <li v-for="(s, i) in snippets" :key="i">{{ s.slice(0, 80) }}…</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
h2 {
  font-size: 14px;
  margin: 0 0 8px;
}
.role {
  font-size: 12px;
  color: #475569;
  margin: 0 0 8px;
}
.banner {
  background: #fef3c7;
  color: #92400e;
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
}
.box {
  margin-top: 10px;
  font-size: 12px;
}
.label {
  color: #64748b;
  margin-bottom: 4px;
}
ul {
  padding-left: 16px;
  margin: 0;
}
</style>
