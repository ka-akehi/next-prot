export type Option = {
  id: number;
  text: string;
  votes: number;
};

export type Poll = {
  id: number;
  question: string;
  options: Option[];
};

export async function fetchPoll(): Promise<Poll> {
  const res = await fetch('/api/polls/1');
  if (!res.ok) throw new Error('投票データ取得失敗');
  return res.json();
}

export async function vote(optionId: number): Promise<Poll> {
  const res = await fetch('/api/polls/1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ optionId }),
  });
  if (!res.ok) throw new Error('投票失敗');

  const data = await res.json();
  return {
    id: 1,
    question: '好きな言語は？',
    options: data.updatedVotes,
  };
}
