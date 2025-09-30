# ✅ REGISTRATION SETUP CHECKLIST

## 🎯 **ЧТО УЖЕ РАБОТАЕТ**

### ✅ **Frontend (Next.js)**
- Страница `/register` готова
- UI с кнопкой "Continue with Keycloak"
- Вызов API `/auth/register?redirect_uri=...`
- Callback обработка `/auth/callback`
- Редирект на dashboard после успеха

### ✅ **Backend (NestJS)**
- Endpoint `GET /auth/register` работает
- `authService.initiateRegister()` генерирует URL с `kc_action=register`
- `keycloakService.getRegistrationUrl()` формирует правильный URL
- Callback processing (общий для login и register)
- Kafka события публикуются
- Metrics и Tracing включены

### ✅ **OAuth2 Flow**
```
1. User → /register
2. Frontend → GET /auth/register?redirect_uri=http://localhost:3000/auth/callback
3. Backend → { authUrl: "http://localhost:8090/realms/.../auth?...&kc_action=register" }
4. Frontend → redirect на Keycloak
5. User заполняет форму регистрации
6. Keycloak → redirect на /auth/callback?code=...&state=...
7. Backend → exchange code for tokens
8. Backend → set cookies + publish Kafka event
9. Frontend → redirect на /dashboard
```

---

## 🔧 **ЧТО НУЖНО НАСТРОИТЬ В KEYCLOAK**

### **1️⃣ ВКЛЮЧИТЬ USER REGISTRATION**

**Путь:** Keycloak Admin Console → Realms → ai-video-interview → Realm Settings → Login

**Настройки:**
- ✅ **User registration**: ON
- ✅ **Forgot password**: ON (опционально)
- ✅ **Remember me**: ON (опционально)
- ✅ **Verify email**: ON (рекомендуется для production)
- ✅ **Login with email**: ON

**Скриншот где искать:**
```
http://localhost:8090/admin/master/console/#/ai-video-interview/realm-settings/login
```

---

### **2️⃣ НАСТРОИТЬ EMAIL (ДЛЯ VERIFICATION)**

**Опционально для dev, обязательно для production!**

**Путь:** Realm Settings → Email

**Для DEV (без реального SMTP):**
```
Host: mailhog или mailtrap
Port: 1025
From: noreply@ai-video-interview.com
✅ SSL/TLS: OFF для local dev
```

**Для PRODUCTION (real SMTP):**
```
Host: smtp.gmail.com / smtp.sendgrid.net / etc
Port: 587
From: noreply@yourdomain.com
Authentication: ON
Username: your-email@gmail.com
Password: your-app-password
✅ SSL/TLS: ON
```

---

### **3️⃣ НАСТРОИТЬ REQUIRED ACTIONS**

**Путь:** Authentication → Required Actions

**Включить:**
- ✅ **Verify Email** - проверка email при регистрации
- ✅ **Update Profile** - обновление профиля (опционально)
- ✅ **Configure OTP** - 2FA (опционально для pro users)

**Для dev можно ОТКЛЮЧИТЬ Verify Email**, чтобы сразу логиниться.

---

### **4️⃣ REGISTRATION FLOW CUSTOMIZATION**

**Путь:** Authentication → Flows → Registration

**Проверить что есть:**
- ✅ **Registration Form** (execution: REQUIRED)
- ✅ **Profile Validation** (execution: REQUIRED) 
- ✅ **Password Validation** (execution: REQUIRED)
- ✅ **Recaptcha** (execution: DISABLED для dev, REQUIRED для prod)

**Что собирать при регистрации:**
- ✅ Email (обязательно)
- ✅ First Name (обязательно)
- ✅ Last Name (обязательно)
- ✅ Username (автоматически = email)

---

### **5️⃣ PASSWORD POLICY**

**Путь:** Authentication → Policies → Password Policy

**Рекомендуемые настройки:**
```
Minimum Length: 8
Special Characters: 1
Uppercase: 1
Lowercase: 1
Digits: 1
Not Username: ON
```

---

### **6️⃣ CLIENT SETTINGS (ПРОВЕРИТЬ)**

**Путь:** Clients → ai-video-interview-app

**Проверить:**
- ✅ **Standard Flow Enabled**: ON (Authorization Code)
- ✅ **Direct Access Grants**: OFF (для безопасности)
- ✅ **Valid Redirect URIs**: 
  - `http://localhost:3000/*`
  - `http://localhost:3000/auth/callback`
- ✅ **Web Origins**: `http://localhost:3000`
- ✅ **Access Type**: public (для SPA)

---

## 🧪 **ТЕСТИРОВАНИЕ РЕГИСТРАЦИИ**

### **ШАГ 1: ПРОВЕРКА BACKEND**

```bash
# Test registration URL generation
curl "http://localhost:3002/auth/register?redirect_uri=http://localhost:3000/auth/callback" | jq

# Expected response:
{
  "success": true,
  "authUrl": "http://localhost:8090/realms/ai-video-interview/protocol/openid-connect/auth?...&kc_action=register",
  "state": "uuid-string",
  "redirectUri": "http://localhost:3000/auth/callback"
}
```

### **ШАГ 2: MANUAL TEST**

1. Открой http://localhost:3000/register
2. Нажми "Continue with Keycloak"
3. Должна открыться форма РЕГИСТРАЦИИ Keycloak (не login!)
4. Заполни форму:
   - Email: test@example.com
   - First Name: Test
   - Last Name: User
   - Password: Test1234!
5. Нажми "Register"
6. Если email verification включена - проверь email
7. Должен редиректнуть на /dashboard

### **ШАГ 3: ПРОВЕРКА KAFKA СОБЫТИЙ**

```bash
# Check Kafka for user.authenticated event
docker exec -it kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic user.events \
  --from-beginning \
  --max-messages 5
```

Expected event:
```json
{
  "eventId": "uuid",
  "eventType": "user.authenticated",
  "aggregateId": "user-uuid-from-keycloak",
  "timestamp": "2025-09-30T10:00:00.000Z",
  "data": {
    "userId": "user-uuid",
    "email": "test@example.com",
    "sessionId": "session-uuid",
    "metadata": {
      "authMethod": "oauth2"
    }
  }
}
```

---

## 🐛 **TROUBLESHOOTING**

### **Проблема: "User registration not allowed"**

**Решение:**
```
Keycloak Admin → Realm Settings → Login → User registration: ON
```

### **Проблема: Показывается login form вместо registration**

**Причины:**
1. Backend не добавляет `kc_action=register` в URL
2. Keycloak user registration disabled

**Проверка:**
```bash
# URL должен содержать kc_action=register
curl "http://localhost:3002/auth/register?redirect_uri=..." | jq '.authUrl'
```

### **Проблема: Email verification не работает**

**Решение:**
1. Настрой SMTP в Keycloak (см. выше)
2. Или ОТКЛЮЧИ email verification для dev:
   - Authentication → Required Actions → Verify Email → Default Action: OFF

### **Проблема: CORS errors**

**Проверь:**
```typescript
// apps/api-gateway/src/main.ts
const corsOptions = {
  origin: 'http://localhost:3000',  // ← Должен совпадать с фронтом
  credentials: true,
};
```

### **Проблема: Callback fails with 401**

**Причины:**
1. Invalid client_secret (для confidential clients)
2. Redirect URI mismatch
3. State validation failed

**Debug:**
```bash
# Check logs
docker logs api-gateway-container
```

---

## ✅ **ГОТОВО ПОСЛЕ НАСТРОЙКИ**

После выполнения всех шагов:

**Пользователи смогут:**
- ✅ Регистрироваться через форму Keycloak
- ✅ Получать verification email (если включено)
- ✅ Автоматически логиниться после регистрации
- ✅ Попадать в dashboard

**Backend будет:**
- ✅ Публиковать Kafka события `user.authenticated`
- ✅ Устанавливать auth cookies
- ✅ Логировать все действия
- ✅ Собирать метрики регистраций

**Мониторинг:**
- 📊 Grafana dashboard покажет количество регистраций
- 📈 Prometheus metrics: `auth_requests_total{operation="register"}`
- 📝 Loki logs: все события регистрации
- 🔍 Jaeger traces: полный путь OAuth2 flow

---

## 🚀 **NEXT STEPS (БУДУЩИЕ УЛУЧШЕНИЯ)**

1. **Social Login** (Google, GitHub)
   - Keycloak Identity Providers
   - Настройка OAuth2 client credentials

2. **Email Templates Customization**
   - Брендированные письма
   - HTML templates в Keycloak

3. **Custom Registration Fields**
   - Company name
   - Job title
   - Phone number

4. **User Service Integration**
   - Слушать Kafka события `user.authenticated`
   - Создавать профили пользователей в user_service database
   - Синхронизировать данные

5. **Rate Limiting**
   - Защита от спама регистраций
   - CAPTCHA для production

**СТАТУС: Registration flow готов, осталось только включить в Keycloak Admin Console! 🎯**
