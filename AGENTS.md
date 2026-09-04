# Agent Guidelines - Google / Secure Gateway Studio

This repository (`masudad/Google`) contains administrative tools, automation scripts, and **Secure Gateway Studio**.

## 1. Architecture & Active Runtime

- **`secure-gateway-studio/extension/`**: **Active, primary runtime**. Manifest V3 Chrome Extension providing planning, configuration, and deployment for Chrome Enterprise Premium (CEP) Secure Gateway.
- **`secure-gateway-studio/backend/` & `frontend/`**: **DEPRECATED** legacy implementations (FastAPI loopback server and React SPA). Retained for historical reference only. Active feature and logic development occurs exclusively in `extension/`.
- **`admin-scripts/`**: Standalone administrative automation scripts (Python & Apps Script).

---

## 2. Environment & Tooling

Commands must use the Cloudtop user environment paths:
```bash
export PATH="$HOME/.local/share/pnpm/bin:$HOME/.local/bin:$PATH"
```
- **Node.js**: v24.x (`~/.local/share/pnpm/bin/node`)
- **pnpm**: v11.x (`~/.local/share/pnpm/bin/pnpm`)
- **Python / uv**: `uv` (`~/.local/bin/uv`) and Python 3.13

### Build & Verification Commands (`secure-gateway-studio/extension`)

```bash
# Build extension into dist/
node build.mjs

# Package zip distribution
python3 package.py

# TypeScript typechecking
./node_modules/.bin/tsc --noEmit

# Run verification test suite
node --experimental-strip-types scripts/verify-routes.ts
node --experimental-strip-types scripts/verify-ui-capabilities.ts
node --experimental-strip-types scripts/verify-coldstart.ts
node --experimental-strip-types scripts/verify-auth.ts
node --experimental-strip-types scripts/verify-storage-safety.ts
node --experimental-strip-types scripts/verify-migration.ts
node --experimental-strip-types scripts/verify-lifecycle.ts
node --experimental-strip-types scripts/verify-planner.ts
node --experimental-strip-types scripts/verify-executor.ts
node --experimental-strip-types scripts/verify-execution-safety.ts
node --experimental-strip-types scripts/verify-discovery.ts
node --experimental-strip-types scripts/verify-catalog.ts
node --experimental-strip-types scripts/verify-resume.ts
node --experimental-strip-types scripts/verify-certificates.ts
node --experimental-strip-types scripts/verify-acceptance.ts
node --experimental-strip-types scripts/verify-iam-policy.ts
node --experimental-strip-types scripts/verify-teardown.ts
node --experimental-strip-types scripts/verify-cep.ts
```

---

## 3. UI Design System & Component Guidelines

When modifying the Secure Gateway Studio UI (`extension/src/ui/`):

1. **Design Tokens**:
   - Use CSS Custom Properties defined in `:root` (`--primary`, `--surface`, `--border`, `--text`, `--success`, `--warning`, `--danger`).
   - Aligned with Google Cloud and Material 3 design philosophy.

2. **Buttons & Controls**:
   - Strictly follow the unified `.btn` hierarchy:
     - `.btn-primary`: Primary calls to action.
     - `.btn-secondary`: Standard secondary actions.
     - `.btn-danger`: Destructive actions.
     - `.btn-link`: Inline text actions.
     - `.btn-sm`: Compact buttons in dense lists/tables.
   - Maintain consistent padding, heights, hover transitions, and focus rings.

3. **Code & Terminal Blocks**:
   - Use dark slate terminal theme (`#161b22`, border `#30363d`, font "IBM Plex Mono", text `#e6edf3` / `#a5d6ff`).

4. **Manifest V3 CSP Strict Compliance**:
   - Chrome Extension Manifest V3 strictly enforces `style-src 'self'`.
   - **CRITICAL**: Never use inline `style={{ ... }}` attributes in JSX components. All styles must be declared via CSS classes in `src/ui/app.css`.

---

## 4. UI Polish & Design Engineering (`make-interfaces-feel-better`)

The skill `.agents/skills/make-interfaces-feel-better` is installed for this repository.
When building, modifying, or reviewing UI components, adopt its tactile polish principles while respecting project constraints:

1. **Tabular Numbers**: Apply `font-variant-numeric: tabular-nums` (or class `.tabular-nums`) to metrics, IPs, ports, and countdowns to prevent layout shift.
2. **Button Feedback**: Apply subtle tactile feedback (`scale(0.96)`) on `.btn:active` without external JS animation dependencies.
3. **Hit Areas**: Maintain at least 40×40px interactive hit area for buttons and icons in the extension popover and options panels.
4. **Transition Restraint**: Never use `transition: all`. Specify exact properties (`transform`, `opacity`, `background-color`, `border-color`) with duration ≤150ms.
5. **Concentric Radii**: Maintain outer/inner radius alignment (`outerRadius = innerRadius + padding`) on nested cards and badge containers.
6. **CSP Compliance**: Implement all visual polish directly in `src/ui/app.css`. Never use inline styles or external animation frameworks.

