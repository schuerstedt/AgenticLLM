# PRD: CLI Agent LLM Proxy

## 1. Background / Problem
You want to plug powerful, repo-aware, headless CLI agents (Qwen headless, Gemini-style CLIs, and OpenAI Codex CLI with `codex exec`) into tooling that only understands OpenAI-compatible “LLM” endpoints. Today those CLIs can already run non-interactively and accept a prompt plus a working directory, but they don’t present themselves as a small HTTP service that returns a neat assistant message. The product is therefore a local HTTP proxy that *pretends* to be an LLM but actually:
1. chooses the right CLI backend,
2. `cd`s into the correct repo/worktree,
3. injects repo-local instructions (AGENTS.md),
4. runs the CLI in headless mode,
5. parses stdout into an OpenAI-like answer.

## 2. Goals
- Allow code such as a volcano-style chain to replace `llm: gpt` with `llm: "codex-repoX"` or `llm: "qwen-repoY"` and “just work”.
- Make the proxy resolve model → (driver, repoPath, agentFile) through a local registry.
- Make the proxy read and prepend AGENTS.md so behavior is controlled from the repo.
- Support three backends in v1: Codex CLI (`codex exec`), Qwen headless (per GitHub docs), Gemini-compatible CLI (treated like Qwen).
- Keep it localhost-only and simple in v1.

## 3. Non-goals
- No auth, no RBAC.
- No remote deployments.
- No complex streaming; single-response is enough.
- No full sandboxing in v1 (assumed trusted environment).

## 4. Users
- You (and your agents) who:
  - already use local repos containing AGENTS.md,
  - already have CLI agents installed,
  - already have orchestration stacks (volcano.dev, etc.) that assume OpenAI-like endpoints.

## 5. Key Features
1. **OpenAI-like HTTP endpoint**: `POST /v1/chat/completions`.
2. **Model registry**: JSON/YAML file mapping model name → driver, repoPath, agentFile.
3. **Driver layer** for: `codex`, `qwen`, `gemini`.
4. **Prompt construction** from AGENTS.md + user message.
5. **Output normalization** so only the assistant content is returned.
6. **Optional git worktree isolation** for parallel calls, one worktree per request.

## 6. Success Criteria
- A volcano-style chain can call the proxy with the three model names and receive valid text responses.
- Two quick successive calls to the same model do not corrupt the repo (serialize per model or use worktree).
- Automated tests exist for registry, prompt construction, command building, and output normalization.

## 7. Assumptions
- CLIs are installed and on PATH.
- Each repo may contain AGENTS.md with instructions like “you may create helpers”.
- We run on Linux-like environment where `cd` and CLI invocation is straightforward.
