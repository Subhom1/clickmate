// Server events must be delivered explicitly: client emit never echoes locally.
export function createSocketMock() {
  const listeners = new Map();
  const socket = {
    on: jest.fn((event, listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(listener);
      return socket;
    }),
    off: jest.fn((event, listener) => {
      if (listener) listeners.get(event)?.delete(listener);
      else listeners.delete(event);
      return socket;
    }),
    emit: jest.fn(() => socket),
    disconnect: jest.fn(() => {
      listeners.clear();
      return socket;
    }),
    serverEmit(event, ...args) {
      listeners.get(event)?.forEach((listener) => listener(...args));
    },
  };
  return socket;
}
