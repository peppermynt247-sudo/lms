import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services';

// Async thunk for fetching current user
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (email, { rejectWithValue }) => {
    try {
      const userData = await authService.getCurrentUser(email);
      return userData;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (formData, { rejectWithValue }) => {
    try {
      const data = await authService.login(formData);
      
      // Store authentication data in localStorage
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('tokenType', data.tokenType);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userRole', JSON.stringify(data.role));
      localStorage.setItem('sessionId', data.sessionId);

      // Store accessToken in cookies for middleware access
      if (typeof document !== 'undefined') {
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieParts = [
          `accessToken=${data.accessToken}`,
          'path=/',
          'SameSite=Strict',
          ...(isProduction ? ['Secure'] : []),
        ];
        document.cookie = cookieParts.join('; ');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk for registration
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (formData, { rejectWithValue }) => {
    try {
      const data = await authService.register(formData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous actions
    logout: (state) => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenType');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('sessionId');
      if (typeof document !== 'undefined') {
        document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Strict';
      }

      state.user = null;
      state.isAuthenticated = false;
      state.token = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setAuthFromStorage: (state) => {
      const token = localStorage.getItem('accessToken');
      const email = localStorage.getItem('userEmail');
      const userId = localStorage.getItem('userId');
      const roleString = localStorage.getItem('userRole');
      
      if (token) {
        let roles = [];
        try { roles = JSON.parse(roleString || '[]'); } catch { /* malformed storage — default to empty */ }
        state.token = token;
        state.isAuthenticated = true;
        state.user = {
          email:  email  !== 'null' ? email  : null,
          userId: userId !== 'null' ? userId : null,
          roles,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchCurrentUser
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle loginUser
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.accessToken;
        state.user = {
          email: action.payload.email,
          userId: action.payload.userId,
          roles: action.payload.role,
        };
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Handle registerUser
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        // Registration successful, but user still needs to login
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, setAuthFromStorage } = authSlice.actions;
export default authSlice.reducer;
