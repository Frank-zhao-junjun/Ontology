# Graph Report - src  (2026-06-26)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1634 nodes · 4583 edges · 86 communities (79 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b93bb8d1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Ontology Policy Constraints|Ontology Policy Constraints]]
- [[_COMMUNITY_UI Component Library|UI Component Library]]
- [[_COMMUNITY_Excel Schema Config|Excel Schema Config]]
- [[_COMMUNITY_EPC Document Prompt|EPC Document Prompt]]
- [[_COMMUNITY_Ontology Store & UI|Ontology Store & UI]]
- [[_COMMUNITY_Test Mock Data Artifacts|Test Mock Data Artifacts]]
- [[_COMMUNITY_AI Draft & Behavior Model|AI Draft & Behavior Model]]
- [[_COMMUNITY_Ontology State & Coverage|Ontology State & Coverage]]
- [[_COMMUNITY_Code Generator|Code Generator]]
- [[_COMMUNITY_Agent Skills Manager|Agent Skills Manager]]
- [[_COMMUNITY_Sidebar & Mobile UI|Sidebar & Mobile UI]]
- [[_COMMUNITY_EPC Linting|EPC Linting]]
- [[_COMMUNITY_Config Package Export|Config Package Export]]
- [[_COMMUNITY_Excel Import Parsing|Excel Import Parsing]]
- [[_COMMUNITY_Editors & Sync Manager|Editors & Sync Manager]]
- [[_COMMUNITY_Meta Element Usage|Meta Element Usage]]
- [[_COMMUNITY_Module Status & Confirm Flow|Module Status & Confirm Flow]]
- [[_COMMUNITY_Meta Dimension Constants|Meta Dimension Constants]]
- [[_COMMUNITY_Element Document Prompt|Element Document Prompt]]
- [[_COMMUNITY_Confirm Dialog & Module Actions|Confirm Dialog & Module Actions]]
- [[_COMMUNITY_Meta Dimension Coverage|Meta Dimension Coverage]]
- [[_COMMUNITY_Code Generation Types|Code Generation Types]]
- [[_COMMUNITY_Marketing Homepage Components|Marketing Homepage Components]]
- [[_COMMUNITY_Manifest Export|Manifest Export]]
- [[_COMMUNITY_Ontology Manifest Semantic|Ontology Manifest Semantic]]
- [[_COMMUNITY_Manifest ID Collection|Manifest ID Collection]]
- [[_COMMUNITY_Ontology Normalization|Ontology Normalization]]
- [[_COMMUNITY_Module Status Labels|Module Status Labels]]
- [[_COMMUNITY_Ontology Project Config Export|Ontology Project Config Export]]
- [[_COMMUNITY_Entity Creation|Entity Creation]]
- [[_COMMUNITY_Button & Error Pages|Button & Error Pages]]
- [[_COMMUNITY_Supabase Client|Supabase Client]]
- [[_COMMUNITY_Master Data Manager|Master Data Manager]]
- [[_COMMUNITY_Ralph Loop Manager|Ralph Loop Manager]]
- [[_COMMUNITY_Query Service|Query Service]]
- [[_COMMUNITY_Menubar UI|Menubar UI]]
- [[_COMMUNITY_Context Menu UI|Context Menu UI]]
- [[_COMMUNITY_Business Chain Tree|Business Chain Tree]]
- [[_COMMUNITY_HR Sync Config API|HR Sync Config API]]
- [[_COMMUNITY_Ontology Manifest Process|Ontology Manifest Process]]
- [[_COMMUNITY_Version History Panel|Version History Panel]]
- [[_COMMUNITY_Gstack Workflows|Gstack Workflows]]
- [[_COMMUNITY_Gstack Roles API|Gstack Roles API]]
- [[_COMMUNITY_Carousel UI|Carousel UI]]
- [[_COMMUNITY_Entity Role & Data Model|Entity Role & Data Model]]
- [[_COMMUNITY_Item UI Component|Item UI Component]]
- [[_COMMUNITY_LLM Model Generation|LLM Model Generation]]
- [[_COMMUNITY_Manifest Object Types|Manifest Object Types]]
- [[_COMMUNITY_Field UI Component|Field UI Component]]
- [[_COMMUNITY_Form UI Component|Form UI Component]]
- [[_COMMUNITY_Code Package Generation|Code Package Generation]]
- [[_COMMUNITY_Chart UI|Chart UI]]
- [[_COMMUNITY_Drawer UI|Drawer UI]]
- [[_COMMUNITY_Dropdown Menu UI|Dropdown Menu UI]]
- [[_COMMUNITY_Excel Flatten Export|Excel Flatten Export]]
- [[_COMMUNITY_Audit Log Service|Audit Log Service]]
- [[_COMMUNITY_Ontology Manifest Behavior|Ontology Manifest Behavior]]
- [[_COMMUNITY_Superpowers Manager|Superpowers Manager]]
- [[_COMMUNITY_Navigation Menu UI|Navigation Menu UI]]
- [[_COMMUNITY_LLM Entity Extraction|LLM Entity Extraction]]
- [[_COMMUNITY_HR Sync History API|HR Sync History API]]
- [[_COMMUNITY_Master Data Field Parser|Master Data Field Parser]]
- [[_COMMUNITY_Input Group UI|Input Group UI]]
- [[_COMMUNITY_Master Data Markdown|Master Data Markdown]]
- [[_COMMUNITY_Ontology Validator|Ontology Validator]]
- [[_COMMUNITY_App Layout & Theme|App Layout & Theme]]
- [[_COMMUNITY_Excel Template Sheet|Excel Template Sheet]]
- [[_COMMUNITY_Gstack Workflow Manager|Gstack Workflow Manager]]
- [[_COMMUNITY_Agent Integration Manager|Agent Integration Manager]]
- [[_COMMUNITY_Test Server Setup|Test Server Setup]]
- [[_COMMUNITY_Toggle UI|Toggle UI]]
- [[_COMMUNITY_File Upload API|File Upload API]]
- [[_COMMUNITY_Mock Fetch Client|Mock Fetch Client]]
- [[_COMMUNITY_Mock Fetch Client|Mock Fetch Client]]
- [[_COMMUNITY_Export Config API|Export Config API]]
- [[_COMMUNITY_Local Metadata|Local Metadata]]
- [[_COMMUNITY_Ralph Loop Agent|Ralph Loop Agent]]
- [[_COMMUNITY_Button Group UI|Button Group UI]]
- [[_COMMUNITY_Legacy API Route Check|Legacy API Route Check]]
- [[_COMMUNITY_Version & Frozen Project|Version & Frozen Project]]
- [[_COMMUNITY_Database Schema|Database Schema]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 279 edges
2. `OntologyState` - 67 edges
3. `useOntologyStore` - 67 edges
4. `OntologyProject` - 56 edges
5. `Button()` - 47 edges
6. `CodeGenerator` - 43 edges
7. `GeneratedFile` - 37 edges
8. `MetaElement` - 35 edges
9. `MetaDimension` - 32 edges
10. `Badge()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `OntologyProjectRow` --references--> `OntologyProject`  [EXTRACTED]
  app/api/projects/[id]/route.ts → types/ontology.ts
- `OntologyProjectRow` --references--> `OntologyProject`  [EXTRACTED]
  app/api/projects/route.ts → types/ontology.ts
- `BusinessChainDetailProps` --references--> `MetaDimension`  [EXTRACTED]
  components/ontology/business-chain-detail.tsx → types/ontology.ts
- `EpcCoveragePanelProps` --references--> `MetaDimension`  [EXTRACTED]
  components/ontology/epc-coverage-panel.tsx → types/ontology.ts
- `AddDepartmentDialog()` --calls--> `useOntologyStore`  [EXTRACTED]
  components/ontology/organization-editor.tsx → store/ontology-store.ts

## Import Cycles
- None detected.

## Communities (86 total, 7 thin omitted)

### Community 0 - "Ontology Policy Constraints"
Cohesion: 0.03
Nodes (67): ActionTimeout, AgentPolicyRule, AgentPolicyScope, BusinessTermModelRef, ComputedProperty, ConstraintScope, ConstraintSeverity, ContextConstraint (+59 more)

### Community 1 - "UI Component Library"
Cohesion: 0.05
Nodes (45): cn(), Accordion(), AccordionContent(), AccordionItem(), AccordionTrigger(), AlertTitle(), Avatar(), AvatarFallback() (+37 more)

### Community 2 - "Excel Schema Config"
Cohesion: 0.07
Nodes (49): EpcWarning, ALL_SHEET_CONFIGS, DESC_COL, DIMENSION_COL, EXCEL_SHEET_CONFIGS, ExcelColumnDef, ExcelModuleRow, ExcelSheetConfig (+41 more)

### Community 3 - "EPC Document Prompt"
Cohesion: 0.06
Nodes (42): buildCatalogLines(), buildEpcDocPrompt(), buildJsonSchema(), ElementRefSchema, EpcDocOutputSchema, EpcDocParseError, EpcDocParseResult, EpcDocPrompt (+34 more)

### Community 4 - "Ontology Store & UI"
Cohesion: 0.08
Nodes (40): ThemeToggle(), useConfirm(), useProjectSync(), DataSourceEditor(), ExcelImportDialog(), ExcelImportExportDialog(), GovernanceEditor(), defaultConfig() (+32 more)

### Community 5 - "Test Mock Data Artifacts"
Cohesion: 0.07
Nodes (42): createMockDomain(), createMockEntity(), createMockProject(), buildFlowArtifacts(), buildSelfCheckRows(), createEmptyEpcModel(), deriveActivities(), deriveExceptions() (+34 more)

### Community 6 - "AI Draft & Behavior Model"
Cohesion: 0.10
Nodes (30): AiDraftFillDialogProps, AiDraftFillTriggerProps, TEXT_EXTENSIONS, BehaviorModelEditor(), BehaviorModelEditorProps, formatLineList(), STATE_COLORS, E1ModelTab (+22 more)

### Community 7 - "Ontology State & Coverage"
Cohesion: 0.08
Nodes (36): EpcCoverageReport, ConfirmFlowFailure, ConfirmFlowSuccess, BusinessChainNodeInput, BusinessChainNodeRef, ensureEntityAggregateBoundary(), ensureEntityScenario(), OntologyState (+28 more)

### Community 9 - "Agent Skills Manager"
Cohesion: 0.14
Nodes (26): AgentSkill, AgentSkillsManager(), CATEGORY_LABELS, GstackWorkflow, GstackWorkflowStep, PRIORITY_LABELS, RalphLoopState, ROLE_LABELS (+18 more)

### Community 10 - "Sidebar & Mobile UI"
Cohesion: 0.07
Nodes (33): useIsMobile(), Sidebar(), SidebarContent(), SidebarContext, SidebarContextProps, SidebarFooter(), SidebarGroup(), SidebarGroupAction() (+25 more)

### Community 11 - "EPC Linting"
Cohesion: 0.22
Nodes (15): getConfirmedEpcSnapshots(), inspectConfirmedEpcStep(), lintBusinessEpc(), pushWarning(), warningId(), EPC_WARNING_RULES, EpcWarningRuleId, LintBusinessEpcInput (+7 more)

### Community 12 - "Config Package Export"
Cohesion: 0.12
Nodes (30): ConfigPackage, ConfigPackageManifest, ExportableEpcProfile, ExportedFile, NormalizedAttribute, NormalizedEntity, NormalizedRelation, createMockDomain() (+22 more)

### Community 13 - "Excel Import Parsing"
Cohesion: 0.09
Nodes (29): EXPECTED_SHEETS, OPTIONAL_SHEETS, parseBoundaries(), parseDataSources(), parseDepartments(), parseEvents(), parseExcelToModels(), parseMetrics() (+21 more)

### Community 14 - "Editors & Sync Manager"
Cohesion: 0.17
Nodes (22): PERMISSION_OPS, INTERVAL_LABELS, INTERVAL_OPTIONS, SOURCE_LABELS, SOURCE_OPTIONS, STRATEGY_LABELS, STRATEGY_OPTIONS, MEASUREMENT_TYPES (+14 more)

### Community 15 - "Meta Element Usage"
Cohesion: 0.10
Nodes (23): resolveEpcName(), filterMetaElementsByDimension(), filterUnreferencedElements(), getUsageCount(), isUnreferencedElement(), isElementEpcCovered(), rebuildUsageIndex(), RebuildUsageIndexInput (+15 more)

### Community 16 - "Module Status & Confirm Flow"
Cohesion: 0.11
Nodes (27): resolveBusinessChainModuleStatus(), BusinessChainNodeKind, executeImport(), applyModuleSnapshotToProject(), ConfirmFlowProject, META_DIMENSIONS, META_MODULE_KINDS, readSnapshot() (+19 more)

### Community 17 - "Meta Dimension Constants"
Cohesion: 0.12
Nodes (24): META_DIMENSION_LABELS, META_DIMENSION_ORDER, buildExistingElementRef(), createInlineElementRef(), filterMetaElements(), groupMetaElementsByDimension(), resolveElementLabel(), ElementSelector() (+16 more)

### Community 18 - "Element Document Prompt"
Cohesion: 0.09
Nodes (22): buildDimensionSection(), buildElementDocPrompt(), buildExistingNamesBlock(), buildExistingNamesHint(), buildJsonSchema(), DIMENSION_DEFINITIONS, ElementDimension, ElementDimensionSchema (+14 more)

### Community 19 - "Confirm Dialog & Module Actions"
Cohesion: 0.12
Nodes (21): ConfirmOptions, ModuleDetailActionsProps, AlertDialog(), AlertDialogAction(), AlertDialogCancel(), AlertDialogContent(), AlertDialogDescription(), AlertDialogFooter() (+13 more)

### Community 20 - "Meta Dimension Coverage"
Cohesion: 0.08
Nodes (30): computeCoverage(), emptyCoverageReport(), roundPercent(), ComputeCoverageInput, DimensionCoverage, DerivedEpcStep, derivedStepsToEpcSteps(), deriveEpcSteps() (+22 more)

### Community 21 - "Code Generation Types"
Cohesion: 0.11
Nodes (30): CodePackage, FlaskRoute, GeneratorContext, ReactComponent, SQLAlchemyColumn, TS_TYPE_MAPPING, TYPE_MAPPING, asE5OrganizationMeta() (+22 more)

### Community 22 - "Marketing Homepage Components"
Cohesion: 0.09
Nodes (3): AcceptanceCriteria(), CTA(), Hero()

### Community 23 - "Manifest Export"
Cohesion: 0.14
Nodes (20): buildManifestExportBundle(), BuildManifestExportOptions, downloadManifestExport(), ManifestExportBundle, ManifestExportFormat, sanitizeFilenameSegment(), ensureGovernanceModel(), compileEvents() (+12 more)

### Community 24 - "Ontology Manifest Semantic"
Cohesion: 0.15
Nodes (16): mapOrchestration(), mapStep(), compileSemantic(), ManifestAction, ManifestDomainEvent, ManifestStateMachine, OntologyManifestSemantic, mapAction() (+8 more)

### Community 25 - "Manifest ID Collection"
Cohesion: 0.23
Nodes (19): collectManifestIds(), IdOccurrence, pushId(), isValidOntologyManifest(), validateManifest(), validateStructure(), aggregateRootIds(), domainEventIds() (+11 more)

### Community 26 - "Ontology Normalization"
Cohesion: 0.14
Nodes (18): normalizeOntologyProjectEntityRoles(), createEmptyDataSourcesModel(), createEmptyGovernanceModel(), ensureDataSourcesModel(), LegacyAttribute, LegacyEntity, normalizeAttribute(), normalizeOntologyProject() (+10 more)

### Community 27 - "Module Status Labels"
Cohesion: 0.17
Nodes (15): getModuleStatusTitle(), MODULE_STATUS_LABEL, MODULE_STATUS_TITLE, findName(), listIncomingModuleReferences(), listOutgoingModuleReferences(), ModuleReferenceLink, AiDraftFillTrigger() (+7 more)

### Community 28 - "Ontology Project Config Export"
Cohesion: 0.18
Nodes (4): ConfigExporter, ManifestExportDialogProps, ModelingWorkspaceProps, OntologyProject

### Community 29 - "Entity Creation"
Cohesion: 0.16
Nodes (13): buildE1Entity(), CreateE1EntityInput, resolveDefaultBusinessScenarioId(), resolveDefaultProjectId(), normalizeEntityRoleFields(), resolveEntityRole(), normalizeEntity(), ensureAggregateRootRoleChangeSafety() (+5 more)

### Community 30 - "Button & Error Pages"
Cohesion: 0.15
Nodes (9): canDeleteBusinessChainNode(), BusinessChainTree(), KIND_COLOR, KIND_LABEL, KIND_SHORT, E1EntityPanel(), ElementLibrary(), Button() (+1 more)

### Community 31 - "Supabase Client"
Cohesion: 0.22
Nodes (11): getSupabaseClient(), hasSupabaseConfig(), DELETE(), GET(), OntologyProjectRow, PUT(), supabaseState, GET() (+3 more)

### Community 32 - "Master Data Manager"
Cohesion: 0.22
Nodes (14): generateId(), generatePrefixedId(), DOMAIN_OPTIONS, MASTERDATA_FIELD_TEMPLATES, MasterDataManagerProps, STATUS_OPTIONS, ATTRIBUTE_TYPES, Table() (+6 more)

### Community 34 - "Query Service"
Cohesion: 0.17
Nodes (9): BasicQueryService, ENTITY_KEYWORDS, INTENT_PATTERNS, IntentPattern, QueryIntent, QueryRequest, QueryResponse, FailingQueryService (+1 more)

### Community 35 - "Menubar UI"
Cohesion: 0.12
Nodes (11): Menubar(), MenubarCheckboxItem(), MenubarContent(), MenubarItem(), MenubarLabel(), MenubarRadioItem(), MenubarSeparator(), MenubarShortcut() (+3 more)

### Community 36 - "Context Menu UI"
Cohesion: 0.12
Nodes (9): ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuItem(), ContextMenuLabel(), ContextMenuRadioItem(), ContextMenuSeparator(), ContextMenuShortcut(), ContextMenuSubContent() (+1 more)

### Community 37 - "Business Chain Tree"
Cohesion: 0.28
Nodes (14): buildBusinessChainTree(), BusinessChainSlices, BusinessChainTreeNode, emptySlices(), findBusinessChainNode(), getBusinessChainDisplayPath(), normalizeBusinessChainSlices(), ExportExcelOptions (+6 more)

### Community 38 - "HR Sync Config API"
Cohesion: 0.25
Nodes (4): GET(), PUT(), POST(), HRSyncConfig

### Community 39 - "Ontology Manifest Process"
Cohesion: 0.16
Nodes (13): ManifestMetric, ManifestOrchestration, ManifestProcessStep, ManifestSideEffect, ManifestState, ManifestTransactionBoundary, ManifestValidationCode, ManifestValidationSeverity (+5 more)

### Community 40 - "Version History Panel"
Cohesion: 0.18
Nodes (9): VersionHistoryPanel(), VersionHistoryPanelProps, Sheet(), SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay() (+1 more)

### Community 41 - "Gstack Workflows"
Cohesion: 0.18
Nodes (10): GSTACK_WORKFLOWS, GstackRole, GstackWorkflow, WorkflowStep, AgentIntegrationConfig, DEFAULT_AGENT_CONFIG, AgentSkill, SkillCategory (+2 more)

### Community 42 - "Gstack Roles API"
Cohesion: 0.19
Nodes (10): GET(), GSTACK_ROLES, parseGstackRole(), parseSkillCategory(), POST(), SKILL_CATEGORIES, mockRalphState, mockRalphStories (+2 more)

### Community 43 - "Carousel UI"
Cohesion: 0.19
Nodes (13): Carousel(), CarouselApi, CarouselContent(), CarouselContext, CarouselContextProps, CarouselItem(), CarouselNext(), CarouselOptions (+5 more)

### Community 44 - "Entity Role & Data Model"
Cohesion: 0.19
Nodes (11): getAggregateRootEntities(), getEntityRoleLabel(), isEntityAggregateRoot(), ATTRIBUTE_TYPES, DataModelEditor(), DataModelEditorProps, DIRECT_ATTRIBUTE_TYPES, IndexDraft (+3 more)

### Community 45 - "Item UI Component"
Cohesion: 0.18
Nodes (12): Item(), ItemActions(), ItemContent(), ItemDescription(), ItemFooter(), ItemGroup(), ItemHeader(), ItemMedia() (+4 more)

### Community 46 - "LLM Model Generation"
Cohesion: 0.21
Nodes (8): createPrompt(), GenerateModelRequest, GenerateModelResponse, POST(), safeJsonParse(), MockConfig, MockLLMClient, sdkState

### Community 47 - "Manifest Object Types"
Cohesion: 0.21
Nodes (8): ManifestObjectType, ManifestProperty, ManifestRule, ObjectTypeKind, mapEntityRoleToObjectTypeKind(), mapRelationCardinality(), mapRuleType(), RuleType

### Community 48 - "Field UI Component"
Cohesion: 0.18
Nodes (11): Field(), FieldContent(), FieldDescription(), FieldError(), FieldGroup(), FieldLabel(), FieldLegend(), FieldSeparator() (+3 more)

### Community 49 - "Form UI Component"
Cohesion: 0.23
Nodes (10): FormControl(), FormDescription(), FormFieldContext, FormFieldContextValue, FormItem(), FormItemContext, FormItemContextValue, FormLabel() (+2 more)

### Community 50 - "Code Package Generation"
Cohesion: 0.36
Nodes (6): generateCodePackage(), GET(), POST(), VersionManagerProps, ProjectVersion, PublishConfig

### Community 51 - "Chart UI"
Cohesion: 0.22
Nodes (8): ChartConfig, ChartContainer(), ChartContext, ChartContextProps, ChartLegendContent(), ChartTooltipContent(), THEMES, useChart()

### Community 52 - "Drawer UI"
Cohesion: 0.18
Nodes (6): DrawerContent(), DrawerDescription(), DrawerFooter(), DrawerHeader(), DrawerOverlay(), DrawerTitle()

### Community 53 - "Dropdown Menu UI"
Cohesion: 0.18
Nodes (6): DropdownMenuCheckboxItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuShortcut(), DropdownMenuSubContent(), DropdownMenuSubTrigger()

### Community 54 - "Excel Flatten Export"
Cohesion: 0.22
Nodes (3): POST(), xlsxState, toRows()

### Community 55 - "Audit Log Service"
Cohesion: 0.20
Nodes (3): AuditLog, AuditService, QueryLog

### Community 56 - "Ontology Manifest Behavior"
Cohesion: 0.36
Nodes (6): compileBehavior(), OntologyManifestBehavior, mapMetrics(), mapRules(), mapSideEffects(), mapTransactionBoundaries()

### Community 58 - "Navigation Menu UI"
Cohesion: 0.22
Nodes (9): NavigationMenu(), NavigationMenuContent(), NavigationMenuIndicator(), NavigationMenuItem(), NavigationMenuLink(), NavigationMenuList(), NavigationMenuTrigger(), navigationMenuTriggerStyle (+1 more)

### Community 59 - "LLM Entity Extraction"
Cohesion: 0.25
Nodes (5): POST(), MockConfig, MockLLMClient, ExtractedAttribute, ExtractedEntity

### Community 60 - "HR Sync History API"
Cohesion: 0.31
Nodes (4): GET(), POST(), syncHistory, HRSyncResult

### Community 61 - "Master Data Field Parser"
Cohesion: 0.39
Nodes (7): buildRecordValues(), createValidationError(), parseFieldNames(), tryParseFieldNames(), createEmptyMasterDataRecord(), normalizeMasterDataRecord(), MasterDataField

### Community 62 - "Input Group UI"
Cohesion: 0.28
Nodes (8): InputGroup(), InputGroupAddon(), inputGroupAddonVariants, InputGroupButton(), inputGroupButtonVariants, InputGroupInput(), InputGroupText(), InputGroupTextarea()

### Community 63 - "Master Data Markdown"
Cohesion: 0.36
Nodes (7): GET(), buildEmptyRecordMap(), MasterDataRow, parseMarkdownRow(), parseMarkdownTable(), SAMPLE_MASTERDATA, SAMPLE_MASTERDATA_RECORDS

### Community 64 - "Ontology Validator"
Cohesion: 0.50
Nodes (5): validateAgentSemanticLayer(), validateAll(), validateEpcCrossModel(), validateLifecycle(), ValidationIssue

### Community 65 - "App Layout & Theme"
Cohesion: 0.38
Nodes (3): metadata, ThemeProvider(), Toaster()

### Community 66 - "Excel Template Sheet"
Cohesion: 0.38
Nodes (5): GET(), getExampleRow(), TEMPLATE_SHEETS, xlsxState, ExcelTemplateSheet

### Community 69 - "Test Server Setup"
Cohesion: 0.38
Nodes (4): handlers, server, localStorageMock, ResizeObserverMock

### Community 70 - "Toggle UI"
Cohesion: 0.43
Nodes (5): ToggleGroup(), ToggleGroupContext, ToggleGroupItem(), Toggle(), toggleVariants

### Community 71 - "File Upload API"
Cohesion: 0.33
Nodes (5): ALLOWED_TYPES, POST(), mammothState, pdfParseState, xlsxState

### Community 72 - "Mock Fetch Client"
Cohesion: 0.33
Nodes (3): MockConfig, MockFetchClient, sdkState

### Community 73 - "Mock Fetch Client"
Cohesion: 0.33
Nodes (3): MockConfig, MockFetchClient, sdkState

### Community 74 - "Export Config API"
Cohesion: 0.19
Nodes (8): ExportConfig, GET(), POST(), POST(), app, handle, port, HRSyncConflict

### Community 77 - "Ralph Loop Agent"
Cohesion: 0.40
Nodes (4): RalphLoopConfig, RalphLoopResult, RalphLoopState, UserStory

### Community 78 - "Button Group UI"
Cohesion: 0.50
Nodes (4): ButtonGroup(), ButtonGroupSeparator(), ButtonGroupText(), buttonGroupVariants

### Community 79 - "Legacy API Route Check"
Cohesion: 0.67
Nodes (3): assertNoLegacyApiRoutes(), findLegacyApiRoutes(), FORBIDDEN_LEGACY_API_SEGMENTS

### Community 81 - "Version & Frozen Project"
Cohesion: 0.67
Nodes (3): createVersion(), createVersion(), createFrozenProject()

## Knowledge Gaps
- **307 isolated node(s):** `mockSkills`, `mockWorkflows`, `mockRalphState`, `mockRalphStories`, `SKILL_CATEGORIES` (+302 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Component Library` to `Ontology Store & UI`, `AI Draft & Behavior Model`, `Agent Skills Manager`, `Sidebar & Mobile UI`, `Editors & Sync Manager`, `Meta Dimension Constants`, `Confirm Dialog & Module Actions`, `Meta Dimension Coverage`, `Button & Error Pages`, `Master Data Manager`, `Menubar UI`, `Context Menu UI`, `Version History Panel`, `Carousel UI`, `Entity Role & Data Model`, `Item UI Component`, `Field UI Component`, `Form UI Component`, `Chart UI`, `Drawer UI`, `Dropdown Menu UI`, `Navigation Menu UI`, `Input Group UI`, `Toggle UI`, `Button Group UI`?**
  _High betweenness centrality (0.231) - this node is a cross-community bridge._
- **Why does `OntologyProject` connect `Ontology Project Config Export` to `Ontology Policy Constraints`, `EPC Document Prompt`, `Ontology Store & UI`, `Test Mock Data Artifacts`, `AI Draft & Behavior Model`, `Ontology State & Coverage`, `EPC Linting`, `Config Package Export`, `Module Status & Confirm Flow`, `Manifest Export`, `Ontology Manifest Semantic`, `Ontology Normalization`, `Module Status Labels`, `Entity Creation`, `Supabase Client`, `Ontology Manifest Process`, `Entity Role & Data Model`, `Manifest Object Types`, `Ontology Manifest Behavior`, `Ontology Validator`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `GeneratedFile` connect `Code Generator` to `Code Package Generation`, `Code Generation Types`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `mockSkills`, `mockWorkflows`, `mockRalphState` to the rest of the system?**
  _307 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Ontology Policy Constraints` be split into smaller, more focused modules?**
  _Cohesion score 0.029411764705882353 - nodes in this community are weakly interconnected._
- **Should `UI Component Library` be split into smaller, more focused modules?**
  _Cohesion score 0.04918032786885246 - nodes in this community are weakly interconnected._
- **Should `Excel Schema Config` be split into smaller, more focused modules?**
  _Cohesion score 0.06599326599326599 - nodes in this community are weakly interconnected._