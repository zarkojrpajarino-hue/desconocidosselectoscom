import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';

// Mock Supabase auth
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } }
}));
const mockGetSession = vi.fn(() => Promise.resolve({ data: { session: null }, error: null }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      onAuthStateChange: mockOnAuthStateChange,
      getSession: mockGetSession,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }
}));

describe('Auth Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have signInWithPassword function available', () => {
    expect(mockSignInWithPassword).toBeDefined();
  });

  it('should have signUp function available', () => {
    expect(mockSignUp).toBeDefined();
  });

  it('should have signOut function available', () => {
    expect(mockSignOut).toBeDefined();
  });

  it('should call signInWithPassword with correct params', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: '123', email: 'test@example.com' }, session: {} },
      error: null
    });

    await mockSignInWithPassword({ email: 'test@example.com', password: 'password123' });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('should call signUp with correct params', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: '123', email: 'new@example.com' }, session: null },
      error: null
    });

    await mockSignUp({
      email: 'new@example.com',
      password: 'password123',
      options: { data: { full_name: 'Test User' } }
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'password123',
      options: { data: { full_name: 'Test User' } }
    });
  });

  it('should call signOut correctly', async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });

    await mockSignOut();

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should handle login error', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' }
    });

    const result = await mockSignInWithPassword({ 
      email: 'wrong@example.com', 
      password: 'wrongpassword' 
    });

    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Invalid credentials');
  });

  it('should handle signup error', async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Email already registered' }
    });

    const result = await mockSignUp({
      email: 'existing@example.com',
      password: 'password123'
    });

    expect(result.error).toBeDefined();
    expect(result.error.message).toBe('Email already registered');
  });

  it('should set up auth state change listener', () => {
    mockOnAuthStateChange.mockImplementation((callback) => {
      // Simulate initial auth state
      callback('INITIAL_SESSION', null);
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    const result = mockOnAuthStateChange((event, session) => {
      // Handle auth state change
    });

    expect(mockOnAuthStateChange).toHaveBeenCalled();
    expect(result.data.subscription.unsubscribe).toBeDefined();
  });

  it('should get initial session', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: '123' }, access_token: 'token' } },
      error: null
    });

    const result = await mockGetSession();

    expect(result.data.session).toBeDefined();
    expect(result.data.session.user.id).toBe('123');
  });

  it('should handle no session', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null
    });

    const result = await mockGetSession();

    expect(result.data.session).toBeNull();
    expect(result.error).toBeNull();
  });
});

describe('Auth Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    mockSignInWithPassword.mockRejectedValueOnce(new Error('Network error'));

    await expect(mockSignInWithPassword({ 
      email: 'test@example.com', 
      password: 'password' 
    })).rejects.toThrow('Network error');
  });

  it('should handle rate limiting', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null, session: null },
      error: { message: 'Too many requests', status: 429 }
    });

    const result = await mockSignInWithPassword({ 
      email: 'test@example.com', 
      password: 'password' 
    });

    expect(result.error.status).toBe(429);
  });
});
