type Props = {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
};

export function PostActions({ onEdit, onDelete, isDeleting }: Props) {
  return (
    <div className="absolute top-2 right-2 flex gap-2 text-xs">
      <button onClick={onEdit} className="text-blue-600 hover:underline">
        編集
      </button>
      <button onClick={onDelete} disabled={isDeleting} className="text-red-600 hover:underline">
        {isDeleting ? '削除中…' : '削除'}
      </button>
    </div>
  );
}
