"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import UsernameInput from "@/components/chat/UsernameInput";
import MessageInput from "@/components/chat/MessageInput";
import MessageList from "@/components/chat/MessageList";
import { useChat } from "@/view_model/use-chat";

export default function ChatRoomPage() {
  const { room } = useParams<{ room: string }>();
  const [username, setUsername] = useState("Guest");

  const { messages, input, setInput, sendMessage } = useChat(username, room);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">チャットルーム: {room}</h1>
      <UsernameInput username={username} setUsername={setUsername} />
      <MessageList messages={messages} currentUser={username} />
      <MessageInput input={input} setInput={setInput} onSend={sendMessage} />
    </div>
  );
}
