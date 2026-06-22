# Project Composer

VS Code / Cursor extension by **SSU Group** to start, stop, and restart Docker Compose projects with **per-stand env presets**. Works on **Windows**, **macOS** (Intel and Apple Silicon), and **Linux**. Choose which backend stand to use from the Command Palette; the extension merges the selected preset into your target env file and runs `docker compose` from the project root.

## Commands (Cmd+Shift+P / Ctrl+Shift+P)

- **Project: Start (select stand, docker-compose up)** — Pick a stand from presets, apply env, optionally clean `.next` / `node_modules` / `yarn.lock`, run `docker compose up -d`, optionally wait for containers, optionally open URLs in the browser.
- **Project: Stop (docker-compose down)** — Run `docker compose down`. Optionally runs full Docker cleanup if enabled in settings.
- **Project: Restart (docker-compose restart)** — Quick restart of running containers without rebuild (`docker compose restart`). Use when the stack is up but the app stopped responding (e.g. Next.js exited inside a live container).
- **Project: Docker Clean** — Run full Docker cleanup (system prune, volumes, images, builder cache).

## How env presets work

The extension does **not** hardcode stands or variable names. For each project you configure paths in settings (defaults below).

1. **Presets folder** (`projectComposeEnv.presetsPath`, default `development/.env.presets/`) — one file per stand: `demo.env`, `test-1.env`, etc.
2. **Target env file** (`projectComposeEnv.envTargetFile`, default `development/.env.development`) — base env with all keys, comments, and order.
3. On **Project: Start**, after you pick a stand, the extension:
   - reads `{presetsPath}/{stand}.env`;
   - **overwrites in the target file only those `KEY=VALUE` lines whose keys already exist in the target file**;
   - preserves comments, empty lines, and keys that are not listed in the preset.

Keys that exist **only** in the preset but not in the target file are **not added**. Add new keys to the target env first, then override them from presets.

Example preset (`demo.env`):

```env
BACKEND_API=https://demo.um-mos-ru-api.arboost.ru
BACKEND_API_HOST=demo.um-mos-ru-api.arboost.ru
```

## Project setup

Your project must have:

- `development/docker-compose.yml` (or path from `projectComposeEnv.composeFile`)
- target env file (default `development/.env.development`)
- presets folder with `*.env` files

## Settings

### Paths (relative to workspace root)

| Setting | Default | Description |
|---------|---------|-------------|
| `projectComposeEnv.presetsPath` | `development/.env.presets` | Folder with stand preset files |
| `projectComposeEnv.envTargetFile` | `development/.env.development` | Env file to merge presets into |
| `projectComposeEnv.composeFile` | `development/docker-compose.yml` | Docker Compose file |

### Start / cleanup

| Setting | Default | Description |
|---------|---------|-------------|
| `projectComposeEnv.cleanNextOnStart` | `false` | Remove `.next` before start |
| `projectComposeEnv.cleanNodeModulesOnStart` | `false` | Remove `node_modules` before start |
| `projectComposeEnv.cleanYarnLockOnStart` | `false` | Remove `yarn.lock` before start |
| `projectComposeEnv.openBrowserOnStart` | `false` | Open `openUrls` after start |
| `projectComposeEnv.openUrls` | `[]` | URLs to open (e.g. `http://web.localhost:4000`) |
| `projectComposeEnv.waitForContainers` | `""` | Space-separated container name tokens (e.g. `node-1 storybook-1 nginx-1`). Waits until `docker compose ps` reports them as **running**. Matches by full name or suffix (`um_mos_ru-node-1` matches `node-1`). |
| `projectComposeEnv.waitTimeoutMs` | `300000` | Max wait for containers + HTTP (5 min) |
| `projectComposeEnv.waitForHttpOnStart` | `true` | Poll `openUrls` until HTTP &lt; 500 before opening browser (avoids 502 while Next.js starts) |

### Stop / restart

| Setting | Default | Description |
|---------|---------|-------------|
| `projectComposeEnv.dockerCleanOnStop` | `false` | Full Docker cleanup after Stop |
| `projectComposeEnv.restartServices` | `""` | Compose service names for Restart (empty = all) |

### Example: um-mos-ru

```json
{
  "projectComposeEnv.openBrowserOnStart": true,
  "projectComposeEnv.openUrls": [
    "http://web.localhost:4000",
    "http://web.localhost:6006"
  ],
  "projectComposeEnv.waitForContainers": "node-1 storybook-1 nginx-1",
  "projectComposeEnv.waitTimeoutMs": 300000
}
```

Open the app at **`http://web.localhost:4000`** (not `localhost:4000`) so server `API_ORIGIN` and browser origin match.

## Install from VSIX

1. Build: `npm run package`
2. Install: Extensions → "..." → Install from VSIX → choose the generated `.vsix` file.

## License

SSU Group.
