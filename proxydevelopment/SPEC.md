# SPEC: CLI Agent LLM Proxy

## 1. Overview
Build a small local HTTP service that exposes an OpenAI-compatible endpoint and translates requests into calls to local CLI agents (Codex, Qwen headless, Gemini CLI) running inside specific repositories. Behavior is controlled by per-repo files (AGENTS.md). Optionally, each call can run in its own git worktree for isolation.

## 2. Components

### 2.1 HTTP Layer
- **Endpoint**: `POST /v1/chat/completions`
- **Request (subset)**:
  ```json
  {
    "model": "codex-repoX",
    "messages": [
      {"role": "system", "content": "You are ..."},
      {"role": "user", "content": "Extract data from report"}
    ]
  }
  ```
- **Response**:
  ```json
  {
    "id": "cmpl-<uuid>",
    "object": "chat.completion",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "<parsed CLI output>"
        },
        "finish_reason": "stop"
      }
    ]
  }
  ```

### 2.2 Model Registry
- Implement as `models.json` in the proxy root, e.g.:
  ```json
  {
    "codex-repoX": {
      "driver": "codex",
      "repoPath": "/home/marcus/projects/repoX",
      "agentFile": "AGENTS.md"
    },
    "qwen-repoY": {
      "driver": "qwen",
      "repoPath": "/home/marcus/projects/repoY",
      "agentFile": "AGENTS.md"
    },
    "gemini-repoZ": {
      "driver": "gemini",
      "repoPath": "/home/marcus/projects/repoZ",
      "agentFile": "AGENTS.md"
    }
  }
  ```
- On request, look up the model. If missing, return 400 with error JSON.
- Later: allow `"worktree": true` to signal worktree creation.

### 2.3 Prompt Construction
- If `agentFile` exists in `repoPath`, read it.
- Build final prompt as:
  ```text
  {AGENTS.md content}

  --- USER TASK ---
  {user message(s) concatenated}
  ```
- System messages from the request are prepended above user messages.

### 2.4 Driver Layer

#### 2.4.1 Codex Driver
- **Command** (example):
  ```bash
  codex exec --cd <repoPath> "<prompt>"
  ```
  Add flags for sandbox / non-interactive if required by the CLI.
- Spawn as child process, capture stdout/stderr.
- Pass stdout to normalizer.

#### 2.4.2 Qwen Driver
- Based on Qwen headless docs: call the qwen-code headless entrypoint with the prompt.
- **Command** (example):
  ```bash
  cd <repoPath> && qwen-code headless --prompt "<prompt>"
  ```
  Adjust to actual CLI name/flags in your environment.

#### 2.4.3 Gemini Driver
- Treat like Qwen: run from repo dir, pass prompt either as argument or stdin.
- **Command** (example):
  ```bash
  cd <repoPath> && gemini-cli --prompt "<prompt>"
  ```

### 2.5 Output Normalizer
- Many CLIs print logs or tool traces.
- Define a simple rule:
  - Split stdout by lines.
  - Take the last non-empty block as the assistant answer.
  - Trim.
- If stdout is empty, return `"No output from CLI."`.

### 2.6 Worktree Support (Optional)
- If model config has `"worktree": true`:
  1. generate request id,
  2. run: `git -C <repoPath> worktree add /tmp/agenticllm/<id> HEAD`,
  3. use `/tmp/agenticllm/<id>` as working directory for the driver,
  4. run CLI,
  5. optionally run `git -C <repoPath> worktree remove /tmp/agenticllm/<id>` afterwards.
- This isolates parallel calls.

### 2.7 Error Handling
- If CLI exits with non-zero code:
  ```json
  {
    "error": {
      "message": "CLI failed",
      "detail": "<stderr>"
    }
  }
  ```
  and HTTP 500.
- If model unknown: HTTP 400 with `{error: {message: "Unknown model"}}`.

## 3. Testing

### 3.1 Unit Tests
- **Registry test**: load `models.json`, request `codex-repoX`, verify driver/repoPath/agentFile.
- **Prompt builder test**: with and without AGENTS.md.
- **Command builder tests**: for each driver, assert the exact command array/string is built.
- **Normalizer test**: given mixed stdout, only final block is returned.

### 3.2 Integration Tests
- Start proxy, mock CLI binaries with small shell scripts that echo known strings.
- Call `POST /v1/chat/completions` with each model and assert response content.
- Create a temp repo with AGENTS.md that forces a certain answer; assert it’s used.

### 3.3 Worktree Test
- Mock `git` calls, assert that `git worktree add` is called before driver, and `git worktree remove` is called after.

## 4. Future Extensions
- Streaming responses.
- Auth / API keys.
- Per-repo policies for “agent may create helpers”.
- Automatic commit of agent-created helpers with a small log file.
