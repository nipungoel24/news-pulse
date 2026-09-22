# Agent Forge

A version-controlled library of reusable AI agent skills, engineering standards, workflows, and project templates.

## Skills

### agent-forge-bootstrap

A small universal loader skill for AI agents. It tells an agent to fetch the current relevant skill from this repository before starting project work.

Use this as the reusable foundation installed into individual coding agents.

### make-this-project

An orchestration/prompt-generation skill for the workflow where you talk to a normal chatbot first and then give its response to a coding agent.

It turns:

```text
/make-this-project
<your project description>
```

into a complete implementation prompt that:

1. reads the current Agent Forge standards
2. identifies the relevant skills
3. tells the coding agent to fetch/install those skills
4. preserves the user's exact project requirements
5. requires repository inspection before changes
6. creates/updates project source-of-truth documents
7. implements phase by phase
8. verifies the result
9. performs a final audit
10. reports exactly what was done and verified

This is the skill to use when the chatbot is acting as the planning/prompt-writing layer and another agent is acting as the implementation layer.

### production-website

A production website engineering and QA skill for building or improving websites without generic AI/vibe-coded patterns.

It covers:
- product discovery and project planning
- design systems and UI quality
- responsive/mobile behavior
- accessibility
- SEO and metadata
- structured data
- social sharing
- content integrity
- forms and interaction states
- performance
- browser QA
- deployment and launch verification

## Recommended Workflow

The intended workflow is:

```text
You
  ↓
/make-this-project
  ↓
Normal chatbot reads the current Agent Forge standards
  ↓
Normal chatbot creates a complete coding-agent prompt
  ↓
Coding agent receives that prompt
  ↓
Coding agent fetches/installs the same current Agent Forge skills
  ↓
Agent inspects the project
  ↓
Agent plans
  ↓
Agent implements
  ↓
Agent verifies
  ↓
Agent reports
```

The important design decision is that both layers point to the same GitHub repository. This avoids maintaining one giant prompt separately in every chatbot.

## Install

Install the bootstrap skill globally:

```bash
npx skills add https://github.com/nipungoel24/agent-forge --skill agent-forge-bootstrap -g --agent '*' --copy
```

Install the `make-this-project` skill into an agent that supports reusable skills:

```bash
npx skills add https://github.com/nipungoel24/agent-forge --skill make-this-project -g --agent '*' --copy
```

Install the production website skill directly:

```bash
npx skills add https://github.com/nipungoel24/agent-forge --skill production-website -g --agent '*' --copy
```

Project-local installation:

```bash
npx skills add https://github.com/nipungoel24/agent-forge --skill production-website --copy
```

## Skill Selection

Do not blindly load every skill for every project.

The `make-this-project` skill identifies which skills are relevant to the user's request. For a website project, `production-website` is mandatory.

The coding agent should also re-fetch the current relevant skills before implementation so the implementation layer does not depend on a stale prompt generated earlier.

## Repository Philosophy

GitHub is the canonical source of truth. Improve the skills here as new failures, techniques, and standards are discovered.

Projects should contain their own PRD, Architecture, Rules, Phases, Design, and Memory files; reusable skills provide the methodology and templates.

## Included Ecosystem References

- ibelick/ui-skills
- emilkowalski/skills
- Morphicons
- theSVG
- shadcn/ui
- Google Search documentation
- Web Vitals guidance
- llms.txt specification

See `skills/production-website/references/` for the integration notes.
