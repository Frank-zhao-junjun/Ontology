/**
 * FE-001: 动作协议 v1（含 version 字段）
 * 对齐 LLD：可扩展；未知类型安全忽略并记录。
 */
export const ACTION_PROTOCOL_VERSION = 1 as const;

export type ActionType =
  | "OPEN"
  | "NAVIGATE"
  | "REFRESH"
  | "FOCUS_ENTITY"
  | "RENDER_CHART"
  | "SHOW_MESSAGE"
  | "SHOW_UI_ONLY";

export interface BaseAction {
  type: ActionType;
  version: typeof ACTION_PROTOCOL_VERSION;
}

export interface NavigateAction extends BaseAction {
  type: "NAVIGATE";
  path?: string;
}

export interface FocusEntityAction extends BaseAction {
  type: "FOCUS_ENTITY";
  entityType?: string;
  entityId?: string;
}

export interface ShowUiOnlyAction extends BaseAction {
  type: "SHOW_UI_ONLY";
}

/** FE-006: 柱状图载荷（与后端 chart_tool 桩对齐） */
export interface ChartPayload {
  type: "bar" | "line";
  title?: string;
  labels: string[];
  values: number[];
}

export interface RenderChartAction extends BaseAction {
  type: "RENDER_CHART";
  chart?: ChartPayload;
}

export type ChatAction =
  | NavigateAction
  | FocusEntityAction
  | ShowUiOnlyAction
  | RenderChartAction
  | BaseAction;

export function normalizeAction(raw: Record<string, unknown>): ChatAction | null {
  const v = raw.version;
  if (v !== undefined && v !== ACTION_PROTOCOL_VERSION) {
    console.warn("[action-protocol] unsupported version", v);
    return null;
  }
  const t = raw.type as ActionType | undefined;
  if (!t) return null;
  return { ...raw, type: t, version: ACTION_PROTOCOL_VERSION } as ChatAction;
}
