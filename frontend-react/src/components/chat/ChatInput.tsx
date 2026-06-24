import { useState } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';

function ChatInput({ onSend, disabled }: { onSend: (t: string) => void; disabled?: boolean }) {
  const [t, setT] = useState('');
  const send = () => { if (t.trim()) { onSend(t.trim()); setT(''); } };
  return (
    <div style={{ padding: 12, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
      <Input placeholder="输入消息..." value={t} onChange={e=>setT(e.target.value)} onPressEnter={send} disabled={disabled} />
      <Button type="primary" icon={<SendOutlined />} onClick={send} disabled={disabled}>发送</Button>
    </div>
  );
}

export default ChatInput;
