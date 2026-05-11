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
