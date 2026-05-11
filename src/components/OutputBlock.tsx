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
