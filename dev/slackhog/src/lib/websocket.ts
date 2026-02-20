import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";

type WebSocketMessage =
  | { type: "subscribe"; channel: string }
  | { type: "unsubscribe"; channel: string };

type BroadcastMessage =
  | {
      type: "message.new";
      channel: string;
      message: any;
    }
  | {
      type: "message.updated";
      channel: string;
      message: any;
    }
  | {
      type: "message.deleted";
      channel: string;
      ts: string;
    }
  | {
      type: "reaction.added";
      channel: string;
      ts: string;
      reaction: string;
      user: string;
    }
  | {
      type: "reaction.removed";
      channel: string;
      ts: string;
      reaction: string;
      user: string;
    };

interface ExtendedWebSocket extends WebSocket {
  channels?: Set<string>;
  isAlive?: boolean;
}

let wss: WebSocketServer | null = null;

export function initWebSocketServer(server: any) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: ExtendedWebSocket, req: IncomingMessage) => {
    ws.channels = new Set();
    ws.isAlive = true;

    console.log("WebSocket client connected from", req.socket.remoteAddress);

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());

        if (message.type === "subscribe") {
          ws.channels?.add(message.channel);
          console.log(`Client subscribed to channel: ${message.channel}`);
          ws.send(
            JSON.stringify({
              type: "subscribed",
              channel: message.channel,
            }),
          );
        } else if (message.type === "unsubscribe") {
          ws.channels?.delete(message.channel);
          console.log(`Client unsubscribed from channel: ${message.channel}`);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  // Heartbeat to detect broken connections
  const interval = setInterval(() => {
    wss?.clients.forEach((ws: WebSocket) => {
      const extWs = ws as ExtendedWebSocket;
      if (extWs.isAlive === false) {
        return ws.terminate();
      }
      extWs.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  console.log("WebSocket server initialized on /ws");

  return wss;
}

export function broadcast(message: BroadcastMessage) {
  if (!wss) {
    console.warn("WebSocket server not initialized");
    return;
  }

  const messageStr = JSON.stringify(message);
  let sentCount = 0;

  wss.clients.forEach((client: WebSocket) => {
    const extClient = client as ExtendedWebSocket;
    if (
      client.readyState === WebSocket.OPEN &&
      extClient.channels?.has(message.channel)
    ) {
      client.send(messageStr);
      sentCount++;
    }
  });

  console.log(
    `Broadcast ${message.type} to ${sentCount} clients in channel ${message.channel}`,
  );
}

export function getWebSocketServer() {
  return wss;
}
