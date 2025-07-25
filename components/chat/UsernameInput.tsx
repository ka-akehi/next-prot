type Props = {
  username: string;
  setUsername: (value: string) => void;
};

export default function UsernameInput({ username, setUsername }: Props) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        ユーザー名
      </label>
      <input
        type="text"
        className="border p-2 w-full"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
    </div>
  );
}
