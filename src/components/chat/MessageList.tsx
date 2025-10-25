import { ChatMessage } from '@/models/chat-message';
import { useEffect, useRef } from 'react';

type Props = {
  messages: ChatMessage[];
  currentUser: string;
};

export function MessageList({ messages, currentUser }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-64 border rounded p-2 overflow-y-auto bg-gray-50 mb-4">
      {messages.map((msg) => {
        const isSelf = msg.user === currentUser;
        const isSystem = msg.type === 'system';

        return (
          <div
            key={msg.id}
            className={`mb-2 flex ${isSystem ? 'justify-center' : isSelf ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`rounded px-3 py-2 max-w-xs break-words text-sm ${
                isSystem
                  ? 'bg-yellow-100 text-gray-700 text-center'
                  : isSelf
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {/* ユーザー名はチャット時かつ他人のときのみ表示 */}
              {!isSystem && !isSelf && <div className="text-xs font-semibold text-gray-600 mb-1">{msg.user}</div>}

              <div>{msg.content}</div>

              {/* timestamp は chat のときのみ表示 */}
              {msg.type === 'chat' && (
                <div className="text-[10px] text-right mt-1 opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
