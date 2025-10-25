type Props = {
  content: string;
  setContent: (value: string) => void;
  error: string;
  loading: boolean;
  onSave: () => void;
  onCancel: () => void;
};

export function PostEditForm({ content, setContent, error, loading, onSave, onCancel }: Props) {
  return (
    <>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full border p-2 rounded"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 text-sm">
        <button onClick={onSave} disabled={loading} className="text-blue-600 hover:underline">
          保存
        </button>
        <button onClick={onCancel} disabled={loading} className="text-gray-500 hover:underline">
          キャンセル
        </button>
      </div>
    </>
  );
}
