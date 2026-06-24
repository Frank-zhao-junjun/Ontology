# AI辅助本体设计工具 — 实施计划（Bite-Sized）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (- [ ]) syntax.

**Goal:** 将 Ontology 项目转型为 AI 辅助本体设计工具（5维+EPC建模，React三栏交互，JSON/YAML导出）

**Architecture:** Flask 后端 + React 前端三栏布局（对话/确认面板/实体树），SQLite，逐层增量生成

**Tech Stack:** Frontend: React 18 + TypeScript + Ant Design 5 + Vite. Backend: Python Flask + SQLAlchemy + SQLite.

**Spec:** docs/superpowers/specs/2026-06-12-ontology-design-tool-design.md

**Repo:** Frank-zhaojunjun/ontology

---

## Phase 1: Frontend 脚手架 + 三栏布局 (预计 20 steps)

### Task 1.1: 创建 Vite + React 项目

**Files:** Create: frontend-react/

- [ ] **Step 1: 初始化项目**
```bash
cd D:/AI/Ontology
npm create vite@latest frontend-react -- --template react-ts
cd frontend-react && npm install
```
Expected: project scaffolded with package.json

- [ ] **Step 2: 安装依赖**
```bash
cd D:/AI/Ontology/frontend-react
npm install antd @ant-design/icons zustand axios
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```
Expected: all packages in node_modules

- [ ] **Step 3: 归档旧前端**
```bash
mkdir -p D:/AI/Ontology/frontend-legacy
cp D:/AI/Ontology/frontend/index.html D:/AI/Ontology/frontend-legacy/
cp D:/AI/Ontology/frontend/app.js D:/AI/Ontology/frontend-legacy/
```

- [ ] **Step 4: 启动验证**
```bash
cd D:/AI/Ontology/frontend-react && npm run dev
```
Open http://localhost:5173, Expected: Vite + React default page

- [ ] **Step 5: Commit**
```bash
git add frontend-react/ frontend-legacy/
git commit -m "feat: init React+Vite+TS project, archive legacy frontend"
```

### Task 1.2: vitest 测试环境配置

**Files:** Modify: frontend-react/vite.config.ts, Create: src/test/setup.ts

- [ ] **Step 1: 更新 vite.config.ts**
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: { globals: true, environment: 'jsdom', setupFiles: './src/test/setup.ts' },
});
```

- [ ] **Step 2: 创建 setup.ts**
```ts
// frontend-react/src/test/setup.ts
import '@testing-library/jest-dom';
```

- [ ] **Step 3: 验证测试框架**
```bash
cd D:/AI/Ontology/frontend-react && npx vitest run
```
Expected: "No test files found" (0 tests, clean run)

- [ ] **Step 4: Commit**
```bash
git add frontend-react/vite.config.ts frontend-react/src/test/
git commit -m "chore: configure vitest + testing-library"
```

### Task 1.3: App 入口整合 Ant Design

**Files:** Modify: src/App.tsx, src/main.tsx

- [ ] **Step 1: 更新 main.tsx**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

- [ ] **Step 2: 更新 App.tsx**
```tsx
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
function App() {
  return <ConfigProvider locale={zhCN}><div style={{padding:40}}>Ontology Design Tool</div></ConfigProvider>;
}
export default App;
```

- [ ] **Step 3: 启动验证**
```bash
cd D:/AI/Ontology/frontend-react && npm run dev
```
Open browser, Expected: "Ontology Design Tool" centered on page

- [ ] **Step 4: Commit**
```bash
git add frontend-react/src/App.tsx frontend-react/src/main.tsx
git commit -m "chore: wire Ant Design ConfigProvider into App"
```

### Task 1.4: ThreeColumnLayout (TDD)

**Files:** Create: src/components/layout/ThreeColumnLayout.tsx, LeftSidebar.tsx, CenterPanel.tsx, RightSidebar.tsx

- [ ] **Step 1: 写 failing test**
```tsx
// frontend-react/src/components/layout/__tests__/ThreeColumnLayout.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ThreeColumnLayout from '../ThreeColumnLayout';
describe('ThreeColumnLayout', () => {
  it('renders 3 panels', () => {
    render(<ThreeColumnLayout />);
    expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('center-panel')).toBeInTheDocument();
    expect(screen.getByTestId('right-sidebar')).toBeInTheDocument();
  });
});
```
Run: `npx vitest run` — Expected: FAIL (module not found)

- [ ] **Step 2: 创建 stub panels**
```tsx
// LeftSidebar.tsx
function LeftSidebar() { return <div>Chat</div>; }
export default LeftSidebar;
// CenterPanel.tsx
function CenterPanel() { return <div>Review</div>; }
export default CenterPanel;
// RightSidebar.tsx
function RightSidebar() { return <div>Tree</div>; }
export default RightSidebar;
```

- [ ] **Step 3: 实现 ThreeColumnLayout**
```tsx
import { Layout } from 'antd';
import LeftSidebar from './LeftSidebar';
import CenterPanel from './CenterPanel';
import RightSidebar from './RightSidebar';
const { Sider, Content } = Layout;
function ThreeColumnLayout() {
  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={320} data-testid="left-sidebar" style={{ background: '#fff' }}><LeftSidebar /></Sider>
      <Content data-testid="center-panel" style={{ background: '#fafafa' }}><CenterPanel /></Content>
      <Sider width={280} data-testid="right-sidebar" style={{ background: '#fff' }}><RightSidebar /></Sider>
    </Layout>
  );
}
export default ThreeColumnLayout;
```

- [ ] **Step 4: Run test — Expected: PASS**

- [ ] **Step 5: Commit**
```bash
git add frontend-react/src/components/layout/
git commit -m "feat: ThreeColumnLayout with stub left/center/right panels"
```

### Task 1.5: 侧栏折叠功能

**Files:** Modify: ThreeColumnLayout.tsx

- [ ] **Step 1: 写 failing test for toggle**
```tsx
// Append to ThreeColumnLayout.test.tsx
it('has toggle buttons', () => {
  render(<ThreeColumnLayout />);
  expect(screen.getByTestId('toggle-left')).toBeInTheDocument();
});
```
Run: FAIL

- [ ] **Step 2: 加折叠逻辑**
```tsx
// ThreeColumnLayout.tsx — add useState + toggle buttons
import { useState } from 'react';
import { Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
function ThreeColumnLayout() {
  const [leftC, setLeftC] = useState(false);
  const [rightC, setRightC] = useState(false);
  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={320} collapsedWidth={0} collapsed={leftC} trigger={null}
        data-testid="left-sidebar" style={{ background: '#fff' }}>
        {!leftC && <LeftSidebar />}
      </Sider>
      <Button data-testid="toggle-left" type="text"
        icon={leftC ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setLeftC(!leftC)}
        style={{ position: 'absolute', left: leftC ? 0 : 320, top: 8, zIndex: 10 }} />
      <Content data-testid="center-panel" style={{ background: '#fafafa' }}><CenterPanel /></Content>
      <Sider width={280} collapsedWidth={0} collapsed={rightC} trigger={null}
        data-testid="right-sidebar" style={{ background: '#fff' }}>
        {!rightC && <RightSidebar />}
      </Sider>
    </Layout>
  );
}
```

- [ ] **Step 3: Run test — PASS**

- [ ] **Step 4: Commit**
```bash
git add frontend-react/src/components/layout/
git commit -m "feat: collapsible left/right sidebars with toggle buttons"
```

### Task 1.6: Zustand 全局状态

**Files:** Create: src/store/useAppStore.ts

- [ ] **Step 1: 写 failing test**
```tsx
// frontend-react/src/store/__tests__/useAppStore.test.ts
import { describe, it, expect } from 'vitest';
import { useAppStore } from '../useAppStore';
describe('useAppStore', () => {
  it('starts with null entity', () => {
    expect(useAppStore.getState().currentEntity).toBeNull();
  });
  it('setCurrentEntity updates entity', () => {
    useAppStore.getState().setCurrentEntity('lead');
    expect(useAppStore.getState().currentEntity).toBe('lead');
  });
  it('all 5 dims start as pending', () => {
    const d = useAppStore.getState().dimensionStatus;
    expect(d.structural).toBe('pending');
    expect(d.behavioral).toBe('pending');
    expect(d.rules).toBe('pending');
    expect(d.events).toBe('pending');
    expect(d.interfaces).toBe('pending');
  });
});
```
Run: `npx vitest run` — Expected: FAIL

- [ ] **Step 2: 实现 store**
```ts
import { create } from 'zustand';
type Status = 'pending' | 'confirmed' | 'draft';
interface DimStatus {
  structural: Status; behavioral: Status; rules: Status;
  events: Status; interfaces: Status;
}
interface AppState {
  currentEntity: string | null;
  dimensionStatus: DimStatus;
  isLoading: boolean;
  setCurrentEntity: (e: string | null) => void;
  setDimStatus: (dim: keyof DimStatus, s: Status) => void;
  setLoading: (l: boolean) => void;
}
const defaults: DimStatus = {
  structural: 'pending', behavioral: 'pending',
  rules: 'pending', events: 'pending', interfaces: 'pending',
};
export const useAppStore = create<AppState>((set) => ({
  currentEntity: null,
  dimensionStatus: defaults,
  isLoading: false,
  setCurrentEntity: (e) => set({ currentEntity: e }),
  setDimStatus: (dim, s) => set((st) => ({
    dimensionStatus: { ...st.dimensionStatus, [dim]: s },
  })),
  setLoading: (l) => set({ isLoading: l }),
}));
```

- [ ] **Step 3: Run test — PASS**

- [ ] **Step 4: Commit**
```bash
git add frontend-react/src/store/
git commit -m "feat: zustand app store with entity + 5-dimension status"
```

### Task 1.7: Axios API 服务层

**Files:** Create: src/services/api.ts

- [ ] **Step 1: 实现 api.ts**
```ts
import axios from 'axios';
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
export const login = (u: string, p: string) => api.post('/auth/login', { username: u, password: p });
export const chatExecute = (msg: string, sid: string, dim?: string) =>
  api.post('/chat/execute', { message: msg, session_id: sid, dimension: dim });
export const getMetaModels = () => api.get('/meta-models/definitions');
export const createMetaModel = (mt: string, name: string, content: object) =>
  api.post('/meta-models/definitions', { model_type: mt, name, version: '1.0.0', content });
export const publishRelease = (rno: string, ids: number[], op: string) =>
  api.post('/meta-models/publish', { release_no: rno, model_ids: ids, operator: op });
export const exportJson = (rno: string) => api.get('/export/json/' + rno);
export default api;
```

- [ ] **Step 2: Commit**
```bash
git add frontend-react/src/services/
git commit -m "feat: axios API service with auth interceptor"
```

---

## Phase 2: 后端 5维 API (预计 10 steps)

### Task 2.1: 扩展模型类型支持 5维

**Files:** Modify: backend/meta_model_service.py, Test: tests/test_5dim_models.py

- [ ] **Step 1: 写 failing test**
```python
# tests/test_5dim_models.py
def test_accepts_all_five_dims(client):
    for dim in ['structural', 'behavioral', 'rules', 'events', 'interfaces']:
        r = client.post('/api/meta-models/definitions', json={
            'model_type': dim, 'name': f'test_{dim}', 'version': '1.0.0', 'content': {}
        })
        assert r.status_code == 201
```
Run: `pytest tests/test_5dim_models.py -v` — Expected: FAIL

- [ ] **Step 2: 改 ALLOWED_MODEL_TYPES**

In `backend/meta_model_service.py` line 17:
```python
# OLD:
ALLOWED_MODEL_TYPES = {"data", "behavior", "rule", "process", "event"}
# NEW:
ALLOWED_MODEL_TYPES = {"structural", "behavioral", "rules", "events", "interfaces", "epc"}
```

- [ ] **Step 3: Run test — PASS**
```bash
pytest tests/test_5dim_models.py -v
```

- [ ] **Step 4: Commit**
```bash
git add backend/meta_model_service.py tests/test_5dim_models.py
git commit -m "feat: support 5-dimension model types"
```

### Task 2.2: EPC 流程 CRUD API

**Files:** Create: backend/routes_epc.py, Modify: backend/__init__.py

- [ ] **Step 1: 写 failing test**
```python
# tests/test_epc_api.py
def test_create_epc_process(client):
    r = client.post('/api/epc/processes', json={
        'name': '线索分配流程', 'scenario': '展会获客',
        'steps': [{'event_trigger': 'lead_created', 'action': 'score_lead'}]
    })
    assert r.status_code == 201
```
Run: `pytest tests/test_epc_api.py -v` — Expected: FAIL (404)

- [ ] **Step 2: 实现 EPC 蓝图**
```python
# backend/routes_epc.py
from flask import Blueprint, jsonify, request
from .auth import require_auth
from .extensions import db
from .models import MetaModelDefinition

bp_epc = Blueprint('epc', __name__, url_prefix='/api/epc')

@bp_epc.post('/processes')
@require_auth()
def create_epc():
    p = request.get_json(force=True)
    m = MetaModelDefinition(model_type='epc', name=p['name'], version='1.0.0',
        content_json={'steps': p.get('steps',[]), 'scenario': p.get('scenario','')},
        status='draft')
    db.session.add(m); db.session.commit()
    return jsonify({'id': m.id, 'name': m.name, 'steps': p.get('steps',[])}), 201

@bp_epc.get('/processes')
@require_auth()
def list_epc():
    rows = MetaModelDefinition.query.filter_by(model_type='epc').all()
    return jsonify({'items': [{'id': r.id, 'name': r.name, 'content': r.content_json} for r in rows]})
```

- [ ] **Step 3: 注册蓝图**

In `backend/__init__.py`:
```python
from .routes_epc import bp_epc
# inside create_app():
app.register_blueprint(bp_epc)
```

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Commit**
```bash
git add backend/routes_epc.py backend/__init__.py tests/test_epc_api.py
git commit -m "feat: EPC process CRUD API"
```

### Task 2.3: JSON 导出 API

**Files:** Create: backend/routes_export.py, Modify: backend/__init__.py

- [ ] **Step 1: 写 failing test**
```python
# tests/test_export.py
def test_export_json(client):
    ids = []
    for dim in ['structural','behavioral','rules','events','interfaces']:
        r = client.post('/api/meta-models/definitions', json={
            'model_type': dim, 'name': f'exp_{dim}', 'version': '1.0.0',
            'content': {dim: True}
        })
        ids.append(r.get_json()['id'])
    client.post('/api/meta-models/publish', json={
        'release_no': 'exp-v1', 'model_ids': ids, 'operator': 't'
    })
    r = client.get('/api/export/json/exp-v1')
    assert r.status_code == 200
    assert 'structural' in r.get_json()
```
Run: `pytest tests/test_export.py -v` — Expected: FAIL

- [ ] **Step 2: 实现导出**
```python
# backend/routes_export.py
from flask import Blueprint, jsonify
from .auth import require_auth
from .models import MetaModelDefinition, MetaModelRelease, MetaModelReleaseItem

bp_export = Blueprint('export', __name__, url_prefix='/api/export')

@bp_export.get('/json/<release_no>')
@require_auth()
def export_json(release_no):
    rel = MetaModelRelease.query.filter_by(release_no=release_no).first()
    if not rel: return jsonify({'error': 'not found'}), 404
    items = MetaModelReleaseItem.query.filter_by(release_id=rel.id).all()
    ids = [i.model_definition_id for i in items]
    models = MetaModelDefinition.query.filter(MetaModelDefinition.id.in_(ids)).all()
    result = {
        'version': release_no,
        'exported_at': rel.released_at.isoformat() if rel.released_at else None,
    }
    for m in models:
        result[m.model_type] = m.content_json
    return jsonify(result)
```

- [ ] **Step 3: 注册 — add** `from .routes_export import bp_export` + `app.register_blueprint(bp_export)` in `__init__.py`

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Commit**
```bash
git add backend/routes_export.py backend/__init__.py tests/test_export.py
git commit -m "feat: JSON export API for published releases"
```

---

## Phase 3: 前端组件 — 实体树 + 确认面板 + 对话 (预计 25 steps)

### Task 3.1: EntityTree 组件

**Files:** Create: src/components/tree/EntityTree.tsx

- [ ] **Step 1: 写 failing test**
```tsx
// src/components/tree/__tests__/EntityTree.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import EntityTree from '../EntityTree';
const sample = [{ key: 'd1', title: '销售', children: [
  { key: 's1', title: 'M2L', children: [
    { key: 'e1', title: 'Lead', data: { dimsConfirmed: 3 } }]}]}];
describe('EntityTree', () => {
  it('renders nodes', () => {
    render(<EntityTree data={sample} onSelect={() => {}} />);
    expect(screen.getByText('销售')).toBeInTheDocument();
  });
  it('shows badge 3/5', () => {
    render(<EntityTree data={sample} onSelect={() => {}} />);
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });
  it('fires onSelect', () => {
    const fn = vi.fn();
    render(<EntityTree data={sample} onSelect={fn} />);
    fireEvent.click(screen.getByText('Lead'));
    expect(fn).toHaveBeenCalledWith('e1');
  });
});
```
Run: `npx vitest run` — Expected: FAIL

- [ ] **Step 2: 实现 EntityTree**
```tsx
import { Tree, Badge, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { TreeDataNode } from 'antd';
interface EntityTreeNode extends TreeDataNode { data?: { dimsConfirmed: number }; }
function EntityTree({ data, onSelect }: { data: EntityTreeNode[]; onSelect: (k: string) => void }) {
  const total = 5;
  return (
    <div style={{ padding: '8px 0' }}>
      <Input prefix={<SearchOutlined />} placeholder="搜索实体..."
        style={{ margin: '0 8px 12px', width: 'calc(100% - 16px)' }} />
      <Tree treeData={data} defaultExpandAll
        onSelect={(keys) => { if (keys.length) onSelect(keys[0] as string); }}
        titleRender={(node) => {
          const d = (node as EntityTreeNode).data?.dimsConfirmed;
          return <span>{node.title as string}
            {d !== undefined && <Badge count={d+'/'+total} size="small" style={{
              marginLeft: 8, backgroundColor: d===total?'#52c41a':d>0?'#faad14':'#d9d9d9'
            }} />}
          </span>;
        }}
      />
    </div>
  );
}
export default EntityTree;
```

- [ ] **Step 3: Run test — PASS**

- [ ] **Step 4: Commit**
```bash
git add frontend-react/src/components/tree/
git commit -m "feat: EntityTree with dimension status badges"
```

### Task 3.2: DimensionBlock 折叠区块

**Files:** Create: src/components/review/DimensionBlock.tsx

- [ ] **Step 1: 写 failing test**
```tsx
// __tests__/DimensionBlock.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import DimensionBlock from '../DimensionBlock';
describe('DimensionBlock', () => {
  it('renders title and status', () => {
    render(<DimensionBlock title="维1" status="pending" onConfirm={vi.fn()} onRegenerate={vi.fn()}><p>x</p></DimensionBlock>);
    expect(screen.getByText('维1')).toBeInTheDocument();
    expect(screen.getByText('待确认')).toBeInTheDocument();
  });
  it('calls onConfirm', () => {
    const fn = vi.fn();
    render(<DimensionBlock title="X" status="pending" onConfirm={fn} onRegenerate={vi.fn()}><p>x</p></DimensionBlock>);
    fireEvent.click(screen.getByText('确认'));
    expect(fn).toHaveBeenCalled();
  });
});
```
Run: FAIL

- [ ] **Step 2: 实现**
```tsx
import { Collapse, Button, Space, Tag } from 'antd';
import { CheckOutlined, ReloadOutlined } from '@ant-design/icons';
const colors: Record<string, string> = { confirmed: 'green', pending: 'blue', draft: 'orange' };
const labels: Record<string, string> = { confirmed: '已确认', pending: '待确认', draft: '草稿' };
function DimensionBlock({ title, status, onConfirm, onRegenerate, children }: {
  title: string; status: 'pending'|'confirmed'|'draft';
  onConfirm: () => void; onRegenerate: () => void; children: React.ReactNode;
}) {
  return (
    <Collapse defaultActiveKey={['1']} items={[{ key: '1',
      label: <Space>{title}<Tag color={colors[status]}>{labels[status]}</Tag></Space>,
      extra: <Space>
        <Button size="small" icon={<ReloadOutlined />}
          onClick={e => { e.stopPropagation(); onRegenerate(); }}>重新生成</Button>
        <Button size="small" type="primary" icon={<CheckOutlined />}
          disabled={status === 'confirmed'}
          onClick={e => { e.stopPropagation(); onConfirm(); }}>确认</Button>
      </Space>,
      children,
    }]} />
  );
}
export default DimensionBlock;
```

- [ ] **Step 3: Run test — PASS**

- [ ] **Step 4: Commit**
```bash
git add frontend-react/src/components/review/DimensionBlock.tsx
git commit -m "feat: DimensionBlock collapsible panel"
```

### Task 3.3: StructuralForm (维1 表单)

**Files:** Create: src/components/review/StructuralForm.tsx

- [ ] **Step 1: 写 failing test**
```tsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import StructuralForm from '../StructuralForm';
const defaults = { entityName: '', domain: '', subDomain: '', scenario: '', attributes: [] };
describe('StructuralForm', () => {
  it('renders entity name input', () => {
    render(<StructuralForm data={defaults} onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });
});
```
Run: FAIL

- [ ] **Step 2: 实现**
```tsx
import { Form, Input, Select, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
interface StructuralData { entityName: string; domain: string; subDomain: string; scenario: string; attributes: any[]; }
function StructuralForm({ data, onChange }: { data: StructuralData; onChange: (d: StructuralData) => void }) {
  return (
    <Form layout="vertical">
      <Form.Item label="实体名称">
        <Input value={data.entityName} onChange={e => onChange({...data, entityName: e.target.value})} />
      </Form.Item>
      <Form.Item label="所属领域">
        <Select value={data.domain || undefined} onChange={v => onChange({...data, domain: v})}
          options={[{value:'manufacturing',label:'制造业'},{value:'customer-service',label:'客服'},
            {value:'supply-chain',label:'供应链'},{value:'general',label:'通用'}]} />
      </Form.Item>
      <Form.Item label="子领域">
        <Input value={data.subDomain} onChange={e => onChange({...data, subDomain: e.target.value})} />
      </Form.Item>
      <Form.Item label="业务场景">
        <Input value={data.scenario} onChange={e => onChange({...data, scenario: e.target.value})} />
      </Form.Item>
      <Button icon={<PlusOutlined />} type="dashed" block>添加属性</Button>
    </Form>
  );
}
export default StructuralForm;
```

- [ ] **Step 3: Run test — PASS**

- [ ] **Step 4: Commit**
```bash
git add frontend-react/src/components/review/StructuralForm.tsx
git commit -m "feat: StructuralForm for dimension 1"
```

### Task 3.4: 维2-5 Stub 表单

**Files:** Create: BehavioralForm.tsx, RulesForm.tsx, EventsForm.tsx, InterfacesForm.tsx

- [ ] **Step 1: Create all 4 forms**

Each file same pattern:
```tsx
// frontend-react/src/components/review/BehavioralForm.tsx
import { Form, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
function BehavioralForm({ data, onChange }: { data: any; onChange: (d: any) => void }) {
  return (
    <Form layout="vertical">
      <Form.Item label="行为列表"><Button icon={<PlusOutlined />} type="dashed" block>添加行为</Button></Form.Item>
      <Form.Item label="状态机"><Button icon={<PlusOutlined />} type="dashed" block>添加状态</Button></Form.Item>
    </Form>
  );
}
export default BehavioralForm;
```
(Create RulesForm.tsx, EventsForm.tsx, InterfacesForm.tsx similarly with appropriate labels)

- [ ] **Step 2: Commit**
```bash
git add frontend-react/src/components/review/
git commit -m "feat: stub forms for dimensions 2-5"
```

### Task 3.5: ReviewPanel 主组件

**Files:** Create: src/components/review/ReviewPanel.tsx

- [ ] **Step 1: 写 failing test**
```tsx
import { render, screen } from '@testing-library/react';
import ReviewPanel from '../ReviewPanel';
describe('ReviewPanel', () => {
  it('renders 5 dim blocks', () => {
    render(<ReviewPanel entityName="Lead" />);
    expect(screen.getByText('维1: 静态结构')).toBeInTheDocument();
    expect(screen.getByText('维2: 动态行为')).toBeInTheDocument();
    expect(screen.getByText('维3: 规则约束')).toBeInTheDocument();
    expect(screen.getByText('维4: 事件消息')).toBeInTheDocument();
    expect(screen.getByText('维5: 外部接口')).toBeInTheDocument();
  });
});
```
Run: FAIL

- [ ] **Step 2: 实现 ReviewPanel**
```tsx
import { useState } from 'react';
import { Button, message } from 'antd';
import DimensionBlock from './DimensionBlock';
import StructuralForm from './StructuralForm';
import BehavioralForm from './BehavioralForm';
import RulesForm from './RulesForm';
import EventsForm from './EventsForm';
import InterfacesForm from './InterfacesForm';

type Status = 'pending'|'confirmed'|'draft';

function ReviewPanel({ entityName }: { entityName: string }) {
  const [statuses, setStatuses] = useState<Record<string,Status>>({
    structural:'pending', behavioral:'pending', rules:'pending',
    events:'pending', interfaces:'pending'
  });
  const [sData, setSData] = useState({
    entityName, domain:'', subDomain:'', scenario:'', attributes:[]
  });

  const confirm = (dim: string) => {
    setStatuses(p=>({...p,[dim]:'confirmed'}));
    message.success(dim+' 已确认');
  };
  const regen = (dim: string) => {
    setStatuses(p=>({...p,[dim]:'pending'}));
    message.info('重新生成 '+dim);
  };
  const allOk = Object.values(statuses).every(s=>s==='confirmed');

  return (
    <div style={{ padding: 24 }}>
      <h2>当前实体：{entityName}</h2>
      <DimensionBlock title="维1: 静态结构" status={statuses.structural}
        onConfirm={()=>confirm('structural')} onRegenerate={()=>regen('structural')}>
        <StructuralForm data={sData} onChange={setSData} />
      </DimensionBlock>
      <DimensionBlock title="维2: 动态行为" status={statuses.behavioral}
        onConfirm={()=>confirm('behavioral')} onRegenerate={()=>regen('behavioral')}>
        <BehavioralForm data={{}} onChange={()=>{}} />
      </DimensionBlock>
      <DimensionBlock title="维3: 规则约束" status={statuses.rules}
        onConfirm={()=>confirm('rules')} onRegenerate={()=>regen('rules')}>
        <RulesForm data={{}} onChange={()=>{}} />
      </DimensionBlock>
      <DimensionBlock title="维4: 事件消息" status={statuses.events}
        onConfirm={()=>confirm('events')} onRegenerate={()=>regen('events')}>
        <EventsForm data={{}} onChange={()=>{}} />
      </DimensionBlock>
      <DimensionBlock title="维5: 外部接口" status={statuses.interfaces}
        onConfirm={()=>confirm('interfaces')} onRegenerate={()=>regen('interfaces')}>
        <InterfacesForm data={{}} onChange={()=>{}} />
      </DimensionBlock>
      <div style={{textAlign:'center',marginTop:24}}>
        <Button type="primary" size="large" disabled={!allOk}>全部确认 - 入库</Button>
      </div>
    </div>
  );
}
export default ReviewPanel;
```

- [ ] **Step 3: Run test — PASS**

- [ ] **Step 4: Commit**
```bash
git add frontend-react/src/components/review/ReviewPanel.tsx
git commit -m "feat: ReviewPanel with 5 dim blocks and confirm-all"
```

### Task 3.6: ChatPanel + ChatInput

**Files:** Create: src/components/chat/ChatPanel.tsx, ChatInput.tsx, MessageBubble.tsx

- [ ] **Step 1: 写 ChatInput test**
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ChatInput from '../ChatInput';
describe('ChatInput', () => {
  it('calls onSend', () => {
    const fn = vi.fn();
    render(<ChatInput onSend={fn} />);
    fireEvent.change(screen.getByPlaceholderText('输入消息...'), { target: { value: 'hi' } });
    fireEvent.click(screen.getByText('发送'));
    expect(fn).toHaveBeenCalledWith('hi');
  });
});
```
Run: FAIL

- [ ] **Step 2: 实现 ChatInput**
```tsx
import { useState } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';
function ChatInput({ onSend }: { onSend: (t: string) => void }) {
  const [t, setT] = useState('');
  const send = () => { if (t.trim()) { onSend(t.trim()); setT(''); } };
  return (
    <div style={{ padding: 12, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 8 }}>
      <Input placeholder="输入消息..." value={t} onChange={e=>setT(e.target.value)} onPressEnter={send} />
      <Button type="primary" icon={<SendOutlined />} onClick={send}>发送</Button>
    </div>
  );
}
export default ChatInput;
```

- [ ] **Step 3: 实现 MessageBubble + ChatPanel**
```tsx
// MessageBubble.tsx
function MessageBubble({ role, content }: { role: 'user'|'ai'; content: string }) {
  return <div style={{ marginBottom: 12, padding: 8, borderRadius: 8,
    background: role==='user'?'#e6f7ff':'#f6f6f6', textAlign: role==='user'?'right':'left' }}>
    <strong>{role==='user'?'You':'AI'}:</strong> {content}
  </div>;
}
export default MessageBubble;

// ChatPanel.tsx
import { useState } from 'react';
import { Button } from 'antd';
import ChatInput from './ChatInput';
import MessageBubble from './MessageBubble';
interface Msg { role: 'user'|'ai'; content: string; }
function ChatPanel({ onSend }: { onSend: (m: string) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
        <Button type="text" block>+ 新对话</Button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {msgs.map((m,i)=><MessageBubble key={i} role={m.role} content={m.content} />)}
      </div>
      <ChatInput onSend={(text) => { setMsgs(p=>[...p,{role:'user',content:text}]); onSend(text); }} />
    </div>
  );
}
export default ChatPanel;
```

- [ ] **Step 4: Run test — PASS**

- [ ] **Step 5: Commit**
```bash
git add frontend-react/src/components/chat/
git commit -m "feat: ChatPanel with message bubbles and input"
```

### Task 3.7: 整合三栏到 App

**Files:** Modify: App.tsx, CenterPanel.tsx, LeftSidebar.tsx, RightSidebar.tsx

- [ ] **Step 1: Update CenterPanel**
```tsx
// CenterPanel.tsx
import { useAppStore } from '../../store/useAppStore';
import ReviewPanel from '../review/ReviewPanel';
function CenterPanel() {
  const entity = useAppStore(s => s.currentEntity);
  if (!entity) return <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>
    <h3>选择实体开始建模</h3><p>在左侧对话输入意图，或从右侧实体树选择</p></div>;
  return <ReviewPanel entityName={entity} />;
}
export default CenterPanel;
```

- [ ] **Step 2: Update LeftSidebar**
```tsx
// LeftSidebar.tsx
import ChatPanel from '../chat/ChatPanel';
function LeftSidebar() {
  return <ChatPanel onSend={(msg) => { /* Phase 4: connect to /api/chat/execute */ }} />;
}
export default LeftSidebar;
```

- [ ] **Step 3: Update RightSidebar**
```tsx
// RightSidebar.tsx
import EntityTree from '../tree/EntityTree';
import { useAppStore } from '../../store/useAppStore';
function RightSidebar() {
  const setEntity = useAppStore(s => s.setCurrentEntity);
  const tree = [
    { key: 'd-sales', title: '销售', children: [
      { key: 's-mtl', title: 'Marketing to Leads', children: [
        { key: 'sc-exh', title: '展会获客跟进', children: [
          { key: 'e-lead', title: 'Lead', data: { dimsConfirmed: 0 } }
        ]}
      ]}
    ]}
  ];
  return <EntityTree data={tree} onSelect={setEntity} />;
}
export default RightSidebar;
```

- [ ] **Step 4: Update App.tsx**
```tsx
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import ThreeColumnLayout from './components/layout/ThreeColumnLayout';
function App() {
  return <ConfigProvider locale={zhCN}><ThreeColumnLayout /></ConfigProvider>;
}
export default App;
```

- [ ] **Step 5: Visual check**
```bash
cd D:/AI/Ontology/frontend-react && npm run dev
```
Click "Lead" in right tree → center shows ReviewPanel with 5 dim blocks.

- [ ] **Step 6: Commit**
```bash
git add frontend-react/src/
git commit -m "feat: wire three-column layout to store, tree, chat, review panel"
```

---

## Phase 4: EPC 编辑器 + 导出 UI (预计 10 steps)

### Task 4.1: EPC 步骤表单

**Files:** Create: src/components/epc/EPCStepForm.tsx

- [ ] **Step 1: 写 failing test**
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import EPCStepForm from '../EPCStepForm';
describe('EPCStepForm', () => {
  it('renders event and action inputs', () => {
    render(<EPCStepForm steps={[{event_trigger:'',action:''}]} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('e.g. lead_created')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. score_lead')).toBeInTheDocument();
  });
  it('adds step on click', () => {
    const fn = vi.fn();
    render(<EPCStepForm steps={[{event_trigger:'',action:''}]} onChange={fn} />);
    fireEvent.click(screen.getByText('添加步骤'));
    expect(fn).toHaveBeenCalled();
  });
});
```
Run: FAIL

- [ ] **Step 2: 实现**
```tsx
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
```

- [ ] **Step 3: Run test — PASS**

- [ ] **Step 4: Commit**
```bash
git add frontend-react/src/components/epc/
git commit -m "feat: EPC step form with add/delete"
```

### Task 4.2: EPCEditor + VersionBar

**Files:** Create: src/components/epc/EPCEditor.tsx, src/components/export/VersionBar.tsx

- [ ] **Step 1: 实现 EPCEditor**
```tsx
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
```

- [ ] **Step 2: 实现 VersionBar**
```tsx
import { Button, Dropdown, Tag } from 'antd';
import { ExportOutlined, CloudUploadOutlined, HistoryOutlined } from '@ant-design/icons';
function VersionBar() {
  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
      <Tag color="blue">v1.0.0</Tag>
      <Dropdown menu={{ items: [
        { key: 'json', label: '导出 JSON', icon: <ExportOutlined /> },
        { key: 'yaml', label: '导出 YAML', icon: <ExportOutlined /> },
        { key: 'publish', label: '发布新版本', icon: <CloudUploadOutlined /> },
        { key: 'history', label: '版本历史', icon: <HistoryOutlined /> },
      ]}}>
        <Button size="small" style={{ marginLeft: 8 }}>发布</Button>
      </Dropdown>
    </div>
  );
}
export default VersionBar;
```

- [ ] **Step 3: Wire VersionBar into RightSidebar** — add import and <VersionBar /> at bottom

- [ ] **Step 4: Commit**
```bash
git add frontend-react/src/components/epc/ frontend-react/src/components/export/ frontend-react/src/components/layout/RightSidebar.tsx
git commit -m "feat: EPC editor + version bar with export dropdown"
```

---

## Phase 5: 端到端集成 + 验收 (预计 5 steps)

### Task 5.1: E2E 测试

**Files:** Create: tests/test_e2e_5dim_flow.py

- [ ] **Step 1: 写 E2E 测试**
```python
# tests/test_e2e_5dim_flow.py
def test_full_5dim_create_publish_export(client):
    dims_data = {
        'structural': {'entities': [{'id':'lead','attributes':[{'id':'source','type':'string'}]}]},
        'behavioral': {'actions': [{'id':'score_lead','name':'评分'}]},
        'rules': {'validations': [{'id':'v1','type':'field_validation','entity':'lead','field':'source'}]},
        'events': {'event_types': [{'id':'lead_created','severity':'info'}]},
        'interfaces': {'apis': [{'id':'api1','url':'http://x','method':'GET'}]},
    }
    ids = []
    for dim, content in dims_data.items():
        r = client.post('/api/meta-models/definitions', json={
            'model_type': dim, 'name': f'e2e_{dim}', 'version': '1.0.0', 'content': content
        })
        assert r.status_code == 201
        ids.append(r.get_json()['id'])
    pub = client.post('/api/meta-models/publish', json={
        'release_no': 'e2e-v1', 'model_ids': ids, 'operator': 'e2e'
    })
    assert pub.status_code == 201
    export = client.get('/api/export/json/e2e-v1')
    assert export.status_code == 200
    data = export.get_json()
    for dim in ['structural','behavioral','rules','events','interfaces']:
        assert dim in data
    assert data['structural']['entities'][0]['id'] == 'lead'
```

- [ ] **Step 2: Run E2E test**
```bash
pytest tests/test_e2e_5dim_flow.py -v
```
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add tests/test_e2e_5dim_flow.py
git commit -m "test: e2e 5-dim create-publish-export flow"
```

### Task 5.2: 全量测试 + lint

- [ ] **Step 1: Backend tests**
```bash
pytest tests/ -v
```
Fix any failures, then Expected: all PASS

- [ ] **Step 2: Frontend tests**
```bash
cd D:/AI/Ontology/frontend-react && npx vitest run
```
Expected: all PASS

- [ ] **Step 3: Type check**
```bash
cd D:/AI/Ontology/frontend-react && npx tsc --noEmit
```
Expected: no type errors

- [ ] **Step 4: Final commit**
```bash
git add -A && git commit -m "chore: all tests green, types clean, integration complete"
```

---

## Execution Notes

1. `content_json` 字段名已核实：`backend/models.py:17` — `MetaModelDefinition.content_json`。Plam 中所有 references 正确。
2. 领域选项（Task 3.3 StructuralForm）Phase 1 硬编码 OK。后续 Phase 增加 `/api/meta-models/domains` 动态获取。

## Summary

| Phase | Steps | Content |
|-------|:-----:|---------|
| P1 | 20 | React scaffold + layout + store + API |
| P2 | 10 | Backend 5-dim types + EPC API + export |
| P3 | 25 | EntityTree + ReviewPanel + Chat |
| P4 | 10 | EPC editor + version bar |
| P5 | 5 | E2E test + lint + final check |
| **Total** | **~70** | **each 2-5 min** |
