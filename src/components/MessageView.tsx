import { useEffect, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Box, Typography, TextField, Button, Paper } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadMessages, searchMessages, clearMessages, markChatAsRead } from '../store/slices/databaseSlice';
import { setSearchQuery } from '../store/slices/uiSlice';

interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
}

const MessageItem = ({ index, style }: MessageItemProps) => {
  const selectedChatId = useAppSelector((state) => state.ui.selectedChatId);
  const messages = useAppSelector((state) => state.database.messages[selectedChatId || 0] || []);
  const message = messages[index];

  if (!message) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        ...style,
        padding: '12px 16px',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="body2" fontWeight={600} color="primary">
          {message.sender}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatTime(message.ts)}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.5, wordWrap: 'break-word' }}>
        {message.body}
      </Typography>
    </Paper>
  );
};

const MessageView = () => {
  const dispatch = useAppDispatch();
  const selectedChatId = useAppSelector((state) => state.ui.selectedChatId);
  const messages = useAppSelector(
    (state) => (selectedChatId ? state.database.messages[selectedChatId] || [] : [])
  );
  const hasMoreMessages = useAppSelector(
    (state) => (selectedChatId ? state.database.hasMoreMessages[selectedChatId] : false)
  );
  const searchQuery = useAppSelector((state) => state.ui.searchQuery);
  const [isSearching, setIsSearching] = useState(false);
  const listRef = useRef<List>(null);

  useEffect(() => {
    if (selectedChatId) {
      dispatch(clearMessages(selectedChatId));
      dispatch(loadMessages({ chatId: selectedChatId, limit: 50, offset: 0 }));
      dispatch(markChatAsRead(selectedChatId));
      dispatch(setSearchQuery(''));
      setIsSearching(false);
    }
  }, [selectedChatId, dispatch]);

  useEffect(() => {
    if (listRef.current && messages.length > 0 && !isSearching) {
      const timer = setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollToItem(messages.length - 1, 'end');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, selectedChatId, isSearching, messages]);

  const handleLoadOlder = () => {
    if (selectedChatId && hasMoreMessages && messages.length > 0) {
      dispatch(loadMessages({ chatId: selectedChatId, limit: 50, offset: messages.length }));
    }
  };

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
    if (query.trim() && selectedChatId) {
      setIsSearching(true);
      dispatch(searchMessages({ chatId: selectedChatId, query: query.trim() }));
    } else {
      setIsSearching(false);
      if (selectedChatId) {
        dispatch(clearMessages(selectedChatId));
        dispatch(loadMessages({ chatId: selectedChatId, limit: 50, offset: 0 }));
      }
    }
  };

  if (!selectedChatId) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100%"
        color="text.secondary"
        fontSize="16px"
      >
        <Typography>Select a chat to view messages</Typography>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100%" overflow="hidden">
      <Box p={2} borderBottom={1} borderColor="divider" sx={{ backgroundColor: 'background.paper' }}>
        <TextField
          fullWidth
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          size="small"
        />
      </Box>
      <Box flex={1} overflow="hidden" position="relative">
        {hasMoreMessages && !isSearching && (
          <Box p={1.5} textAlign="center" sx={{ backgroundColor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Button variant="contained" color="primary" onClick={handleLoadOlder} size="small">
              Load Older Messages
            </Button>
          </Box>
        )}
        {messages.length > 0 ? (
          <List
            ref={listRef}
            height={window.innerHeight - 200}
            itemCount={messages.length}
            itemSize={80}
            width="100%"
          >
            {MessageItem}
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
            <Typography>No messages found</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessageView;

