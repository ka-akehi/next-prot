import { ChatMessage } from '@/models/chat-message';
import { useEffect, useRef, useState } from 'react';

export function useChat(username: string, room: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [count, setCount] = useState(0);
  const [input, setInput] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(`ws://localhost:4000/chat?room=${encodeURIComponent(room)}`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: 'join', user: username }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'count') {
        setCount(data.count);
      } else if (data.type === 'system' || data.type === 'chat') {
        const msg: ChatMessage = {
          id: Date.now() + Math.random(),
          type: data.type,
          user: data.user,
          content: data.content,
          timestamp: data.timestamp || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
      }
    };

    return () => {
      socket.close();
    };
  }, [room, username]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;

    socketRef.current.send(
      JSON.stringify({
        type: 'chat',
        user: username,
        content: input.trim(),
      })
    );
    setInput('');
  };

  return {
    messages,
    input,
    setInput,
    sendMessage,
    count,
  };
}
