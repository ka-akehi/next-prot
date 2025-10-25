type Props = {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
};

export function MessageInput({ input, setInput, onSend }: Props) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        className="border p-2 flex-1"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSend()}
        placeholder="メッセージを入力..."
      />
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={onSend}>
        送信
      </button>
    </div>
  );
}
