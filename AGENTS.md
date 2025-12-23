# AGENTS.md

Audiobook Toolkit — Electron + React + TypeScript + Node.js + FFmpeg

Follows [MCAF](https://mcaf.managed-code.com/)

---

## Conversations (Self-Learning)

Learn the user's habits, preferences, and working style. Extract rules from conversations, save to "## Rules to follow", and generate code according to the user's personal rules.

**Update requirement (core mechanism):**

Before doing ANY task, evaluate the latest user message.
If you detect a new rule, correction, preference, or change → update `AGENTS.md` first.
Only after updating the file you may produce the task output.
If no new rule is detected → do not update the file.

**When to extract rules:**

- prohibition words (never, don't, stop, avoid) or similar → add NEVER rule
- requirement words (always, must, make sure, should) or similar → add ALWAYS rule
- memory words (remember, keep in mind, note that) or similar → add rule
- process words (the process is, the workflow is, we do it like) or similar → add to workflow
- future words (from now on, going forward) or similar → add permanent rule

**Preferences → add to Preferences section:**

- positive (I like, I prefer, this is better) or similar → Likes
- negative (I don't like, I hate, this is bad) or similar → Dislikes
- comparison (prefer X over Y, use X instead of Y) or similar → preference rule

**Corrections → update or add rule:**

- error indication (this is wrong, incorrect, broken) or similar → fix and add rule
- repetition frustration (don't do this again, you ignored, you missed) or similar → emphatic rule
- manual fixes by user → extract what changed and why

**Strong signal (add IMMEDIATELY):**

- swearing, frustration, anger, sarcasm → critical rule
- ALL CAPS, excessive punctuation (!!!, ???) → high priority
- same mistake twice → permanent emphatic rule
- user undoes your changes → understand why, prevent

**Ignore (do NOT add):**

- temporary scope (only for now, just this time, for this task) or similar
- one-off exceptions
- context-specific instructions for current task only

**Rule format:**

- One instruction per bullet
- Tie to category (Testing, Code, Docs, etc.)
- Capture WHY, not just what
- Remove obsolete rules when superseded

---

## Rules to follow (Mandatory, no exceptions)

### Commands

- build: `npm run build`
- test: `npm test` (when test suite exists)
- format: `npm run format` (if configured)
- dev: `npm run dev`

### Task Delivery (ALL TASKS)

- Read assignment, inspect code and docs before planning
- Write multi-step plan before implementation
- **Write feature docs BEFORE coding** (mandatory for non-trivial features)
- Implement code and tests together
- Run tests in layers: new → related suite → broader regressions
- After all tests pass: run format, then build
- Summarize changes and test results before marking complete
- Always run required builds and tests yourself; do not ask the user to execute them

### Documentation (ALL TASKS)

- All docs live in `docs/` directory
- Update feature docs when behaviour changes
- Update ADRs when architecture changes
- Templates: `docs/templates/ADR-Template.md`, `docs/templates/Feature-Template.md`

### Testing (ALL TASKS)

- Every behaviour change needs sufficient automated tests to cover its cases; one is the minimum, not the target
- Each public API endpoint has at least one test; complex endpoints have tests for different inputs and errors
- Integration tests must exercise real flows end-to-end, not just call endpoints in isolation
- Prefer integration/API/UI tests over unit tests
- **No mocks for internal systems** (databases, queues, caches, FFmpeg) — use real processes
- Mocks only for external third-party systems (payment gateways, SMS, external APIs)
- Never delete or weaken a test to make it pass
- Each test verifies a real flow or scenario, not just calls a function — tests without meaningful assertions are forbidden
- Check code coverage to see which functionality is actually tested; coverage is for finding gaps, not a number to chase

### Autonomy

- Start work immediately — no permission seeking
- Questions only for architecture blockers not covered by ADR
- Report only when task is complete

### Code Style

- Follow existing TypeScript/React patterns
- No magic literals — extract to constants, enums, config
- Keep components focused and reusable
- Use TypeScript types, avoid `any`

### Critical (NEVER violate)

- Never commit secrets, keys, connection strings
- Never mock internal systems (FFmpeg, filesystem) in integration tests
- Never skip tests to make PR green
- Never force push to master
- Never approve or merge (human decision)
- **ALWAYS follow MCAF from this point onwards** (user directive with extreme emphasis)

### Boundaries

**Always:**

- Read AGENTS.md and docs before editing code
- Run tests before commit

**Ask first:**

- Changing Electron IPC contracts
- Adding new npm dependencies
- Modifying audio processing pipeline
- Deleting code files

---

## Preferences

### Likes

- Open Core monetization model (source code free, binaries paid)
- Modern, beautiful UI with dark mode
- Emojis in documentation for scannability
- Transparent communication about limitations (e.g., unsigned binaries)
- GPL-3.0 + Commons Clause licensing

### Dislikes

- Tiered monetization / paywalls in source code
- Mocking internal dependencies in tests
- Vague or incomplete documentation
