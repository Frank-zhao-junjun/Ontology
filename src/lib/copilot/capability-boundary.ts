export type BoundaryIntent = 'export' | 'delete' | 'unknown';

const BOUNDARY_MESSAGES: Record<BoundaryIntent, string> = {
  export:
    'Copilot 暂不支持导出操作。请使用工作台顶部的「导出」菜单导出 Manifest 或 Excel。',
  delete:
    'Copilot 不执行任何删除操作。请在左侧业务链或要素库中手动删除模块/要素。',
  unknown:
    '当前请求超出 Copilot 建模能力范围。你可以尝试：创建价值域/能力/场景/EPC、修改模块描述、口述或上传文档生成 EPC 步骤与要素。所有写入均为草稿，请在左侧确认。',
};

export function buildBoundaryReply(intent: BoundaryIntent): string {
  return BOUNDARY_MESSAGES[intent];
}
