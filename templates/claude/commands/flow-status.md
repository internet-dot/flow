---
description: Display progress overview for all flows
allowed-tools: Read, Glob, Grep, Bash
---

# Flow Status

Display progress overview for all active flows.

## Phase 1: Load Registry

Read `.agent/prds.md` to get list of active flows.

---

## Phase 2: Beads Status

```bash
bd prime
bd ready
```

---

## Phase 3: Flow Summary

For each active flow:

1. Read `.agent/specs/{flow_id}/plan.md`
2. Count tasks by status: `[ ]`, `[~]`, `[x]`, `[!]`, `[-]`
3. Calculate progress percentage

---

## Phase 4: Display Dashboard

```
Flow Status Dashboard

=== Active Flows ===

[~] auth_20260124 - Add user authentication
    Progress: 5/12 tasks (41%)
    Current: Phase 2, Task 6
    Last Activity: 2026-01-24 14:30
    Blockers: 0

[ ] dark-mode_20260124 - Add dark mode toggle
    Progress: 0/8 tasks (0%)
    Status: Not started

=== Beads Ready ===

Ready tasks (no blockers):
  - auth_20260124: Task 6 - Implement login endpoint
  - auth_20260124: Task 7 - Add session middleware

=== Quality Gates ===

Last Test Run: PASSED (2026-01-24 14:25)
Coverage: 82%

=== Recent Activity ===

- 14:30 - auth_20260124: Task 5 completed [abc1234]
- 14:15 - auth_20260124: Task 4 completed [def5678]
- 13:45 - dark-mode_20260124: Flow created
```

---

## Phase 5: Recommendations

Based on status, suggest next action:

- If blocked tasks exist: "Consider running `/flow-block` to document blockers"
- If no in-progress: "Ready to continue? Run `/flow-implement {flow_id}`"
- If flow complete: "Flow ready for archive? Run `/flow-archive {flow_id}`"

---

## Critical Rules

1. **READ ONLY** - This command only displays information
2. **BEADS SYNC** - Include Beads ready tasks
3. **ACTIONABLE** - Provide next step suggestions
