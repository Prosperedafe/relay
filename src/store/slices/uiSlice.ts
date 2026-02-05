import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  selectedChatId: number | null;
  searchQuery: string;
}

const initialState: UIState = {
  selectedChatId: null,
  searchQuery: '',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    selectChat: (state, action: PayloadAction<number | null>) => {
      state.selectedChatId = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { selectChat, setSearchQuery } = uiSlice.actions;
export default uiSlice.reducer;

