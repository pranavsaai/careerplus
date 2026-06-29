// This is Kittu Style Code
// WebSocket hook — real-time interview status updates! 🔥

import { useEffect, useRef, useState } from "react";

export type SocketStatus =
  | "CONNECTING"
  | "CONNECTED"
  | "GENERATING"
  | "READY"
  | "EVALUATING"
  | "EVALUATED"
  | "DISCONNECTED";

interface StatusMessage {
  status: SocketStatus;
  message: string;
  timestamp: number;
}

export function useInterviewSocket(userId: string | null) {
  const [status, setStatus] = useState<SocketStatus>("DISCONNECTED");
  const [lastMessage, setLastMessage] = useState<StatusMessage | null>(null);
  const clientRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    // dynamically import SockJS + STOMP — only loads when needed
    const connect = async () => {
      try {
        const SockJS = (await import("sockjs-client")).default;
        const { Client } = await import("@stomp/stompjs");

        setStatus("CONNECTING");

        const client = new Client({
          webSocketFactory: () => new SockJS("/api/ws"),
          onConnect: () => {
            setStatus("CONNECTED");
            console.log("WebSocket connected!");

            // subscribe to user-specific queue
            client.subscribe(
              `/user/${userId}/queue/interview-status`,
              (message) => {
                try {
                  const data: StatusMessage = JSON.parse(message.body);
                  setStatus(data.status);
                  setLastMessage(data);
                  console.log("WS message:", data);
                } catch (e) {
                  console.error("WS parse error:", e);
                }
              }
            );
          },
          onDisconnect: () => {
            setStatus("DISCONNECTED");
          },
          onStompError: (frame) => {
            console.error("STOMP error:", frame);
            setStatus("DISCONNECTED");
          },
          reconnectDelay: 5000,
        });

        client.activate();
        clientRef.current = client;

      } catch (e) {
        console.error("WebSocket setup failed:", e);
      }
    };

    connect();

    return () => {
      clientRef.current?.deactivate();
    };
  }, [userId]);

  return { status, lastMessage };
}