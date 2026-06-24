<script setup lang="ts">
/**
 * 对齐 1900：合同 + 客户/员工/产品/发票 最小联调（需 Ontology 根目录 backend，端口与 Vite 代理一致）。
 */
import { ref, computed } from "vue";

const props = defineProps<{
  token: string | null;
}>();

type EntityTab = "contract" | "customer" | "employee" | "product" | "invoice";

const tab = ref<EntityTab>("customer");
const loading = ref(false);
const msg = ref<string | null>(null);
const listJson = ref<string>("");
const raw = ref("");

const headers = computed(() =>
  props.token ? { Authorization: `Bearer ${props.token}`, "Content-Type": "application/json" } : {}
);

async function refreshList() {
  msg.value = null;
  loading.value = true;
  listJson.value = "";
  try {
    if (tab.value === "contract") {
      const r = await fetch("/api/contracts", { headers: headers.value });
      listJson.value = JSON.stringify(await r.json(), null, 2);
      if (!r.ok) msg.value = `HTTP ${r.status}`;
    } else {
      const r = await fetch(`/api/entities/${tab.value}`, { headers: headers.value });
      listJson.value = JSON.stringify(await r.json(), null, 2);
      if (!r.ok) msg.value = `HTTP ${r.status}`;
    }
  } catch (e) {
    msg.value = String(e);
  } finally {
    loading.value = false;
  }
}

async function demoCreate() {
  msg.value = null;
  loading.value = true;
  const suffix = Date.now().toString(36);
  try {
    if (tab.value === "contract") {
      const body = {
        id: `FE-C-${suffix}`,
        contract_no: `CN-${suffix}`,
        title: "Demo",
        counterparty: "Demo",
        amount: 1,
      };
      const r = await fetch("/api/contracts", {
        method: "POST",
        headers: headers.value,
        body: JSON.stringify(body),
      });
      raw.value = JSON.stringify(await r.json(), null, 2);
      if (!r.ok) msg.value = `HTTP ${r.status}`;
    } else {
      const bodies: Record<Exclude<EntityTab, "contract">, Record<string, unknown>> = {
        customer: {
          id: `FE-CU-${suffix}`,
          customer_no: `CU-${suffix}`,
          name: "Demo Customer",
          industry: "IT",
        },
        employee: {
          id: `FE-EM-${suffix}`,
          employee_no: `EM-${suffix}`,
          name: "Demo Employee",
          department: "HQ",
          job_title: "Dev",
        },
        product: {
          id: `FE-PD-${suffix}`,
          product_no: `PD-${suffix}`,
          name: "Demo SKU",
          category: "Svc",
          price: 9.99,
        },
        invoice: {
          id: `FE-IV-${suffix}`,
          invoice_no: `IV-${suffix}`,
          customer_id: "placeholder",
          amount: 9.99,
        },
      } as const;
      if (tab.value === "invoice") {
        msg.value =
          "发票需有效 customer_id：请先在「客户」页创建客户，再把上面 JSON 里 customer_id 换成真实 ID。";
        loading.value = false;
        return;
      }
      const r = await fetch(`/api/entities/${tab.value}`, {
        method: "POST",
        headers: headers.value,
        body: JSON.stringify(bodies[tab.value]),
      });
      raw.value = JSON.stringify(await r.json(), null, 2);
      if (!r.ok) msg.value = `HTTP ${r.status}`;
    }
    await refreshList();
  } catch (e) {
    msg.value = String(e);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="workbench">
    <h2>多实体联调（1900）</h2>
    <p class="hint">
      请启动 <strong>D:\AI\Ontology</strong> 根目录后端：<code>python backend/app.py</code>（与 Vite 代理
      <code>127.0.0.1:5000</code> 一致）。默认账号示例：<code>admin</code> /
      <code>admin123</code>。若使用 Cursor 独立后端，部分路径可能不一致。
    </p>
    <div class="tabs">
      <button :class="{ on: tab === 'contract' }" type="button" @click="tab = 'contract'">合同</button>
      <button :class="{ on: tab === 'customer' }" type="button" @click="tab = 'customer'">客户</button>
      <button :class="{ on: tab === 'employee' }" type="button" @click="tab = 'employee'">员工</button>
      <button :class="{ on: tab === 'product' }" type="button" @click="tab = 'product'">产品</button>
      <button :class="{ on: tab === 'invoice' }" type="button" @click="tab = 'invoice'">发票</button>
    </div>
    <div class="row">
      <button type="button" :disabled="loading || !token" @click="refreshList">刷新列表</button>
      <button type="button" :disabled="loading || !token" @click="demoCreate">试建一条（演示）</button>
    </div>
    <p v-if="msg" class="warn">{{ msg }}</p>
    <p v-if="loading">请求中…</p>
    <pre v-if="listJson" class="block">{{ listJson }}</pre>
    <pre v-if="raw" class="block small">上次写入响应：{{ raw }}</pre>
  </div>
</template>

<style scoped>
.workbench {
  margin-top: 12px;
}
h2 {
  font-size: 16px;
  margin: 0 0 8px;
}
.hint {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 12px;
  line-height: 1.5;
}
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.tabs button {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}
.tabs button.on {
  border-color: #6366f1;
  background: #eef2ff;
}
.row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.row button {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #6366f1;
  background: #eef2ff;
  cursor: pointer;
  font-size: 12px;
}
.warn {
  color: #b45309;
  font-size: 12px;
}
.block {
  font-size: 11px;
  overflow: auto;
  max-height: 220px;
  background: #0f172a;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 8px;
}
.block.small {
  max-height: 120px;
  margin-top: 8px;
  background: #1e293b;
}
</style>
