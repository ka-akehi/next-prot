type Props = {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
};

export function PostActions({ onEdit, onDelete, isDeleting = false }: Props) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        className="px-2 py-1 rounded bg-yellow-500 text-white disabled:opacity-60"
        onClick={onEdit}
        data-testid="edit-post"
        disabled={isDeleting}
      >
        編集
      </button>
      <button
        type="button"
        className="px-2 py-1 rounded bg-red-600 text-white disabled:opacity-60"
        onClick={onDelete}
        data-testid="delete-post"
        disabled={isDeleting}
      >
        {isDeleting ? '削除中…' : '削除'}
      </button>
    </div>
  );
}
