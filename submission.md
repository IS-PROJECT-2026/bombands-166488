# Project Submission Report

## 1. Student Details

- **Full Name:** Bwibo Ethan Nimrod
- **GitHub Username:** EthanBwibo
- **Email:** ethan.bwibo@strathmore.edu

---

## 2. Deployed Project Link

- **Live GitHub Pages URL:** https://is-project-2026.github.io/bombands-166488/
---

## 3. Reflection — Grounded in Your Git History

### A. Your Best Commit

- **Commit URL:** [URL](https://github.com/IS-PROJECT-2026/bombands-166488/commit/3a32c372d8a426c650ca26c3980f76ffe62b9565)
- **Why this one?** This commit follows Conventional Commits precisely (`refactor(crossword): switch to algorithmic puzzle generator, fix win-check case bug, add check/hint/streak/share`), and the body explains the structural *why* — switching from hand-authored crossword grids to an algorithmic constraint-based generator — rather than just restating the diff.

### B. A Mistake or Struggle

- **Link to the evidence:** [(https://github.com/IS-PROJECT-2026/bombands-166488/commit/e4731ef47927c1cc12f05eeaac2b9b8ccd93b1d9)]
- **What happened and how did you recover?** My Crossword game's win-check silently never triggered — the grid stored user entries in lowercase but compared them against uppercase answer strings, so a fully correct solve could never register as "won." I traced it by reading through the state flow line by line rather than guessing, found the case mismatch, and fixed it by normalizing letter casing at the point the grid is built.

### C. A Pull Request You're Proud Of

- **PR URL:** https://github.com/IS-PROJECT-2026/bombands-166488/pull/40
- **What did you check before merging?** I reviewed the diff for consistency with the other five games' UI patterns, tested the feature in both light and dark mode, and confirmed the linked issue's acceptance criteria were all met before merging."

### D. One Thing You Would Do Differently

- **What would you change?** I'd verify structured game data — like crossword grid coordinates — programmatically before trusting it, rather than hand-authoring intersecting word placements by eye. My first Crossword attempt had silent letter-mismatch bugs in the grid data itself that only surfaced once actually played; switching to an algorithmic generator that validates every placement structurally prevents that entire class of bug.
- **Link to the evidence of the original decision:** (https://github.com/IS-PROJECT-2026/bombands-166488/pull/40/changes/e4731ef47927c1cc12f05eeaac2b9b8ccd93b1d9)

---

## 4. Screenshots of Key GitHub Features

> Paste each screenshot directly into this file via the GitHub web editor (click the blank line below each prompt, then Ctrl+V).

### A. Milestones and Issues

[PASTE YOUR MILESTONE SCREENSHOT DIRECTLY HERE]

* **Caption:** Four milestones (Core Platform, Authentication, Game Modules, Polish & Deployment) with granular issues linked to each, tracking the full build from setup through all six games.

### B. Project Board

[PASTE YOUR PROJECT BOARD SCREENSHOT DIRECTLY HERE]

* **Caption:** Kanban board with issues moved across To Do / In Progress / Done as each game and feature was completed.

### C. Branching Architecture

[PASTE YOUR BRANCHING SCREENSHOT DIRECTLY HERE — see steps below to get this]

* **Caption:** Feature branches follow the `feat/`, `fix/`, and `style/` naming convention, each scoped to a single issue (e.g. `feat/6-wordle-game`, `feat/sudoku-improvements`).

### D. Pull Requests & Traceability

[PASTE YOUR PULL REQUEST SCREENSHOT DIRECTLY HERE]

* **Caption:** [Fill in: which issue does this PR close, and what does it cover?]

---

## 5. Merge Conflict Evidence

### Conflict 1 — Full Chronology

**What cause did you use?** Two branches independently editing the same line of the same file.

#### Step 1: Generating the Clash

[PASTE SCREENSHOT OF ATTEMPTED MERGE / TERMINAL WARNING HERE]

* **Caption:** Merging `branch-A` into `branch-B` after both branches modified the same line of the same file, triggering Git's standard content conflict warning.

#### Step 2: Inside the Code Editor (Conflict Markers)

[PASTE SCREENSHOT OF RAW CONFLICT MARKERS HERE]

* **Caption:** Raw `<<<<<<< HEAD` / `=======` / `>>>>>>>` markers showing both versions of the disputed line side by side; resolved by keeping the intended final version and removing the markers.

#### Step 3: Resolution & Clean Merge

[PASTE SCREENSHOT OF CLEAN RESOLUTION HERE]

* **Caption:** Clean commit history after resolving the conflict, staging the merged file, and completing the merge.

---

### Conflict 2 — Different Cause

**What cause did you use?** Edit vs. delete — one branch edited a specific line while another branch deleted the surrounding block containing that same line.

**Why does this cause trigger a conflict?** Git can't automatically decide whether to keep an edit made to content that no longer exists on the other branch — it has no way to know if the edit should survive the deletion or not, so it stops and asks.

[PASTE SCREENSHOT OF CONFLICT MARKERS FOR CONFLICT 2 HERE]

* **Caption:** `conflict-test-2a` edited a line in `scratch.md` while `conflict-test-2b` deleted the surrounding block containing that line, producing a genuine edit/delete conflict on merge.

---

### Conflict 3 — Different Cause

**What cause did you use?** Add/Add — two branches independently created a new file with the identical filename but different content.

**Why does this cause trigger a conflict?** Since both branches added the same filename with no shared history for that file between them, Git has no common ancestor version to diff against and can't determine which version is correct — so it surfaces both and asks for a manual resolution.

[PASTE SCREENSHOT OF CONFLICT MARKERS FOR CONFLICT 3 HERE]

* **Caption:** `conflict-test-4a` and `conflict-test-4b` each independently created `notes.md` with different content; merging produced `CONFLICT (add/add): Merge conflict in notes.md`, resolved by keeping both versions' content.

---

## 6. Feedback & Evaluation

- [ ] **Anonymous Evaluation Form:** [Course & Instructor Evaluation](https://forms.gle/YLybnsyXXErKEg3s9)

---

## Final Submission

> **Submission Form:** [https://forms.gle/KrT4VxtFtkU3wtYu8](https://forms.gle/KrT4VxtFtkU3wtYu8)
