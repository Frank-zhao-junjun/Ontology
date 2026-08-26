import { describe, expect, it } from 'vitest';
import type { OwlOntology } from '@/types/ontology';
import { serializeToRdfXml, serializeToTurtle } from '@/lib/owl/serialize-rdf';

function sampleOntology(): OwlOntology {
  return {
    baseUri: 'http://example.com/erp/',
    ontologyIri: 'http://example.com/erp/',
    versionInfo: 'v1.0.0',
    label: '采购管理本体',
    classes: [
      { id: 'Order', label: '订单', labelEn: 'Order' },
      {
        id: 'PurchaseOrder',
        label: '采购订单',
        subClassOf: ['Order'],
        equivalentTo: ['PO'],
        description: '向供应商发起的采购单据',
      },
      { id: 'PO', label: '采购单' },
    ],
    objectProperties: [
      { id: 'PurchaseOrder_hasLine', label: '包含', domain: 'PurchaseOrder', range: 'OrderLine', transitive: true },
    ],
    datatypeProperties: [
      { id: 'PurchaseOrder_amount', label: '金额', domain: 'PurchaseOrder', range: 'xsd:decimal', functional: true },
    ],
  };
}

describe('serializeToRdfXml', () => {
  it('应输出标准 rdf:RDF 根元素与完整命名空间声明', () => {
    const xml = serializeToRdfXml(sampleOntology());
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rdf:RDF');
    expect(xml).toContain('xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"');
    expect(xml).toContain('xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"');
    expect(xml).toContain('xmlns:owl="http://www.w3.org/2002/07/owl#"');
    expect(xml).toContain('xmlns:xsd="http://www.w3.org/2001/XMLSchema#"');
    expect(xml).toContain('</rdf:RDF>');
  });

  it('应输出本体声明与类/属性结构', () => {
    const xml = serializeToRdfXml(sampleOntology());
    expect(xml).toContain('<owl:Ontology rdf:about="http://example.com/erp/">');
    expect(xml).toContain('<rdfs:label>采购管理本体</rdfs:label>');
    expect(xml).toContain('<owl:versionInfo>v1.0.0</owl:versionInfo>');
    expect(xml).toContain('<owl:Class rdf:about="http://example.com/erp/PurchaseOrder">');
    expect(xml).toContain('<rdfs:subClassOf rdf:resource="http://example.com/erp/Order"/>');
    expect(xml).toContain('<owl:equivalentClass rdf:resource="http://example.com/erp/PO"/>');
    expect(xml).toContain('<owl:ObjectProperty rdf:about="http://example.com/erp/PurchaseOrder_hasLine">');
    expect(xml).toContain('<owl:DatatypeProperty rdf:about="http://example.com/erp/PurchaseOrder_amount">');
    expect(xml).toContain('<rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#decimal"/>');
  });

  it('应转义 XML 特殊字符', () => {
    const ontology = sampleOntology();
    ontology.classes = [{ id: 'A', label: '含<特殊>&"字符"', description: '5 > 3 & 2 < 4' }];
    const xml = serializeToRdfXml(ontology);
    expect(xml).toContain('含&lt;特殊&gt;&amp;&quot;字符&quot;');
    expect(xml).toContain('5 &gt; 3 &amp; 2 &lt; 4');
  });
});

describe('serializeToTurtle', () => {
  it('应输出 @prefix 声明与本体三元组', () => {
    const ttl = serializeToTurtle(sampleOntology());
    expect(ttl).toContain('@prefix : <http://example.com/erp/> .');
    expect(ttl).toContain('@prefix owl: <http://www.w3.org/2002/07/owl#> .');
    expect(ttl).toContain('@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .');
    expect(ttl).toContain('@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .');
    expect(ttl).toContain('a owl:Ontology');
    expect(ttl).toContain('rdfs:label "采购管理本体"');
  });

  it('应输出类层级与属性三元组', () => {
    const ttl = serializeToTurtle(sampleOntology());
    expect(ttl).toContain(':PurchaseOrder');
    expect(ttl).toContain('rdfs:subClassOf :Order');
    expect(ttl).toContain('owl:equivalentClass :PO');
    expect(ttl).toContain('a owl:ObjectProperty, owl:TransitiveProperty');
    expect(ttl).toContain('rdfs:domain :PurchaseOrder');
    expect(ttl).toContain('rdfs:range xsd:decimal');
    expect(ttl).toContain('a owl:DatatypeProperty, owl:FunctionalProperty');
  });

  it('应转义字符串字面量中的引号与换行', () => {
    const ontology = sampleOntology();
    ontology.classes = [{ id: 'A', label: '含"引号"', description: '第一行\n第二行' }];
    const ttl = serializeToTurtle(ontology);
    expect(ttl).toContain('rdfs:label "含\\"引号\\""');
    expect(ttl).toContain('rdfs:comment "第一行\\n第二行"');
  });
});
