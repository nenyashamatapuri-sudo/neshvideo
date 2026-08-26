'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Set auth cookie and redirect
      document.cookie = `admin_token=${data.token}; path=/; max-age=86400`;
      router.push('/admin/dashboard');
    } catch (err) {
      setError('An error occurred');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0c0a0a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
        backgroundColor: '#1a1818',
        border: '1px solid #333',
        borderRadius: '8px',
      }}>
        <h1 style={{
          color: '#f2ede3',
          fontSize: '24px',
          marginBottom: '2rem',
          textAlign: 'center',
          fontWeight: '700',
          letterSpacing: '-0.02em',
        }}>
          Nesh Admin
        </h1>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: '#948b86',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#0c0a0a',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#f2ede3',
                fontSize: '14px',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              color: '#948b86',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#0c0a0a',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#f2ede3',
                fontSize: '14px',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
              disabled={loading}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(227, 37, 27, 0.1)',
              border: '1px solid #e3251b',
              color: '#e3251b',
              padding: '0.75rem',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '1rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#e3251b',
              color: '#f2ede3',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid #333',
          fontSize: '12px',
          color: '#948b86',
          lineHeight: '1.6',
        }}>
          <p style={{ margin: '0 0 0.5rem' }}>Demo credentials:</p>
          <p style={{ margin: '0' }}>Username: <code style={{ color: '#f2ede3' }}>admin</code></p>
          <p style={{ margin: '0' }}>Password: <code style={{ color: '#f2ede3' }}>changeme123</code></p>
        </div>
      </div>
    </div>
  );
}
