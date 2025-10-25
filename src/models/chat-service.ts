import { ChatMessage } from "./chat-message";

type Listener = (msg: ChatMessage) => void;

export class ChatService {
  private socket: WebSocket | null = null;
  private listeners: Listener[] = [];

  connect(url: string) {
    this.socket = new WebSocket(url);

    this.socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this.listeners.forEach((cb) => cb(msg));
    };
  }

  disconnect() {
    this.socket?.close();
  }

  sendMessage(msg: ChatMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg));
    }
  }

  onMessage(cb: Listener) {
    this.listeners.push(cb);
  }
}
