import { NextResponse } from 'next/server';

const mockPoll = {
  id: 1,
  question: '好きな言語は？',
  options: [
    { id: 1, text: 'JavaScript', votes: 10 },
    { id: 2, text: 'Python', votes: 8 },
    { id: 3, text: 'Go', votes: 3 },
  ],
};

// GET: 投票状況を取得
export async function GET() {
  return NextResponse.json(mockPoll);
}

// POST: 投票する（モックなので実際には保存しない）
export async function POST(req: Request) {
  const body = await req.json();
  const optionId = body.optionId as number;

  // モックなので、擬似的に票数を +1 した結果を返す
  const updatedVotes = mockPoll.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o));

  return NextResponse.json({
    success: true,
    votedOptionId: optionId,
    updatedVotes,
  });
}
