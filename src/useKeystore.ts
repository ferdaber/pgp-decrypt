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
