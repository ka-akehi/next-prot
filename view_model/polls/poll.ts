'use client';

import { Poll, fetchPoll, vote } from '@/models/polls/poll';
import { useEffect, useState } from 'react';

export function usePollViewModel() {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初期データ取得
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPoll();
        setPoll(data);
      } catch {
        setError('投票データの取得に失敗しました');
      }
    })();
  }, []);

  // 投票処理
  const handleVote = async (optionId: number) => {
    setLoading(true);
    try {
      const data = await vote(optionId);
      setPoll(data);
    } catch {
      setError('投票に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return { poll, loading, error, handleVote };
}
