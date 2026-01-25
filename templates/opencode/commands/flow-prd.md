# Flow PRD

Create a PRD with specification and implementation plan.

## Phase 1: Validate Environment

Check for `.agent/` directory. If missing: "Run `/flow:setup` first." → HALT

## Phase 2: Gather Flow Information

### 2.1 Flow Description
User provides: description of what to build

### 2.2 Generate Flow ID
Format: `shortname_YYYYMMDD`
Example: `user-auth_20260124`

## Phase 3: Research Phase

Before writing spec:
1. Search codebase for related code
2. Read `.agent/patterns.md` for relevant patterns
3. Identify affected files

## Phase 4: Create Spec

Create `.agent/specs/{flow_id}/spec.md`:

```markdown
# {Flow Title}

## Overview
{Brief description}

## Problem Statement
{What problem does this solve}

## Requirements
### Functional
- [ ] Requirement 1
- [ ] Requirement 2

### Non-Functional
- [ ] Performance targets
- [ ] Security requirements

## Constraints
- {Technical constraints}
- {Business constraints}

## Affected Files
- `src/file1.ts` - {reason}
- `src/file2.ts` - {reason}
```

## Phase 5: Create Plan

Create `.agent/specs/{flow_id}/plan.md`:

```markdown
# Implementation Plan: {flow_id}

## Phase 1: {Phase Name}

- [ ] Task 1.1: {Description}
  - Files: `src/file.ts`
  - Tests: `tests/file.test.ts`
```

## Phase 6: Create Beads Epic

```bash
bd create "Flow: {flow_id}" -t epic -p 1 --description "{brief_description}" --notes "Created by Flow | Git: $(git branch --show-current)@$(git rev-parse --short HEAD)"
bd create "{task_description}" --parent {epic_id} -p 1 --description "{task_description}" --notes "Created by Flow"
```

## Phase 7: Register Flow

Add to `.agent/flows.md`:
```markdown
## Active

- [ ] `{flow_id}` - {description} (epic: {epic_id})
```

## Final Output

```
Flow Created: {flow_id}

Spec: .agent/specs/{flow_id}/spec.md
Plan: .agent/specs/{flow_id}/plan.md

Next: Run `/flow:implement {flow_id}` to start
```