import { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { useShallow } from 'zustand/shallow';
import DimensionBlock from './DimensionBlock';
import StructuralForm from './StructuralForm';
import BehavioralForm from './BehavioralForm';
import RulesForm from './RulesForm';
import EventsForm from './EventsForm';
import InterfacesForm from './InterfacesForm';
import { useAppStore } from '../../store/useAppStore';
import { safeMap } from '../../utils/array-helpers';

type Status = 'pending'|'confirmed'|'draft';

function ReviewPanel({ entityName }: { entityName: string }) {
  const storeStructural = useAppStore(useShallow(s => s.structuralData));
  const storeBehavioral = useAppStore(useShallow(s => s.behavioralData));
  const storeRules    = useAppStore(useShallow(s => s.rulesData));
  const storeEvents   = useAppStore(useShallow(s => s.eventsData));
  const storeInterfaces = useAppStore(useShallow(s => s.interfacesData));

  const [statuses, setStatuses] = useState<Record<string,Status>>({
    structural:'pending', behavioral:'pending', rules:'pending',
    events:'pending', interfaces:'pending'
  });
  const [sData, setSData] = useState({
    entityName, domain:'', domainId: null as number | null, subDomain:'', scenario:'',
    attributes:[], relations:[], inheritance:'', valueObjects:[]
  });
  const [bData, setBData] = useState({ actions: [], stateMachines: [], indicators: [] });
  const [rData, setRData] = useState({ validations: [], guardrails: [], policies: [], permissions: [], exemptions: [], probes: [] });
  const [eData, setEData] = useState({ eventTypes: [], sources: [], causalities: [] });
  const [iData, setIData] = useState({ apis: [], queries: [], compute: [], notifications: [], reports: [] });

  // When store receives LLM data, populate forms.
  // Guard: never overwrite a confirmed dimension — confirmed versions are immutable.
  useEffect(() => {
    if (statuses.structural === 'confirmed') return;
    if (storeStructural.entities?.length > 0) {
      const e = storeStructural.entities[0];
      setSData(prev => ({
        ...prev,
        entityName: e.name || prev.entityName,
        attributes: safeMap(e.attributes, (a, i) => ({
          key: String(i),
          id: a.id || '',
          name: a.name || '',
          type: a.type || 'string',
          required: Boolean(a.required),
          unique: Boolean(a.unique),
          autoFill: a.autoFill || '',
        })),
        relations: safeMap(storeStructural.relations, (r, i) => ({
          key: String(i),
          source: r.source || '',
          target: r.target || '',
          type: r.type || '',
          inverseOf: r.inverseOf || '',
          domain: r.domain || '',
          range: r.range || '',
        })),
        valueObjects: safeMap(storeStructural.valueObjects, (v, i) => ({
          key: String(i),
          name: v.name || '',
          fields: v.fields || '',
        })),
      }));
      setStatuses(prev => ({ ...prev, structural: 'pending' }));
    }
  }, [storeStructural, statuses.structural]);

  useEffect(() => {
    if (statuses.behavioral === 'confirmed') return;
    if (storeBehavioral.actions?.length > 0 || storeBehavioral.stateMachines?.length > 0) {
      setBData({
        actions: safeMap(storeBehavioral.actions, (a, i) => ({
          key: String(i),
          id: a.id || '',
          name: a.name || '',
          input: a.input || '',
          output: a.output || '',
          domain: a.domain || '',
        })),
        stateMachines: safeMap(storeBehavioral.stateMachines, (sm, i) => ({
          key: String(i),
          id: sm.id || '',
          name: sm.name || '',
          entity: sm.entity || '',
          states: sm.states || [],
          transitions: safeMap(sm.transitions, (t, j) => ({
            key: String(j),
            from: t.from || '',
            to: t.to || '',
            trigger: t.trigger || '',
          })),
        })),
        indicators: safeMap(storeBehavioral.indicators, (ind, i) => ({
          key: String(i),
          id: ind.id || '',
          name: ind.name || '',
          formula: ind.formula || '',
          target: ind.target || '',
          warningThreshold: ind.warningThreshold || '',
          domain: ind.domain || '',
        })),
      });
      setStatuses(prev => ({ ...prev, behavioral: 'pending' }));
    }
  }, [storeBehavioral, statuses.behavioral]);

  useEffect(() => {
    if (statuses.rules === 'confirmed') return;
    if (storeRules.validations?.length > 0 || storeRules.guardrails?.length > 0) {
      setRData({
        validations: safeMap(storeRules.validations, (v, i) => ({
          key: String(i),
          id: v.id || '',
          type: v.type || '',
          entity: v.entity || '',
          field: v.field || '',
          expression: v.expression || '',
        })),
        guardrails: safeMap(storeRules.guardrails, (g, i) => ({
          key: String(i),
          id: g.id || '',
          name: g.name || '',
          condition: g.condition || '',
          action: g.action || '',
        })),
        policies: safeMap(storeRules.policies, (p, i) => ({
          key: String(i),
          id: p.id || '',
          name: p.name || '',
          rules: p.rules || '',
        })),
        permissions: safeMap(storeRules.permissions, (p, i) => ({
          key: String(i),
          role: p.role || '',
          resource: p.resource || '',
          operations: p.operations || '',
        })),
        exemptions: safeMap(storeRules.exemptions, (e, i) => ({
          key: String(i),
          id: e.id || '',
          constraint: e.constraint || '',
          reason: e.reason || '',
        })),
        probes: safeMap(storeRules.probes, (p, i) => ({
          key: String(i),
          id: p.id || '',
          name: p.name || '',
          target: p.target || '',
          frequency: p.frequency || '',
          alertCondition: p.alertCondition || '',
          domain: p.domain || '',
        })),
      });
      setStatuses(prev => ({ ...prev, rules: 'pending' }));
    }
  }, [storeRules, statuses.rules]);

  useEffect(() => {
    if (statuses.events === 'confirmed') return;
    if (storeEvents.eventTypes?.length > 0) {
      setEData({
        eventTypes: safeMap(storeEvents.eventTypes, (et, i) => ({
          key: String(i),
          id: et.id || '',
          name: et.name || '',
          severity: et.severity || '',
          source: et.source || '',
          targetEntity: et.targetEntity || '',
          payloadSchema: et.payloadSchema || '',
        })),
        sources: storeEvents.sources || [],
        causalities: safeMap(storeEvents.causalities, (c, i) => ({
          key: String(i),
          cause: c.cause || '',
          effect: c.effect || '',
        })),
      });
      setStatuses(prev => ({ ...prev, events: 'pending' }));
    }
  }, [storeEvents, statuses.events]);

  useEffect(() => {
    if (statuses.interfaces === 'confirmed') return;
    if (storeInterfaces.apis?.length > 0 || storeInterfaces.queries?.length > 0) {
      setIData({
        apis: safeMap(storeInterfaces.apis, (a, i) => ({
          key: String(i),
          id: a.id || '',
          name: a.name || '',
          url: a.url || '',
          method: a.method || '',
          params: a.params || '',
          response: a.response || '',
        })),
        queries: safeMap(storeInterfaces.queries, (q, i) => ({
          key: String(i),
          id: q.id || '',
          name: q.name || '',
          type: q.type || '',
          template: q.template || '',
        })),
        compute: safeMap(storeInterfaces.compute, (c, i) => ({
          key: String(i),
          id: c.id || '',
          name: c.name || '',
          input: c.input || '',
          output: c.output || '',
          formula: c.formula || '',
        })),
        notifications: safeMap(storeInterfaces.notifications, (n, i) => ({
          key: String(i),
          id: n.id || '',
          name: n.name || '',
          channel: n.channel || '',
          template: n.template || '',
        })),
        reports: safeMap(storeInterfaces.reports, (r, i) => ({
          key: String(i),
          id: r.id || '',
          name: r.name || '',
          fields: r.fields || '',
          format: r.format || '',
        })),
      });
      setStatuses(prev => ({ ...prev, interfaces: 'pending' }));
    }
  }, [storeInterfaces, statuses.interfaces]);

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
        <BehavioralForm data={bData} onChange={setBData} />
      </DimensionBlock>
      <DimensionBlock title="维3: 规则约束" status={statuses.rules}
        onConfirm={()=>confirm('rules')} onRegenerate={()=>regen('rules')}>
        <RulesForm data={rData} onChange={setRData} />
      </DimensionBlock>
      <DimensionBlock title="维4: 事件消息" status={statuses.events}
        onConfirm={()=>confirm('events')} onRegenerate={()=>regen('events')}>
        <EventsForm data={eData} onChange={setEData} />
      </DimensionBlock>
      <DimensionBlock title="维5: 外部接口" status={statuses.interfaces}
        onConfirm={()=>confirm('interfaces')} onRegenerate={()=>regen('interfaces')}>
        <InterfacesForm data={iData} onChange={setIData} />
      </DimensionBlock>
      <div style={{textAlign:'center',marginTop:24}}>
        <Button type="primary" size="large" disabled={!allOk}>全部确认 - 入库</Button>
      </div>
    </div>
  );
}
export default ReviewPanel;
