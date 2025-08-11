export type ChatMessage = {
  id: number;
  type: "chat" | "system";
  user?: string;
  content: string;
  timestamp: string;
};

export type CountMessage = {
  type: "count";
  count: number;
};
