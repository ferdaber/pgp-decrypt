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
