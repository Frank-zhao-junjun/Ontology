import { Component, ReactNode } from 'react';
import { Result, Button } from 'antd';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="页面异常"
          subTitle={this.state.error?.message || '未知错误'}
          extra={[
            <Button key="retry" type="primary" onClick={() => this.setState({ hasError: false, error: null })}>
              重试
            </Button>,
            <Button key="reload" onClick={() => window.location.reload()}>刷新页面</Button>,
          ]}
        />
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
