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
