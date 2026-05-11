# PGP Decrypt — Design

**Date:** 2026-05-10
**Status:** Approved

## Goal

A local web application served on `http://localhost:5173` that encrypts and decrypts PGP messages. Personal tool, single user, localhost only. Supports Chrome and Tor Browser.

(Originally specced for port 6666, but Chrome and Tor Browser block that port via their hard-coded unsafe-port list — the entire IRC range 6660–6669. 5173 is Vite's default dev port and is universally allowed.)

## Tech stack

- React 19 + TypeScript
- Vite (dev server only — no production build pipeline is needed for this tool)
- openpgp.js v6 — sole PGP implementation
- Plain CSS (one file) — no Tailwind, no CSS-in-JS
- localStorage for persistence
- No router, no state library, no test framework

## Scaffolding note

The project directory is non-empty (this spec, `.gitignore`, `.superpowers/`), so `npm create vite@latest .` would either prompt or scrub files. Instead the project is **scaffolded manually**: create `package.json`, `vite.config.ts`, `index.html`, `tsconfig.json`, and `src/main.tsx` directly. The Vite React template's demo content (logos, counter, App.css) would be deleted anyway.

## Layout

Single page, single dark theme, desktop-only (14" MacBook Pro target). Two equal panes side-by-side:

- **Left pane: Decrypt**
- **Right pane: Encrypt**

CSS layout for `App`:

```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 16px;
height: 100vh;
padding: 16px;
```

No responsive breakpoints. Global monospace font: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`.

## File layout

```
pgp-decrypt/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .gitignore
└── src/
    ├── main.tsx
    ├── App.tsx                   # Two-pane shell + ToastHost
    ├── theme.css                 # Tokens, monospace, layout
    ├── pgp.ts                    # openpgp.js wrapper (only file importing openpgp)
    ├── keystore.ts               # localStorage CRUD (only file touching localStorage)
    ├── useKeystore.ts            # React hook over keystore.ts
    ├── useToast.ts               # Toast queue hook
    ├── types.ts                  # SavedKey, KeyType, error classes
    └── components/
        ├── DecryptPane.tsx
        ├── EncryptPane.tsx
        ├── KeyDropdown.tsx       # Dropdown w/ inline × delete on hover
        ├── SaveKeyControl.tsx    # Checkbox + label input
        ├── OutputBlock.tsx       # Read-only output + Copy button
        └── Toast.tsx
```

### Module boundaries

- `pgp.ts` is the only file that imports `openpgp`. Exposes `encryptText({ plaintext, publicKeyArmored })` and `decryptText({ ciphertext, privateKeyArmored, passphrase })`. Throws typed errors (see Errors section).
- `keystore.ts` is pure functions and is the only file that touches `localStorage`. Owns the storage key, schema, and ordering.
- `useKeystore.ts` wraps it in a hook with a re-render trigger; panes consume only the hook.
- Panes are independent — they share nothing with each other, only with the keystore hook.

## Data model

### Storage

A single localStorage key: `pgp-decrypt:keystore:v1`, holding the entire keystore as JSON. One key keeps writes atomic and migration easy if the schema changes (`v1` → `v2`).

### Types

```ts
type KeyType = 'private' | 'public';

interface SavedKey {
  id: string;          // crypto.randomUUID()
  type: KeyType;
  label: string;       // unique within (type)
  value: string;       // armored key block
  passphrase?: string; // private keys only; empty allowed for unprotected keys
  createdAt: number;   // ms epoch — sole ordering field
}

interface KeystoreState {
  version: 1;
  keys: SavedKey[];
}
```

### Operations (`keystore.ts`)

- `load(): KeystoreState` — read + parse; returns empty state if missing or corrupt.
- `save(state): void` — JSON.stringify + write.
- `add(state, { type, label, value, passphrase }): KeystoreState` — throws `DuplicateLabelError` if `(type, label)` already exists. Sets `createdAt = Date.now()`.
- `remove(state, id): KeystoreState`
- `listByType(state, type): SavedKey[]` — sorted by `createdAt DESC` (newest first → dropdown order).
- `defaultFor(state, type): SavedKey | null` — returns `listByType(state, type)[0] ?? null`. Default dropdown selection.

### Uniqueness rule

The unique constraint is `(type, label)`. The same label may exist once as a private key and once as a public key. Duplicate `value` content is allowed.

### Passphrase storage

Passphrases are stored in **plaintext** in localStorage alongside the private key. This is the user's explicit ask and is appropriate for a localhost-only personal tool, but any code with same-origin access can read them.

## Pane structure

Both panes share an identical vertical layout. The differences are: the labels, the action, and the presence of the passphrase row in Decrypt.

Top-to-bottom in each pane:

1. **Main textarea** — message (ciphertext for Decrypt, plaintext for Encrypt).
2. **Row: dropdown | passphrase** — one flex row.
   - Dropdown: saved keys for this pane's type, recency-ordered (newest first), with a sentinel `— New key —` entry at the end. Defaults to the first saved entry, or `— New key —` if none. Each saved row shows a hover `×` that calls `remove(id)` after a native `confirm()`.
   - Passphrase: masked `<input type="password">`, **Decrypt pane only**. Autofills from selected saved key. Empty + editable when `— New key —` is active. On Encrypt the row is just the dropdown at full width.
3. **Key textarea** — armored key block (private for Decrypt, public for Encrypt). Populated from the selected saved key. Editable.
4. **Action row** — flex, `justify-content: space-between`:
   - Left: `SaveKeyControl` — checkbox + label field. **Only rendered when the dropdown is `— New key —`.**
   - Right: submit button — `[Decrypt]` or `[Encrypt]`.
5. **OutputBlock** — read-only `<textarea>` with a `Copy` button positioned at its top-right corner. Hidden until the first successful op; once shown, displays the most recent output.

### Per-pane state

```ts
{
  message: string;
  selectedKeyId: string | typeof NEW_KEY;
  keyText: string;
  passphrase: string;        // decrypt pane only
  saveChecked: boolean;
  saveLabel: string;
  output: string | null;
  busy: boolean;
}
```

## Interactions

### Dropdown selection (only mutator of key fields)

- Selecting a saved entry → writes `keyText` (and `passphrase` for Decrypt) from the saved entry, sets `selectedKeyId` to its id.
- Selecting `— New key —` → clears `keyText`, `passphrase`, `saveLabel`, sets `saveChecked = false`.
- Edits to the key textarea (or passphrase field) **do not** change the dropdown selection. The dropdown stays locked to whatever was last picked.

### Trim on submit

All text fields are `.trim()`'d at the start of the submit handler before validation, before passing to `pgp.ts`, and before saving:

```ts
const message = state.message.trim();
const keyText = state.keyText.trim();
const passphrase = state.passphrase.trim();   // decrypt only
const saveLabel = state.saveLabel.trim();
```

Empty-after-trim guards the submit (button disabled if message or keyText is empty). Note: a passphrase that is only whitespace becomes empty — acceptable for this tool.

### Enter handling on main textarea

```
keydown:
  Enter & no modifiers      → preventDefault, click submit button
  Shift+Enter               → default (newline)
  any other modifier+Enter  → default
```

Submit button click runs the same handler; no duplicate logic.

### Save-on-success flow

After a successful encrypt or decrypt:

1. If `selectedKeyId === NEW_KEY` AND `saveChecked === true` AND `saveLabel !== ''`, call `keystore.add({ type, label: saveLabel, value: keyText, passphrase })`.
2. On `DuplicateLabelError` → toast "Label already exists". The operation result is still shown; nothing is saved.
3. On success → dropdown switches to the freshly-saved entry; `saveChecked` resets to `false`, `saveLabel` to `''`.
4. If `selectedKeyId` referenced an existing saved entry, no save occurs.

### OutputBlock behavior

- Read-only `<textarea>`.
- No custom click handler — clicking places a cursor (browser default). Select-all is **not** auto-triggered.
- `Copy` button calls `navigator.clipboard.writeText(output)` and toasts "Copied". Under Tor, clipboard writes require a user gesture; the button click satisfies this.

## Errors → toasts

`pgp.ts` throws typed error classes. Panes catch and translate to toasts.

| Error                   | Toast                  | When                               |
|-------------------------|------------------------|------------------------------------|
| `MalformedKeyError`     | "Invalid key format"   | openpgp can't parse the key block  |
| `MalformedMessageError` | "Invalid PGP message"  | openpgp can't parse ciphertext     |
| `BadPassphraseError`    | "Wrong passphrase"     | private key decryption fails       |
| `DecryptError`          | "Decryption failed"    | catch-all decrypt failure          |
| `EncryptError`          | "Encryption failed"    | catch-all encrypt failure          |
| `DuplicateLabelError`   | "Label already exists" | from `keystore.add`                |

### Toast component

- Bottom-right stack, max 3 visible at once, auto-dismiss after 3s, click-to-dismiss.
- Variants: `info` (Copied), `error` (everything else).
- Hook: `useToast()` returns `{ info, error }`. A single `<ToastHost />` lives in `App.tsx`.

## Theme

Single dark theme. Tokens at `:root` in `theme.css`:

```css
--bg: #1a1a1a;
--bg-elev: #252525;
--border: #3a3a3a;
--text: #e8e8e8;
--text-dim: #9a9a9a;
--accent: #6ea8ff;
--danger: #ff6b6b;
```

All elements (textarea, input, button, select, output) use the monospace font globally — no fallback to sans-serif anywhere.

## Dev server

`vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: 'localhost', port: 5173, strictPort: true },
});
```

`npm run dev` serves http://localhost:5173. `strictPort: true` means startup fails if 5173 is taken rather than silently falling back. No HTTPS — localhost personal tool only.

## Browser support

- **Chrome:** all primary APIs available.
- **Tor Browser:** localStorage and `crypto.randomUUID()` are available across security levels. `navigator.clipboard.writeText` requires a user gesture in stricter modes — already satisfied by the `Copy` button click. IndexedDB is *not* used (would be disabled in higher Tor security levels).

## Non-goals

To keep the implementation tight, the following are explicitly out of scope:

- Signing or signature verification
- Multiple recipients per encrypted message
- Key generation (user brings their own keys)
- Import/export of the keystore
- Unit tests
- Mobile or responsive layout
- Light theme / theme toggle
- Routing or multi-page navigation
- Production build / deployment configuration
