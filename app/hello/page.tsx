'use client';

import { useEffect, useState } from 'react';

export default function HelloPage() {
  const [msg, setMsg] = useState('loading...');

  useEffect(() => {
    (async () => {
      const res = await fetch('https://x6pdjwc3a8.execute-api.ap-northeast-1.amazonaws.com/hello');
      const data = await res.json();
      setMsg(data.message);
    })();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-bold">{msg}</h1>
    </div>
  );
}
