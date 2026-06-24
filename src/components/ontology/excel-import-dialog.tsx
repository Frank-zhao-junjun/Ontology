'use client';

import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Clock, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useOntologyStore } from '@/store/ontology-store';
import type { ExcelImportResult, ExcelImportError, ProjectVersion } from '@/types/ontology';

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'validating' | 'result' | 'review';

export function ExcelImportDialog({ open, onOpenChange }: ExcelImportDialogProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExcelImportResult | null>(null);
  const [errorDetailsOpen, setErrorDetailsOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [importedVersion, setImportedVersion] = useState<ProjectVersion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createVersionFromParsedData, versions, project, approveVersion, rejectVersion } = useOntologyStore();

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/excel-template');
      if (!response.ok) throw new Error('模板下载失败');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ontology-import-template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      // silently fail
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setStep('upload');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStep('validating');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/excel-import', {
        method: 'POST',
        body: formData,
      });
      const data: ExcelImportResult = await response.json();
      setResult(data);

      if (data.success && data.versionId && data.parsedData) {
        // 使用解析后的数据生成新版本 (pending_review)
        const existingVersions = versions.filter(v => v.projectId === project?.id);
        const nextVersionNum = existingVersions.length + 1;
        const versionName = data.versionName || `v${nextVersionNum}.0.0`;

        const newVersion = createVersionFromParsedData({
          version: versionName,
          name: `Excel导入 ${new Date().toLocaleDateString('zh-CN')}`,
          description: `从文件 ${file.name} 导入`,
          parsedData: data.parsedData,
        });

        setImportedVersion(newVersion);
        setStep('review');
      } else {
        setStep('result');
      }
    } catch {
      setResult({
        success: false,
        errorMessage: '网络错误，请重试',
        validation: { totalRows: 0, validRows: 0, errorCount: 0, errors: [] },
      });
      setStep('result');
    }
  };

  const handleApprove = () => {
    if (importedVersion) {
      approveVersion(importedVersion.id);
    }
    handleClose();
  };

  const handleReject = () => {
    if (importedVersion) {
      rejectVersion(importedVersion.id, rejectReason || '未提供原因');
    }
    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setFile(null);
    setResult(null);
    setErrorDetailsOpen(false);
    setImportedVersion(null);
    setRejectReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            导入 Excel 数据
          </DialogTitle>
          <DialogDescription>
            上传符合模板格式的 Excel 文件，自动生成待审核版本
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">下载模板后按格式填写，再上传导入</p>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-1" />
                下载模板
              </Button>
            </div>

            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">点击选择文件或拖拽到此处</p>
              <p className="text-xs text-muted-foreground mt-1">仅支持 .xlsx 格式，最大 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {file && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <Button size="sm" onClick={handleUpload}>
                  开始导入
                </Button>
              </div>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>模板包含6个Sheet: 实体 / 属性 / 关系 / 状态机 / 规则 / 事件</p>
              <p>必填字段未填写或格式不符将导致校验失败</p>
              <p>导入成功后生成待审核版本，审核通过后应用到工作区</p>
            </div>
          </div>
        )}

        {/* Step 2: Validating */}
        {step === 'validating' && (
          <div className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">正在校验 Excel 数据...</p>
          </div>
        )}

        {/* Step 3: Result (with errors) */}
        {step === 'result' && result && (
          <div className="space-y-4 py-4">
            {result.success ? (
              <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  校验通过！共 {result.validation.totalRows} 行数据
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    {result.errorMessage || '校验失败'}
                  </span>
                </div>

                {result.validation.errors.length > 0 && (
                  <div className="space-y-2">
                    <button
                      className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setErrorDetailsOpen(!errorDetailsOpen)}
                    >
                      {errorDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      错误详情 ({result.validation.errorCount} 条)
                    </button>

                    {errorDetailsOpen && (
                      <div className="max-h-60 overflow-y-auto border rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-muted sticky top-0">
                            <tr>
                              <th className="px-2 py-1 text-left">Sheet</th>
                              <th className="px-2 py-1 text-left">行</th>
                              <th className="px-2 py-1 text-left">列</th>
                              <th className="px-2 py-1 text-left">错误</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.validation.errors.map((err: ExcelImportError, idx: number) => (
                              <tr key={idx} className="border-t">
                                <td className="px-2 py-1">{err.sheet}</td>
                                <td className="px-2 py-1">{err.row}</td>
                                <td className="px-2 py-1">{err.column}</td>
                                <td className="px-2 py-1 text-red-600">{err.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>统计: 总行数 {result.validation.totalRows}，有效行 {result.validation.validRows}，错误 {result.validation.errorCount}</p>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>关闭</Button>
              {!result.success && (
                <Button onClick={() => { setStep('upload'); setFile(null); setResult(null); }}>
                  重新上传
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && importedVersion && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  导入成功，已生成待审核版本
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  版本: {importedVersion.version} | 状态: 待审核
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-1">
                <Eye className="h-4 w-4" />
                版本审核
              </h4>
              <p className="text-sm text-muted-foreground">
                审核通过后，导入的数据将应用到当前工作区。驳回后可重新上传修正。
              </p>

              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">版本: {importedVersion.version}</span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">待审核</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {importedVersion.description || 'Excel 导入数据'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">驳回原因（仅驳回时需要）</label>
                <textarea
                  className="w-full min-h-[60px] p-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="如驳回，请说明原因..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { rejectVersion(importedVersion.id, '用户取消'); handleClose(); }}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
                <XCircle className="h-4 w-4 mr-1" />
                驳回
              </Button>
              <Button onClick={handleApprove}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                审核通过
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
