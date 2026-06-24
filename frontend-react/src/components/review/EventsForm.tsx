import { Collapse, Table, Input, Select, Button, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface EventType { key: string; id: string; name: string; severity: string; source: string; targetEntity: string; payloadSchema: string; }
interface Causality { key: string; cause: string; effect: string; }
interface EventsData { eventTypes: EventType[]; sources: string[]; causalities: Causality[]; }

function EventsForm({ data, onChange }: { data: EventsData; onChange: (d: EventsData) => void }) {
  const cols: ColumnsType<EventType> = [
    { title: 'ID', dataIndex:'id', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '名称', dataIndex:'name', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '级别', dataIndex:'severity', render: (v:string) =>
      <Select size="small" value={v||undefined} style={{width:90}} options={['critical','high','medium','low','info'].map(o=>({value:o,label:o}))} /> },
    { title: '事件源', dataIndex:'source', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '作用实体', dataIndex:'targetEntity', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '属性Schema', dataIndex:'payloadSchema', render: (v:string)=><Input size="small" value={v} style={{width:150}} placeholder='{key:type}' /> },
    { title: '', width:40, render: (_:any, __:EventType, i:number)=>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={()=>onChange({...data, eventTypes: data.eventTypes.filter((_,idx)=>idx!==i)})} /> },
  ];
  const cauCols: ColumnsType<Causality> = [
    { title: '原因事件', dataIndex:'cause', render: (v:string)=><Input size="small" value={v} style={{width:150}} /> },
    { title: '→', key:'arrow', width:40, render: ()=><span>→</span> },
    { title: '结果事件', dataIndex:'effect', render: (v:string)=><Input size="small" value={v} style={{width:150}} /> },
    { title: '', width:40, render: (_:any, __:Causality, i:number)=>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={()=>onChange({...data, causalities: data.causalities.filter((_,idx)=>idx!==i)})} /> },
  ];

  return (
    <Collapse defaultActiveKey={['types','causalities']} items={[
      { key: 'types', label: '事件类型定义', children: (
        <div>
          <Table<EventType> columns={cols} dataSource={data.eventTypes} pagination={false} size="small" rowKey="key" />
          <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
            onClick={()=>onChange({...data, eventTypes: [...data.eventTypes, {key:String(data.eventTypes.length),id:'',name:'',severity:'',source:'',targetEntity:'',payloadSchema:''}]})}>
            添加事件类型</Button>
        </div>
      )},
      { key: 'causalities', label: '事件因果链', children: (
        <div>
          <Table<Causality> columns={cauCols} dataSource={data.causalities} pagination={false} size="small" rowKey="key" />
          <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
            onClick={()=>onChange({...data, causalities: [...data.causalities, {key:String(data.causalities.length),cause:'',effect:''}]})}>
            添加因果链</Button>
        </div>
      )},
    ]} />
  );
}
export default EventsForm;
