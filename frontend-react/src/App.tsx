import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import ErrorBoundary from './components/ErrorBoundary';
import ThreeColumnLayout from './components/layout/ThreeColumnLayout';
function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <ErrorBoundary>
        <ThreeColumnLayout />
      </ErrorBoundary>
    </ConfigProvider>
  );
}
export default App;
