import 'ws';
/// <reference types="ws" />

declare global {
  namespace WebSocket {
    interface WebSocket {
      roomId?: string;
      username?: string;
    }
  }
}

declare module 'ws' {
  interface WebSocket {
    roomId?: string;
    username?: string;
  }
}

export {};
