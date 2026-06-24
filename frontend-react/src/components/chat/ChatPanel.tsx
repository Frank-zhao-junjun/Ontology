import { useState } from 'react';
import { Button, Spin } from 'antd';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
import { chatExecute } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';

interface Msg { role: 'user'|'ai'; content: string; }

function ChatPanel() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const setEntity = useAppStore(s => s.setCurrentEntity);

  const send = async (text: string) => {
    setMsgs(p => [...p, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const r = await chatExecute(text, 'default-session');
      const data = r.data;
      const aiMsg = data.assistant_message || `Intent=${data.plan?.[0]?.intent || 'unknown'}`;
      setMsgs(p => [...p, { role: 'ai', content: aiMsg }]);

      // Push structured ontology data to store for ReviewPanel
      if (data.structural || data.behavioral || data.rules || data.events || data.interfaces) {
        useAppStore.getState().setLLMResponse({
          structural: data.structural || {},
          behavioral: data.behavioral || {},
          rules: data.rules || {},
          events: data.events || {},
          interfaces: data.interfaces || {},
          epc: data.epc || {},
        });
      }

      // Select entity from structural response
      const entities = data.structural?.entities;
      if (entities && entities.length > 0) {
        setEntity(entities[0].name || entities[0].id || 'entity');
      }
    } catch (err) {
      console.error('ChatPanel: LLM request failed', err);
      setMsgs(p => [...p, { role: 'ai', content: 'AI 服务暂不可用，请稍后重试' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
        <Button type="text" block>+ 新对话</Button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {msgs.map((m,i)=><MessageBubble key={i} role={m.role} content={m.content} />)}
        {loading && <Spin style={{ padding: 8 }} />}
      </div>
      <ChatInput onSend={send} disabled={loading} />
    </div>
  );
}

export default ChatPanel;
