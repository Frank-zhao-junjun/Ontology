// Supabase 数据库客户端
// 使用项目注入的安全环境变量 COZE_SUPABASE_URL 和 COZE_SUPABASE_ANON_KEY

import { createClient } from '@supabase/supabase-js';

/**
 * 检查是否配置了 Supabase 环境变量
 */
export function hasSupabaseConfig(): boolean {
  return !!(process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY);
}

// Supabase 客户端单例
let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * 获取 Supabase 客户端实例（安全版本 - 返回 null 而不是抛出错误）
 */
export function getSupabaseClient() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.COZE_SUPABASE_URL!,
      process.env.COZE_SUPABASE_ANON_KEY!
    );
  }

  return supabaseClient;
}

/**
 * 同步版本 - 仅用于已确认有环境变量的场景
 * @deprecated 使用 getSupabaseClient() 替代
 */
export function getSupabaseClientSync() {
  if (!process.env.COZE_SUPABASE_URL || !process.env.COZE_SUPABASE_ANON_KEY) {
    throw new Error('COZE_SUPABASE_URL is not set');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.COZE_SUPABASE_URL,
      process.env.COZE_SUPABASE_ANON_KEY
    );
  }

  return supabaseClient;
}
