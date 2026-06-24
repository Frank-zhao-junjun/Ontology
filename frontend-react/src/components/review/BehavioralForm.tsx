import { Form, Input, Button, Table, Space, Select, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Action { key: string; id: string; name: string; input: string; output: string; domain: string; }
interface Transition { key: string; from: string; to: string; trigger: string; }
interface StateMachine { key: string; id: string; name: string; entity: string; states: string[]; transitions: Transition[]; }
interface Indicator { key: string; id: string; name: string; formula: string; target: string; warningThreshold: string; domain: string; }
interface BehavioralData { actions: Action[]; stateMachines: StateMachine[]; indicators: Indicator[]; }

function BehavioralForm({ data, onChange }: { data: BehavioralData; onChange: (d: BehavioralData) => void }) {
  const actionColumns: ColumnsType<Action> = [
    { title: 'ID', dataIndex: 'id', key: 'id', render: (v: string) => <Input size="small" value={v} style={{width:100}} /> },
    { title: '名称', dataIndex: 'name', key: 'name', render: (v: string) => <Input size="small" value={v} style={{width:120}} /> },
    { title: '输入', dataIndex: 'input', key: 'input', render: (v: string) => <Input size="small" value={v} style={{width:120}} /> },
    { title: '输出', dataIndex: 'output', key: 'output', render: (v: string) => <Input size="small" value={v} style={{width:120}} /> },
    { title: '所属域', dataIndex: 'domain', key: 'domain', render: (v: string) => <Input size="small" value={v} style={{width:100}} /> },
    { title: '', key: 'del', width: 40, render: (_: unknown, __: Action, i: number) =>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
        const acts = data.actions.filter((_, idx) => idx !== i).map((a, j) => ({...a, key: String(j)}));
        onChange({ ...data, actions: acts });
      }} />
    },
  ];

  const addAction = () => {
    const acts = [...data.actions, { key: String(data.actions.length), id: '', name: '', input: '', output: '', domain: '' }];
    onChange({ ...data, actions: acts });
  };

  const addSM = () => {
    const sms = [...data.stateMachines, { key: String(data.stateMachines.length), id: '', name: '', entity: '', states: [], transitions: [] }];
    onChange({ ...data, stateMachines: sms });
  };

  /* type-safe state-machine field updater — no `any` */
  const updateSM = <K extends keyof StateMachine>(i: number, field: K, value: StateMachine[K]) => {
    const sms = [...data.stateMachines];
    sms[i] = { ...sms[i], [field]: value };
    onChange({ ...data, stateMachines: sms });
  };

  return (
    <Form layout="vertical">
      <Form.Item label={<strong>行为列表</strong>}>
        <Table<Action> columns={actionColumns} dataSource={data.actions} pagination={false} size="small" rowKey="key"
          locale={{ emptyText: '暂无行为' }} />
        <Button icon={<PlusOutlined />} type="dashed" block onClick={addAction} style={{ marginTop: 8 }}>添加行为</Button>
      </Form.Item>

      <Form.Item label={<strong>状态机</strong>}>
        {data.stateMachines.map((sm, i) => (
          <div key={sm.key} style={{ border: '1px solid #f0f0f0', padding: 12, marginBottom: 12, borderRadius: 4 }}>
            <Space wrap style={{ marginBottom: 8 }}>
              <Input addonBefore="ID" size="small" value={sm.id} style={{width:150}} onChange={e => updateSM(i, 'id', e.target.value)} />
              <Input addonBefore="名称" size="small" value={sm.name} style={{width:150}} onChange={e => updateSM(i, 'name', e.target.value)} />
              <Input addonBefore="绑定实体" size="small" value={sm.entity} style={{width:150}} onChange={e => updateSM(i, 'entity', e.target.value)} />
            </Space>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontWeight: 500 }}>状态列表：</span>
              <Select mode="tags" size="small" style={{ width: '100%', marginTop: 4 }}
                placeholder="输入状态后回车" value={sm.states}
                onChange={vals => updateSM(i, 'states', vals)} />
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ fontWeight: 500 }}>转移规则：</span>
              {sm.transitions.map((tr, j) => (
                <Space key={tr.key} wrap style={{ marginTop: 4, display: 'flex' }}>
                  <Input size="small" placeholder="from" value={tr.from} style={{width:100}}
                    onChange={e => { const sms = [...data.stateMachines]; sms[i].transitions[j].from = e.target.value; onChange({...data, stateMachines: sms}); }} />
                  <span>→</span>
                  <Input size="small" placeholder="to" value={tr.to} style={{width:100}}
                    onChange={e => { const sms = [...data.stateMachines]; sms[i].transitions[j].to = e.target.value; onChange({...data, stateMachines: sms}); }} />
                  <Input size="small" placeholder="触发条件" value={tr.trigger} style={{width:120}}
                    onChange={e => { const sms = [...data.stateMachines]; sms[i].transitions[j].trigger = e.target.value; onChange({...data, stateMachines: sms}); }} />
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
                    const sms = [...data.stateMachines]; sms[i].transitions = sms[i].transitions.filter((_, idx) => idx !== j);
                    onChange({...data, stateMachines: sms});
                  }} />
                </Space>
              ))}
              <Button size="small" icon={<PlusOutlined />} type="link" onClick={() => {
                const sms = [...data.stateMachines];
                sms[i].transitions.push({ key: String(sms[i].transitions.length), from: '', to: '', trigger: '' });
                onChange({...data, stateMachines: sms});
              }}>+ 添加转移</Button>
            </div>
          </div>
        ))}
        <Button icon={<PlusOutlined />} type="dashed" block onClick={addSM}>添加状态机</Button>
      </Form.Item>

      <Form.Item label={<strong>指标定义</strong>}>
        <Table<Indicator> columns={[
          { title: 'ID', dataIndex:'id', render: (v:string)=><Input size="small" value={v} style={{width:80}}/> },
          { title: '名称', dataIndex:'name', render: (v:string)=><Input size="small" value={v} style={{width:100}}/> },
          { title: '公式', dataIndex:'formula', render: (v:string)=><Input size="small" value={v} style={{width:150}} placeholder="实际产出/设计产能"/> },
          { title: '目标值', dataIndex:'target', render: (v:string)=><Input size="small" value={v} style={{width:80}} placeholder="≥85%"/> },
          { title: '预警阈值', dataIndex:'warningThreshold', render: (v:string)=><Input size="small" value={v} style={{width:80}} placeholder="<70%"/> },
          { title: '所属域', dataIndex:'domain', render: (v:string)=><Input size="small" value={v} style={{width:100}}/> },
          { title: '', width:40, render: (_:unknown, __:Indicator, i:number)=>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={()=>onChange({...data, indicators: data.indicators.filter((_,idx)=>idx!==i)})}/> },
        ]} dataSource={data.indicators} pagination={false} size="small" rowKey="key"
          locale={{ emptyText: '暂无指标 — 如产线效率≥85%、SLA达标率≥95%' }} />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={()=>onChange({...data, indicators: [...data.indicators, {key:String(data.indicators.length),id:'',name:'',formula:'',target:'',warningThreshold:'',domain:''}]})}>
          添加指标</Button>
      </Form.Item>
    </Form>
  );
}
export default BehavioralForm;
