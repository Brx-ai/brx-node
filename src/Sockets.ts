import { WebSocket as ServerWebSocket } from 'ws';

export function isOpen(ws: ServerWebSocket) {
  return ws.readyState === ws.OPEN;
}

export function mapReplacer(key: string, value: any) {
  if (value instanceof Map) {
    return {
      _isMap: true,
      data: Array.from(value.entries()),
    };
  } else {
    return value;
  }
}

export function mapReviver(key: string, value: any): any {
  if (typeof value === 'object' && value !== null) {
    if (value._isMap) {
      return new Map(value.data);
    }
  }
  return value;
}
