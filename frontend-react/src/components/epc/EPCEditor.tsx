import { useState } from 'react';
import { Input, Button, message } from 'antd';
import EPCStepForm from './EPCStepForm';
function EPCEditor() {
  const [name, setName] = useState('');
  const [scenario, setScenario] = useState('');
  const [steps, setSteps] = useState([{ event_trigger: '', action: '' }]);
  return (
    <div style={{ padding: 24 }}>
      <h2>EPC 流程编辑器</h2>
      <Input placeholder="流程名称" value={name} onChange={e=>setName(e.target.value)} style={{ marginBottom: 12 }} />
      <Input placeholder="所属业务场景" value={scenario} onChange={e=>setScenario(e.target.value)} style={{ marginBottom: 12 }} />
      <EPCStepForm steps={steps} onChange={setSteps} />
      <Button type="primary" onClick={() => message.success('EPC流程保存成功')} style={{ marginTop: 12 }}>保存流程</Button>
    </div>
  );
}
export default EPCEditor;
