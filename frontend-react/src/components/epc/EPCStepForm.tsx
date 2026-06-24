import { Input, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

interface Step { event_trigger: string; action: string; }

function EPCStepForm({ steps, onChange }: { steps: Step[]; onChange: (s: Step[]) => void }) {
  return (
    <div>
      {steps.map((step, i) => (
        <div key={i} style={{ border: '1px solid #f0f0f0', padding: 12, marginBottom: 8, borderRadius: 4 }}>
          <Input addonBefore="触发事件(维4)" placeholder="e.g. lead_created" value={step.event_trigger}
            onChange={e => { const u = [...steps]; u[i].event_trigger = e.target.value; onChange(u); }}
            style={{ marginBottom: 8 }} />
          <Input addonBefore="行为(维2)" placeholder="e.g. score_lead" value={step.action}
            onChange={e => { const u = [...steps]; u[i].action = e.target.value; onChange(u); }}
            style={{ marginBottom: 8 }} />
          <Button danger size="small" icon={<DeleteOutlined />}
            onClick={() => onChange(steps.filter((_, idx) => idx !== i))}>删除步骤</Button>
        </div>
      ))}
      <Button type="dashed" icon={<PlusOutlined />} block
        onClick={() => onChange([...steps, { event_trigger: '', action: '' }])}>添加步骤</Button>
    </div>
  );
}
export default EPCStepForm;
