# Tasks: Reddit Insights extraction

- [x] Confirm destination path with user (default: `/Users/sarthak/Desktop/fleet/reddit-insights/`).
- [x] Create `reddit-insights` directory and base files (`package.json`, `README.md`, `.gitignore`).
- [x] Copy Reddit scripts, proxy worker, config, and data to the new project.
- [x] Audit and declare dependencies in `package.json`.
- [x] Update any hardcoded paths in moved scripts to be relative to the new project root.
- [x] Delete Reddit tooling from `chatgpt-memory-insights`.
- [x] Run `node scripts/reddit-memory-ui.mjs LocalLLaMA` in the new project to verify the dashboard builds.
- [x] Run `node scripts/reddit-memory-analyze.mjs LocalLLaMA` to verify the pipeline still works.
- [x] Update `PROJECT_STATUS.md` in `chatgpt-memory-insights` if needed (not required for removal of untracked experimental code).
- [x] Commit changes to both projects.
