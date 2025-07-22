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
      // Check if user exists in registered users
      const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const user = registeredUsers.find((u: User) => u.email === email);
      
      if (!user) {
        throw new Error('No account found with this email. Please create an account first.');
      }
      
      // In a real app, you would verify the password hash
      // For this demo, we'll check if the user has a stored password
      const storedPassword = localStorage.getItem(`password_${user.id}`);
      if (!storedPassword || storedPassword !== password) {
        throw new Error('Invalid password. Please check your credentials.');
      }
      
      // Store auth data
      localStorage.setItem('auth_token', 'token_' + user.id + '_' + Date.now());
      localStorage.setItem('user_data', JSON.stringify(user));
      
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Login failed' });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Validate input
      if (!name.trim()) {
        throw new Error('Name is required');
      }
      if (!email.trim()) {
        throw new Error('Email is required');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      // Check if user already exists
      const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
      const existingUser = registeredUsers.find((u: User) => u.email === email);
      
      if (existingUser) {
        throw new Error('An account with this email already exists. Please login instead.');
      }
      
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        name: name.trim(),
        email: email.trim().toLowerCase(),
        created_at: new Date().toISOString()
      };
      
      // Store user in registered users list
      const updatedUsers = [...registeredUsers, newUser];
      localStorage.setItem('registered_users', JSON.stringify(updatedUsers));
      
      // Store password separately (in a real app, this would be hashed)
      localStorage.setItem(`password_${newUser.id}`, password);
      
      // Store auth data
      localStorage.setItem('auth_token', 'token_' + newUser.id + '_' + Date.now());
      localStorage.setItem('user_data', JSON.stringify(newUser));
      
      dispatch({ type: 'SET_USER', payload: newUser });
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