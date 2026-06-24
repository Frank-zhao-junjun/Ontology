import { Tabs, Table, Input, Button, Select, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Validation { key: string; id: string; type: string; entity: string; field: string; expression: string; }
interface Guardrail { key: string; id: string; name: string; condition: string; action: string; }
interface Policy { key: string; id: string; name: string; rules: string; }
interface Permission { key: string; role: string; resource: string; operations: string; }
interface Exemption { key: string; id: string; constraint: string; reason: string; }
interface Probe { key: string; id: string; name: string; target: string; frequency: string; alertCondition: string; domain: string; }
interface RulesData {
  validations: Validation[]; guardrails: Guardrail[];
  policies: Policy[]; permissions: Permission[]; exemptions: Exemption[];
  probes: Probe[];
}

function RulesForm({ data, onChange }: { data: RulesData; onChange: (d: RulesData) => void }) {
  const valCols: ColumnsType<Validation> = [
    { title: 'ID', dataIndex: 'id', render: (v: string) => <Input size="small" value={v} style={{width:100}} /> },
    { title: '类型', dataIndex: 'type', render: (v: string) => <Select size="small" value={v || undefined} style={{width:110}}
        options={['field_validation','cross_field','cross_entity','aggregation','temporal'].map(o=>({value:o,label:o}))} /> },
    { title: '实体', dataIndex: 'entity', render: (v: string) => <Input size="small" value={v} style={{width:100}} /> },
    { title: '字段', dataIndex: 'field', render: (v: string) => <Input size="small" value={v} style={{width:100}} /> },
    { title: '表达式', dataIndex: 'expression', render: (v: string) => <Input size="small" value={v} style={{width:150}} /> },
    { title: '', width: 40, render: (_:any, __:Validation, i:number) =>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onChange({...data, validations: data.validations.filter((_,idx)=>idx!==i)})} /> },
  ];
  const grdCols: ColumnsType<Guardrail> = [
    { title: 'ID', dataIndex: 'id', render: (v:string) => <Input size="small" value={v} style={{width:100}} /> },
    { title: '名称', dataIndex: 'name', render: (v:string) => <Input size="small" value={v} style={{width:120}} /> },
    { title: '触发条件', dataIndex: 'condition', render: (v:string) => <Input size="small" value={v} style={{width:150}} /> },
    { title: '动作', dataIndex: 'action', render: (v:string) => <Select size="small" value={v||undefined} style={{width:90}}
        options={[{value:'block',label:'阻断'},{value:'alert',label:'告警'},{value:'approve',label:'审批'}]} /> },
    { title: '', width: 40, render: (_:any, __:Guardrail, i:number) =>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onChange({...data, guardrails: data.guardrails.filter((_,idx)=>idx!==i)})} /> },
  ];
  const polCols: ColumnsType<Policy> = [
    { title: 'ID', dataIndex:'id', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '名称', dataIndex:'name', render: (v:string)=><Input size="small" value={v} style={{width:120}} /> },
    { title: '规则引用', dataIndex:'rules', render: (v:string)=><Input size="small" value={v} style={{width:200}} /> },
    { title: '', width:40, render: (_:any, __:Policy, i:number)=>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onChange({...data, policies: data.policies.filter((_,idx)=>idx!==i)})} /> },
  ];
  const permCols: ColumnsType<Permission> = [
    { title: '角色', dataIndex:'role', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '资源', dataIndex:'resource', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '操作', dataIndex:'operations', render: (v:string)=><Input size="small" value={v} style={{width:120}} /> },
    { title: '', width:40, render: (_:any, __:Permission, i:number)=>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onChange({...data, permissions: data.permissions.filter((_,idx)=>idx!==i)})} /> },
  ];
  const exmCols: ColumnsType<Exemption> = [
    { title: 'ID', dataIndex:'id', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '约束', dataIndex:'constraint', render: (v:string)=><Input size="small" value={v} style={{width:120}} /> },
    { title: '原因', dataIndex:'reason', render: (v:string)=><Input size="small" value={v} style={{width:200}} /> },
    { title: '', width:40, render: (_:any, __:Exemption, i:number)=>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onChange({...data, exemptions: data.exemptions.filter((_,idx)=>idx!==i)})} /> },
  ];

  const tabItems = [
    { key: 'validations', label: '校验规则', children: (
      <div>
        <Table<Validation> columns={valCols} dataSource={data.validations} pagination={false} size="small" rowKey="key" />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={() => onChange({...data, validations: [...data.validations, {key:String(data.validations.length),id:'',type:'',entity:'',field:'',expression:''}]})}>
          添加校验规则</Button>
      </div>
    )},
    { key: 'guardrails', label: '护栏', children: (
      <div>
        <Table<Guardrail> columns={grdCols} dataSource={data.guardrails} pagination={false} size="small" rowKey="key" />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={() => onChange({...data, guardrails: [...data.guardrails, {key:String(data.guardrails.length),id:'',name:'',condition:'',action:''}]})}>
          添加护栏</Button>
      </div>
    )},
    { key: 'policies', label: '策略', children: (
      <div>
        <Table<Policy> columns={polCols} dataSource={data.policies} pagination={false} size="small" rowKey="key" />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={() => onChange({...data, policies: [...data.policies, {key:String(data.policies.length),id:'',name:'',rules:''}]})}>
          添加策略</Button>
      </div>
    )},
    { key: 'permissions', label: '权限', children: (
      <div>
        <Table<Permission> columns={permCols} dataSource={data.permissions} pagination={false} size="small" rowKey="key" />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={() => onChange({...data, permissions: [...data.permissions, {key:String(data.permissions.length),role:'',resource:'',operations:''}]})}>
          添加权限</Button>
      </div>
    )},
    { key: 'exemptions', label: '豁免', children: (
      <div>
        <Table<Exemption> columns={exmCols} dataSource={data.exemptions} pagination={false} size="small" rowKey="key" />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={() => onChange({...data, exemptions: [...data.exemptions, {key:String(data.exemptions.length),id:'',constraint:'',reason:''}]})}>
          添加豁免</Button>
      </div>
    )},
    { key: 'probes', label: '探针', children: (
      <div>
        <Table<Probe> columns={[
          { title: 'ID', dataIndex:'id', render: (v:string)=><Input size="small" value={v} style={{width:80}}/> },
          { title: '名称', dataIndex:'name', render: (v:string)=><Input size="small" value={v} style={{width:120}}/> },
          { title: '采样目标', dataIndex:'target', render: (v:string)=><Input size="small" value={v} style={{width:120}} placeholder="关键设备振动值"/> },
          { title: '频率', dataIndex:'frequency', render: (v:string)=><Input size="small" value={v} style={{width:80}} placeholder="1min"/> },
          { title: '预警条件', dataIndex:'alertCondition', render: (v:string)=><Input size="small" value={v} style={{width:150}} placeholder=">80%触发预警"/> },
          { title: '所属域', dataIndex:'domain', render: (v:string)=><Input size="small" value={v} style={{width:100}}/> },
          { title: '', width:40, render: (_:any, __:Probe, i:number)=>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={()=>onChange({...data, probes: data.probes.filter((_,idx)=>idx!==i)})}/> },
        ]} dataSource={data.probes} pagination={false} size="small" rowKey="key"
          locale={{ emptyText: '暂无探针 — 如设备振动探针(实时)、SLA倒计时探针(1min)' }} />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={()=>onChange({...data, probes: [...data.probes, {key:String(data.probes.length),id:'',name:'',target:'',frequency:'',alertCondition:'',domain:''}]})}>
          添加探针</Button>
      </div>
    )},
  ];

  return <Tabs items={tabItems} />;
}
export default RulesForm;
