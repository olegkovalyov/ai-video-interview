"use client";
import Link from "next/link";

export default function LandingPage() {
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
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
          🎥 AI Video Interview
        </h1>
        <nav style={{ display: 'flex', gap: '16px' }}>
          <Link 
            href="/login" 
            style={{ 
              padding: '8px 16px', 
              background: 'rgba(255,255,255,0.2)', 
              borderRadius: '6px', 
              textDecoration: 'none', 
              color: 'white',
              fontWeight: '500'
            }}
          >
            Login
          </Link>
          <Link 
            href="/register"
            style={{ 
              padding: '8px 16px', 
              background: 'white', 
              color: '#667eea', 
              borderRadius: '6px', 
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Sign Up
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main style={{ 
        padding: '80px 40px', 
        textAlign: 'center', 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ 
            fontSize: '48px', 
            fontWeight: '800', 
            margin: '0 0 20px 0',
            lineHeight: '1.2'
          }}>
            Revolutionize Your
            <br />
            <span style={{ color: '#ffd700' }}>AI-Powered Interviews</span>
          </h2>
          <p style={{ 
            fontSize: '20px', 
            opacity: '0.9', 
            maxWidth: '600px', 
            margin: '0 auto 40px auto',
            lineHeight: '1.6'
          }}>
            Experience next-generation video interviews with AI analysis, 
            real-time feedback, and comprehensive candidate evaluation.
          </p>
        </div>

        {/* Features Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '30px',
          marginBottom: '60px'
        }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '30px', 
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Smart Analysis</h3>
            <p style={{ opacity: '0.8', lineHeight: '1.5' }}>
              AI-powered evaluation of communication skills, technical knowledge, and personality traits.
            </p>
          </div>
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '30px', 
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Real-time Insights</h3>
            <p style={{ opacity: '0.8', lineHeight: '1.5' }}>
              Get instant feedback and detailed reports on candidate performance and potential.
            </p>
          </div>
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '30px', 
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Streamlined Process</h3>
            <p style={{ opacity: '0.8', lineHeight: '1.5' }}>
              Reduce hiring time by 70% with automated screening and intelligent matching.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '40px', 
          borderRadius: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <h3 style={{ fontSize: '28px', marginBottom: '20px', fontWeight: '700' }}>
            Ready to Transform Your Hiring?
          </h3>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              href="/register"
              style={{ 
                padding: '16px 32px', 
                background: '#ffd700', 
                color: '#333', 
                borderRadius: '8px', 
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '18px',
                display: 'inline-block'
              }}
            >
              Create Account
            </Link>
            <Link 
              href="/login"
              style={{ 
                padding: '16px 32px', 
                background: 'rgba(255,255,255,0.2)', 
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px', 
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '18px',
                display: 'inline-block'
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
