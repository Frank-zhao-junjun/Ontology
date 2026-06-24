'use client';

import { useState, useRef } from 'react';
import { useOntologyStore } from '@/store/ontology-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Trash2, FileText, Loader2, Eye, Search, AlertCircle } from 'lucide-react';

export function ReferenceDocPanel() {
  const project = useOntologyStore((s) => s.project);
  const addDoc = useOntologyStore((s) => s.addReferenceDocument);
  const removeDoc = useOntologyStore((s) => s.removeReferenceDocument);
  const updateDoc = useOntologyStore((s) => s.updateReferenceDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  const docs = project?.referenceDocuments || [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/reference-documents/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        addDoc(json.data);
      } else {
        setError(json.error || '上传失败');
      }
    } catch {
      setError('网络错误');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExtractEntities = async (docId: string) => {
    const doc = docs.find((d) => d.id === docId);
    if (!doc) return;
    updateDoc(docId, { extractionStatus: 'processing' });
    try {
      const res = await fetch('/api/reference-documents/extract-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId,
          documentText: doc.extractedText,
          title: doc.title,
          domain: project?.domain,
        }),
      });
      const json = await res.json();
      if (json.success) {
        updateDoc(docId, {
          extractedEntities: json.data.entities,
          extractionStatus: 'done',
        });
      } else {
        updateDoc(docId, { extractionStatus: 'failed' });
      }
    } catch {
      updateDoc(docId, { extractionStatus: 'failed' });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          参考文档
          <Badge variant="secondary">{docs.length}/10</Badge>
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || docs.length >= 10}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          上传
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".docx,.pdf,.xlsx,.txt,.md,.csv"
          onChange={handleUpload}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      {docs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Upload className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">上传参考文档辅助 AI 建模</p>
            <p className="text-xs mt-1">支持 .docx .pdf .xlsx .txt .md .csv (最大10MB, 最多10份)</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {docs.map((doc) => (
              <Card key={doc.id} className={previewDocId === doc.id ? 'ring-2 ring-primary' : ''}>
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="truncate flex-1">{doc.fileName}</span>
                    <Badge variant="outline" className="text-[10px]">{doc.fileType}</Badge>
                    <Badge variant={doc.parseStatus === 'success' ? 'default' : 'destructive'} className="text-[10px]">
                      {doc.parseStatus}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 text-xs space-y-1">
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>{formatSize(doc.fileSize)}</span>
                    <span>{doc.textLength} 字符</span>
                    {doc.title && <span className="font-medium">{doc.title}</span>}
                  </div>

                  {doc.parseError && (
                    <p className="text-red-500">{doc.parseError}</p>
                  )}

                  <div className="flex gap-1 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setPreviewDocId(previewDocId === doc.id ? null : doc.id)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      {previewDocId === doc.id ? '收起' : '预览'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => handleExtractEntities(doc.id)}
                      disabled={doc.extractionStatus === 'processing' || doc.parseStatus !== 'success'}
                    >
                      <Search className="h-3 w-3 mr-1" />
                      {doc.extractionStatus === 'processing' ? '提取中...' : '提取实体'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-red-500 ml-auto"
                      onClick={() => removeDoc(doc.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Preview */}
                  {previewDocId === doc.id && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs max-h-32 overflow-auto whitespace-pre-wrap">
                      {doc.extractedText.slice(0, 1000)}
                      {doc.extractedText.length > 1000 && '\n...(预览截断)'}
                    </div>
                  )}

                  {/* Extracted Entities */}
                  {doc.extractionStatus === 'done' && doc.extractedEntities && doc.extractedEntities.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="font-medium text-xs">提取的实体候选 ({doc.extractedEntities.length}):</p>
                      {doc.extractedEntities.map((entity, i) => (
                        <div key={i} className="flex items-center gap-1 text-[11px]">
                          <Badge variant="secondary" className="text-[10px]">{entity.name}</Badge>
                          {entity.nameEn && <span className="text-muted-foreground">{entity.nameEn}</span>}
                          <Badge variant="outline" className="text-[10px]">{Math.round(entity.confidence * 100)}%</Badge>
                          {entity.attributes && (
                            <span className="text-muted-foreground">({entity.attributes.length} 属性)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

