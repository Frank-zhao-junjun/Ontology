/**
 * Convert PPT/PPTX buffer to markdown via MarkItDown when available.
 * Falls back with a clear error when MarkItDown is not installed or fails.
 */
export async function convertPptxToMarkdown(buffer: Buffer): Promise<string> {
  try {
    const markitdown = await import('@anthropic-ai/markitdown').catch(() => null);
    if (!markitdown) {
      throw new Error(
        'PPTX 解析需要 MarkItDown（@anthropic-ai/markitdown），当前环境未安装。请安装依赖或使用 docx/pdf/txt 格式。',
      );
    }

    const MarkItDown =
      (markitdown as { MarkItDown?: new () => { convert: (input: Buffer) => Promise<{ textContent?: string }> } })
        .MarkItDown ??
      (markitdown as { default?: new () => { convert: (input: Buffer) => Promise<{ textContent?: string }> } })
        .default;

    if (!MarkItDown) {
      throw new Error('MarkItDown 模块加载失败：未找到 MarkItDown 构造函数');
    }

    const converter = new MarkItDown();
    const result = await converter.convert(buffer);
    const text = result?.textContent?.trim();
    if (!text) {
      throw new Error('MarkItDown 未从 PPTX 提取到文本内容');
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.message.includes('MarkItDown')) {
      throw err;
    }
    throw new Error(
      `PPTX 解析失败: ${err instanceof Error ? err.message : '未知错误'}。请确认 MarkItDown 已正确安装。`,
    );
  }
}
