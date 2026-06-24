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
