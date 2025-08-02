type Props = {
  content: string;
  setContent: (val: string) => void;
  save: () => void;
  cancel: () => void;
  loading: boolean;
  error: string | null;
};

export function PostEditor({ content, setContent, save, cancel, loading, error }: Props) {
  return (
    <>
      <textarea
        className="w-full border rounded p-2 text-sm"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button onClick={save} disabled={loading} className="px-2 py-1 bg-green-600 text-white text-sm rounded">
          保存
        </button>
        <button onClick={cancel} disabled={loading} className="px-2 py-1 text-sm border rounded">
          キャンセル
        </button>
      </div>
    </>
  );
}
