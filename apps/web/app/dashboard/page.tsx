"use client";
import { useEffect, useState } from "react";
import { apiPost, apiGet } from "../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string>("Session ready (cookies)");
  const [error, setError] = useState<string | null>(null);
  const [protectedData, setProtectedData] = useState<any>(null);

  useEffect(() => {
    // Auto-test protected route on page load to verify session
    onTestProtected();
  }, []);

  const onRefresh = async () => {
    setError(null);
    console.log('🔧 Dashboard: Starting refresh token request');
    console.log('🔧 Dashboard: Current cookies:', document.cookie);
    try {
      const res = await apiPost<{ success: boolean; expiresIn: number }>("/auth/refresh");
      console.log('🔧 Dashboard: Refresh response:', res);
      setMessage(`Refreshed. New access TTL ~${res.expiresIn}s`);
    } catch (e: any) {
      console.log('❌ Dashboard: Refresh error:', e);
      setError(e.message || "Refresh failed");
    }
  };

  const onTestProtected = async () => {
    setError(null);
    try {
      const res = await apiGet<{ message: string; timestamp: string; user: any }>("/protected");
      setProtectedData(res);
      setMessage("Protected endpoint test successful!");
    } catch (e: any) {
      setError(e.message || "Protected endpoint failed - maybe no valid session?");
      if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
        // Redirect to login if unauthorized
        setTimeout(() => router.replace("/login"), 2000);
      }
    }
  };

  const onLogout = async () => {
    try {
      // Call logout API to revoke tokens and clear cookies
      await apiPost("/auth/logout");
    } catch (e) {
      // ignore logout API errors
    }
    
    // Simple logout - just redirect to landing page
    // This avoids Authentik logout flow complications
    router.replace("/");
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        padding: '20px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <Link href="/" style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          margin: 0, 
          color: 'white', 
          textDecoration: 'none' 
        }}>
          🎥 AI Video Interview
        </Link>
        <button 
          onClick={onLogout} 
          style={{ 
            background: 'rgba(244, 67, 54, 0.8)', 
            color: 'white', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '6px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main style={{ 
        padding: '40px', 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          padding: '40px',
          borderRadius: '16px',
          marginBottom: '30px'
        }}>
          <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>
            Dashboard
          </h1>
          
          {error && (
            <div style={{ 
              color: '#ffcdd2', 
              backgroundColor: 'rgba(244, 67, 54, 0.1)', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '20px' 
            }}>
              {error}
            </div>
          )}
          
          <div style={{ 
            display: "flex", 
            gap: '16px', 
            marginBottom: '30px', 
            flexWrap: "wrap",
            justifyContent: 'center'
          }}>
            <button 
              onClick={onRefresh}
              style={{
                padding: '12px 24px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Refresh Token
            </button>
            <button 
              onClick={onTestProtected}
              style={{
                padding: '12px 24px',
                background: '#ffd700',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Test Protected Route
            </button>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px'
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px',
              borderRadius: '12px'
            }}>
              <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Status</h3>
              <pre style={{ 
                background: 'rgba(0,0,0,0.2)', 
                padding: '12px', 
                borderRadius: '6px',
                overflow: 'auto',
                fontSize: '14px',
                whiteSpace: 'pre-wrap'
              }}>
                {message}
              </pre>
            </div>
            
            {protectedData && (
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '20px',
                borderRadius: '12px'
              }}>
                <h3 style={{ fontSize: '18px', marginBottom: '12px' }}>Protected Route Response</h3>
                <pre style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '12px', 
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {JSON.stringify(protectedData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
