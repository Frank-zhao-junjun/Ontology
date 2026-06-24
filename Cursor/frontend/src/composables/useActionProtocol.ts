import { ref, type Ref } from "vue";
import {
  ACTION_PROTOCOL_VERSION,
  type ChartPayload,
  type ChatAction,
  normalizeAction,
} from "@/types/action-protocol";

export interface UiState {
  currentPath: string;
  focusEntity: { type?: string; id?: string } | null;
  degraded: boolean;
  lastMessages: string[];
  /** 最近一次 RENDER_CHART 的载荷 */
  chartConfig: ChartPayload | null;
}

export function useActionProtocol(ui: Ref<UiState>) {
  const unknownActions = ref<string[]>([]);

  function applyActions(rawList: unknown[]) {
    for (const raw of rawList) {
      if (!raw || typeof raw !== "object") continue;
      const a = normalizeAction(raw as Record<string, unknown>);
      if (!a) continue;
      switch (a.type) {
        case "NAVIGATE":
          ui.value.currentPath = (a as { path?: string }).path ?? "/";
          break;
        case "FOCUS_ENTITY":
          ui.value.focusEntity = {
            type: (a as { entityType?: string }).entityType,
            id: (a as { entityId?: string }).entityId,
          };
          break;
        case "SHOW_UI_ONLY":
          ui.value.degraded = true;
          break;
        case "RENDER_CHART":
          ui.value.chartConfig = (a as { chart?: ChartPayload }).chart ?? null;
          break;
        default:
          unknownActions.value.push(String((a as { type?: string }).type ?? "?"));
      }
    }
  }

  function coerceServerActions(actions: unknown[]): ChatAction[] {
    return actions
      .map((x) =>
        typeof x === "object" && x !== null
          ? normalizeAction(x as Record<string, unknown>)
          : null
      )
      .filter((x): x is ChatAction => x !== null);
  }

  return {
    ACTION_PROTOCOL_VERSION,
    applyActions,
    coerceServerActions,
    unknownActions,
  };
}
