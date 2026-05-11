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
