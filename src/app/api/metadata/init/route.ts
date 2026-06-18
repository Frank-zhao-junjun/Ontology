import { NextResponse } from 'next/server';
import { METADATA_LIST } from '@/lib/metadata-local';
import { createMetadataTemplateId } from '@/lib/metadata-utils';

export async function GET() {
  try {
    const now = new Date().toISOString();
    const metadata = METADATA_LIST.map((item) => ({
      id: createMetadataTemplateId(item.nameEn),
      domain: item.domain,
      name: item.name,
      nameEn: item.nameEn,
      description: item.description,
      type: item.type,
      valueRange: item.valueRange || '',
      standard: item.standard || '',
      source: item.source || '',
      createdAt: now,
      updatedAt: now,
    }));

    return NextResponse.json({
      success: true,
      data: metadata,
      total: metadata.length,
    });
  } catch (error) {
    console.error('Metadata init error:', error);
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      warning: '元数据初始化失败，请手动添加元数据',
    });
  }
}
