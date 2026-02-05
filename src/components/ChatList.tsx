import { useEffect, useRef, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Box, Typography, Paper } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadChats } from '../store/slices/databaseSlice';
import { selectChat } from '../store/slices/uiSlice';
import { markChatAsRead } from '../store/slices/databaseSlice';

interface ChatItemProps {
  index: number;
  style: React.CSSProperties;
}

const ChatItem = ({ index, style }: ChatItemProps) => {
  const dispatch = useAppDispatch();
  const chats = useAppSelector((state) => state.database.chats);
  const selectedChatId = useAppSelector((state) => state.ui.selectedChatId);
  const chat = chats[index];

  if (!chat) return null;

  const handleClick = () => {
    dispatch(selectChat(chat.id));
    if (chat.unreadCount > 0) {
      dispatch(markChatAsRead(chat.id));
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        ...style,
        padding: '12px 16px',
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        backgroundColor: selectedChatId === chat.id ? 'secondary.main' : 'background.paper',
        borderLeft: selectedChatId === chat.id ? '3px solid' : 'none',
        borderLeftColor: selectedChatId === chat.id ? 'primary.main' : 'transparent',
        '&:hover': {
          backgroundColor: selectedChatId === chat.id ? 'primary.light' : 'grey.100',
        },
      }}
      onClick={handleClick}
    >
      <Box display="flex" flexDirection="column" gap={0.5}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant="body1"
            fontWeight={500}
            sx={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {chat.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" ml={1}>
            {formatTime(chat.lastMessageAt)}
          </Typography>
        </Box>
        {chat.unreadCount > 0 && (
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                minWidth: '20px',
                textAlign: 'center',
              }}
            >
              {chat.unreadCount}
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

const ChatList = () => {
  const dispatch = useAppDispatch();
  const chats = useAppSelector((state) => state.database.chats);
  const hasMoreChats = useAppSelector((state) => state.database.hasMoreChats);
  const listRef = useRef<List>(null);

  useEffect(() => {
    dispatch(loadChats({ limit: 50, offset: 0 }));
  }, [dispatch]);

  const handleItemsRendered = useCallback(
    ({ visibleStopIndex }: { visibleStopIndex: number }) => {
      if (visibleStopIndex >= chats.length - 10 && hasMoreChats) {
        dispatch(loadChats({ limit: 50, offset: chats.length }));
      }
    },
    [chats.length, hasMoreChats, dispatch]
  );

  return (
    <Box display="flex" flexDirection="column" height="100%" overflow="hidden">
      <Box p={2} borderBottom={1} borderColor="divider" sx={{ backgroundColor: 'background.paper' }}>
        <Typography variant="h6" fontWeight={600}>
          Chats
        </Typography>
      </Box>
      <Box flex={1} overflow="hidden">
        {chats.length > 0 ? (
          <List
            ref={listRef}
            height={window.innerHeight - 90}
            itemCount={chats.length}
            itemSize={70}
            width="100%"
            onItemsRendered={handleItemsRendered}
          >
            {ChatItem}
          </List>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
            color="text.secondary"
            fontSize="14px"
          >
            <Typography>No chats available</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ChatList;

