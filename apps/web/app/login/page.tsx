"use client";
import { useState } from "react";
import { apiGet } from "../lib/api";
import Link from "next/link";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const beginLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const webOrigin = process.env.NEXT_PUBLIC_WEB_ORIGIN || "http://localhost:3000";
      const callbackUrl = `${webOrigin}/auth/callback`;
      const qs = new URLSearchParams({ redirect_uri: callbackUrl }).toString();
      const { authUrl } = await apiGet<{ authUrl: string; state: string; redirectUri: string }>(`/auth/login?${qs}`);
      window.location.assign(authUrl);
    } catch (e: any) {
      setError(e.message || "Failed to start login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        padding: '40px',
        borderRadius: '16px',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center'
      }}>
        <Link href="/" style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '20px', 
          color: 'white', 
          textDecoration: 'none', 
          fontSize: '24px', 
          fontWeight: '700' 
        }}>
          🎥 AI Video Interview
        </Link>
        
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '24px' }}>
          Welcome Back
        </h1>
        
        {error && (
          <div style={{ 
            color: '#ffcdd2', 
            backgroundColor: 'rgba(244, 67, 54, 0.1)', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '20px' 
          }}>
            {error}
          </div>
        )}
        
        <button 
          onClick={beginLogin} 
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            background: loading ? 'rgba(255,255,255,0.1)' : '#ffd700',
            color: loading ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '20px'
          }}
        >
          {loading ? "Redirecting..." : "Continue with Authentik"}
        </button>
        
        <p style={{ margin: '0', opacity: '0.9' }}>
          No account?{' '}
          <Link 
            href="/register"
            style={{ color: '#ffd700', textDecoration: 'none', fontWeight: '600' }}
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
