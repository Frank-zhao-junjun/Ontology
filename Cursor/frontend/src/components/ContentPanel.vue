<script setup lang="ts">
import ChartBlock from "@/components/ChartBlock.vue";
import DomainPanel from "@/components/DomainPanel.vue";
import MultiEntityWorkbench from "@/components/MultiEntityWorkbench.vue";
import type { ChartPayload } from "@/types/action-protocol";

/** FE-004: 最小合同域页面占位；FE-006: 图表区；多实体域 */
defineProps<{
  path: string;
  chartConfig?: ChartPayload | null;
  authToken?: string | null;
}>();
const emit = defineEmits<{ navigate: [path: string] }>();
</script>

<template>
  <div class="content">
    <nav class="tabs">
      <button :class="{ on: path === '/welcome' }" @click="emit('navigate', '/welcome')">
        欢迎
      </button>
      <button :class="{ on: path === '/contracts' }" @click="emit('navigate', '/contracts')">
        合同列表
      </button>
      <button
        :class="{ on: path.startsWith('/contracts/') }"
        @click="emit('navigate', '/contracts/demo-1')"
      >
        合同详情
      </button>
      <button :class="{ on: path === '/domain' }" @click="emit('navigate', '/domain')">
        多实体域
      </button>
      <button :class="{ on: path === '/workbench' }" @click="emit('navigate', '/workbench')">
        五实体联调
      </button>
    </nav>

    <section v-if="path === '/welcome'" class="panel">
      <h1>欢迎</h1>
      <p>三栏混合交互骨架。左侧对话，中间结构化内容，右侧上下文。</p>
      <ChartBlock v-if="chartConfig" :chart="chartConfig" class="chart-slot" />
      <p v-else class="hint">在对话中输入「分析」「图表」等可触发示例柱状图（需后端 chart_tool）。</p>
    </section>

    <section v-else-if="path === '/domain'" class="panel">
      <h1>多实体完整域</h1>
      <p class="hint">发布含 Contract / Invoice / Customer 的快照后，可在此试跑写路径。</p>
      <DomainPanel :token="authToken ?? null" />
    </section>

    <section v-else-if="path === '/workbench'" class="panel">
      <MultiEntityWorkbench :token="authToken ?? null" />
    </section>

    <section v-else-if="path === '/contracts'" class="panel">
      <h1>合同列表</h1>
      <table class="tbl">
        <thead>
          <tr>
            <th>编号</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>demo-1</td>
            <td>draft</td>
          </tr>
        </tbody>
      </table>
      <p class="hint">数据来自后端 API 的下一步对接。</p>
    </section>

    <section v-else class="panel">
      <h1>合同详情</h1>
      <p>ID: {{ path.split('/').pop() }}</p>
      <p class="hint">表单与受控写路径对接 <code>/api/domain/validate-and-transition</code>。</p>
    </section>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.tabs button {
  padding: 6px 10px;
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.tabs button.on {
  border-color: #6366f1;
  background: #eef2ff;
}
.panel h1 {
  font-size: 18px;
  margin: 0 0 8px;
}
.tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.tbl th,
.tbl td {
  border: 1px solid #e2e8f0;
  padding: 8px;
  text-align: left;
}
.hint {
  font-size: 12px;
  color: #64748b;
  margin-top: 12px;
}
.chart-slot {
  margin-top: 16px;
  max-width: 480px;
}
</style>
