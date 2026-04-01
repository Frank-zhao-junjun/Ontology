# Findings & Decisions

## Requirements
- Merge README(NEW).md into the canonical README.md.
- Continue auditing REQUIREMENT.md beyond section 2.3.2 for architecture and terminology inconsistencies.
- Produce a first-pass code generator directory and interface draft aligned with the publish flow.

## Research Findings
- README(NEW).md already reflects the modeling tool direction better than README.md and has been partially cleaned up.
- REQUIREMENT.md still contains mixed generations of the architecture, including older references to process-model or five-model descriptions in some places.
- The current generated runtime JSON package shows the target runtime shape: React + Vite frontend, Flask backend, SQLite scripts, Docker Compose packaging.
- README.md is still the old baseline and still references five metamodels, process-model editor, and older API/examples.
- REQUIREMENT.md still contains outdated references in at least three places: data-flow section mentions 流程模型, later type definitions still say 五大模型/process, and the lower half includes copied conversational confirmation text that should not remain in a formal requirement document.
- A second cleanup pass confirmed many standalone formatting artifacts in REQUIREMENT.md: `复制`, `表格`, `TypeScript`, `Python`, `bash`, and `plain` labels left from pasted content.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Keep README focused on the modeling tool, not the generated runtime internals | README is the entry point for the current repository |
| Keep REQUIREMENT as the detailed dual-system roadmap | It is the right place for runtime and publish pipeline details |
| Add a separate generator draft document instead of overloading README | Easier for follow-up implementation and review |
| Split test strategy into layered docs under tests/ | Makes TDD execution and ownership clearer than one monolithic TEST_CASES.md |
| Keep one case-to-spec map file | Prevents naming drift between developers and CI |
| Add minimal CI checklist with unified commands | Eliminates local/CI mismatch and clarifies merge gate |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| README(NEW).md still had minor wording and formatting drift | Cleaned in place before merge |
| REQUIREMENT.md mixes formal specification with chat transcript-style content | Will remove or rewrite those sections into formal specification language |
| REQUIREMENT.md included many pasted formatting markers | Rewrote the affected sections into fenced code blocks, markdown tables, and a formal appendix |

## Resources
- README(NEW).md
- README.md
- REQUIREMENT.md
- 合同管理本体模型_v1.0.0_code.json

## Visual/Browser Findings
- The workspace contains both README.md and README(NEW).md, so canonicalization is needed to avoid divergence.