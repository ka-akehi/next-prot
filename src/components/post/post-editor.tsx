type Props = {
  content: string;
  setContent: (v: string) => void;
  save: () => Promise<void> | void;
  cancel: () => void;
  loading?: boolean;
  error?: string | null;
};

export function PostEditor({ content, setContent, save, cancel, loading = false, error }: Props) {
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2" data-testid="post-edit-form">
      <textarea
        className="w-full border p-2 rounded"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        data-testid="post-body-edit"
        disabled={loading}
      />
      {error && (
        <p className="text-red-500 text-sm" data-testid="post-error">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-60"
          data-testid="submit-post-edit"
          disabled={loading}
        >
          {loading ? '更新中…' : '更新'}
        </button>
        <button
          type="button"
          className="px-3 py-1 rounded bg-gray-200"
          onClick={cancel}
          data-testid="cancel-edit"
          disabled={loading}
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
