"use client";
import { useEffect, useState } from "react";
import { apiGet } from "../../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("Processing callback...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const qs = typeof window !== "undefined" ? window.location.search : "";
        // forward the same query to the API; it will set cookies and respond
        const resp = await apiGet<{ success: boolean }>(`/auth/callback${qs}`);
        if (resp && (resp as any).success) {
          setStatus("Login successful. Redirecting to dashboard...");
          setTimeout(() => router.replace("/dashboard"), 1000);
        } else {
          setError("Callback failed - invalid response from server");
        }
      } catch (e: any) {
        setError(e.message || "Callback error");
      }
    };
    run();
  }, [router]);

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
        maxWidth: '480px',
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
        
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>
          {!error ? '🔄' : '❌'}
        </div>
        
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '20px' }}>
          {!error ? 'Authenticating...' : 'Authentication Failed'}
        </h1>
        
        {!error ? (
          <p style={{ fontSize: '16px', opacity: '0.9' }}>{status}</p>
        ) : (
          <div>
            <div style={{ 
              color: '#ffcdd2', 
              backgroundColor: 'rgba(244, 67, 54, 0.1)', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '20px' 
            }}>
              {error}
            </div>
            <Link 
              href="/login"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#ffd700',
                color: '#333',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Try Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
