import type { OwlOntology } from '@/types/ontology';

const RDF_NS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const RDFS_NS = 'http://www.w3.org/2000/01/rdf-schema#';
const OWL_NS = 'http://www.w3.org/2002/07/owl#';
const XSD_NS = 'http://www.w3.org/2001/XMLSchema#';

/** XML 特殊字符转义 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Turtle 字符串字面量转义 */
function escapeTurtleLiteral(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

/** xsd:string → http://www.w3.org/2001/XMLSchema#string */
function xsdUri(xsdType: string): string {
  return `${XSD_NS}${xsdType.replace(/^xsd:/, '')}`;
}

/** 序列化为 RDF/XML（标准 <rdf:RDF> 根元素 + owl/rdfs/xsd 命名空间） */
export function serializeToRdfXml(ontology: OwlOntology): string {
  const { baseUri } = ontology;
  const lines: string[] = [];

  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    `<rdf:RDF xml:base="${escapeXml(baseUri)}"`,
  );
  lines.push(`     xmlns="${escapeXml(baseUri)}"`);
  lines.push(`     xmlns:rdf="${RDF_NS}"`);
  lines.push(`     xmlns:rdfs="${RDFS_NS}"`);
  lines.push(`     xmlns:owl="${OWL_NS}"`);
  lines.push(`     xmlns:xsd="${XSD_NS}">`);

  // 本体声明（label 使用项目/领域名称）
  lines.push(`  <owl:Ontology rdf:about="${escapeXml(ontology.ontologyIri)}">`);
  lines.push(`    <rdfs:label>${escapeXml(ontology.label)}</rdfs:label>`);
  if (ontology.versionInfo) {
    lines.push(`    <owl:versionInfo>${escapeXml(ontology.versionInfo)}</owl:versionInfo>`);
  }
  lines.push('  </owl:Ontology>');

  for (const cls of ontology.classes) {
    lines.push(`  <owl:Class rdf:about="${escapeXml(baseUri + cls.id)}">`);
    lines.push(`    <rdfs:label>${escapeXml(cls.label)}</rdfs:label>`);
    if (cls.labelEn) {
      lines.push(`    <rdfs:label xml:lang="en">${escapeXml(cls.labelEn)}</rdfs:label>`);
    }
    for (const parent of cls.subClassOf ?? []) {
      lines.push(`    <rdfs:subClassOf rdf:resource="${escapeXml(baseUri + parent)}"/>`);
    }
    for (const eq of cls.equivalentTo ?? []) {
      lines.push(`    <owl:equivalentClass rdf:resource="${escapeXml(baseUri + eq)}"/>`);
    }
    for (const dis of cls.disjointWith ?? []) {
      lines.push(`    <owl:disjointWith rdf:resource="${escapeXml(baseUri + dis)}"/>`);
    }
    if (cls.description) {
      lines.push(`    <rdfs:comment>${escapeXml(cls.description)}</rdfs:comment>`);
    }
    lines.push('  </owl:Class>');
  }

  for (const prop of ontology.objectProperties) {
    lines.push(`  <owl:ObjectProperty rdf:about="${escapeXml(baseUri + prop.id)}">`);
    lines.push(`    <rdfs:label>${escapeXml(prop.label)}</rdfs:label>`);
    lines.push(`    <rdfs:domain rdf:resource="${escapeXml(baseUri + prop.domain)}"/>`);
    lines.push(`    <rdfs:range rdf:resource="${escapeXml(baseUri + prop.range)}"/>`);
    for (const sup of prop.subPropertyOf ?? []) {
      lines.push(`    <rdfs:subPropertyOf rdf:resource="${escapeXml(baseUri + sup)}"/>`);
    }
    if (prop.inverseOf) {
      lines.push(`    <owl:inverseOf rdf:resource="${escapeXml(baseUri + prop.inverseOf)}"/>`);
    }
    if (prop.description) {
      lines.push(`    <rdfs:comment>${escapeXml(prop.description)}</rdfs:comment>`);
    }
    lines.push('  </owl:ObjectProperty>');
    if (prop.transitive) {
      lines.push(`  <owl:TransitiveProperty rdf:about="${escapeXml(baseUri + prop.id)}"/>`);
    }
    if (prop.symmetric) {
      lines.push(`  <owl:SymmetricProperty rdf:about="${escapeXml(baseUri + prop.id)}"/>`);
    }
    if (prop.functional) {
      lines.push(`  <owl:FunctionalProperty rdf:about="${escapeXml(baseUri + prop.id)}"/>`);
    }
  }

  for (const prop of ontology.datatypeProperties) {
    lines.push(`  <owl:DatatypeProperty rdf:about="${escapeXml(baseUri + prop.id)}">`);
    lines.push(`    <rdfs:label>${escapeXml(prop.label)}</rdfs:label>`);
    lines.push(`    <rdfs:domain rdf:resource="${escapeXml(baseUri + prop.domain)}"/>`);
    lines.push(`    <rdfs:range rdf:resource="${escapeXml(xsdUri(prop.range))}"/>`);
    if (prop.description) {
      lines.push(`    <rdfs:comment>${escapeXml(prop.description)}</rdfs:comment>`);
    }
    lines.push('  </owl:DatatypeProperty>');
    if (prop.functional) {
      lines.push(`  <owl:FunctionalProperty rdf:about="${escapeXml(baseUri + prop.id)}"/>`);
    }
  }

  lines.push('</rdf:RDF>');
  return `${lines.join('\n')}\n`;
}

/** 序列化为 Turtle（@prefix 声明 + 简洁三元组） */
export function serializeToTurtle(ontology: OwlOntology): string {
  const { baseUri } = ontology;
  const lines: string[] = [];

  lines.push(`@prefix : <${baseUri}> .`);
  lines.push(`@prefix rdf: <${RDF_NS}> .`);
  lines.push(`@prefix rdfs: <${RDFS_NS}> .`);
  lines.push(`@prefix owl: <${OWL_NS}> .`);
  lines.push(`@prefix xsd: <${XSD_NS}> .`);
  lines.push('');

  // 本体声明
  const ontologyTriples = [
    `a owl:Ontology`,
    `rdfs:label "${escapeTurtleLiteral(ontology.label)}"`,
  ];
  if (ontology.versionInfo) {
    ontologyTriples.push(`owl:versionInfo "${escapeTurtleLiteral(ontology.versionInfo)}"`);
  }
  lines.push(`<${ontology.ontologyIri}>`);
  lines.push(`    ${ontologyTriples.join(' ;\n    ')} .`);
  lines.push('');

  for (const cls of ontology.classes) {
    const triples = [`a owl:Class`, `rdfs:label "${escapeTurtleLiteral(cls.label)}"`];
    if (cls.labelEn) {
      triples.push(`rdfs:label "${escapeTurtleLiteral(cls.labelEn)}"@en`);
    }
    for (const parent of cls.subClassOf ?? []) {
      triples.push(`rdfs:subClassOf :${parent}`);
    }
    for (const eq of cls.equivalentTo ?? []) {
      triples.push(`owl:equivalentClass :${eq}`);
    }
    for (const dis of cls.disjointWith ?? []) {
      triples.push(`owl:disjointWith :${dis}`);
    }
    if (cls.description) {
      triples.push(`rdfs:comment "${escapeTurtleLiteral(cls.description)}"`);
    }
    lines.push(`:${cls.id}`);
    lines.push(`    ${triples.join(' ;\n    ')} .`);
    lines.push('');
  }

  for (const prop of ontology.objectProperties) {
    const types = ['owl:ObjectProperty'];
    if (prop.transitive) types.push('owl:TransitiveProperty');
    if (prop.symmetric) types.push('owl:SymmetricProperty');
    if (prop.functional) types.push('owl:FunctionalProperty');
    const triples = [
      `a ${types.join(', ')}`,
      `rdfs:label "${escapeTurtleLiteral(prop.label)}"`,
      `rdfs:domain :${prop.domain}`,
      `rdfs:range :${prop.range}`,
    ];
    for (const sup of prop.subPropertyOf ?? []) {
      triples.push(`rdfs:subPropertyOf :${sup}`);
    }
    if (prop.inverseOf) {
      triples.push(`owl:inverseOf :${prop.inverseOf}`);
    }
    if (prop.description) {
      triples.push(`rdfs:comment "${escapeTurtleLiteral(prop.description)}"`);
    }
    lines.push(`:${prop.id}`);
    lines.push(`    ${triples.join(' ;\n    ')} .`);
    lines.push('');
  }

  for (const prop of ontology.datatypeProperties) {
    const types = ['owl:DatatypeProperty'];
    if (prop.functional) types.push('owl:FunctionalProperty');
    const triples = [
      `a ${types.join(', ')}`,
      `rdfs:label "${escapeTurtleLiteral(prop.label)}"`,
      `rdfs:domain :${prop.domain}`,
      `rdfs:range ${prop.range}`,
    ];
    if (prop.description) {
      triples.push(`rdfs:comment "${escapeTurtleLiteral(prop.description)}"`);
    }
    lines.push(`:${prop.id}`);
    lines.push(`    ${triples.join(' ;\n    ')} .`);
    lines.push('');
  }

  return lines.join('\n');
}
