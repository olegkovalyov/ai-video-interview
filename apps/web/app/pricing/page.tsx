"use client";
import Link from "next/link";

export default function PricingPage() {
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
          <Link href="/about" style={{ color: 'white', textDecoration: 'none', fontWeight: '500' }}>About</Link>
          <Link href="/pricing" style={{ color: '#ffd700', textDecoration: 'none', fontWeight: '500' }}>Pricing</Link>
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
            Simple, <span style={{ color: '#ffd700' }}>Transparent Pricing</span>
          </h1>
          <p style={{ 
            fontSize: '20px', 
            opacity: '0.9', 
            maxWidth: '600px', 
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Choose the perfect plan for your hiring needs. All plans include our core AI analysis 
            and come with a 14-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '40px',
          marginBottom: '80px'
        }}>
          {/* Starter Plan */}
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '40px', 
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                Starter
              </h3>
              <p style={{ opacity: '0.8', fontSize: '16px' }}>
                Perfect for small teams
              </p>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#ffd700' }}>
                $29
              </div>
              <div style={{ opacity: '0.7', fontSize: '16px' }}>
                per month
              </div>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Up to 50 interviews/month
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Basic AI analysis
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Standard templates
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Email support
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Video recording storage (30 days)
              </div>
            </div>

            <Link 
              href="/register"
              style={{ 
                display: 'block',
                padding: '16px 24px', 
                background: 'rgba(255,255,255,0.2)', 
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px', 
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              Start Free Trial
            </Link>
          </div>

          {/* Professional Plan - Featured */}
          <div style={{ 
            background: 'rgba(255,255,255,0.15)', 
            padding: '40px', 
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            position: 'relative',
            border: '2px solid #ffd700'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ffd700',
              color: '#333',
              padding: '6px 20px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              MOST POPULAR
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                Professional
              </h3>
              <p style={{ opacity: '0.8', fontSize: '16px' }}>
                For growing companies
              </p>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#ffd700' }}>
                $99
              </div>
              <div style={{ opacity: '0.7', fontSize: '16px' }}>
                per month
              </div>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Up to 200 interviews/month
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Advanced AI analysis & insights
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Custom question templates
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Priority support
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Video recording storage (90 days)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Team collaboration tools
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Advanced analytics dashboard
              </div>
            </div>

            <Link 
              href="/register"
              style={{ 
                display: 'block',
                padding: '16px 24px', 
                background: '#ffd700', 
                color: '#333', 
                borderRadius: '8px', 
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              Start Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '40px', 
            borderRadius: '16px',
            backdropFilter: 'blur(10px)',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                Enterprise
              </h3>
              <p style={{ opacity: '0.8', fontSize: '16px' }}>
                For large organizations
              </p>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#ffd700' }}>
                $299
              </div>
              <div style={{ opacity: '0.7', fontSize: '16px' }}>
                per month
              </div>
            </div>

            <div style={{ textAlign: 'left', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Unlimited interviews
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Enterprise AI features
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                White-label solution
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                24/7 dedicated support
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Unlimited storage
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Custom integrations
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ffd700', marginRight: '8px' }}>✓</span>
                Advanced security & compliance
              </div>
            </div>

            <Link 
              href="/register"
              style={{ 
                display: 'block',
                padding: '16px 24px', 
                background: 'rgba(255,255,255,0.2)', 
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px', 
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
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
            Frequently Asked Questions
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gap: '30px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#ffd700' }}>
                What's included in the free trial?
              </h3>
              <p style={{ opacity: '0.8', lineHeight: '1.6' }}>
                All plans come with a 14-day free trial that includes full access to all features 
                in your chosen plan. No credit card required to start.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#ffd700' }}>
                Can I change plans anytime?
              </h3>
              <p style={{ opacity: '0.8', lineHeight: '1.6' }}>
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect 
                at your next billing cycle, and we'll prorate any differences.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#ffd700' }}>
                What happens to my data if I cancel?
              </h3>
              <p style={{ opacity: '0.8', lineHeight: '1.6' }}>
                Your data remains accessible for 30 days after cancellation. You can export 
                all your interviews and candidate data during this period.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#ffd700' }}>
                Do you offer volume discounts?
              </h3>
              <p style={{ opacity: '0.8', lineHeight: '1.6' }}>
                Yes! For organizations conducting more than 500 interviews per month, 
                we offer custom pricing with significant discounts. Contact our sales team.
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
            Ready to Transform Your Hiring Process?
          </h2>
          <p style={{ 
            fontSize: '18px', 
            opacity: '0.9', 
            marginBottom: '30px',
            maxWidth: '600px',
            margin: '0 auto 30px'
          }}>
            Start your 14-day free trial today. No credit card required. 
            Cancel anytime. Setup takes less than 5 minutes.
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
              href="/about"
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
              Learn More
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
