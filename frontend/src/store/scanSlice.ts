import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { scanAPI } from '../utils/api'

export const fetchHistory = createAsyncThunk('scan/history', async (_params: void | Record<string, any>) => {
  const res = await scanAPI.history(_params ?? undefined)
  return res.data
})

export const fetchStats = createAsyncThunk('scan/stats', async () => {
  const res = await scanAPI.stats()
  return res.data
})

const scanSlice = createSlice({
  name: 'scan',
  initialState: { history: [] as any[], stats: null as any, loading: false },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchHistory.pending, s => { s.loading = true })
      .addCase(fetchHistory.fulfilled, (s, a) => { s.loading = false; s.history = a.payload })
      .addCase(fetchStats.fulfilled, (s, a) => { s.stats = a.payload })
  }
})

export default scanSlice.reducer
