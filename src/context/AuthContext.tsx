import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, AuthState } from '../types';

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => void;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for existing session on app load
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        dispatch({ type: 'SET_USER', payload: user });
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        dispatch({ type: 'SET_USER', payload: null });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // In a real app, this would call your authentication API
      // For demo purposes, we'll simulate the login
      if (email && password) {
        const user: User = {
          id: '1',
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          email: email,
          created_at: new Date().toISOString()
        };
        
        // Store auth data
        localStorage.setItem('auth_token', 'demo_token_' + Date.now());
        localStorage.setItem('user_data', JSON.stringify(user));
        
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Login failed' });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // In a real app, this would call your registration API
      // For demo purposes, we'll simulate the registration
      if (name && email && password) {
        const user: User = {
          id: Date.now().toString(),
          name: name,
          email: email,
          created_at: new Date().toISOString()
        };
        
        // Store auth data
        localStorage.setItem('auth_token', 'demo_token_' + Date.now());
        localStorage.setItem('user_data', JSON.stringify(user));
        
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        throw new Error('All fields are required');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Registration failed' });
      throw error;
    }
  };

  const updateProfile = async (name: string, email: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // In a real app, this would call your profile update API
      if (name && email) {
        const updatedUser: User = {
          ...state.user!,
          name: name,
          email: email,
        };
        
        // Update stored data
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        
        dispatch({ type: 'SET_USER', payload: updatedUser });
      } else {
        throw new Error('Name and email are required');
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Profile update failed' });
      throw error;
    }
  };

  const deleteAccount = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // In a real app, this would call your account deletion API
      // Clear all user data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      
      dispatch({ type: 'SET_USER', payload: null });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Account deletion failed' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    dispatch({ type: 'SET_USER', payload: null });
  };

  return (
    <AuthContext.Provider value={{ state, login, register, updateProfile, deleteAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}