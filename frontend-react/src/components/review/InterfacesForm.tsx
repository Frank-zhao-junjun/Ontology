import { Tabs, Table, Input, Select, Button } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface API { key: string; id: string; name: string; url: string; method: string; params: string; response: string; }
interface Query { key: string; id: string; name: string; type: string; template: string; }
interface Compute { key: string; id: string; name: string; input: string; output: string; formula: string; }
interface Notification { key: string; id: string; name: string; channel: string; template: string; }
interface Report { key: string; id: string; name: string; fields: string; format: string; }
interface InterfacesData { apis: API[]; queries: Query[]; compute: Compute[]; notifications: Notification[]; reports: Report[]; }

function InterfacesForm({ data, onChange }: { data: InterfacesData; onChange: (d: InterfacesData) => void }) {
  const apiCols: ColumnsType<API> = [
    { title: 'ID', dataIndex:'id', render: (v:string)=><Input size="small" value={v} style={{width:80}} /> },
    { title: '名称', dataIndex:'name', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: 'URL', dataIndex:'url', render: (v:string)=><Input size="small" value={v} style={{width:180}} /> },
    { title: '方法', dataIndex:'method', render: (v:string)=><Select size="small" value={v||undefined} style={{width:80}} options={['GET','POST','PUT','DELETE'].map(o=>({value:o,label:o}))} /> },
    { title: '', width:40, render: (_:any, __:API, i:number)=>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={()=>onChange({...data, apis: data.apis.filter((_,idx)=>idx!==i)})} /> },
  ];
  const qCols: ColumnsType<Query> = [
    { title: 'ID', dataIndex:'id', render: (v:string)=><Input size="small" value={v} style={{width:80}} /> },
    { title: '名称', dataIndex:'name', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '类型', dataIndex:'type', render: (v:string)=><Select size="small" value={v||undefined} style={{width:100}} options={['SQL','NoSQL','GraphQL'].map(o=>({value:o,label:o}))} /> },
    { title: '模板', dataIndex:'template', render: (v:string)=><Input size="small" value={v} style={{width:250}} /> },
    { title: '', width:40, render: (_:any, __:Query, i:number)=>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={()=>onChange({...data, queries: data.queries.filter((_,idx)=>idx!==i)})} /> },
  ];
  const cCols: ColumnsType<Compute> = [
    { title: 'ID', dataIndex:'id', render: (v:string)=><Input size="small" value={v} style={{width:80}} /> },
    { title: '名称', dataIndex:'name', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '输入', dataIndex:'input', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '输出', dataIndex:'output', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '公式', dataIndex:'formula', render: (v:string)=><Input size="small" value={v} style={{width:150}} /> },
    { title: '', width:40, render: (_:any, __:Compute, i:number)=>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={()=>onChange({...data, compute: data.compute.filter((_,idx)=>idx!==i)})} /> },
  ];
  const nCols: ColumnsType<Notification> = [
    { title: 'ID', dataIndex:'id', render: (v:string)=><Input size="small" value={v} style={{width:80}} /> },
    { title: '名称', dataIndex:'name', render: (v:string)=><Input size="small" value={v} style={{width:100}} /> },
    { title: '渠道', dataIndex:'channel', render: (v:string)=><Select size="small" value={v||undefined} style={{width:90}} options={['email','IM','SMS','webhook'].map(o=>({value:o,label:o}))} /> },
    { title: '模板', dataIndex:'template', render: (v:string)=><Input size="small" value={v} style={{width:200}} /> },
    { title: '', width:40, render: (_:any, __:Notification, i:number)=>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={()=>onChange({...data, notifications: data.notifications.filter((_,idx)=>idx!==i)})} /> },
  ];

  const tabs = [
    { key: 'apis', label: '系统API', children: (
      <div>
        <Table<API> columns={apiCols} dataSource={data.apis} pagination={false} size="small" rowKey="key" />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={()=>onChange({...data, apis: [...data.apis, {key:String(data.apis.length),id:'',name:'',url:'',method:'GET',params:'',response:''}]})}>添加API</Button>
      </div>
    )},
    { key: 'queries', label: '数据查询', children: (
      <div>
        <Table<Query> columns={qCols} dataSource={data.queries} pagination={false} size="small" rowKey="key" />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={()=>onChange({...data, queries: [...data.queries, {key:String(data.queries.length),id:'',name:'',type:'SQL',template:''}]})}>添加查询</Button>
      </div>
    )},
    { key: 'compute', label: '计算引擎', children: (
      <div>
        <Table<Compute> columns={cCols} dataSource={data.compute} pagination={false} size="small" rowKey="key" />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={()=>onChange({...data, compute: [...data.compute, {key:String(data.compute.length),id:'',name:'',input:'',output:'',formula:''}]})}>添加计算</Button>
      </div>
    )},
    { key: 'notifications', label: '通知推送', children: (
      <div>
        <Table<Notification> columns={nCols} dataSource={data.notifications} pagination={false} size="small" rowKey="key" />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={()=>onChange({...data, notifications: [...data.notifications, {key:String(data.notifications.length),id:'',name:'',channel:'email',template:''}]})}>添加通知</Button>
      </div>
    )},
    { key: 'reports', label: '报表生成', children: (
      <div>
        <Table<Report> columns={[{title:'ID',dataIndex:'id',render:(v:string)=><Input size="small" value={v} style={{width:80}}/>},
          {title:'名称',dataIndex:'name',render:(v:string)=><Input size="small" value={v} style={{width:100}}/>},
          {title:'字段',dataIndex:'fields',render:(v:string)=><Input size="small" value={v} style={{width:150}}/>},
          {title:'格式',dataIndex:'format',render:(v:string)=><Select size="small" value={v||undefined} style={{width:80}} options={['CSV','Excel','PDF'].map(o=>({value:o,label:o}))}/>},
          {title:'',width:40,render:(_:any,__:Report,i:number)=><Button size="small" danger icon={<DeleteOutlined/>} onClick={()=>onChange({...data,reports:data.reports.filter((_,idx)=>idx!==i)})}/>}]}
          dataSource={data.reports} pagination={false} size="small" rowKey="key" />
        <Button icon={<PlusOutlined />} type="dashed" block style={{marginTop:8}}
          onClick={()=>onChange({...data, reports: [...data.reports, {key:String(data.reports.length),id:'',name:'',fields:'',format:'CSV'}]})}>添加报表</Button>
      </div>
    )},
  ];
  return <Tabs items={tabs} />;
}
export default InterfacesForm;
