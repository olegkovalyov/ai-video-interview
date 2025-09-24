# Authentik OAuth2/OIDC Setup Guide for AI Video Interview Platform

## Overview

This guide provides step-by-step instructions for configuring Authentik as the authentication provider for the AI Video Interview platform. The setup includes seamless login flow and automatic logout without intermediate confirmation pages.

## Prerequisites

- Authentik server running on `http://localhost:9443`
- AI Video Interview backend (API Gateway) running on `http://localhost:3002`
- AI Video Interview frontend running on `http://localhost:3000`
- Admin access to Authentik interface

## Architecture Overview

```
User Login Flow:
Frontend → Authentik Login → OAuth2 Callback → Backend Token Exchange → Dashboard

User Logout Flow:  
Frontend Logout Button → Backend API → Token Revocation → End Session URL → 
Authentik Invalidation Flow → Auto Redirect to Frontend Home
```

## Step-by-Step Setup

### Step 1: Create OAuth2/OIDC Provider

1. **Access Authentik Admin Interface:**
   - Navigate to `http://localhost:9443/if/admin/`
   - Login with admin credentials

2. **Create Provider:**
   - Go to `Applications → Providers → Create`
   - Select `OAuth2/OpenID Provider`
   
3. **Provider Configuration:**
   ```
   Name: AI Video Interview OAuth2
   Authentication flow: default-authentication-flow
   Authorization flow: default-provider-authorization-explicit-consent
   
   Client type: Confidential
   Client ID: ai-video-interview (or leave empty to auto-generate)
   Client secret: (leave empty - will be auto-generated)
   
   Redirect URIs/Origins (regex):
   http://localhost:3000/auth/callback
   http://localhost:3000/
   
   Signing Key: (select any available key)
   
   Subject mode: Based on the User's hashed ID
   Include claims in id_token: ✓ (checked)
   
   Scopes: openid, profile, email
   ```

4. **Save and Note Credentials:**
   - Click `Create`
   - **Copy the generated Client ID and Client Secret** - you'll need these for backend configuration

### Step 2: Create Application

1. **Create Application:**
   - Go to `Applications → Applications → Create`
   
2. **Application Configuration:**
   ```
   Name: AI Video Interview
   Slug: ai-video-interview
   Provider: AI Video Interview OAuth2 (select the provider created in Step 1)
   
   Launch URL: http://localhost:3000/
   
   Backchannel providers: (leave empty)
   ```

3. **Save Application:**
   - Click `Create`

### Step 3: Create Test User

1. **Create User:**
   - Go to `Directory → Users → Create`
   
2. **User Configuration:**
   ```
   Username: testuser
   Name: Test User
   Email: testuser@ai-interview.com
   Password: TestPassword123!
   
   Path: users (default)
   Type: internal
   
   ✓ Is active (checked)
   ✗ Is staff (unchecked for regular user)
   ✗ Is superuser (unchecked)
   ```

3. **Assign User to Application:**
   - Go to `Applications → Applications → AI Video Interview`
   - Go to `Policy / Group / User Bindings → Bind existing policy`
   - Create User Binding:
     ```
     User: testuser
     Order: 0
     Timeout: (leave empty)
     ```
   - Click `Create`

### Step 4: Create Redirect Stage for Auto Logout

1. **Create Redirect Stage:**
   - Go to `Flows and stages → Stages → Create`
   - Select `Redirect Stage`
   
2. **Stage Configuration:**
   ```
   Name: Frontend Auto Redirect Stage
   Mode: Static
   Redirect URL: http://localhost:3000/
   ```
   
3. **Save Stage:**
   - Click `Create`

### Step 5: Create Custom Invalidation Flow

1. **Create Flow:**
   - Go to `Flows and stages → Flows → Create`
   
2. **Flow Configuration:**
   ```
   Name: AI Interview Auto Logout Flow
   Title: AI Interview Auto Logout
   Slug: ai-interview-auto-logout-flow
   Designation: Invalidation
   Policy engine mode: any
   Compatibility mode: ✓ (checked)
   Layout: stacked
   ```

3. **Save Flow:**
   - Click `Create`

4. **Add Stages to Flow:**
   - Click on the created `AI Interview Auto Logout Flow`
   - Go to `Stage Bindings` tab → Click `Bind Stage`
   
   **First Stage - User Logout:**
   ```
   Stage: default-invalidation-logout (User Logout)
   Order: 10
   ```
   Click `Create`
   
   **Second Stage - Auto Redirect:**
   ```
   Stage: Frontend Auto Redirect Stage (created in Step 4)
   Order: 20
   ```
   Click `Create`

### Step 6: Configure OAuth2 Provider Invalidation Flow

1. **Edit OAuth2 Provider:**
   - Go to `Applications → Providers`
   - Click on `AI Video Interview OAuth2`
   - Click `Edit`

2. **Update Invalidation Flow:**
   ```
   Invalidation flow: AI Interview Auto Logout Flow
   ```
   
3. **Save Changes:**
   - Click `Update`

> **Important:** The OAuth2 Provider's invalidation flow setting is used by the OIDC End Session endpoint, NOT the Brand's invalidation flow setting.

### Step 7: Update Backend Configuration

1. **Update Environment Variables:**
   Add the following to your backend `.env` file:
   ```bash
   AUTHENTIK_URL=http://localhost:9443
   AUTHENTIK_CLIENT_ID=[your-client-id-from-step-1]
   AUTHENTIK_CLIENT_SECRET=[your-client-secret-from-step-1] 
   AUTHENTIK_ISSUER_URL=http://localhost:9443/application/o/ai-video-interview/
   AUTHENTIK_APP_SLUG=ai-video-interview
   AUTHENTIK_FRONTEND_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:3002
   NEXT_PUBLIC_WEB_ORIGIN=http://localhost:3000
   ```

2. **Restart Backend Service:**
   - Restart your API Gateway service to pick up the new configuration

### Step 8: Testing the Setup

#### Test Login Flow:

1. **Access Application:**
   - Navigate to `http://localhost:3000`
   - Click login or access a protected route

2. **Verify Redirect to Authentik:**
   - Should redirect to Authentik login page
   - URL should be: `http://localhost:9443/if/flow/default-authentication-flow/`

3. **Login with Test User:**
   - Username: `testuser`
   - Password: `TestPassword123!`

4. **Verify Dashboard Access:**
   - Should automatically redirect back to `http://localhost:3000/dashboard`
   - User should be logged in without additional steps

#### Test Logout Flow:

1. **Initiate Logout:**
   - From dashboard, click the Logout button

2. **Verify Automatic Logout:**
   - Should NOT show any Authentik confirmation pages
   - Should automatically redirect to `http://localhost:3000/` (homepage)
   - User should be completely logged out

3. **Verify Session Termination:**
   - Try accessing protected routes - should redirect to login
   - Authentik session should be terminated

## Troubleshooting

### Common Issues:

1. **Logout shows Authentik confirmation page:**
   - Verify OAuth2 Provider has correct Invalidation Flow set
   - Check Redirect Stage is set to Static mode (not Flow mode)
   - Ensure Stage order is correct in the Invalidation Flow

2. **Login redirects to wrong URL:**
   - Check Redirect URIs in OAuth2 Provider settings
   - Verify `NEXT_PUBLIC_WEB_ORIGIN` environment variable

3. **Token exchange fails:**
   - Check Client ID and Client Secret in backend configuration
   - Verify `AUTHENTIK_ISSUER_URL` matches the Application slug

4. **OIDC Discovery returns 404:**
   - Ensure `AUTHENTIK_ISSUER_URL` includes the correct application slug
   - Format should be: `http://localhost:9443/application/o/[application-slug]/`

### Debugging Tips:

1. **Check Authentik Logs:**
   ```bash
   docker compose logs authentik-server
   ```

2. **Check Backend Logs:**
   - Look for OAuth2 exchange and OIDC discovery logs
   - Verify token validation and revocation

3. **Browser Developer Tools:**
   - Check Network tab for redirect chains
   - Verify cookies are set and cleared properly

## Security Considerations

1. **Production Setup:**
   - Use HTTPS for all endpoints
   - Set secure environment variables
   - Configure proper CORS origins
   - Use production-grade secrets

2. **Token Security:**
   - Tokens are stored in HttpOnly cookies
   - Automatic token revocation on logout
   - Proper token expiration times

3. **Session Management:**
   - Sessions terminated on logout
   - No persistent sessions without user consent
   - Proper session invalidation

## API Endpoints

### Backend Authentication Endpoints:

- `GET /auth/login` - Initiate OAuth2 login
- `GET /auth/callback` - Handle OAuth2 callback
- `POST /auth/logout` - Logout and revoke tokens
- `POST /auth/refresh` - Refresh access tokens

### Authentik OIDC Endpoints:

- `/.well-known/openid-configuration` - OIDC Discovery
- `/auth/` - Authorization endpoint  
- `/token/` - Token endpoint
- `/userinfo/` - User info endpoint
- `/end-session/` - End session endpoint
- `/jwks/` - JSON Web Key Set

## Conclusion

This setup provides a seamless authentication experience with:
- Single sign-on through Authentik
- Automatic logout without user intervention
- Secure token management
- Production-ready OAuth2/OIDC implementation

The key insight is that OIDC End Session endpoints use the OAuth2 Provider's invalidation flow, not the Brand's global invalidation flow. This allows for application-specific logout behaviors while maintaining security.
