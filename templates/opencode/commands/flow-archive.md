# Flow Archive

Archive completed flow and elevate patterns.

## Usage
`/flow:archive {flow_id}`

## Phase 1: Validate Flow

Verify all tasks are `[x]` completed or `[-]` skipped.

## Phase 2: Extract Learnings

### 2.1 Read Flow Learnings
Parse `.agent/specs/{flow_id}/learnings.md`

### 2.2 Merge to Project Patterns
Append selected patterns to `.agent/patterns.md`

## Phase 3: Close Beads Epic

```bash
bd close {epic_id} --reason "Flow archived"
```

## Phase 4: Move to Archive

Move `.agent/specs/{flow_id}/` → `.agent/archive/{flow_id}/`

Update `.agent/flows.md`

## Final Output

```
Flow Archived: {flow_id}

Location: .agent/archive/{flow_id}/
Patterns Elevated: {count}
```
