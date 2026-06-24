import { ref, computed } from "vue";
import { errorMessageForCode } from "@/lib/errorCodes";

export function useChat(
  sessionId: string,
  getExtraHeaders?: () => Record<string, string>
) {
  const messages = ref<{ role: "user" | "assistant"; text: string; traceId?: string }[]>(
    []
  );
  const loading = ref(false);
  const error = ref<string | null>(null);
  const llmAvailable = ref(true);
  const lastTraceId = ref<string | null>(null);

  const headers = computed(() => {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      ...(getExtraHeaders?.() ?? {}),
    };
    if (!llmAvailable.value) {
      h["X-LLM-Available"] = "false";
    }
    if (lastTraceId.value) {
      h["X-Trace-Id"] = lastTraceId.value;
    }
    return h;
  });

  async function send(message: string) {
    loading.value = true;
    error.value = null;
    messages.value.push({ role: "user", text: message });
    try {
      const res = await fetch("/api/chat/execute", {
        method: "POST",
        headers: headers.value,
        body: JSON.stringify({
          session_id: sessionId,
          message,
          ui_context: {},
        }),
      });
      const tid = res.headers.get("X-Trace-Id");
      if (tid) lastTraceId.value = tid;
      const data = await res.json();
      const code = data.error_code as string | undefined;
      if (code) {
        error.value = errorMessageForCode(code) ?? code;
      } else {
        error.value = null;
      }
      if (!res.ok) {
        if (!code) error.value = data.error ?? res.statusText;
        return { ok: false as const, data };
      }
      messages.value.push({
        role: "assistant",
        text: data.assistant_message ?? JSON.stringify(data),
        traceId: data.trace_id ?? tid ?? undefined,
      });
      return { ok: true as const, data };
    } catch (e) {
      error.value = String(e);
      return { ok: false as const, data: null };
    } finally {
      loading.value = false;
    }
  }

  async function retryManual(messageId: string) {
    const res = await fetch("/api/chat/retry", {
      method: "POST",
      headers: headers.value,
      body: JSON.stringify({ message_id: messageId, reason: "user" }),
    });
    return res.json();
  }

  return {
    messages,
    loading,
    error,
    llmAvailable,
    lastTraceId,
    send,
    retryManual,
  };
}
