import { useAppStore } from '../../store/useAppStore';
import ReviewPanel from '../review/ReviewPanel';
function CenterPanel() {
  const entity = useAppStore(s => s.currentEntity);
  if (!entity) return <div style={{ padding: 48, textAlign: 'center', color: '#999' }}>
    <h3>选择实体开始建模</h3><p>在左侧对话输入意图，或从右侧实体树选择</p></div>;
  return <ReviewPanel entityName={entity} />;
}
export default CenterPanel;
