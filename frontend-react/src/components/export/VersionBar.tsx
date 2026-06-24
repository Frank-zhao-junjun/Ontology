import { useState, useEffect } from 'react';
import { Button, Dropdown, Tag, Spin } from 'antd';
import { ExportOutlined, CloudUploadOutlined, HistoryOutlined } from '@ant-design/icons';
import { getVersions } from '../../services/api';

function VersionBar() {
  const [latest, setLatest] = useState<string>('—');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getVersions()
      .then(r => { if (!cancelled) { const items = r.data.items || []; setLatest(items.length > 0 ? items[0].release_no : 'v0.0.0'); } })
      .catch(() => { if (!cancelled) setLatest('离线'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
      {loading ? <Spin size="small" /> : <Tag color="blue">{latest}</Tag>}
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
