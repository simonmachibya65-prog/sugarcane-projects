import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authAPI } from '../utils/api'

export const login = createAsyncThunk('auth/login', async (creds: any, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(creds)
    localStorage.setItem('access_token', res.data.access_token)
    return res.data
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.detail || 'Login failed')
  }
})

export const register = createAsyncThunk('auth/register', async (data: any, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data)
    localStorage.setItem('access_token', res.data.access_token)
    return res.data
  } catch (e: any) {
    return rejectWithValue(e.response?.data?.detail || 'Registration failed')
  }
})

export const fetchMe = createAsyncThunk('auth/me', async () => {
  const res = await authAPI.me()
  return res.data
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null as any, loading: false, error: null as any },
  reducers: {
    logout(state) {
      state.user = null
      state.error = null
      localStorage.removeItem('access_token')
    }
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending,    s => { s.loading = true;  s.error = null })
      .addCase(login.fulfilled,  (s, a) => { s.loading = false; s.user = a.payload })
      .addCase(login.rejected,   (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(register.pending,   s => { s.loading = true })
      .addCase(register.fulfilled, (s, a) => { s.loading = false; s.user = a.payload })
      .addCase(register.rejected,  (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(fetchMe.pending,    s => { s.loading = true })
      .addCase(fetchMe.fulfilled,  (s, a) => { s.loading = false; s.user = a.payload })
      .addCase(fetchMe.rejected,   s => {
        s.loading = false
        s.user = null
        localStorage.removeItem('access_token') // token invalid, clear it
      })
  }
})

export const { logout } = authSlice.actions
export default authSlice.reducer
