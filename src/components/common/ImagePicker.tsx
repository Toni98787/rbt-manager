export function ImagePicker({
  label = 'Choose from gallery',
  onPick,
}: {
  label?: string;
  onPick: (dataUrl: string) => void;
}) {
  return (
    <label className="btn ghost" style={{ display: 'inline-flex', cursor: 'pointer' }}>
      {label}
      <input
        type="file"
        accept="image/*"
        capture={undefined}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') onPick(reader.result);
          };
          reader.readAsDataURL(file);
          e.target.value = '';
        }}
      />
    </label>
  );
}
