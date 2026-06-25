"use client";

import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Upload, FileSpreadsheet, FileText, AlertTriangle, FileDown } from "lucide-react";
import { useOntologyStore } from "@/store/ontology-store";
import { parseExcelImport, executeImport } from "@/lib/excel/import-excel";
import { exportModulesToExcel } from "@/lib/excel/export-excel";
import { type ImportPreview } from "@/lib/excel/excel-schema";
import { parseMarkdownImport, generateMarkdownTemplate, exportModulesToMarkdown, type ExistingModule } from "@/lib/markdown/markdown-import";
import { type ModuleKind } from "@/types/ontology";

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type ImportFormat = "excel" | "markdown";

interface ExcelImportExportDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ExcelImportExportDialog({ open: controlledOpen, onOpenChange: controlledOnOpenChange }: ExcelImportExportDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) controlledOnOpenChange!(v);
    else setInternalOpen(v);
  };
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importFormat, setImportFormat] = useState<ImportFormat>("excel");
  const [importStep, setImportStep] = useState<'select' | 'preview'>('select');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveModuleDraft = useOntologyStore((s) => s.saveModuleDraft);
  const rebuildUsageIndex = useOntologyStore((s) => s.rebuildUsageIndex);

  function getStoreData() {
    const s = useOntologyStore.getState();
    const p = s.project;
    return {
      project: p,
      valueDomains: p?.valueDomains ?? [],
      capabilities: p?.capabilities ?? [],
      scenarios: p?.scenarios ?? [],
      epcProcesses: p?.epcProcesses ?? [],
      metaElements: p?.metaElements ?? [],
      moduleVersionRecords: p?.moduleVersionRecords ?? [],
    };
  }

  // Excel 导出
  const handleExportExcel = () => {
    try {
      const data = getStoreData();
      const buf = exportModulesToExcel(data);
      const name = (data.project?.name || 'ontology').replace(/[^\w一-鿿-]/g, '_');
      downloadBlob(buf as BlobPart, `${name}-modules.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      setError(null);
    } catch (err) {
      setError((err as Error).message || '导出失败');
    }
  };

  // Markdown 导出
  const handleExportMarkdown = () => {
    try {
      const data = getStoreData();
      const md = exportModulesToMarkdown(data);
      const name = (data.project?.name || 'ontology').replace(/[^\w一-鿿-]/g, '_');
      downloadBlob(md, `${name}-modules.md`, "text/markdown;charset=utf-8");
      setError(null);
    } catch (err) {
      setError((err as Error).message || '导出失败');
    }
  };

  // Markdown 模板下载
  const handleDownloadTemplate = () => {
    try {
      const md = generateMarkdownTemplate();
      downloadBlob(md, "ontology-import-template.md", "text/markdown;charset=utf-8");
      setError(null);
    } catch (err) {
      setError((err as Error).message || '模板下载失败');
    }
  };

  // 导入：文件选择
  const handleFileSelect = async (file: File) => {
    setError(null);
    setImportFile(file);
    try {
      const data = getStoreData();
      let result: ImportPreview;
      if (importFormat === "excel") {
        result = await parseExcelImport({
          file,
          existingValueDomains: data.valueDomains,
          existingCapabilities: data.capabilities,
          existingScenarios: data.scenarios,
          existingMetaElements: data.metaElements,
          existingModuleVersionRecords: data.moduleVersionRecords,
        });
      } else {
        const text = await file.text();
        const existingModules: ExistingModule[] = [
          ...data.valueDomains.map(m => ({ moduleKind: 'value_domain' as ModuleKind, moduleId: m.id })),
          ...data.capabilities.map(m => ({ moduleKind: 'capability' as ModuleKind, moduleId: m.id })),
          ...data.scenarios.map(m => ({ moduleKind: 'scenario' as ModuleKind, moduleId: m.id })),
        ];
        result = parseMarkdownImport({ text, existingModules });
      }
      setPreview(result);
      setImportStep('preview');
    } catch (err) {
      setError((err as Error).message || '解析失败');
    }
  };

  // 导入：确认
  const handleImportConfirm = () => {
    if (!preview) return;
    setImporting(true);
    try {
      executeImport({
        preview,
        saveModuleDraft,
        rebuildUsageIndex,
      });
      setOpen(false);
      resetImportState();
    } catch (err) {
      setError((err as Error).message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const resetImportState = () => {
    setImportStep('select');
    setPreview(null);
    setImportFile(null);
    setError(null);
  };

  // 拖放支持
  const [dragOver, setDragOver] = useState(false);
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const ext = importFormat === "excel" ? '.xlsx' : '.md';
      if (file.name.endsWith(ext)) {
        handleFileSelect(file);
      } else {
        setError(`请选择 ${ext} 文件`);
      }
    }
  };

  const acceptedExt = importFormat === "excel" ? ".xlsx" : ".md,.markdown,.txt";
  const fileIcon = importFormat === "excel" ? FileSpreadsheet : FileText;
  const Icon = fileIcon;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetImportState(); }}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" data-testid="excel-dialog-trigger">
            <FileSpreadsheet className="mr-1 h-4 w-4" />
            导入/导出
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>分模块导入/导出</DialogTitle>
          <DialogDescription>
            按 A/B/C/EPC/E1–E8 模块导入导出，仅生成草稿不自动确认。支持 Excel 和 Markdown 两种格式。
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'export' | 'import'); resetImportState(); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" data-testid="tab-export">
              <Download className="mr-1 h-4 w-4" /> 导出
            </TabsTrigger>
            <TabsTrigger value="import" data-testid="tab-import">
              <Upload className="mr-1 h-4 w-4" /> 导入
            </TabsTrigger>
          </TabsList>

          {/* 导出 Tab */}
          <TabsContent value="export" className="space-y-4 pt-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                将项目中所有已确认（confirmed）模块导出为 Excel 或 Markdown 文件，包含 12 个模块。
              </p>
              <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground space-y-1">
                <li>仅导出 latest confirmed 版本</li>
                <li>draft 状态的模块不会导出</li>
                <li>编辑后可通过「导入」Tab 重新导入为 draft</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleExportExcel} variant="outline" data-testid="export-excel-btn">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                导出 Excel
              </Button>
              <Button onClick={handleExportMarkdown} variant="outline" data-testid="export-md-btn">
                <FileText className="mr-2 h-4 w-4" />
                导出 Markdown
              </Button>
            </div>
          </TabsContent>

          {/* 导入 Tab */}
          <TabsContent value="import" className="space-y-4 pt-4">

            {importStep === 'select' && (
              <>
                {/* 格式选择 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium whitespace-nowrap">格式:</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={importFormat === "excel" ? "default" : "outline"}
                      onClick={() => { setImportFormat("excel"); resetImportState(); }}
                    >
                      <FileSpreadsheet className="mr-1 h-3.5 w-3.5" /> Excel
                    </Button>
                    <Button
                      size="sm"
                      variant={importFormat === "markdown" ? "default" : "outline"}
                      onClick={() => { setImportFormat("markdown"); resetImportState(); }}
                    >
                      <FileText className="mr-1 h-3.5 w-3.5" /> Markdown
                    </Button>
                  </div>
                  {importFormat === "markdown" && (
                    <Button size="sm" variant="ghost" onClick={handleDownloadTemplate} className="ml-auto">
                      <FileDown className="mr-1 h-3.5 w-3.5" /> 下载模板
                    </Button>
                  )}
                </div>

                {/* 拖放区 */}
                <div
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  data-testid="import-dropzone"
                >
                  <Icon className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="mb-2 text-sm font-medium">
                    拖放 {importFormat === "excel" ? ".xlsx" : ".md"} 文件到此处
                  </p>
                  <p className="mb-4 text-xs text-muted-foreground">或点击下方按钮选择文件</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedExt}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                      e.target.value = '';
                    }}
                    data-testid="import-file-input"
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    选择文件
                  </Button>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>注意：</strong>导入仅生成 draft，不会自动 confirm。
                    父节点（A/B/C）缺失时自动创建占位 draft。
                    EPC 步骤引用缺失的要素会产生 warning，不阻断导入。
                  </p>
                  {importFormat === "markdown" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      <strong>Markdown 格式说明：</strong>使用 <code className="text-primary"># 模块名</code> 作为模块分隔，
                      <code className="text-primary">| 列1 | 列2 |</code> 表格语法定义数据行。
                      建议先下载模板查看格式。
                    </p>
                  )}
                </div>
              </>
            )}

            {importStep === 'preview' && preview && (
              <div className="space-y-4" data-testid="import-preview">
                {/* 变更摘要 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-blue-50 p-3 text-center" data-testid="summary-new">
                    <div className="text-2xl font-bold text-blue-600">{preview.summary.newDrafts}</div>
                    <div className="text-xs text-blue-700">新建 draft</div>
                  </div>
                  <div className="rounded-lg border bg-amber-50 p-3 text-center" data-testid="summary-update">
                    <div className="text-2xl font-bold text-amber-600">{preview.summary.updatedDrafts}</div>
                    <div className="text-xs text-amber-700">更新 draft</div>
                  </div>
                  <div className="rounded-lg border bg-purple-50 p-3 text-center" data-testid="summary-placeholder">
                    <div className="text-2xl font-bold text-purple-600">{preview.summary.placeholderDrafts}</div>
                    <div className="text-xs text-purple-700">占位 draft</div>
                  </div>
                </div>

                {/* Warnings */}
                {preview.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3" data-testid="import-warnings">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700">
                        {preview.summary.warningCount} 个警告
                      </span>
                    </div>
                    <ScrollArea className="max-h-32">
                      <ul className="space-y-1">
                        {preview.warnings.slice(0, 10).map((w, i) => (
                          <li key={i} className="text-xs text-amber-800">
                            [{w.sheet}:{w.row}] {w.message}
                          </li>
                        ))}
                        {preview.warnings.length > 10 && (
                          <li className="text-xs text-muted-foreground">
                            ... 还有 {preview.warnings.length - 10} 条
                          </li>
                        )}
                      </ul>
                    </ScrollArea>
                  </div>
                )}

                {/* 变更列表 */}
                {preview.changes.length > 0 && (
                  <div className="rounded-lg border p-3" data-testid="import-changes">
                    <p className="mb-2 text-sm font-medium">变更列表</p>
                    <ScrollArea className="max-h-40">
                      <ul className="space-y-1">
                        {preview.changes.map((c, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs">
                            <Badge variant={
                              c.action === 'placeholder_draft' ? 'destructive' :
                              c.action === 'update_draft' ? 'secondary' : 'default'
                            }>
                              {c.action === 'new_draft' ? '新建' :
                               c.action === 'update_draft' ? '更新' : '占位'}
                            </Badge>
                            <span className="font-mono">{c.moduleKind}:{c.moduleId}</span>
                            <span className="text-muted-foreground">行 {c.row}</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetImportState} className="flex-1">
                    返回
                  </Button>
                  <Button
                    onClick={handleImportConfirm}
                    disabled={importing}
                    className="flex-1"
                    data-testid="import-confirm-btn"
                  >
                    {importing ? '导入中...' : '确认导入'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-testid="excel-error">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
