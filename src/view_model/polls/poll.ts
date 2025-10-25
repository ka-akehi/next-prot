'use client';

import { POLL_ERROR_MESSAGES } from '@domain/messages/error.messages';
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
        setError(POLL_ERROR_MESSAGES.fetchFailed);
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
      setError(POLL_ERROR_MESSAGES.voteFailed);
    } finally {
      setLoading(false);
    }
  };

  return { poll, loading, error, handleVote };
}
