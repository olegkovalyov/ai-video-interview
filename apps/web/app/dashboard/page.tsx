"use client";
import { useEffect, useState } from "react";
import { apiPost, apiGet } from "../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ interviews: 0, candidates: 0, responses: 0 });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await apiGet("/protected") as { user: any };
        setUser(res.user);
        // TODO: Load real stats from API
        setStats({ interviews: 3, candidates: 12, responses: 8 });
      } catch (e: any) {
        if (e.message?.includes('401')) {
          router.replace("/login");
        } else {
          setError("Failed to load user data");
        }
      }
    };

    loadUserData();
  }, [router]);

  const onLogout = async () => {
    if (isLoggingOut) return; // Предотвращаем множественные клики
    
    setIsLoggingOut(true);
    try {
      // Вызов logout API для полного OIDC logout
      const response = await apiPost("/auth/logout") as { 
        success: boolean; 
        requiresRedirect?: boolean; 
        endSessionEndpoint?: string; 
      };
      
      // Если требуется redirect в Authentik - выполнить
      if (response.requiresRedirect && response.endSessionEndpoint) {
        console.log('Redirecting to Authentik End Session:', response.endSessionEndpoint);
        window.location.href = response.endSessionEndpoint;
        return; // Authentik сам перенаправит обратно
      }
      
      // Fallback - простой redirect если End Session недоступен
      router.replace("/");
    } catch (error) {
      console.error('Logout error:', error);
      // При ошибке все равно редиректим - логаут должен быть надежным
      router.replace("/");
    } finally {
      setIsLoggingOut(false);
    }
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

        {/* Welcome Section */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          padding: '40px',
          borderRadius: '16px',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '12px' }}>
            Welcome back{user?.name ? `, ${user.name}` : ''}! 👋
          </h1>
          <p style={{ fontSize: '18px', opacity: '0.8', marginBottom: '30px' }}>
            Manage your AI-powered video interviews and analyze candidate responses
          </p>
          
          {/* Quick Stats */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '20px',
            marginTop: '30px'
          }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#ffd700' }}>{stats.interviews}</div>
              <div style={{ fontSize: '14px', opacity: '0.8' }}>Active Interviews</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#4ade80' }}>{stats.candidates}</div>
              <div style={{ fontSize: '14px', opacity: '0.8' }}>Total Candidates</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '20px', borderRadius: '12px' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#60a5fa' }}>{stats.responses}</div>
              <div style={{ fontSize: '14px', opacity: '0.8' }}>Pending Reviews</div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* Create New Interview */}
          <Link href="/dashboard/interviews/create" style={{
            display: 'block',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '30px',
            borderRadius: '16px',
            textDecoration: 'none',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>➕</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>Create Interview</h3>
            <p style={{ opacity: '0.8', textAlign: 'center', margin: 0 }}>Set up a new video interview with custom questions</p>
          </Link>

          {/* My Interviews */}
          <Link href="/dashboard/interviews" style={{
            display: 'block',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '30px',
            borderRadius: '16px',
            textDecoration: 'none',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>📋</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>My Interviews</h3>
            <p style={{ opacity: '0.8', textAlign: 'center', margin: 0 }}>View and manage all your interviews</p>
          </Link>

          {/* Analytics */}
          <Link href="/dashboard/analytics" style={{
            display: 'block',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '30px',
            borderRadius: '16px',
            textDecoration: 'none',
            color: 'white',
            border: '2px solid rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', textAlign: 'center' }}>📊</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>Analytics</h3>
            <p style={{ opacity: '0.8', textAlign: 'center', margin: 0 }}>View performance insights and reports</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          padding: '30px',
          borderRadius: '16px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px' }}>Recent Activity</h2>
          <div style={{ textAlign: 'center', padding: '40px', opacity: '0.6' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
            <p style={{ fontSize: '16px' }}>No recent activity yet. Create your first interview to get started!</p>
          </div>
        </div>
      </main>
    </div>
  );
}
