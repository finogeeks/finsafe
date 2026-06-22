# FinSAFE operator skills (for AI agents)

**中文：** [README-zh.md](./README-zh.md)

Each skill under this directory is **self-contained**: an operator can use it with release
binaries from [GitHub Releases](https://github.com/finogeeks/finsafe/releases) and the skill
file — no local checkout of the documentation tree is required.

## How to use with an agent

1. Give the agent the skill file (for example copy `finsafe-bundlectl/SKILL.md` into your agent’s skill path, or attach it to the session).
2. Ensure `finsafe-bundlectl` is on `PATH` and environment variables from the skill are set.
3. The skill includes install steps, commands, troubleshooting, and a minimal policy YAML example.

## Agent sandbox (Hermes, OpenCode, agy, …)

**Start here:** [docs/agent-sandbox-guide.md](../docs/agent-sandbox-guide.md) · [中文](../docs/agent-sandbox-guide-zh.md) — includes **`learn` / `explain`** workflows for agents.

| Skill | File | Use when |
|-------|------|----------|
| **finsafe-agent-sandbox-run** | [SKILL.md](./finsafe-agent-sandbox-run/SKILL.md) · [SKILL-zh.md](./finsafe-agent-sandbox-run/SKILL-zh.md) | Run agents; iterate policy with **`learn`**, **`explain`**, `--audit`, trace |
| **finsafe-agent-sandbox-verify** | [SKILL.md](./finsafe-agent-sandbox-verify/SKILL.md) | After agent runs: prove isolation (A/B/C/D) |
| **finsafe-trace-denials** | [SKILL.md](./finsafe-trace-denials/SKILL.md) | macOS: when **`learn`** reports 0 denials but stderr still denies paths |

## Enterprise fleet

| Skill | File | Use when |
|-------|------|----------|
| **finsafe-enterprise-setup** | [SKILL.md](./finsafe-enterprise-setup/SKILL.md) · [SKILL-zh.md](./finsafe-enterprise-setup/SKILL-zh.md) | End-to-end managed fleet: authority, Finogeeks `license.jws`, MDM, pilot checks |
| **finsafe-bundlectl** | [SKILL.md](./finsafe-bundlectl/SKILL.md) · [SKILL-zh.md](./finsafe-bundlectl/SKILL-zh.md) | Build / sign / publish policy bundles; MDM managed-required sentinel |

## Optional deeper reading (online only)

Skills intentionally avoid relative links to other repo files. If needed, full URLs:

- https://github.com/finogeeks/finsafe/releases
- https://github.com/finogeeks/finsafe/tree/main/docs
