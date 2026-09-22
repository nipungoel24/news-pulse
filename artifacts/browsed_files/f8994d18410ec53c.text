---
name: make-this-project
version: 1.0.0
description: Turn a user's project request into a complete, current Agent Forge implementation brief for a coding agent, while requiring the agent to fetch and apply the latest relevant skills from the canonical Agent Forge repository.
---

# /make-this-project

Use this skill whenever the user asks to build, create, redesign, fix, or substantially improve a software project and wants a coding agent to perform the implementation.

The user should be able to write:

```
/make-this-project

Build a [PROJECT DESCRIPTION].
[Additional requirements, references, constraints, links, screenshots, stack preferences, etc.]
```

Your job is to convert that request into a high-quality execution package for the coding agent.

## Canonical Source

The canonical Agent Forge repository is:

https://github.com/nipungoel24/agent-forge

Never treat a copied or stale version of an Agent Forge skill as the source of truth when the canonical repository is reachable.

## Core Behavior

Every invocation must do these things:

1. Parse the complete project request.
2. Determine the project type and which Agent Forge skills are relevant.
3. Inspect the current Agent Forge repository structure, including the README, CHANGELOG, skills directory, and relevant supporting prompt/reference/checklist/template files.
4. Read the current relevant skills from the canonical GitHub repository when the chatbot has GitHub/web access.
5. If the chatbot cannot directly retrieve the repository, explicitly include instructions for the coding agent to retrieve the current skills before implementation.
6. Generate one self-contained execution prompt for the coding agent.
6. The execution prompt must tell the coding agent to fetch/install the relevant Agent Forge skills itself and follow them during implementation.
7. Preserve the user's project requirements exactly. Do not replace them with generic assumptions.
8. Require the agent to inspect the existing project/repository before making destructive or architectural changes.
9. Require phase-by-phase implementation and verification.
10. Require the agent to report what it changed, what it verified, what remains, and any blockers.

## Skill Selection

Start from the user's actual project request.

First inspect what currently exists under `skills/`. Do not assume today's skill list is permanent.

Load only the relevant Agent Forge skills, but always check the canonical repository for the latest versions.

For every selected skill:
- read its `SKILL.md`;
- inspect any `prompts/`, `references/`, `checklists/`, `templates/`, examples, or other instruction files that the skill explicitly depends on;
- follow those supporting instructions when applicable;
- include the relevant paths in the downstream agent handoff.

Do not blindly copy the entire repository into the prompt. Read what is relevant, then give the downstream agent canonical paths so it can fetch the same current source itself.

Examples:

- Website / landing page / dashboard / web app:
  - `production-website`
- If another Agent Forge skill exists that clearly applies, include it.
- Do not blindly load unrelated skills.

For website work, `production-website` is mandatory.

Canonical website skill:

https://raw.githubusercontent.com/nipungoel24/agent-forge/main/skills/production-website/SKILL.md

## Required Agent Bootstrap

The generated coding-agent prompt must begin with an instruction equivalent to:

> Before doing implementation work, connect to the canonical Agent Forge repository at https://github.com/nipungoel24/agent-forge, identify the relevant skills for this project, fetch their current contents, and use them as active implementation standards. Do not rely on an old cached copy if the repository is reachable.

If the agent has shell access and supports the Skills CLI, prefer:

```bash
npx skills add https://github.com/nipungoel24/agent-forge --skill <relevant-skill> --copy
```

For global installation:

```bash
npx skills add https://github.com/nipungoel24/agent-forge --skill <relevant-skill> -g --copy
```

If the agent does not have the Skills CLI but can read GitHub/raw URLs, it must fetch the relevant `SKILL.md` files directly and apply them.

If neither is available, the agent must say so rather than claiming the skill was loaded.

## Repository + Prompt Discovery Rule

The user often gives requirements to the normal chatbot first and then asks the chatbot to produce a prompt for another agent. Therefore, treat this skill as the bridge between those two layers.

Before writing the final handoff, combine these sources in order:

1. the user's current project request;
2. any project files/context explicitly supplied by the user;
3. the current Agent Forge repository instructions;
4. the selected Agent Forge skill files and their relevant supporting prompts/references/checklists/templates.

Do not assume that a previous conversational prompt is part of the current task unless it is actually available in the current context.

When the repository contains reusable prompts or instruction files relevant to the selected skill, read them and incorporate their requirements into the generated handoff rather than merely mentioning that they exist.

## Project-Specific Source of Truth

The user's request is the highest project-level source of truth.

The agent must preserve:

- requested functionality
- required pages/screens
- requested stack, if specified
- integrations
- APIs
- data models
- authentication requirements
- visual references
- business rules
- deployment constraints
- accessibility requirements
- performance requirements
- deadlines or phase constraints
- explicit things the user said not to change

When the request is ambiguous, the agent should inspect the existing project and use conservative assumptions. It should ask only when the missing information is genuinely blocking implementation.

## Required Execution Workflow

The generated prompt must instruct the agent to follow this sequence:

### Phase 0 — Load Standards

- Fetch current relevant Agent Forge skills.
- Read them completely enough to apply their rules.
- Identify project-specific constraints.
- Do not start coding before this step.

### Phase 1 — Inspect

Inspect the existing project before changing it:

- directory structure
- package/dependency files
- framework and build system
- existing routes/pages
- components
- styling system
- assets
- configuration
- environment variables
- tests
- lint/typecheck/build configuration
- existing documentation
- current Git state when available

Do not delete, rewrite, or migrate working architecture without a reason.

### Phase 2 — Establish Project Documentation

Create or update the project's source-of-truth documents where applicable:

- `PRD.md`
- `Architecture.md`
- `Rules.md`
- `Phases.md`
- `Design.md`
- `Memory.md`

These documents must reflect the actual project rather than generic filler.

### Phase 3 — Plan

Create a concrete implementation plan based on the inspected codebase and the loaded Agent Forge skills.

Break the work into verifiable phases.

Do not silently skip requirements.

### Phase 4 — Implement

Implement phase by phase.

After each meaningful phase:

- run relevant tests/checks
- inspect the result
- fix issues before continuing
- update project memory/documentation when decisions or important discoveries change

### Phase 5 — Verify

Run all appropriate checks for the project.

For web projects, this should include, as applicable:

- build
- typecheck
- lint
- unit/integration tests
- route checks
- browser/runtime checks
- responsive/mobile checks
- accessibility checks
- SEO/discovery checks
- console-error checks
- broken-link/button checks
- performance checks

### Phase 6 — Final Audit

Compare the finished implementation against:

1. the user's original request
2. the project source-of-truth documents
3. every applicable Agent Forge skill requirement
4. the actual runtime/build output

Fix discrepancies before declaring the project complete.

### Phase 7 — Report

Return:

- what was implemented
- important architectural/design decisions
- files changed/created
- checks run and their results
- known limitations
- remaining work, if any
- whether the relevant Agent Forge skills were successfully fetched/applied

Never claim a test, browser check, skill installation, or deployment happened unless it actually happened.

## Web Project Special Rule

If the project is a website or web application, the generated prompt must explicitly require the agent to load and apply:

```
https://raw.githubusercontent.com/nipungoel24/agent-forge/main/skills/production-website/SKILL.md
```

The agent should also inspect that skill's linked references/checklists when needed.

The agent must not treat a website as finished merely because it renders. It must pass the applicable production, accessibility, responsive, SEO, performance, content-integrity, and launch checks defined by the skill.

## Prompt Construction Rules

The final agent prompt should be detailed enough that the user can paste it directly into a coding agent.

Use this structure:

1. ROLE
2. USER PROJECT REQUEST
3. CANONICAL SKILL SOURCE
4. MANDATORY SKILL LOADING
5. PROJECT CONTEXT
6. NON-NEGOTIABLE REQUIREMENTS
7. INSPECTION REQUIREMENTS
8. IMPLEMENTATION PHASES
9. VERIFICATION REQUIREMENTS
10. FINAL AUDIT
11. REPORTING FORMAT

Do not produce a vague "build this project" prompt.

Do not invent requirements that conflict with the user.

Do not turn preferences into hard requirements unless the user made them hard requirements.

## Agent Prompt Template

Use this template and fill it with the user's actual request:

```text
You are the implementation agent responsible for completing this project.

## 0. BEFORE IMPLEMENTATION — LOAD AGENT FORGE

Canonical repository:
https://github.com/nipungoel24/agent-forge

Before coding, identify and load the relevant current Agent Forge skills.

For this project, the relevant skill(s) are:
- <SKILL NAME(S)>

Preferred installation when shell + Skills CLI are available:
npx skills add https://github.com/nipungoel24/agent-forge --skill <SKILL NAME> --copy

For website projects, you MUST load:
https://raw.githubusercontent.com/nipungoel24/agent-forge/main/skills/production-website/SKILL.md

Do not use a stale cached skill when the canonical repository is reachable.

If you cannot fetch/load the skill, state that clearly and continue only if the project can still be implemented safely.

## 1. PROJECT REQUEST

<PASTE THE USER'S COMPLETE PROJECT REQUEST HERE>

## 2. PROJECT-SPECIFIC NON-NEGOTIABLES

<EXTRACT EXPLICIT REQUIREMENTS FROM THE USER REQUEST>

Do not invent facts, content, metrics, customers, reviews, credentials, integrations, or business claims.

## 3. INSPECT BEFORE CHANGING

Inspect the existing repository/codebase first.

Understand the current architecture, dependencies, routes, components, assets, configuration, tests, and build system.

Preserve working behavior unless a change is required by the project request or a loaded skill.

## 4. SOURCE-OF-TRUTH DOCUMENTS

Create or update, where appropriate:
- PRD.md
- Architecture.md
- Rules.md
- Phases.md
- Design.md
- Memory.md

Keep them synchronized with the actual implementation.

## 5. IMPLEMENT PHASE BY PHASE

Plan the work, then execute it in verifiable phases.

After each meaningful phase, run the relevant checks and fix failures before proceeding.

## 6. VERIFY

Run all applicable build, typecheck, lint, test, runtime/browser, accessibility, responsive, SEO, performance, and content-integrity checks.

Do not report checks that were not actually run.

## 7. FINAL AUDIT

Compare the final implementation against:
- the user's original request
- project source-of-truth documents
- all loaded Agent Forge skills
- actual build/runtime behavior

Fix all discovered issues before completion.

## 8. FINAL REPORT

Report:
- implemented features
- important decisions
- files changed
- verification performed
- results
- remaining limitations/blockers
- Agent Forge skills actually loaded/applied
```

## Invocation Contract

When the user invokes `/make-this-project`, do not merely explain how to build the project.

Produce the actual copy-paste-ready implementation prompt for the downstream agent.

The normal chatbot's work is:

1. understand the project;
2. inspect Agent Forge;
3. read the relevant standards and supporting instructions;
4. select the applicable skills;
5. encode the requirements into the agent handoff;
6. explicitly require the downstream agent to fetch the same skills from GitHub;
7. return the finished handoff.

If the user asks for "just the prompt", return the prompt without extra tutorial text.

## Important Distinction

This skill is a prompt-orchestration skill, not the implementation skill itself.

Its purpose is to make the normal workflow:

```
User
  ↓
/make-this-project
  ↓
Chatbot reads current Agent Forge standards
  ↓
Chatbot generates a complete implementation prompt
  ↓
Coding agent receives the prompt
  ↓
Coding agent fetches/installs the same current skills
  ↓
Agent inspects project
  ↓
Agent plans
  ↓
Agent implements
  ↓
Agent verifies
  ↓
Agent reports
```

This gives both the chatbot and the coding agent a direct path to the same canonical source of truth.

## Continuous Improvement

If implementation reveals a reusable engineering rule that should apply to future projects, mention it as a candidate improvement to the relevant Agent Forge skill.

Do not silently modify the canonical skill during a normal project run unless the user explicitly asks for the Agent Forge repository to be updated.

## Priority Order

When resolving conflicts:

1. platform/system safety rules
2. explicit user requirements
3. project-specific source-of-truth documents
4. current Agent Forge skills
5. general implementation preferences

Never let a generic skill override an explicit project requirement unless a higher-priority constraint requires it.
