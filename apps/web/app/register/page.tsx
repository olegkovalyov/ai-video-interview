"use client";
import Link from "next/link";

export default function RegisterPage() {
  const handleRegister = () => {
    // Direct to Authentik enrollment with proper redirect
    const callbackUrl = `${process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000'}/auth/callback`;
    const enrollmentUrl = `http://localhost:9443/flows/enrollment/ai-video-interview/?next=${encodeURIComponent(callbackUrl)}`;
    window.location.assign(enrollmentUrl);
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
          Create Account
        </h1>
        
        <p style={{ fontSize: '16px', opacity: '0.9', marginBottom: '32px', lineHeight: '1.5' }}>
          Join AI Video Interview platform to revolutionize your hiring process with intelligent candidate evaluation.
        </p>
        
        <button 
          onClick={handleRegister}
          style={{
            width: '100%',
            padding: '16px',
            background: '#ffd700',
            color: '#333',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          Continue with Authentik
        </button>
        
        <p style={{ margin: '0', opacity: '0.9' }}>
          Already have an account?{' '}
          <Link 
            href="/login"
            style={{ color: '#ffd700', textDecoration: 'none', fontWeight: '600' }}
          >
            Sign in
          </Link>
        </p>
        
        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <p style={{ margin: '0', fontSize: '14px', opacity: '0.8' }}>
            You'll be redirected to our secure registration system. After creating your account, you'll automatically return to the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
