import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    const wsUrl = import.meta.env.VITE_API_BASE_URL || '/';

    const socket = io(wsUrl, {
      path: '/socket.io',
      auth: { token },
      // polling first: avoids Vite ws-proxy ECONNABORTED when tracking service
      // is down.  Socket.io upgrades to WebSocket automatically once the HTTP
      // handshake succeeds, so real-time performance is unchanged when the
      // service IS running.
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 8000,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('reconnect_failed', () => setConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [user]);

  // Expose a stable subscribe helper so pages can add/remove listeners
  // without needing a direct ref to the socket object
  const on = useCallback((event, handler) => {
    socketRef.current?.on(event, handler);
    return () => socketRef.current?.off(event, handler);
  }, []);

  const emit = useCallback((event, payload) => {
    socketRef.current?.emit(event, payload);
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, on, emit }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
