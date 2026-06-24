<script setup lang="ts">
import type { ChartPayload } from "@/types/action-protocol";

const props = defineProps<{ chart: ChartPayload }>();

const maxVal = () => {
  const vs = props.chart.values ?? [];
  if (!vs.length) return 1;
  return Math.max(...vs.map((v) => Math.abs(v)), 1);
};
</script>

<template>
  <div class="chart">
    <h3 v-if="chart.title" class="title">{{ chart.title }}</h3>
    <div class="bars" role="img" :aria-label="chart.title ?? 'chart'">
      <div
        v-for="(label, i) in chart.labels"
        :key="i"
        class="row"
      >
        <span class="lab">{{ label }}</span>
        <div class="track">
          <div
            class="bar"
            :style="{
              width: `${(100 * (chart.values[i] ?? 0)) / maxVal()}%`,
            }"
          />
        </div>
        <span class="num">{{ chart.values[i] ?? 0 }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}
.title {
  margin: 0 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}
.bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.row {
  display: grid;
  grid-template-columns: 72px 1fr 36px;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}
.lab {
  color: #475569;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.track {
  height: 14px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}
.bar {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #818cf8);
  border-radius: 4px;
  min-width: 2px;
  transition: width 0.25s ease;
}
.num {
  text-align: right;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
</style>
