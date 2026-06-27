declare module '@anthropic-ai/markitdown' {
  class MarkItDown {
    constructor();
    convert(input: Buffer): Promise<{ textContent?: string }>;
  }
  export { MarkItDown };
  export default MarkItDown;
}
