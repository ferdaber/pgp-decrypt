# PGP Decrypt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a localhost-only React web app at `http://localhost:5173` that encrypts and decrypts PGP messages with labeled-key storage in localStorage.

**Architecture:** Single-page Vite app, two split panes (Decrypt left, Encrypt right). All PGP via openpgp.js v6, encapsulated in `pgp.ts`. All persistence via a single localStorage key, encapsulated in `keystore.ts`. A small React hook layer (`useKeystore`, `useToast`) connects pure modules to components. No router, no state library, no tests.

**Tech Stack:** React 19, TypeScript, Vite 5, openpgp.js 6, plain CSS.

**Spec:** [`docs/superpowers/specs/2026-05-10-pgp-decrypt-design.md`](../specs/2026-05-10-pgp-decrypt-design.md)

**Testing note:** The spec is explicit — no unit tests are written. Each task is verified by running `npx tsc --noEmit` and a manual browser smoke test using `npm run dev`.

**Deviation from spec:** The spec lists `useToast.ts`, but the file exports a React provider that returns JSX, so it is named `useToast.tsx`. No other file names change.

---

## File map

| File | Purpose | Task |
|------|---------|------|
| `package.json` | dependencies, scripts | 1 |
| `tsconfig.json` | TS strict, react-jsx | 1 |
| `vite.config.ts` | dev server on port 5173 | 1 |
| `index.html` | Vite entry | 1 |
| `src/main.tsx` | React root | 1 |
| `src/theme.css` | dark tokens, layout, all component styles | 1 |
| `src/App.tsx` | two-pane shell + ToastProvider + ToastHost | 12 |
| `src/types.ts` | `SavedKey`, `KeyType`, error classes, `NEW_KEY` constant | 2 |
| `src/keystore.ts` | localStorage CRUD (pure functions) | 3 |
| `src/useKeystore.ts` | React hook wrapping `keystore.ts` | 4 |
| `src/pgp.ts` | openpgp.js v6 wrapper, throws typed errors | 5 |
| `src/useToast.tsx` | ToastContext, ToastProvider, useToast hook | 6 |
| `src/components/Toast.tsx` | `ToastHost` renderer | 6 |
| `src/components/KeyDropdown.tsx` | custom dropdown w/ hover-× delete | 7 |
| `src/components/SaveKeyControl.tsx` | checkbox + label field | 8 |
| `src/components/OutputBlock.tsx` | read-only textarea + Copy button | 9 |
| `src/components/DecryptPane.tsx` | left pane | 10 |
| `src/components/EncryptPane.tsx` | right pane | 11 |

---

## Task 1: Scaffold Vite + React + TS project on port 5173

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx` (stub — replaced fully in Task 12)
- Create: `src/theme.css`

The project directory is non-empty (existing spec, plan, `.gitignore`, `.superpowers/`). Do **not** run `npm create vite@latest .` — it will either prompt or scrub. All scaffold files are written manually below.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "pgp-decrypt",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "openpgp": "^6.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "useDefineForClassFields": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Create `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
  },
});
```

- [ ] **Step 5: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>PGP Decrypt</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './theme.css';

const root = document.getElementById('root');
if (!root) throw new Error('root element missing');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 7: Create `src/App.tsx` (stub — replaced in Task 12)**

```tsx
export function App() {
  return <div style={{ padding: 16 }}>scaffolding ok</div>;
}
```

- [ ] **Step 8: Create `src/theme.css` (full styles)**

```css
:root {
  --bg: #1a1a1a;
  --bg-elev: #252525;
  --bg-input: #1f1f1f;
  --border: #3a3a3a;
  --border-focus: #6ea8ff;
  --text: #e8e8e8;
  --text-dim: #9a9a9a;
  --accent: #6ea8ff;
  --accent-fg: #0a0a0a;
  --danger: #ff6b6b;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}

* { box-sizing: border-box; }

html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 13px;
}

button, input, textarea, select {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
}

.app {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: 100vh;
  padding: 16px;
}

.pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 14px;
  min-height: 0;
  overflow: hidden;
}

.pane-title {
  margin: 0 0 4px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-dim);
}

.message-input,
.key-input,
.output-textarea {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 8px 10px;
  color: var(--text);
  resize: none;
  width: 100%;
  outline: none;
}

.message-input:focus,
.key-input:focus,
.passphrase-input:focus,
.dropdown-trigger:focus,
.save-control-label:focus,
.output-textarea:focus {
  border-color: var(--border-focus);
}

.message-input { flex: 1 1 0; min-height: 140px; }
.key-input { height: 110px; }

.key-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.passphrase-input {
  flex: 1;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 6px 10px;
  color: var(--text);
  outline: none;
  min-width: 0;
}

.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.submit-button {
  background: var(--accent);
  color: var(--accent-fg);
  border: none;
  border-radius: 4px;
  padding: 8px 18px;
  cursor: pointer;
  font-weight: 600;
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.save-control {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-dim);
}

.save-control-label {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 8px;
  color: var(--text);
  outline: none;
  width: 160px;
}

/* Dropdown */
.dropdown {
  position: relative;
  flex: 1;
  min-width: 0;
}

.dropdown-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 6px 10px;
  color: var(--text);
  cursor: pointer;
  text-align: left;
}

.dropdown-caret {
  color: var(--text-dim);
  margin-left: 8px;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 4px;
  z-index: 10;
  max-height: 240px;
  overflow-y: auto;
}

.dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  cursor: pointer;
}

.dropdown-item:hover { background: rgba(110, 168, 255, 0.1); }
.dropdown-item.is-selected { color: var(--accent); }

.dropdown-item-delete {
  background: transparent;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0 4px;
  opacity: 0;
}

.dropdown-item:hover .dropdown-item-delete { opacity: 1; }
.dropdown-item-delete:hover { color: var(--danger); }

/* Output block */
.output-block {
  position: relative;
  margin-top: 4px;
}

.output-textarea {
  width: 100%;
  min-height: 100px;
  padding-right: 64px;
}

.output-copy {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--bg-elev);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 12px;
}

.output-copy:hover { border-color: var(--accent); }

/* Toast */
.toast-host {
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
}

.toast {
  padding: 10px 14px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--bg-elev);
  color: var(--text);
  cursor: pointer;
  min-width: 200px;
  max-width: 320px;
}

.toast--info  { border-color: var(--accent); }
.toast--error { border-color: var(--danger); color: var(--danger); }
```

- [ ] **Step 9: Install dependencies**

Run: `npm install`
Expected: completes without errors. `node_modules/` is created and `package-lock.json` is written.

- [ ] **Step 10: Verify dev server starts on port 5173**

Run: `npm run dev`
Expected output (similar):
```
  VITE v5.x.x  ready in NNN ms
  ➜  Local:   http://localhost:5173/
```

Open `http://localhost:5173` in a browser. Expected: dark background, monospace "scaffolding ok" text. Stop the server with `Ctrl+C`.

If port 5173 is in use, the run will fail (due to `strictPort: true`). Free the port and re-run. Note: port was changed from 6666 (Chrome/Tor unsafe-port blocklist, IRC range 6660–6669) to 5173 (Vite default, universally allowed).

- [ ] **Step 11: Verify type-check passes**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 12: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts index.html src/main.tsx src/App.tsx src/theme.css
git commit -m "feat: scaffold Vite + React 19 + TS project on port 5173"
```

---

## Task 2: Types module

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write `src/types.ts`**

```ts
export type KeyType = 'private' | 'public';

export interface SavedKey {
  id: string;
  type: KeyType;
  label: string;
  value: string;
  passphrase?: string;
  createdAt: number;
}

export interface KeystoreState {
  version: 1;
  keys: SavedKey[];
}

export const NEW_KEY = '__NEW__' as const;
export type NewKey = typeof NEW_KEY;

export class MalformedKeyError extends Error {
  constructor() { super('MalformedKey'); this.name = 'MalformedKeyError'; }
}

export class MalformedMessageError extends Error {
  constructor() { super('MalformedMessage'); this.name = 'MalformedMessageError'; }
}

export class BadPassphraseError extends Error {
  constructor() { super('BadPassphrase'); this.name = 'BadPassphraseError'; }
}

export class DecryptError extends Error {
  constructor() { super('DecryptFailed'); this.name = 'DecryptError'; }
}

export class EncryptError extends Error {
  constructor() { super('EncryptFailed'); this.name = 'EncryptError'; }
}

export class DuplicateLabelError extends Error {
  constructor() { super('DuplicateLabel'); this.name = 'DuplicateLabelError'; }
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add core types and error classes"
```

---

## Task 3: Keystore module (pure localStorage CRUD)

**Files:**
- Create: `src/keystore.ts`

This file is the only one that touches `localStorage`. All functions are pure (apart from `load`/`save` which read/write storage). State is passed in, new state is returned.

- [ ] **Step 1: Write `src/keystore.ts`**

```ts
import {
  DuplicateLabelError,
  type KeyType,
  type KeystoreState,
  type SavedKey,
} from './types';

const STORAGE_KEY = 'pgp-decrypt:keystore:v1';

const emptyState = (): KeystoreState => ({ version: 1, keys: [] });

export function load(): KeystoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      (parsed as { version?: unknown }).version !== 1 ||
      !Array.isArray((parsed as { keys?: unknown }).keys)
    ) {
      return emptyState();
    }
    return parsed as KeystoreState;
  } catch {
    return emptyState();
  }
}

export function save(state: KeystoreState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function add(
  state: KeystoreState,
  input: { type: KeyType; label: string; value: string; passphrase?: string },
): { state: KeystoreState; key: SavedKey } {
  const exists = state.keys.some(
    (k) => k.type === input.type && k.label === input.label,
  );
  if (exists) throw new DuplicateLabelError();

  const key: SavedKey = {
    id: crypto.randomUUID(),
    type: input.type,
    label: input.label,
    value: input.value,
    passphrase: input.type === 'private' ? (input.passphrase ?? '') : undefined,
    createdAt: Date.now(),
  };
  return { state: { ...state, keys: [...state.keys, key] }, key };
}

export function remove(state: KeystoreState, id: string): KeystoreState {
  return { ...state, keys: state.keys.filter((k) => k.id !== id) };
}

export function listByType(state: KeystoreState, type: KeyType): SavedKey[] {
  return state.keys
    .filter((k) => k.type === type)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function defaultFor(
  state: KeystoreState,
  type: KeyType,
): SavedKey | null {
  return listByType(state, type)[0] ?? null;
}

export function getById(state: KeystoreState, id: string): SavedKey | null {
  return state.keys.find((k) => k.id === id) ?? null;
}
```

Note: `add` returns both the new state and the newly created `SavedKey` so callers (the React hook) can immediately reference the new `id` for setting `selectedKeyId` on save-on-success.

- [ ] **Step 2: Verify type-check passes**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/keystore.ts
git commit -m "feat: add localStorage-backed keystore module"
```

---

## Task 4: useKeystore hook

**Files:**
- Create: `src/useKeystore.ts`

A React hook that subscribes to keystore changes. It owns a state copy and persists writes back through `keystore.save`.

- [ ] **Step 1: Write `src/useKeystore.ts`**

```ts
import { useCallback, useEffect, useState } from 'react';
import * as keystore from './keystore';
import type { KeyType, KeystoreState, SavedKey } from './types';

const STORAGE_KEY = 'pgp-decrypt:keystore:v1';

export function useKeystore() {
  const [state, setState] = useState<KeystoreState>(() => keystore.load());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === STORAGE_KEY) {
        setState(keystore.load());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback(
    (input: { type: KeyType; label: string; value: string; passphrase?: string }): SavedKey => {
      const { state: next, key } = keystore.add(state, input);
      keystore.save(next);
      setState(next);
      return key;
    },
    [state],
  );

  const remove = useCallback(
    (id: string) => {
      const next = keystore.remove(state, id);
      keystore.save(next);
      setState(next);
    },
    [state],
  );

  const listByType = useCallback(
    (type: KeyType): SavedKey[] => keystore.listByType(state, type),
    [state],
  );

  const defaultFor = useCallback(
    (type: KeyType): SavedKey | null => keystore.defaultFor(state, type),
    [state],
  );

  const getById = useCallback(
    (id: string): SavedKey | null => keystore.getById(state, id),
    [state],
  );

  return { add, remove, listByType, defaultFor, getById };
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/useKeystore.ts
git commit -m "feat: add useKeystore React hook"
```

---

## Task 5: PGP wrapper (openpgp.js v6)

**Files:**
- Create: `src/pgp.ts`

The only file that imports `openpgp`. Exposes two async functions and translates every failure into one of the typed error classes from `types.ts`.

- [ ] **Step 1: Write `src/pgp.ts`**

```ts
import {
  readKey,
  readPrivateKey,
  decryptKey,
  encrypt,
  decrypt,
  createMessage,
  readMessage,
  type PrivateKey,
} from 'openpgp';

import {
  BadPassphraseError,
  DecryptError,
  EncryptError,
  MalformedKeyError,
  MalformedMessageError,
} from './types';

export async function encryptText({
  plaintext,
  publicKeyArmored,
}: {
  plaintext: string;
  publicKeyArmored: string;
}): Promise<string> {
  let publicKey;
  try {
    publicKey = await readKey({ armoredKey: publicKeyArmored });
  } catch {
    throw new MalformedKeyError();
  }

  try {
    const message = await createMessage({ text: plaintext });
    const armored = await encrypt({ message, encryptionKeys: publicKey });
    return armored as string;
  } catch {
    throw new EncryptError();
  }
}

export async function decryptText({
  ciphertext,
  privateKeyArmored,
  passphrase,
}: {
  ciphertext: string;
  privateKeyArmored: string;
  passphrase: string;
}): Promise<string> {
  let privateKey: PrivateKey;
  try {
    privateKey = await readPrivateKey({ armoredKey: privateKeyArmored });
  } catch {
    throw new MalformedKeyError();
  }

  let unlocked: PrivateKey;
  if (privateKey.isDecrypted()) {
    unlocked = privateKey;
  } else {
    try {
      unlocked = await decryptKey({ privateKey, passphrase });
    } catch {
      throw new BadPassphraseError();
    }
  }

  let message;
  try {
    message = await readMessage({ armoredMessage: ciphertext });
  } catch {
    throw new MalformedMessageError();
  }

  try {
    const { data } = await decrypt({ message, decryptionKeys: unlocked });
    return data as string;
  } catch {
    throw new DecryptError();
  }
}
```

Why the `isDecrypted()` check: an unprotected private key has no passphrase. Calling `decryptKey` on it would throw "Key is already decrypted" — we skip it.

- [ ] **Step 2: Verify type-check passes**

Run: `npm run typecheck`
Expected: no output, exit code 0.

If TypeScript complains about missing types for `openpgp`, the installed `openpgp` v6 ships its own `.d.ts` — no separate `@types` package is needed. If errors mention `Buffer` or `process`, double-check that `tsconfig.json`'s `lib` includes `DOM` (it does in Task 1).

- [ ] **Step 3: Commit**

```bash
git add src/pgp.ts
git commit -m "feat: add openpgp.js wrapper with typed errors"
```

---

## Task 6: Toast system (context + hook + host)

**Files:**
- Create: `src/useToast.tsx`
- Create: `src/components/Toast.tsx`

- [ ] **Step 1: Create the components directory**

Run: `mkdir -p src/components`

- [ ] **Step 2: Write `src/useToast.tsx`**

```tsx
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type ToastVariant = 'info' | 'error';

export interface Toast {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastApi {
  info: (message: string) => void;
  error: (message: string) => void;
  toasts: Toast[];
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TOAST_TTL_MS = 3000;
const MAX_VISIBLE = 3;

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((variant: ToastVariant, message: string) => {
    const id = nextId++;
    setToasts((curr) => [...curr.slice(-(MAX_VISIBLE - 1)), { id, variant, message }]);
    setTimeout(() => {
      setToasts((curr) => curr.filter((t) => t.id !== id));
    }, TOAST_TTL_MS);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((curr) => curr.filter((t) => t.id !== id));
  }, []);

  const info = useCallback((msg: string) => push('info', msg), [push]);
  const error = useCallback((msg: string) => push('error', msg), [push]);

  const api: ToastApi = { info, error, toasts, dismiss };

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
```

- [ ] **Step 3: Write `src/components/Toast.tsx`**

```tsx
import { useToast } from '../useToast';

export function ToastHost() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.variant}`}
          onClick={() => dismiss(t.id)}
          role="status"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Verify type-check passes**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/useToast.tsx src/components/Toast.tsx
git commit -m "feat: add toast context, hook, and host renderer"
```

---

## Task 7: KeyDropdown component

**Files:**
- Create: `src/components/KeyDropdown.tsx`

Native `<select>` cannot render per-item delete buttons or hover states, so this is a custom dropdown. Saved entries are displayed in the order passed in (the caller sorts). A `— New key —` sentinel always appears at the bottom.

- [ ] **Step 1: Write `src/components/KeyDropdown.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import { NEW_KEY, type NewKey, type SavedKey } from '../types';

interface Props {
  keys: SavedKey[];
  selectedId: string | NewKey;
  onSelect: (id: string | NewKey) => void;
  onDelete: (id: string) => void;
}

export function KeyDropdown({ keys, selectedId, onSelect, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  const selectedLabel =
    selectedId === NEW_KEY
      ? '— New key —'
      : (keys.find((k) => k.id === selectedId)?.label ?? '— New key —');

  const handleDeleteClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
    label: string,
  ) => {
    e.stopPropagation();
    if (window.confirm(`Delete saved key "${label}"?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="dropdown" ref={rootRef}>
      <button
        type="button"
        className="dropdown-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selectedLabel}</span>
        <span className="dropdown-caret">▾</span>
      </button>
      {open && (
        <ul className="dropdown-menu" role="listbox">
          {keys.map((k) => (
            <li
              key={k.id}
              className={`dropdown-item ${k.id === selectedId ? 'is-selected' : ''}`}
              onClick={() => {
                onSelect(k.id);
                setOpen(false);
              }}
              role="option"
              aria-selected={k.id === selectedId}
            >
              <span className="dropdown-item-label">{k.label}</span>
              <button
                type="button"
                className="dropdown-item-delete"
                onClick={(e) => handleDeleteClick(e, k.id, k.label)}
                aria-label={`Delete ${k.label}`}
              >
                ×
              </button>
            </li>
          ))}
          <li
            className={`dropdown-item ${selectedId === NEW_KEY ? 'is-selected' : ''}`}
            onClick={() => {
              onSelect(NEW_KEY);
              setOpen(false);
            }}
            role="option"
            aria-selected={selectedId === NEW_KEY}
          >
            <span className="dropdown-item-label">— New key —</span>
          </li>
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/KeyDropdown.tsx
git commit -m "feat: add KeyDropdown with hover-delete on saved entries"
```

---

## Task 8: SaveKeyControl component

**Files:**
- Create: `src/components/SaveKeyControl.tsx`

A controlled checkbox + label-text-input pair. Rendered only when the parent pane's dropdown is set to `NEW_KEY`.

- [ ] **Step 1: Write `src/components/SaveKeyControl.tsx`**

```tsx
interface Props {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
  onLabelChange: (label: string) => void;
}

export function SaveKeyControl({
  checked,
  label,
  onCheckedChange,
  onLabelChange,
}: Props) {
  return (
    <label className="save-control">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <span>Save this key as</span>
      <input
        type="text"
        className="save-control-label"
        placeholder="label"
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
      />
    </label>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/SaveKeyControl.tsx
git commit -m "feat: add SaveKeyControl checkbox + label input"
```

---

## Task 9: OutputBlock component

**Files:**
- Create: `src/components/OutputBlock.tsx`

A read-only `<textarea>` with a Copy button anchored in the top-right. The textarea has `readOnly` only — no custom click handler, so clicks place the cursor naturally without auto-selecting all.

- [ ] **Step 1: Write `src/components/OutputBlock.tsx`**

```tsx
import { useToast } from '../useToast';

interface Props {
  value: string;
}

export function OutputBlock({ value }: Props) {
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.info('Copied');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="output-block">
      <button type="button" className="output-copy" onClick={handleCopy}>
        Copy
      </button>
      <textarea
        className="output-textarea"
        value={value}
        readOnly
        rows={6}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/OutputBlock.tsx
git commit -m "feat: add OutputBlock with Copy button"
```

---

## Task 10: DecryptPane

**Files:**
- Create: `src/components/DecryptPane.tsx`

The left pane. Composes all the smaller pieces, owns pane-local state, runs `decryptText`, and handles the save-on-success path.

- [ ] **Step 1: Write `src/components/DecryptPane.tsx`**

```tsx
import { useState, type KeyboardEvent } from 'react';
import {
  BadPassphraseError,
  DecryptError,
  DuplicateLabelError,
  MalformedKeyError,
  MalformedMessageError,
  NEW_KEY,
  type NewKey,
} from '../types';
import { decryptText } from '../pgp';
import { useKeystore } from '../useKeystore';
import { useToast } from '../useToast';
import { KeyDropdown } from './KeyDropdown';
import { SaveKeyControl } from './SaveKeyControl';
import { OutputBlock } from './OutputBlock';

export function DecryptPane() {
  const ks = useKeystore();
  const toast = useToast();
  const savedKeys = ks.listByType('private');
  const initial = ks.defaultFor('private');

  const [selectedKeyId, setSelectedKeyId] = useState<string | NewKey>(
    initial?.id ?? NEW_KEY,
  );
  const [message, setMessage] = useState('');
  const [keyText, setKeyText] = useState(initial?.value ?? '');
  const [passphrase, setPassphrase] = useState(initial?.passphrase ?? '');
  const [saveChecked, setSaveChecked] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSelect = (id: string | NewKey) => {
    setSelectedKeyId(id);
    if (id === NEW_KEY) {
      setKeyText('');
      setPassphrase('');
      setSaveChecked(false);
      setSaveLabel('');
    } else {
      const k = ks.getById(id);
      if (k) {
        setKeyText(k.value);
        setPassphrase(k.passphrase ?? '');
      }
    }
  };

  const handleDelete = (id: string) => {
    ks.remove(id);
    if (selectedKeyId === id) {
      setSelectedKeyId(NEW_KEY);
      setKeyText('');
      setPassphrase('');
      setSaveChecked(false);
      setSaveLabel('');
    }
  };

  const submit = async () => {
    if (busy) return;
    const trimmedMessage = message.trim();
    const trimmedKey = keyText.trim();
    const trimmedPass = passphrase.trim();
    const trimmedLabel = saveLabel.trim();
    if (!trimmedMessage || !trimmedKey) return;

    setBusy(true);
    try {
      const plaintext = await decryptText({
        ciphertext: trimmedMessage,
        privateKeyArmored: trimmedKey,
        passphrase: trimmedPass,
      });
      setOutput(plaintext);

      if (selectedKeyId === NEW_KEY && saveChecked && trimmedLabel) {
        try {
          const added = ks.add({
            type: 'private',
            label: trimmedLabel,
            value: trimmedKey,
            passphrase: trimmedPass,
          });
          setSelectedKeyId(added.id);
          setSaveChecked(false);
          setSaveLabel('');
        } catch (e) {
          if (e instanceof DuplicateLabelError) {
            toast.error('Label already exists');
          } else {
            throw e;
          }
        }
      }
    } catch (e) {
      if (e instanceof MalformedKeyError) toast.error('Invalid key format');
      else if (e instanceof MalformedMessageError) toast.error('Invalid PGP message');
      else if (e instanceof BadPassphraseError) toast.error('Wrong passphrase');
      else if (e instanceof DecryptError) toast.error('Decryption failed');
      else toast.error('Decryption failed');
    } finally {
      setBusy(false);
    }
  };

  const onMessageKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !e.altKey &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
      void submit();
    }
  };

  const canSubmit =
    message.trim().length > 0 && keyText.trim().length > 0 && !busy;

  return (
    <section className="pane">
      <h2 className="pane-title">Decrypt</h2>
      <textarea
        className="message-input"
        placeholder="Paste encrypted PGP message…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={onMessageKeyDown}
      />
      <div className="key-row">
        <KeyDropdown
          keys={savedKeys}
          selectedId={selectedKeyId}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
        <input
          type="password"
          className="passphrase-input"
          placeholder="Passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
        />
      </div>
      <textarea
        className="key-input"
        placeholder="Private key (armored)"
        value={keyText}
        onChange={(e) => setKeyText(e.target.value)}
      />
      <div className="action-row">
        {selectedKeyId === NEW_KEY ? (
          <SaveKeyControl
            checked={saveChecked}
            label={saveLabel}
            onCheckedChange={setSaveChecked}
            onLabelChange={setSaveLabel}
          />
        ) : (
          <span />
        )}
        <button
          type="button"
          className="submit-button"
          onClick={submit}
          disabled={!canSubmit}
        >
          {busy ? 'Decrypting…' : 'Decrypt'}
        </button>
      </div>
      {output !== null && <OutputBlock value={output} />}
    </section>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/DecryptPane.tsx
git commit -m "feat: add DecryptPane with key picker, save-on-success, Enter-to-submit"
```

---

## Task 11: EncryptPane

**Files:**
- Create: `src/components/EncryptPane.tsx`

Mirror of `DecryptPane` for the right side. Differences: no passphrase, key textarea is the recipient public key, action is `encryptText`, dropdown filters `'public'`. The `.key-row` contains only the dropdown (which fills the row via `flex: 1`).

- [ ] **Step 1: Write `src/components/EncryptPane.tsx`**

```tsx
import { useState, type KeyboardEvent } from 'react';
import {
  DuplicateLabelError,
  EncryptError,
  MalformedKeyError,
  NEW_KEY,
  type NewKey,
} from '../types';
import { encryptText } from '../pgp';
import { useKeystore } from '../useKeystore';
import { useToast } from '../useToast';
import { KeyDropdown } from './KeyDropdown';
import { SaveKeyControl } from './SaveKeyControl';
import { OutputBlock } from './OutputBlock';

export function EncryptPane() {
  const ks = useKeystore();
  const toast = useToast();
  const savedKeys = ks.listByType('public');
  const initial = ks.defaultFor('public');

  const [selectedKeyId, setSelectedKeyId] = useState<string | NewKey>(
    initial?.id ?? NEW_KEY,
  );
  const [message, setMessage] = useState('');
  const [keyText, setKeyText] = useState(initial?.value ?? '');
  const [saveChecked, setSaveChecked] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSelect = (id: string | NewKey) => {
    setSelectedKeyId(id);
    if (id === NEW_KEY) {
      setKeyText('');
      setSaveChecked(false);
      setSaveLabel('');
    } else {
      const k = ks.getById(id);
      if (k) setKeyText(k.value);
    }
  };

  const handleDelete = (id: string) => {
    ks.remove(id);
    if (selectedKeyId === id) {
      setSelectedKeyId(NEW_KEY);
      setKeyText('');
      setSaveChecked(false);
      setSaveLabel('');
    }
  };

  const submit = async () => {
    if (busy) return;
    const trimmedMessage = message.trim();
    const trimmedKey = keyText.trim();
    const trimmedLabel = saveLabel.trim();
    if (!trimmedMessage || !trimmedKey) return;

    setBusy(true);
    try {
      const ciphertext = await encryptText({
        plaintext: trimmedMessage,
        publicKeyArmored: trimmedKey,
      });
      setOutput(ciphertext);

      if (selectedKeyId === NEW_KEY && saveChecked && trimmedLabel) {
        try {
          const added = ks.add({
            type: 'public',
            label: trimmedLabel,
            value: trimmedKey,
          });
          setSelectedKeyId(added.id);
          setSaveChecked(false);
          setSaveLabel('');
        } catch (e) {
          if (e instanceof DuplicateLabelError) {
            toast.error('Label already exists');
          } else {
            throw e;
          }
        }
      }
    } catch (e) {
      if (e instanceof MalformedKeyError) toast.error('Invalid key format');
      else if (e instanceof EncryptError) toast.error('Encryption failed');
      else toast.error('Encryption failed');
    } finally {
      setBusy(false);
    }
  };

  const onMessageKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !e.altKey &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
      void submit();
    }
  };

  const canSubmit =
    message.trim().length > 0 && keyText.trim().length > 0 && !busy;

  return (
    <section className="pane">
      <h2 className="pane-title">Encrypt</h2>
      <textarea
        className="message-input"
        placeholder="Plaintext to encrypt…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={onMessageKeyDown}
      />
      <div className="key-row">
        <KeyDropdown
          keys={savedKeys}
          selectedId={selectedKeyId}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      </div>
      <textarea
        className="key-input"
        placeholder="Recipient public key (armored)"
        value={keyText}
        onChange={(e) => setKeyText(e.target.value)}
      />
      <div className="action-row">
        {selectedKeyId === NEW_KEY ? (
          <SaveKeyControl
            checked={saveChecked}
            label={saveLabel}
            onCheckedChange={setSaveChecked}
            onLabelChange={setSaveLabel}
          />
        ) : (
          <span />
        )}
        <button
          type="button"
          className="submit-button"
          onClick={submit}
          disabled={!canSubmit}
        >
          {busy ? 'Encrypting…' : 'Encrypt'}
        </button>
      </div>
      {output !== null && <OutputBlock value={output} />}
    </section>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/EncryptPane.tsx
git commit -m "feat: add EncryptPane"
```

---

## Task 12: Wire everything in App.tsx

**Files:**
- Modify: `src/App.tsx` (replace stub from Task 1)

- [ ] **Step 1: Replace `src/App.tsx`**

```tsx
import { DecryptPane } from './components/DecryptPane';
import { EncryptPane } from './components/EncryptPane';
import { ToastHost } from './components/Toast';
import { ToastProvider } from './useToast';

export function App() {
  return (
    <ToastProvider>
      <div className="app">
        <DecryptPane />
        <EncryptPane />
      </div>
      <ToastHost />
    </ToastProvider>
  );
}
```

`ToastHost` is rendered outside `.app` so its `position: fixed` host doesn't get clipped by the grid container.

- [ ] **Step 2: Verify type-check passes**

Run: `npm run typecheck`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire decrypt and encrypt panes into App shell"
```

---

## Task 13: Manual smoke test

No tests are written; instead, run through this checklist in the browser. Use any spare PGP keypair (or generate one with `gpg --gen-key` outside the project, then export public/private with `gpg --armor --export <id>` / `gpg --armor --export-secret-keys <id>`).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server starts on `http://localhost:5173`. Open it in Chrome.

- [ ] **Step 2: Verify layout**

- Two panes side-by-side, equal width.
- Left pane labeled "Decrypt", right pane labeled "Encrypt".
- Dark background, monospace font throughout.
- Both dropdowns initially show "— New key —" (no saved keys yet).
- Decrypt pane shows passphrase field next to dropdown; Encrypt pane shows only the dropdown in the key row.
- "Save this key as [label]" control is visible at the bottom-left of each pane (since both dropdowns are on `— New key —`).
- Submit buttons are disabled (no message or key entered).

- [ ] **Step 3: Encrypt → Decrypt round-trip with save**

1. In the Encrypt pane: paste a recipient public key into the key textarea.
2. Check "Save this key as", enter label `alice`.
3. Type a plaintext message into the message textarea.
4. Press Enter (without Shift). Verify: message is encrypted, output appears below with a Copy button, dropdown switches to `alice`, save-control disappears.
5. Click Copy on the encrypted output. Verify: a "Copied" toast appears bottom-right; clicking the toast dismisses it; the toast auto-dismisses after 3s if untouched.
6. Paste the encrypted output into the Decrypt pane's message textarea.
7. In the Decrypt pane: paste the matching private key into the key textarea, type the passphrase (masked), check "Save this key as", label `me`.
8. Click Decrypt. Verify: decrypted plaintext matches the original; dropdown switches to `me`.

- [ ] **Step 4: Persistence & ordering**

1. Reload the page.
2. Verify: Decrypt dropdown defaults to `me`, with its key and passphrase prefilled; Encrypt dropdown defaults to `alice`, with its key prefilled.
3. Add a second public key with label `bob` via the New-key flow in the Encrypt pane.
4. Reload. Verify: Encrypt dropdown defaults to `bob` (newest). Open the dropdown — order is `bob`, then `alice`, then `— New key —`.

- [ ] **Step 5: Delete a saved key**

1. Open the Encrypt dropdown, hover over `alice`. Verify: an `×` appears on the right of the row.
2. Click the `×`. Verify: native confirm dialog appears with `Delete saved key "alice"?`. Confirm.
3. Verify: `alice` is gone from the dropdown.
4. Reload — `alice` is still gone (persisted).

- [ ] **Step 6: Error toasts**

1. In Decrypt: select `— New key —`, paste a private key, type a wrong passphrase, paste a valid ciphertext, click Decrypt. Verify: red "Wrong passphrase" toast.
2. In Decrypt: paste garbage into the key textarea, click Decrypt. Verify: red "Invalid key format" toast.
3. In Decrypt: paste a valid private key + correct passphrase but garbage in the message textarea, click Decrypt. Verify: red "Invalid PGP message" toast.
4. In Encrypt: paste garbage into the key textarea, type a message, click Encrypt. Verify: red "Invalid key format" toast.
5. In Encrypt: select `— New key —`, paste a valid public key, check Save with label `bob` (already exists), encrypt. Verify: encryption succeeds (output appears) AND red "Label already exists" toast.

- [ ] **Step 7: Keyboard and UX details**

1. In the Decrypt message textarea: Shift+Enter inserts a newline (does not submit).
2. In the Decrypt message textarea: Enter submits.
3. Click anywhere inside the OutputBlock textarea. Verify: cursor is placed at the click position; text is NOT auto-selected.
4. Trim behavior: paste a message with surrounding whitespace and a key with surrounding whitespace, encrypt/decrypt. Verify: it works (trim happens before openpgp sees the inputs).

- [ ] **Step 8: Tor Browser sanity check (optional but recommended)**

Open `http://localhost:5173` in Tor Browser at default security level. Verify: app loads, encrypt/decrypt round-trip works, Copy button copies (the user gesture satisfies clipboard permission).

- [ ] **Step 9: No commit needed**

This task only verifies behavior; nothing changed in the repo.

---

## Done criteria

- `npm run dev` serves the app on `http://localhost:5173`.
- `npm run typecheck` is clean.
- All Task 13 checklist items pass in Chrome.
- All commits made; `git status` is clean.
