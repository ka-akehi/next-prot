'use client';

import { MessageInput, MessageList, UsernameInput } from '@/components/chat';
import { useChat } from '@/view_model/use-chat';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function ChatRoomPage() {
  const params = useParams<{ room: string }>();
  const [username, setUsername] = useState('Guest');

  const { messages, input, setInput, sendMessage, count } = useChat(username, params?.room || '');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">チャットルーム: {params?.room || ''}</h1>
      <h4 className="text-2xl font-bold mb-4">{count} 人参加中</h4>
      <UsernameInput username={username} setUsername={setUsername} />
      <MessageList messages={messages} currentUser={username} />
      <MessageInput input={input} setInput={setInput} onSend={sendMessage} />
    </div>
  );
}
