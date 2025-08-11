export default function SkeletonPage() {
  function BlogCardSkeleton() {
    return (
      <div className="animate-pulse border rounded p-4 space-y-4 shadow-sm">
        <div className="h-48 bg-gray-300 rounded"></div>
        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-full"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <main>
      <h1>skeleton base</h1>
      <div className="animate-pulse space-y-4 mb-2">
        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
        <div className="h-4 bg-gray-300 rounded w-full"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </div>

      <h1>skeleton card</h1>
      {BlogCardSkeleton()}

      <h1 className="mt-2">skeleton table</h1>
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-300 rounded my-2 w-full" />
        ))}
      </div>

      <h1 className="mt-2">custom</h1>
      <div className="h-4 bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-[length:200%_100%] animate-shimmer rounded" />
    </main>
  );
}
