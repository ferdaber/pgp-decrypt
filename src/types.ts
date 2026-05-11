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
