* I want test done with Volcano https://volcano.dev/docs
* the proxy should be linux/WSL enabled
* it should support automatic git cloning as well, e.g. the proxy can ssh into a remote machine, clone the desired git repo, install the cli, executes the cli in a worktree, merge everything back into the git repo
* it should implement history via AGENTS.md as well, so that the agent can learn from past
* it should write appropriate AGENTS.md (naming) like the cli expects them - check cli doc for that and inject that into the worktree.
* experiment with branching using Volcano, e.g. have different cli compete on a task, select the best, learn from each other
* first CLI to test would be gemini cli, qwen coder, copilot cli
* file uploads and larger context should be handled by copying the data into a inputs folder in the repo and tell this in the prompt rather than creating huge contexts
**  this could even lead to a more intelligent system to parse from a huge context for the LLM via an internal RAG
**   maybe the same way larger output can be handled (I think thats what ChatGPT for example is doing as well, if its creates a file it does that in a sandbox and gives you the output), but we are using git as our central storage for a model
** OPenAI has a files api with a vector store - I would not recommend to use that for now in the proxy - could be implemented later on
* a model has a git repo and a cli - when invoking a new session, a worktree is cloned and the session(s) working on the same worktree. This allows parallel sessions and session persistance. This kind os session persistance is not in open ai api.
