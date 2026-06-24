function MessageBubble({ role, content }: { role: 'user'|'ai'; content: string }) {
  return <div style={{ marginBottom: 12, padding: 8, borderRadius: 8,
    background: role==='user'?'#e6f7ff':'#f6f6f6', textAlign: role==='user'?'right':'left' }}>
    <strong>{role==='user'?'You':'AI'}:</strong> {content}
  </div>;
}

export default MessageBubble;
