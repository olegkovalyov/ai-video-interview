# 🔐 AUTHENTICATION & USER FLOW - Detailed Sequence

## 🎯 Overview

Этот документ описывает детальное взаимодействие между компонентами:
- **Next.js Frontend** - UI
- **API Gateway** - Entry point, auth orchestration
- **Keycloak** - Identity Provider (OAuth2/OIDC)
- **User Service** - User data storage

---

## 📊 FLOW 1: Initial Login & User Creation

```mermaid
sequenceDiagram
    participant User as 👤 User Browser
    participant Next as Next.js Frontend
    participant Gateway as API Gateway
    participant Keycloak as Keycloak
    participant UserService as User Service
    participant Kafka as Kafka

    Note over User,Kafka: STEP 1: User clicks "Login"
    
    User->>Next: Click "Login" button
    Next->>Next: Redirect to /auth/login
    Next->>Gateway: GET /auth/login
    
    Note over Gateway: Generate state & redirect URL
    Gateway->>Gateway: state = uuid()
    Gateway-->>Next: 302 Redirect to Keycloak
    
    Next->>Keycloak: GET /realms/ai-video-interview/protocol/openid-connect/auth
    Note right of Keycloak: Query params:<br/>response_type=code<br/>client_id=ai-video-interview-app<br/>redirect_uri=http://localhost:3000/auth/callback<br/>state={uuid}<br/>scope=openid profile email
    
    Note over User,Keycloak: STEP 2: Keycloak Authentication
    
    Keycloak-->>User: Show Login Form
    User->>Keycloak: Enter credentials + Submit
    Keycloak->>Keycloak: Validate credentials
    
    alt First Time Login
        Keycloak->>Keycloak: Create Keycloak user
        Keycloak->>Keycloak: Generate tokens
    else Existing User
        Keycloak->>Keycloak: Load existing user
        Keycloak->>Keycloak: Generate tokens
    end
    
    Keycloak-->>Next: 302 Redirect to /auth/callback?code={auth_code}&state={uuid}
    
    Note over User,Kafka: STEP 3: Token Exchange
    
    Next->>Gateway: GET /auth/callback?code={auth_code}&state={uuid}
    Gateway->>Gateway: Validate state
    Gateway->>Keycloak: POST /token<br/>(Exchange code for tokens)
    
    Note right of Gateway: Body:<br/>grant_type=authorization_code<br/>code={auth_code}<br/>redirect_uri=http://localhost:3000/auth/callback<br/>client_id=ai-video-interview-app
    
    Keycloak->>Keycloak: Validate auth code
    Keycloak-->>Gateway: Return tokens<br/>{access_token, refresh_token, id_token}
    
    Gateway->>Keycloak: GET /userinfo<br/>(with access_token)
    Keycloak-->>Gateway: User Info<br/>{sub, email, name, etc.}
    
    Note over User,Kafka: STEP 4: User Service Sync
    
    Gateway->>UserService: GET /internal/users/by-keycloak/{sub}
    
    alt User Exists in User Service
        UserService-->>Gateway: User data {id, email, roles}
        UserService->>UserService: Update last_login_at
        UserService->>Kafka: Publish user_logged_in event
    else User Does NOT Exist
        Note over UserService: First login - create user
        UserService->>UserService: Create user record<br/>(keycloak_id, email, name)
        UserService->>UserService: Assign default role (Candidate)
        UserService->>Kafka: Publish user.created event
        UserService-->>Gateway: New user data {id, email, roles}
    end
    
    Note over User,Kafka: STEP 5: JWT Enrichment & Cookie Setup
    
    Gateway->>Gateway: Enrich tokens with user data<br/>(userId, roles from User Service)
    Gateway->>Gateway: Set secure HTTP-only cookies<br/>- access_token<br/>- refresh_token<br/>- id_token
    
    Gateway-->>Next: 302 Redirect to /dashboard<br/>+ Set-Cookie headers
    
    Next->>Next: Store auth state in client
    Next-->>User: Show Dashboard
    
    Note over User,Kafka: COMPLETED: User is authenticated
```

---

## 📊 FLOW 2: Protected Resource Access (with JWT validation)

```mermaid
sequenceDiagram
    participant User as 👤 User Browser
    participant Next as Next.js Frontend
    participant Gateway as API Gateway
    participant Keycloak as Keycloak
    participant UserService as User Service
    participant InterviewService as Interview Service

    Note over User,InterviewService: User wants to access protected resource
    
    User->>Next: Click "My Interviews"
    Next->>Gateway: GET /interviews<br/>Cookie: access_token={jwt}
    
    Note over Gateway: STEP 1: JWT Validation
    
    Gateway->>Gateway: Extract access_token from cookie
    Gateway->>Gateway: Verify JWT signature<br/>(using Keycloak public key)
    
    alt JWT Valid
        Gateway->>Gateway: Extract claims<br/>{sub, email, exp, roles}
        
        Note over Gateway: STEP 2: Get User Data
        
        Gateway->>UserService: GET /users/{sub}/permissions<br/>(check if user still active)
        UserService-->>Gateway: {userId, roles, permissions, status}
        
        alt User Active
            Gateway->>Gateway: Enrich request context<br/>req.user = {userId, roles, permissions}
            
            Note over Gateway: STEP 3: Authorization Check
            
            Gateway->>Gateway: Check permission: interviews:read
            
            alt Has Permission
                Gateway->>InterviewService: GET /interviews<br/>Headers: X-User-Id, X-User-Roles
                InterviewService-->>Gateway: Interviews data
                Gateway-->>Next: 200 OK + interviews
                Next-->>User: Show interviews list
            else No Permission
                Gateway-->>Next: 403 Forbidden
                Next-->>User: "Access Denied"
            end
            
        else User Suspended/Deleted
            Gateway-->>Next: 401 Unauthorized<br/>{error: "User account suspended"}
            Next->>Next: Clear cookies & redirect to login
        end
        
    else JWT Expired
        Note over Gateway,Next: Token expired - try refresh
        Gateway-->>Next: 401 Unauthorized<br/>{error: "Token expired", action: "refresh"}
        
        Next->>Gateway: POST /auth/refresh<br/>Cookie: refresh_token
        
        Note over Gateway,Keycloak: See FLOW 3: Token Refresh
    else JWT Invalid
        Gateway-->>Next: 401 Unauthorized<br/>{error: "Invalid token"}
        Next->>Next: Clear cookies & redirect to login
    end
```

---

## 📊 FLOW 3: Token Refresh

```mermaid
sequenceDiagram
    participant Next as Next.js Frontend
    participant Gateway as API Gateway
    participant Keycloak as Keycloak
    participant UserService as User Service

    Note over Next,UserService: Access token expired, refresh it
    
    Next->>Gateway: POST /auth/refresh<br/>Cookie: refresh_token={jwt}
    
    Gateway->>Gateway: Extract refresh_token from cookie
    Gateway->>Gateway: Validate refresh_token signature
    
    alt Refresh Token Valid
        Gateway->>Keycloak: POST /token<br/>grant_type=refresh_token<br/>refresh_token={jwt}
        
        Keycloak->>Keycloak: Validate refresh_token
        
        alt Refresh Token Still Valid
            Keycloak->>Keycloak: Generate new access_token
            Keycloak-->>Gateway: New tokens<br/>{access_token, refresh_token, id_token}
            
            Gateway->>Gateway: Set new cookies
            Gateway-->>Next: 200 OK<br/>+ Set-Cookie headers
            
            Next->>Next: Update local state
            Next->>Gateway: Retry original request<br/>(with new access_token)
            
        else Refresh Token Expired
            Keycloak-->>Gateway: 401 Token expired
            Gateway-->>Next: 401 Unauthorized
            Next->>Next: Clear cookies
            Next->>Next: Redirect to /login
        end
        
    else Refresh Token Invalid
        Gateway-->>Next: 401 Unauthorized
        Next->>Next: Clear cookies & redirect to login
    end
```

---

## 📊 FLOW 4: User Profile Update

```mermaid
sequenceDiagram
    participant User as 👤 User Browser
    participant Next as Next.js Frontend
    participant Gateway as API Gateway
    participant UserService as User Service
    participant Kafka as Kafka

    Note over User,Kafka: User updates profile
    
    User->>Next: Edit profile form<br/>(firstName, lastName, bio)
    Next->>Next: Validate form
    User->>Next: Click "Save"
    
    Next->>Gateway: PUT /users/me<br/>Cookie: access_token<br/>Body: {firstName, lastName, bio}
    
    Note over Gateway: STEP 1: Authentication
    
    Gateway->>Gateway: Validate JWT
    Gateway->>Gateway: Extract userId from JWT
    
    Note over Gateway: STEP 2: Route to User Service
    
    Gateway->>UserService: PUT /users/{userId}<br/>Headers: X-User-Id={userId}<br/>Body: {firstName, lastName, bio}
    
    UserService->>UserService: Validate request<br/>(userId matches X-User-Id)
    UserService->>UserService: Validate data (DTO validation)
    UserService->>UserService: Update database
    
    Note over UserService: STEP 3: Publish Event
    
    UserService->>Kafka: Publish user.updated event<br/>{<br/>  eventType: "user.updated",<br/>  userId: "{uuid}",<br/>  changes: {firstName, lastName, bio}<br/>}
    
    UserService-->>Gateway: 200 OK<br/>{user: updated_user_data}
    Gateway-->>Next: 200 OK<br/>{user: updated_user_data}
    
    Next->>Next: Update local state
    Next-->>User: Show success message<br/>"Profile updated!"
    
    Note over Kafka: Other services can listen to user.updated event
```

---

## 📊 FLOW 5: Avatar Upload

```mermaid
sequenceDiagram
    participant User as 👤 User Browser
    participant Next as Next.js Frontend
    participant Gateway as API Gateway
    participant UserService as User Service
    participant MinIO as MinIO Storage
    participant Kafka as Kafka

    User->>Next: Select avatar file
    Next->>Next: Validate file<br/>(size, type)
    User->>Next: Click "Upload"
    
    Next->>Gateway: POST /users/me/avatar<br/>Content-Type: multipart/form-data<br/>Cookie: access_token
    
    Gateway->>Gateway: Validate JWT
    Gateway->>Gateway: Extract userId
    
    Gateway->>UserService: POST /users/{userId}/avatar<br/>Headers: X-User-Id<br/>Body: multipart file
    
    UserService->>UserService: Validate file<br/>(max 5MB, image types only)
    
    UserService->>UserService: Generate unique filename<br/>{userId}-{timestamp}.jpg
    
    UserService->>MinIO: PUT /user-avatars/{filename}<br/>Body: file stream
    MinIO-->>UserService: 200 OK<br/>{url: "http://minio/user-avatars/..."}
    
    UserService->>UserService: Update users.avatar_url
    UserService->>Kafka: Publish user.updated event<br/>{changes: {avatarUrl}}
    
    UserService-->>Gateway: 200 OK<br/>{avatarUrl: "http://..."}
    Gateway-->>Next: 200 OK<br/>{avatarUrl: "http://..."}
    
    Next->>Next: Update avatar in UI
    Next-->>User: Show new avatar
```

---

## 📊 FLOW 6: Role Assignment (Admin action)

```mermaid
sequenceDiagram
    participant Admin as 👤 Admin User
    participant Next as Next.js Frontend
    participant Gateway as API Gateway
    participant UserService as User Service
    participant Kafka as Kafka

    Admin->>Next: Navigate to User Management
    Next->>Gateway: GET /users<br/>Cookie: access_token (Admin role)
    
    Gateway->>Gateway: Validate JWT
    Gateway->>Gateway: Check permission: users:read
    
    Gateway->>UserService: GET /users?page=1&limit=20
    UserService-->>Gateway: Users list
    Gateway-->>Next: Users list
    Next-->>Admin: Show users table
    
    Note over Admin,Kafka: Admin assigns HR role to user
    
    Admin->>Next: Click "Assign Role" for user
    Next-->>Admin: Show role selection modal
    Admin->>Next: Select "HR" role + Confirm
    
    Next->>Gateway: POST /users/{targetUserId}/roles<br/>Cookie: access_token (Admin)<br/>Body: {roleId: "hr-role-uuid"}
    
    Gateway->>Gateway: Validate JWT
    Gateway->>Gateway: Check permission: roles:manage
    
    alt Has Permission
        Gateway->>UserService: POST /users/{targetUserId}/roles<br/>Headers: X-User-Id={adminUserId}<br/>Body: {roleId}
        
        UserService->>UserService: Validate role exists
        UserService->>UserService: Check user doesn't have role already
        UserService->>UserService: Insert into user_roles table
        
        UserService->>Kafka: Publish user.role_assigned event<br/>{<br/>  userId: "{targetUserId}",<br/>  roleId: "hr-role-uuid",<br/>  roleName: "HR",<br/>  assignedBy: "{adminUserId}"<br/>}
        
        UserService-->>Gateway: 200 OK<br/>{message: "Role assigned"}
        Gateway-->>Next: 200 OK
        Next-->>Admin: Show success<br/>"HR role assigned!"
        
    else No Permission
        Gateway-->>Next: 403 Forbidden
        Next-->>Admin: "Access Denied"
    end
```

---

## 🔑 Key Concepts Explained

### **1. JWT Flow:**
```typescript
// JWT содержит:
{
  sub: "keycloak-user-id",           // Subject (Keycloak ID)
  email: "user@example.com",
  preferred_username: "johndoe",
  exp: 1234567890,                   // Expiration timestamp
  iat: 1234567890,                   // Issued at
  aud: "ai-video-interview-app",     // Audience
  iss: "http://localhost:8090/realms/ai-video-interview",
  
  // Custom claims (enriched by API Gateway):
  userId: "user-service-uuid",       // From User Service
  roles: ["HR"],                     // From User Service
}
```

### **2. Cookie Strategy:**
```typescript
// API Gateway sets these cookies:
Set-Cookie: access_token={jwt}; HttpOnly; Secure; SameSite=Strict; Max-Age=300
Set-Cookie: refresh_token={jwt}; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000
Set-Cookie: id_token={jwt}; HttpOnly; Secure; SameSite=Strict; Max-Age=300

// Frontend никогда не видит tokens (HttpOnly)
// XSS protected
```

### **3. User Service as Source of Truth:**
```typescript
// Keycloak хранит:
- Authentication credentials
- OAuth sessions
- Basic profile (email, name)

// User Service хранит:
- Extended profile (bio, phone, avatar)
- Roles & permissions
- Application-specific data
- User preferences
- Activity tracking

// API Gateway обращается к обоим:
1. Keycloak → validate JWT
2. User Service → get roles, check status
```

### **4. Request Headers Enrichment:**
```typescript
// API Gateway добавляет headers при проксировании:
X-User-Id: "123e4567-e89b-12d3-a456-426614174000"
X-User-Email: "user@example.com"
X-User-Roles: "HR,Admin"
X-User-Permissions: "interviews:read,interviews:write"
X-Trace-Id: "trace-uuid"
X-Span-Id: "span-uuid"

// Downstream сервисы могут доверять этим headers
// (так как они приходят из API Gateway, который валидировал JWT)
```

---

## 🔐 Security Considerations

### **1. Where validation happens:**

```typescript
// API Gateway:
✅ JWT signature validation (using Keycloak public key)
✅ JWT expiration check
✅ Cookie extraction
✅ Basic authorization (roles/permissions)
✅ Rate limiting

// User Service:
✅ User exists & active check
✅ Data validation (DTOs)
✅ Business logic validation
✅ Database constraints

// Keycloak:
✅ Credentials validation
✅ OAuth flow
✅ Token generation
✅ Token revocation
```

### **2. Token Invalidation:**

```typescript
// On logout:
1. Frontend → DELETE /auth/logout
2. API Gateway → revoke tokens in Keycloak
3. API Gateway → clear cookies
4. Frontend → clear local state

// On user suspension (Admin action):
1. Admin → PUT /users/{id} {status: "suspended"}
2. User Service → update DB
3. User Service → publish user.status_changed event
4. API Gateway listens → adds user to "suspended" cache
5. Next request → 401 Unauthorized (even if JWT valid)
```

### **3. Role-based Access Control:**

```typescript
// API Gateway checks permissions BEFORE proxying:

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'HR')
@Post('/interviews')
createInterview() {
  // This route requires Admin OR HR role
  // Gateway checks JWT → extracts roles → allows/denies
}

// If user has role but User Service says suspended:
// → 401 Unauthorized (User Service check happens in JwtAuthGuard)
```

---

## 🚀 Performance Optimizations

### **1. JWT Caching:**
```typescript
// API Gateway caches Keycloak public key:
- Fetch once at startup
- Refresh every 1 hour
- Use for JWT signature validation
- No need to call Keycloak on every request
```

### **2. User Service Caching:**
```typescript
// Cache user permissions in Redis:
Key: user:{userId}:permissions
Value: ["interviews:read", "interviews:write", ...]
TTL: 5 minutes

// On role change → invalidate cache
```

### **3. Connection Pooling:**
```typescript
// API Gateway → User Service:
- HTTP connection pool (keep-alive)
- gRPC for internal communication (future)
```

---

## 📊 Error Handling

### **Common Error Scenarios:**

```typescript
// 1. JWT Expired
Response: 401 Unauthorized
Body: {
  error: "token_expired",
  message: "Access token has expired",
  action: "refresh"  // Frontend should call /auth/refresh
}

// 2. User Suspended
Response: 401 Unauthorized
Body: {
  error: "user_suspended",
  message: "Your account has been suspended",
  action: "logout"
}

// 3. No Permission
Response: 403 Forbidden
Body: {
  error: "forbidden",
  message: "You don't have permission to access this resource",
  required_permission: "interviews:write"
}

// 4. User Service Unavailable
Response: 503 Service Unavailable
Body: {
  error: "service_unavailable",
  message: "User service is temporarily unavailable",
  action: "retry"
}
```

---

## 🔄 Data Consistency

### **How we keep data in sync:**

```typescript
// 1. Keycloak as Primary for Authentication
- User changes password in Keycloak
- No sync needed (User Service doesn't store passwords)

// 2. User Service as Primary for Profile
- User updates profile in User Service
- Keycloak doesn't need to know (it only stores email/name)
- Kafka event published for other services

// 3. Email/Name sync on login
- If email changed in Keycloak:
  → API Gateway sees new email in JWT
  → Calls User Service to update email
  → User Service publishes user.updated event

// 4. Role changes immediate effect
- Admin assigns role in User Service
- Next request → API Gateway gets new roles
- Authorization updated immediately
```

---

## 📈 Monitoring & Observability

### **What to track:**

```typescript
// Metrics:
- auth_login_total (counter)
- auth_login_duration_seconds (histogram)
- auth_token_refresh_total (counter)
- user_service_requests_total (counter)
- jwt_validation_errors_total (counter)

// Logs:
{service_name="api-gateway", category="authentication", action="login_success"}
{service_name="user-service", action="user_created"}
{service_name="api-gateway", level="ERROR", message="JWT validation failed"}

// Traces:
- Full trace from Login button click → Dashboard display
- Spans: Next.js → Gateway → Keycloak → User Service
- Trace ID passed through all services
```

---

## ✅ Summary

### **Component Responsibilities:**

| Component | Responsibility |
|-----------|---------------|
| **Next.js** | UI, Client state, Cookie management, API calls |
| **API Gateway** | Entry point, JWT validation, Authorization, Routing, Token refresh |
| **Keycloak** | Authentication, OAuth2/OIDC, Token generation, User credentials |
| **User Service** | User profiles, Roles, Permissions, User data storage, Kafka events |
| **Kafka** | Event bus, Async communication between services |

### **Flow Summary:**

1. **Login** → Next.js → Gateway → Keycloak → User Service → Kafka
2. **Access Protected Resource** → Next.js → Gateway (validates JWT + checks User Service) → Downstream Service
3. **Token Refresh** → Next.js → Gateway → Keycloak
4. **Profile Update** → Next.js → Gateway → User Service → Kafka

---

**Документация обновлена: 2025-09-30**
**Следующий шаг: Начать implementation User Service! 🚀**
