import ThemeToggle from '@/components/ThemeToggle';

export default function PostsPage() {
  return (
    <main>
      <h1>darkMode</h1>
      <header className="p-4">
        <ThemeToggle />
      </header>

      <div className="text-black bg-white dark:bg-gray-900 dark:text-white p-4 rounded">
        <p>ダークモード対応のボックス</p>
      </div>
    </main>
  );
}
