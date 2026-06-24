import { useState } from 'react';
import { Layout, Button } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import LeftSidebar from './LeftSidebar';
import CenterPanel from './CenterPanel';
import RightSidebar from './RightSidebar';

const { Sider, Content } = Layout;

function ThreeColumnLayout() {
  const [leftC, setLeftC] = useState(false);
  const [rightC, setRightC] = useState(false);

  return (
    <Layout style={{ height: '100vh', position: 'relative' }}>
      <Sider width={320} collapsedWidth={0} collapsed={leftC} trigger={null}
        data-testid="left-sidebar" style={{ background: '#fff' }}>
        {!leftC && <LeftSidebar />}
      </Sider>
      <Button data-testid="toggle-left" type="text"
        icon={leftC ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setLeftC(!leftC)}
        style={{ position: 'absolute', left: leftC ? 0 : 320, top: 8, zIndex: 10 }} />
      <Content data-testid="center-panel" style={{ background: '#fafafa' }}>
        <CenterPanel />
      </Content>
      <Sider width={280} collapsedWidth={0} collapsed={rightC} trigger={null}
        data-testid="right-sidebar" style={{ background: '#fff' }}>
        {!rightC && <RightSidebar />}
      </Sider>
    </Layout>
  );
}

export default ThreeColumnLayout;
