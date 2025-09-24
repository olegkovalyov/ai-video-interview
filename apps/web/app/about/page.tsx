"use client";
import Link from "next/link";

export default function AboutPage() {
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
        <nav style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/about" style={{ color: '#ffd700', textDecoration: 'none', fontWeight: '500' }}>About</Link>
          <Link href="/pricing" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>Pricing</Link>
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

      {/* Main Content */}
      <main style={{ 
        padding: '60px 40px', 
        maxWidth: '1200px', 
        margin: '0 auto' 
      }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '800', 
            margin: '0 0 20px 0',
            lineHeight: '1.2'
          }}>
            About <span style={{ color: '#ffd700' }}>AI Video Interview</span>
          </h1>
          <p style={{ 
            fontSize: '20px', 
            opacity: '0.9', 
            maxWidth: '600px', 
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            We're revolutionizing the hiring process with cutting-edge AI technology 
            that makes interviews smarter, faster, and more effective.
          </p>
        </div>

        {/* Mission Section */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '50px', 
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          marginBottom: '60px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '20px' }}>
              Our Mission
            </h2>
            <p style={{ 
              fontSize: '18px', 
              opacity: '0.9', 
              maxWidth: '800px', 
              margin: '0 auto',
              lineHeight: '1.6'
            }}>
              To empower companies worldwide to find the perfect candidates faster and more accurately 
              than ever before, while providing candidates with a fair and engaging interview experience.
            </p>
          </div>
        </div>

        {/* Features Detailed */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ 
            fontSize: '36px', 
            fontWeight: '700', 
            textAlign: 'center', 
            marginBottom: '50px' 
          }}>
            What Makes Us Different
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: '40px'
          }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '40px', 
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px', textAlign: 'center' }}>🤖</div>
              <h3 style={{ fontSize: '24px', marginBottom: '16px', textAlign: 'center' }}>
                Advanced AI Analysis
              </h3>
              <p style={{ opacity: '0.8', lineHeight: '1.6', textAlign: 'center' }}>
                Our proprietary AI algorithms analyze facial expressions, speech patterns, 
                and content quality to provide comprehensive candidate insights that go beyond traditional interviews.
              </p>
            </div>

            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '40px', 
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px', textAlign: 'center' }}>🎯</div>
              <h3 style={{ fontSize: '24px', marginBottom: '16px', textAlign: 'center' }}>
                Precision Matching
              </h3>
              <p style={{ opacity: '0.8', lineHeight: '1.6', textAlign: 'center' }}>
                Match candidates to roles with unprecedented accuracy using machine learning 
                models trained on thousands of successful hires across various industries.
              </p>
            </div>

            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '40px', 
              borderRadius: '12px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px', textAlign: 'center' }}>⚡</div>
              <h3 style={{ fontSize: '24px', marginBottom: '16px', textAlign: 'center' }}>
                Lightning Fast
              </h3>
              <p style={{ opacity: '0.8', lineHeight: '1.6', textAlign: 'center' }}>
                Reduce your hiring timeline from weeks to days. Get real-time candidate 
                evaluation and instant recommendations as soon as interviews are completed.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '50px', 
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          marginBottom: '60px'
        }}>
          <h2 style={{ 
            fontSize: '36px', 
            fontWeight: '700', 
            textAlign: 'center', 
            marginBottom: '40px' 
          }}>
            Trusted by Industry Leaders
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '30px',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#ffd700', marginBottom: '8px' }}>
                500+
              </div>
              <div style={{ fontSize: '18px', opacity: '0.8' }}>Companies Trust Us</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#ffd700', marginBottom: '8px' }}>
                50K+
              </div>
              <div style={{ fontSize: '18px', opacity: '0.8' }}>Interviews Conducted</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#ffd700', marginBottom: '8px' }}>
                70%
              </div>
              <div style={{ fontSize: '18px', opacity: '0.8' }}>Faster Hiring Process</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#ffd700', marginBottom: '8px' }}>
                95%
              </div>
              <div style={{ fontSize: '18px', opacity: '0.8' }}>Customer Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ 
            fontSize: '36px', 
            fontWeight: '700', 
            textAlign: 'center', 
            marginBottom: '50px' 
          }}>
            Meet Our Team
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '40px'
          }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '30px', 
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: '#ffd700', 
                borderRadius: '50%', 
                margin: '0 auto 20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '32px'
              }}>
                👨‍💼
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Alex Johnson</h3>
              <p style={{ opacity: '0.7', marginBottom: '12px' }}>CEO & Co-founder</p>
              <p style={{ opacity: '0.8', fontSize: '14px', lineHeight: '1.5' }}>
                Former VP of Engineering at TechCorp. 10+ years in AI and machine learning.
              </p>
            </div>

            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '30px', 
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: '#ffd700', 
                borderRadius: '50%', 
                margin: '0 auto 20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '32px'
              }}>
                👩‍🔬
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Dr. Sarah Chen</h3>
              <p style={{ opacity: '0.7', marginBottom: '12px' }}>CTO & Co-founder</p>
              <p style={{ opacity: '0.8', fontSize: '14px', lineHeight: '1.5' }}>
                PhD in Computer Vision from Stanford. Leading expert in behavioral analysis AI.
              </p>
            </div>

            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '30px', 
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              textAlign: 'center'
            }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: '#ffd700', 
                borderRadius: '50%', 
                margin: '0 auto 20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '32px'
              }}>
                👨‍💻
              </div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Mike Rodriguez</h3>
              <p style={{ opacity: '0.7', marginBottom: '12px' }}>Head of Product</p>
              <p style={{ opacity: '0.8', fontSize: '14px', lineHeight: '1.5' }}>
                Former Product Lead at Google. Passionate about creating intuitive user experiences.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '50px', 
          borderRadius: '16px',
          backdropFilter: 'blur(10px)',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px', fontWeight: '700' }}>
            Ready to Experience the Future of Hiring?
          </h2>
          <p style={{ 
            fontSize: '18px', 
            opacity: '0.9', 
            marginBottom: '30px',
            maxWidth: '600px',
            margin: '0 auto 30px'
          }}>
            Join thousands of companies already using AI Video Interview to find their perfect candidates.
          </p>
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
              Start Free Trial
            </Link>
            <Link 
              href="/pricing"
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
              View Pricing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
