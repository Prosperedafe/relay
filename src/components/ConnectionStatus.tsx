import { Box, Button, Chip } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { simulateConnectionDrop, connectWebSocket } from '../store/slices/websocketSlice';

const ConnectionStatus = () => {
  const dispatch = useAppDispatch();
  const { state, port } = useAppSelector((state) => state.websocket);

  const handleSimulateDrop = async () => {
    await dispatch(simulateConnectionDrop()).unwrap();
    if (port) {
      setTimeout(() => {
        dispatch(connectWebSocket(port));
      }, 1000);
    }
  };

  const getStatusColor = () => {
    switch (state) {
      case 'connected':
        return 'success';
      case 'reconnecting':
        return 'warning';
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <Chip
        label={getStatusText()}
        color={getStatusColor()}
        size="small"
        sx={{ fontWeight: 500 }}
      />
      <Button
        variant="contained"
        color="warning"
        size="small"
        onClick={handleSimulateDrop}
        sx={{ fontSize: '12px' }}
      >
        Simulate Connection Drop
      </Button>
    </Box>
  );
};

export default ConnectionStatus;

