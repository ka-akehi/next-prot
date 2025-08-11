import type * as ws from "ws";

declare module "ws" {
  interface WebSocket {
    roomId?: string;
    username?: string;
  }
}
