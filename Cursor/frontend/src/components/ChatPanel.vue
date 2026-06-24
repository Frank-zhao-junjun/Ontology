<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  messages: { role: string; text: string; traceId?: string }[];
  loading: boolean;
  error: string | null;
  llmAvailable: boolean;
  userLabel?: string;
}>();

const emit = defineEmits<{
  send: [text: string];
  "toggle-llm": [];
  logout: [];
}>();

const input = ref("");

function submit() {
  const t = input.value.trim();
  if (!t) return;
  emit("send", t);
  input.value = "";
}
</script>

<template>
  <div class="chat">
    <header class="hdr">
      <div class="who">
        <strong>对话</strong>
        <span v-if="userLabel" class="user">{{ userLabel }}</span>
        <button type="button" class="out" @click="emit('logout')">退出</button>
      </div>
      <label class="llm">
        <input
          type="checkbox"
          :checked="llmAvailable"
          @change="emit('toggle-llm')"
        />
        LLM 可用
      </label>
    </header>
    <p v-if="!llmAvailable" class="warn">已关闭 LLM（将发送 X-LLM-Available: false，纯 UI 降级）。</p>
    <div class="msgs">
      <div
        v-for="(m, i) in messages"
        :key="i"
        :class="['bubble', m.role]"
      >
        {{ m.text }}
        <span v-if="m.traceId" class="tid">{{ m.traceId.slice(0, 8) }}…</span>
      </div>
    </div>
    <p v-if="error" class="err">{{ error }}</p>
    <form class="row" @submit.prevent="submit">
      <input v-model="input" :disabled="loading" placeholder="输入…" />
      <button type="submit" :disabled="loading">发送</button>
    </form>
  </div>
</template>

<style scoped>
.hdr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.who {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user {
  font-size: 11px;
  color: #64748b;
}
.out {
  font-size: 11px;
  padding: 2px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}
.llm {
  font-size: 12px;
  font-weight: normal;
}
.warn {
  font-size: 12px;
  color: #b45309;
  background: #fffbeb;
  padding: 6px;
  border-radius: 6px;
}
.msgs {
  min-height: 200px;
  max-height: 50vh;
  overflow: auto;
  margin-bottom: 8px;
}
.bubble {
  padding: 8px;
  border-radius: 8px;
  margin-bottom: 6px;
  font-size: 14px;
}
.bubble.user {
  background: #e0e7ff;
}
.bubble.assistant {
  background: #f1f5f9;
}
.tid {
  display: block;
  font-size: 10px;
  color: #64748b;
}
.err {
  color: #b91c1c;
  font-size: 12px;
}
.row {
  display: flex;
  gap: 8px;
}
.row input {
  flex: 1;
  padding: 8px;
}
.row button {
  padding: 8px 12px;
}
</style>
