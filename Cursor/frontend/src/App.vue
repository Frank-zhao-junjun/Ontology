<script setup lang="ts">
import { ref, watch } from "vue";
import { useChat } from "@/composables/useChat";
import { useAuth } from "@/composables/useAuth";
import { useActionProtocol } from "@/composables/useActionProtocol";
import type { UiState } from "@/composables/useActionProtocol";
import ThreeColumnLayout from "@/components/ThreeColumnLayout.vue";
import ChatPanel from "@/components/ChatPanel.vue";
import ContentPanel from "@/components/ContentPanel.vue";
import ContextPanel from "@/components/ContextPanel.vue";
import LoginPanel from "@/components/LoginPanel.vue";

const auth = useAuth();
const sessionId = ref("web-" + Math.random().toString(36).slice(2, 10));
const chat = useChat(sessionId.value, () => auth.authHeaders());

const ui = ref<UiState>({
  currentPath: "/welcome",
  focusEntity: null,
  degraded: false,
  lastMessages: [],
  chartConfig: null,
});

const { applyActions } = useActionProtocol(ui);

watch(
  () => chat.messages.value.length,
  () => {
    ui.value.lastMessages = chat.messages.value.slice(-5).map((m) => m.text);
  },
  { immediate: true }
);

async function doLogin(username: string, password: string) {
  const r = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await r.json();
  const access = data.access_token ?? data.token;
  if (!r.ok || !access) {
    return {
      ok: false as const,
      error: data.error?.code ?? data.error_code ?? "A4013",
    };
  }
  auth.setSession(access, data.user ?? { username });
  return { ok: true as const };
}

async function onSend(text: string) {
  const r = await chat.send(text);
  if (r?.ok && r.data) {
    if (r.data.degraded) ui.value.degraded = true;
    const actions = r.data.actions;
    if (Array.isArray(actions)) applyActions(actions);
  }
}
</script>

<template>
  <LoginPanel v-if="!auth.isAuthenticated.value" :on-login="doLogin" />
  <ThreeColumnLayout v-else>
    <template #left>
      <ChatPanel
        :messages="chat.messages.value"
        :loading="chat.loading.value"
        :error="chat.error.value"
        :llm-available="chat.llmAvailable.value"
        :user-label="auth.user.value?.username"
        @send="onSend"
        @toggle-llm="chat.llmAvailable.value = !chat.llmAvailable.value"
        @logout="auth.logout()"
      />
    </template>
    <template #center>
      <ContentPanel
        :path="ui.currentPath"
        :chart-config="ui.chartConfig"
        :auth-token="auth.token.value"
        @navigate="(p) => (ui.currentPath = p)"
      />
    </template>
    <template #right>
      <ContextPanel
        :focus="ui.focusEntity"
        :degraded="ui.degraded || !chat.llmAvailable.value"
        :snippets="ui.lastMessages"
        :trace-id="chat.lastTraceId.value"
        :role="auth.user.value?.role"
      />
    </template>
  </ThreeColumnLayout>
</template>

<style>
  * {
    box-sizing: border-box;
  }
  html,
  body,
  #app {
    height: 100%;
    margin: 0;
    font-family: system-ui, sans-serif;
  }
</style>
