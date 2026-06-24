import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Spin, Collapse, Table, Space, Modal, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getDomains, createDomain } from '../../services/api';
import type { ColumnsType } from 'antd/es/table';

interface Attribute { key: string; id: string; name: string; type: string; required: boolean; unique: boolean; autoFill: string; }
interface Relation { key: string; source: string; target: string; type: string; inverseOf: string; domain: string; range: string; }
interface ValueObject { key: string; name: string; fields: string; }
interface StructuralData {
  entityName: string; domain: string; domainId: number | null;
  subDomain: string; scenario: string;
  attributes: Attribute[];
  relations: Relation[];
  inheritance: string;
  valueObjects: ValueObject[];
}

interface DomainOption { id: number; name: string; }

function StructuralForm({ data, onChange }: { data: StructuralData; onChange: (d: StructuralData) => void }) {
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDomains().then(r => { if (!cancelled) setDomains(r.data.items || []); }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleDomainChange = (value: string) => {
    if (value === '__new__') {
      let modalName = '';
      Modal.confirm({
        title: '新建领域',
        content: <Input placeholder="领域名称" onChange={e => { modalName = e.target.value; }} />,
        onOk: async () => {
          if (!modalName.trim()) return;
          try {
            const r = await createDomain(modalName.trim(), '');
            const d = r.data;
            setDomains(prev => [...prev, { id: d.id, name: d.name }]);
            onChange({ ...data, domain: d.name, domainId: d.id });
            message.success(`领域 "${modalName.trim()}" 已创建`);
          } catch (e) {
            message.error('创建失败: ' + (e as Error).message);
          }
        },
      });
    } else {
      const sel = domains.find(d => String(d.id) === value);
      onChange({ ...data, domain: sel?.name || '', domainId: sel?.id || null });
    }
  };

  const attrCols: ColumnsType<Attribute> = [
    { title: 'ID', dataIndex:'id', render: (v:string)=><Input size="small" value={v} style={{width:80}}/> },
    { title: '名称', dataIndex:'name', render: (v:string)=><Input size="small" value={v} style={{width:100}}/> },
    { title: '类型', dataIndex:'type', render: (v:string)=>
      <Select size="small" value={v||undefined} style={{width:90}} options={['string','integer','decimal','date','boolean','enum','reference'].map(o=>({value:o,label:o}))} /> },
    { title: '必填', dataIndex:'required', render: (v:boolean, _:any, i:number)=>
      <input type="checkbox" checked={v} onChange={e=>{const a=[...data.attributes];a[i].required=e.target.checked;onChange({...data,attributes:a})}} /> },
    { title: '唯一', dataIndex:'unique', render: (v:boolean, _:any, i:number)=>
      <input type="checkbox" checked={v} onChange={e=>{const a=[...data.attributes];a[i].unique=e.target.checked;onChange({...data,attributes:a})}} /> },
    { title: 'autoFill', dataIndex:'autoFill', render: (v:string)=><Input size="small" value={v} style={{width:80}} placeholder="current_user"/> },
    { title: '', width:40, render: (_:any, __:Attribute, i:number)=>
      <Button size="small" danger icon={<DeleteOutlined/>} onClick={()=>onChange({...data, attributes:data.attributes.filter((_,idx)=>idx!==i)})}/> },
  ];

  const relCols: ColumnsType<Relation> = [
    { title: '源', dataIndex:'source', render: (v:string)=><Input size="small" value={v} style={{width:90}}/> },
    { title: '关系', dataIndex:'type', render: (v:string)=>
      <Select size="small" value={v||undefined} style={{width:110}} options={['subClassOf','equivalentClass','disjointWith','聚合','组合','关联','依赖'].map(o=>({value:o,label:o}))} /> },
    { title: '目标', dataIndex:'target', render: (v:string)=><Input size="small" value={v} style={{width:90}}/> },
    { title: 'inverseOf', dataIndex:'inverseOf', render: (v:string)=><Input size="small" value={v} style={{width:90}} placeholder="hasPart"/> },
    { title: 'domain', dataIndex:'domain', render: (v:string)=><Input size="small" value={v} style={{width:80}}/> },
    { title: 'range', dataIndex:'range', render: (v:string)=><Input size="small" value={v} style={{width:80}}/> },
    { title: '', width:40, render: (_:any, __:Relation, i:number)=>
      <Button size="small" danger icon={<DeleteOutlined/>} onClick={()=>onChange({...data, relations:data.relations.filter((_,idx)=>idx!==i)})}/> },
  ];

  const voCols: ColumnsType<ValueObject> = [
    { title: '名称', dataIndex:'name', render: (v:string)=><Input size="small" value={v} style={{width:120}}/> },
    { title: '字段 (逗号分隔)', dataIndex:'fields', render: (v:string)=><Input size="small" value={v} style={{width:250}} placeholder="targetHours,elapsedHours,isBreached"/> },
    { title: '', width:40, render: (_:any, __:ValueObject, i:number)=>
      <Button size="small" danger icon={<DeleteOutlined/>} onClick={()=>onChange({...data, valueObjects:data.valueObjects.filter((_,idx)=>idx!==i)})}/> },
  ];

  return (
    <Form layout="vertical">
      <Form.Item label="实体名称">
        <Input value={data.entityName} onChange={e => onChange({...data, entityName: e.target.value})} />
      </Form.Item>
      <Form.Item label="所属领域">
        {loading ? <Spin size="small" /> : (
          <Select value={data.domainId ? String(data.domainId) : undefined}
            onChange={handleDomainChange} placeholder="选择领域"
            options={[...domains.map(d => ({ value: String(d.id), label: d.name })),
              { value: '__new__', label: '+ 新建领域...' }]} />
        )}
      </Form.Item>
      <Form.Item label="子领域">
        <Input value={data.subDomain} onChange={e => onChange({...data, subDomain: e.target.value})} placeholder="e.g. Marketing to Leads" />
      </Form.Item>
      <Form.Item label="业务场景">
        <Input value={data.scenario} onChange={e => onChange({...data, scenario: e.target.value})} placeholder="e.g. 展会获客跟进" />
      </Form.Item>

      <Form.Item label={<strong>属性列表</strong>}>
        <Table<Attribute> columns={attrCols} dataSource={data.attributes} pagination={false} size="small" rowKey="key"
          locale={{ emptyText: '暂无属性' }} />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={()=>onChange({...data, attributes: [...data.attributes, {key:String(data.attributes.length),id:'',name:'',type:'string',required:false,unique:false,autoFill:''}]})}>
          添加属性</Button>
      </Form.Item>

      <Collapse ghost items={[
        { key: 'relations', label: '关系定义 (OWL + 领域关系)', children: (
          <div>
            <Table<Relation> columns={relCols} dataSource={data.relations} pagination={false} size="small" rowKey="key"
              locale={{ emptyText: '暂无关系 — subClassOf / equivalentClass / 聚合 / ...' }} />
            <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
              onClick={()=>onChange({...data, relations: [...data.relations, {key:String(data.relations.length),source:'',type:'',target:'',inverseOf:'',domain:'',range:''}]})}>
              添加关系</Button>
          </div>
        )},
        { key: 'inheritance', label: '继承', children: (
          <Input value={data.inheritance} onChange={e=>onChange({...data, inheritance: e.target.value})}
            placeholder="父实体，如 VIPCustomer subClassOf Customer" />
        )},
        { key: 'valueObjects', label: '值对象', children: (
          <div>
            <Table<ValueObject> columns={voCols} dataSource={data.valueObjects} pagination={false} size="small" rowKey="key"
              locale={{ emptyText: '暂无值对象 — 优先级、SLA、设备状态等无标识属性组合' }} />
            <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
              onClick={()=>onChange({...data, valueObjects: [...data.valueObjects, {key:String(data.valueObjects.length),name:'',fields:''}]})}>
              添加值对象</Button>
          </div>
        )},
      ]} />
    </Form>
  );
}

export default StructuralForm;
