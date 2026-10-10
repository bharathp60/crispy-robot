import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { api, getToken } from './api.js';

export const realtimeTopics = [
  '/topic/quotes',
  '/topic/signals',
  '/topic/ai/decisions',
  '/topic/orders',
  '/topic/risk/alerts',
  '/topic/system'
];

export function createRealtimeClient(onEvent, onStatus) {
  const wsUrl = `${api.baseUrl.replace(/\/$/, '')}/ws`;
  const client = new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    connectHeaders: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {}
  });

  client.onConnect = () => {
    onStatus('CONNECTED');
    realtimeTopics.forEach((topic) => {
      client.subscribe(topic, (message) => {
        try {
          onEvent({ topic, ...JSON.parse(message.body) });
        } catch {
          onEvent({ topic, eventType: 'RAW', payload: message.body, timestamp: new Date().toISOString() });
        }
      });
    });
  };

  client.onStompError = (frame) => onStatus(`ERROR: ${frame.headers.message || 'STOMP error'}`);
  client.onWebSocketClose = () => onStatus('DISCONNECTED');

  return client;
}
