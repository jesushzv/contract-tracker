# Token Optimization Guide for Sprint Workflows

This document outlines the strategy for executing sprints on the `contract-tracker` project while keeping token usage optimized, leveraging the Everything Claude Code (ECC) rules and the sprint development workflow skill.

---

## 🔄 The Multi-Session Sprint Workflow

To prevent the massive amount of research data (PRDs, roadmaps, and directory listings) from bloating the active context window during coding and testing, split the sprint lifecycle into **three distinct conversation phases**.

### 📋 Phase 1: Research & Planning (New Chat Session)

_Use this prompt to generate the implementation plan without running long autonomous loops._

```markdown
Use the sprint-development-workflow skill and active ECC rules to plan.

1. Read the roadmap, technical PRD files and architecture in `design_docs/` to understand the requirements.
2. Search the codebase for files that need modifications using grep (do not read entire files yet).
3. Create the implementation_plan.md artifact outlining the proposed modifications. For existing files, read only the target line ranges where code will be edited.
4. Set request_feedback: true and wait for my approval.
```

---

### 💻 Phase 2: Step-by-Step Execution (Start a NEW Chat Session)

_Once the plan is approved, start a new chat. This wipes the large PRD texts from the context window, leaving maximum room for coding._

```markdown
/goal Execute the approved implementation plan.

1. Read the approved implementation_plan.md
2. Initialize the task.md tracker.
3. Modify the files step-by-step as planned. Preserve existing comments and style conventions. Use targeted line edits (avoid rewriting or reading entire files unless necessary).
4. Update task.md as you complete each task.
5. Update the files in the /design_docs (also the architecture if applicable) as needed.
6. Afer all tasks are finished make a local deployment so I can validate.
```

---

### 🧪 Phase 3: Verification & Handover (Same session as Phase 2, or a NEW one)

_Use this prompt to run tests, write the walkthrough, and push changes._

```markdown
Verify and package the implemented changes for Sprint:

1. Run the local unit tests and end-to-end integration tests. Fix any failures or regressions immediately.
2. Create the walkthrough.md artifact with test outputs and a summary of the changes.
3. Commit all changes to Git and push them to the development branch.
```

---

## 💡 Key Optimization Rules

1. **Start Fresh**: Always start a new chat session when transitioning from **Planning ➡️ Execution** to clear out PRD/research file-read history.
2. **Targeted Reads**: Read specific line ranges when viewing files (avoid reading entire source code files unless completely necessary).
3. **Targeted Code Modifications**: Use narrow line replacements instead of rewriting large files.
4. **Use Grep**: Locate functions/symbols using `grep_search` instead of listing files/directories or reading files manually.
