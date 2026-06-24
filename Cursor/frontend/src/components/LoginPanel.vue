<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  onLogin: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
}>();

const username = ref("operator");
const password = ref("");
const err = ref<string | null>(null);
const loading = ref(false);

async function submit() {
  err.value = null;
  loading.value = true;
  try {
    const r = await props.onLogin(username.value.trim(), password.value);
    if (!r.ok) err.value = r.error ?? "登录失败";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login">
    <div class="card">
      <h1>登录</h1>
      <p class="hint">
        <strong>Cursor 后端</strong>：operator / Operator!dev1 等见 Cursor README。
        <strong>Ontology 根后端（1900 全量）</strong>：admin / admin123。生产环境请修改默认密码。
      </p>
      <form @submit.prevent="submit">
        <label>用户名</label>
        <input v-model="username" autocomplete="username" />
        <label>密码</label>
        <input v-model="password" type="password" autocomplete="current-password" />
        <p v-if="err" class="err">{{ err }}</p>
        <button type="submit" :disabled="loading">{{ loading ? "…" : "登录" }}</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}
.card {
  width: 360px;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}
h1 {
  margin: 0 0 8px;
  font-size: 20px;
}
.hint {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 16px;
}
label {
  display: block;
  font-size: 12px;
  color: #475569;
  margin-bottom: 4px;
}
input {
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-sizing: border-box;
}
button {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
button:disabled {
  opacity: 0.6;
}
.err {
  color: #b91c1c;
  font-size: 13px;
  margin: 0;
}
</style>
