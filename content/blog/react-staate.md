---
title: 'React における状態管理の基本'
slug: 'react-state'
date: '2025-07-02'
tags: ['react', 'state']
category: 'react'
description: 'useState から始める React の状態管理入門。'
---

React では、状態管理は UI 構築の要です。基本となるのが`useState`と`useReducer`です。

## useState とは？

```tsx
const [count, setCount] = useState(0);
```

## useReducer とは？

```tsx
const [state, dispatch] = useReducer(reducer, initialState);
```

## 状態管理ライブラリとの使い分け

- 小規模：useState
- 中〜大規模：useReducer や Jotai, Zustand, Redux
