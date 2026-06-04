# Project Composer

VS Code / Cursor extension by **SSU Group** to start, stop, and restart Docker Compose projects with **per-stand env presets**. Works on **Windows**, **macOS** (Intel and Apple Silicon), and **Linux**. Choose which backend stand to use from the Command Palette; the extension merges the selected preset into `development/.env.development` and runs `docker compose` from the project root.

## Commands (Cmd+Shift+P / Ctrl+Shift+P)

- **Project: Start (select stand, docker-compose up)** — Pick a stand from presets, apply env, optionally clean `.next` / `node_modules` / `yarn.lock`, then run `docker compose -f development/docker-compose.yml up -d`.
- **Project: Stop (docker-compose down)** — Run `docker compose down`. Optionally runs full Docker cleanup if enabled in settings.
- **Project: Restart (docker-compose restart)** — Quick restart of running containers without rebuild (`docker compose restart`). Use when the stack is up but the app stopped responding (e.g. Next.js exited inside a live container).
- **Project: Docker Clean** — Run full Docker cleanup (system prune, volumes, images, builder cache).

## Project setup: presets

Presets are **per project** and shared via git. The extension does not hardcode stands or variables.

1. In your project, create folder: **`development/.env.presets/`**
2. Add one file per stand, e.g.:
   - `demo.env`
   - `staging.env`
   - `dev-1.env`
   - `dev-2.env`
3. Each file contains **only the variables that differ between stands** (e.g. API URLs). Example:

```env
NEXT_PUBLIC_API_URL=https://api.demo.example.com/v2
NEXT_PUBLIC_APP_URL=https://demo.example.com
NEXT_PUBLIC_SSE_SERVER=https://demo.example.com/.well-known/mercure?topic={topic}
NEXT_PUBLIC_SSE_TOPIC=/user/{id}/events
```

4. The extension merges the chosen preset into **`development/.env.development`** (only keys present in the preset file are overwritten; comments and other variables are kept).

Your project must have:

- `development/docker-compose.yml`
- `development/.env.development` (base env file)

## Settings

- **projectComposeEnv.cleanNextOnStart** — Remove `.next` before start (default: false).
- **projectComposeEnv.cleanNodeModulesOnStart** — Remove `node_modules` before start (default: false).
- **projectComposeEnv.cleanYarnLockOnStart** — Remove `yarn.lock` before start (default: false).
- **projectComposeEnv.dockerCleanOnStop** — After Project: Stop, run full Docker cleanup (default: false).
- **projectComposeEnv.restartServices** — Space-separated service names for Project: Restart (e.g. `node`). Empty — restart all services (default: empty).

## Install from VSIX

1. Build: `npm run compile` then `npx @vscode/vsce package`
2. Install: Extensions → "..." → Install from VSIX → choose the generated `.vsix` file.

## License

SSU Group.
