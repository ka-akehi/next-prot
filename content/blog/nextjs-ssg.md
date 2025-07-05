---
title: 'Next.jsのSSGを徹底解説'
slug: 'nextjs-ssg'
date: '2025-07-01'
tags: ['nextjs', 'ssg']
category: 'nextjs'
description: 'Next.jsにおけるSSG（静的サイト生成）について、実装例付きで徹底解説。'
---

Next.js の SSG（Static Site Generation）は、ビルド時に HTML を生成して高速なページ表示を実現する仕組みです。

## なぜ SSG なのか？

- 初期表示が爆速（CDN キャッシュ）
- サーバーコストが不要
- SEO にも強い

## 実装例

```tsx
export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}
```

## まとめ

静的なコンテンツが多いサイトでは SSG を優先的に選ぶべきです。
