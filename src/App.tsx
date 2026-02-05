import { useEffect, useState } from 'react';
import { Box, Typography, Button, AppBar, Toolbar } from '@mui/material';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { initializeDatabase, seedDatabase, loadChats } from './store/slices/databaseSlice';
import { connectWebSocket } from './store/slices/websocketSlice';
import ChatList from './components/ChatList';
import MessageView from './components/MessageView';
import ConnectionStatus from './components/ConnectionStatus';
import { createWebAdapter } from './services/webAdapter';

declare global {
  interface Window {
    electronAPI?: {
      dbInit: () => Promise<void>;
      dbSeed: () => Promise<void>;
      dbGetChats: (limit: number, offset: number) => Promise<any[]>;
      dbGetMessages: (chatId: number, limit: number, offset: number) => Promise<any[]>;
      dbSearchMessages: (chatId: number, query: string) => Promise<any[]>;
      dbMarkChatAsRead: (chatId: number) => Promise<void>;
      wsGetPort: () => Promise<number>;
      wsSimulateDrop: () => Promise<void>;
    };
    apiAdapter: ReturnType<typeof createWebAdapter>;
  }
}

function App() {
  const dispatch = useAppDispatch();
  const { isInitialized } = useAppSelector((state) => state.database);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initAdapter = () => {
      window.apiAdapter = createWebAdapter();
      setIsReady(true);
    };
    initAdapter();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const init = async () => {
      try {
        setError(null);
        await dispatch(initializeDatabase()).unwrap();
        await dispatch(seedDatabase()).unwrap();
        await dispatch(loadChats({ limit: 50, offset: 0 })).unwrap();
        if (!window.apiAdapter) {
          throw new Error('API adapter not initialized');
        }
        const port = await window.apiAdapter.wsGetPort();
        dispatch(connectWebSocket(port));
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize application');
      }
    };
    init();
  }, [dispatch, isReady]);

  if (!isReady) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        fontSize="18px"
        color="text.secondary"
      >
        <Typography>Initializing...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        gap={2}
      >
        <Typography color="error">Error: {error}</Typography>
        <Button
          variant="contained"
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  if (!isInitialized) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        fontSize="18px"
        color="text.secondary"
      >
        <Typography>Initializing database...</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100vh" width="100vw">
      <AppBar position="static" elevation={1} sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h1" fontWeight={600}>
            Relay
          </Typography>
          <ConnectionStatus />
        </Toolbar>
      </AppBar>
      <Box display="flex" flex={1} overflow="hidden" px={1.25} sx={{ backgroundColor: 'background.paper' }}>
        <Box width={350} borderRight={1} borderColor="divider" sx={{ backgroundColor: 'background.paper', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <ChatList />
        </Box>
        <Box flex={1} display="flex" flexDirection="column" sx={{ backgroundColor: 'grey.50', overflow: 'hidden' }}>
          <MessageView />
        </Box>
      </Box>
    </Box>
  );
}

export default App;

