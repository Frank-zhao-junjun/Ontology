/** FE-007: 与后端 error_code 对齐的简短中文说明（MVP） */
export const ERROR_MESSAGES_ZH: Record<string, string> = {
  P4031: "权限不足，该操作已被拦截。",
  A4011: "未登录或缺少 Authorization Bearer 令牌。",
  A4012: "令牌无效或已过期，请重新登录。",
  A4013: "用户名或密码错误。",
  A4014: "无法解析当前用户。",
  A4002: "请求参数无效。",
  A4092: "手动重试次数已达上限。",
  M5001: "服务器内部错误。",
  R4001: "规则校验未通过。",
  S4001: "会话或状态无效。",
};

export function errorMessageForCode(code: string | null | undefined): string | null {
  if (!code) return null;
  return ERROR_MESSAGES_ZH[code] ?? null;
}
