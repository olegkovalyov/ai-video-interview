# 🔧 KEYCLOAK REGISTRATION SETUP

## ✅ **ЧТО УЖЕ СДЕЛАНО**

### **1. Кастомная тема готова:**
```
keycloak-theme/ai-interview/login/
├── login.ftl         ✅ Login page
├── register.ftl      ✅ Registration page (ТОЛЬКО ЧТО СОЗДАН!)
├── template.ftl      ✅ Base template
├── theme.properties  ✅ Theme config
└── resources/
    └── css/
        └── login.css ✅ Styles
```

**Стили:** Glass morphism, gradient background (indigo → purple → blue), консистентный с Next.js app

---

## 📋 **ЧТО НУЖНО НАСТРОИТЬ В KEYCLOAK ADMIN CONSOLE**

### **Шаг 1: Включить User Registration**

1. Открой **Keycloak Admin Console**: http://localhost:8090/admin
   - Username: `admin`
   - Password: `admin123`

2. Выбери realm: **`ai-video-interview`** (в dropdown слева вверху)

3. Перейди в **Realm Settings** → **Login** tab

4. Включи следующие настройки:
   ```
   ✅ User registration: ON
   ✅ Forgot password: ON (optional, рекомендуется)
   ✅ Remember me: ON (optional)
   ✅ Login with email: ON (рекомендуется)
   ```

5. (Optional) Включи **Email as username**:
   ```
   ✅ Email as username: ON
   ```
   Тогда пользователям не нужно будет вводить username отдельно.

6. Нажми **Save**

---

### **Шаг 2: Проверить Password Policy (Optional)**

1. В **Realm Settings** → **Security Defenses** → **Password Policy**

2. Рекомендуемые настройки:
   ```
   Minimum Length: 8
   Special Characters: 1
   Uppercase Characters: 1
   Lowercase Characters: 1
   Digits: 1
   Not Username: Enabled
   ```

3. Или можешь оставить по умолчанию для dev

---

### **Шаг 3: Настроить Required Actions (Optional)**

1. Перейди в **Authentication** → **Required Actions**

2. Проверь что включены:
   ```
   ✅ Verify Email (для production, можно ОТКЛЮЧИТЬ для dev)
   ✅ Update Profile (optional)
   ```

3. **Для DEV:** Рекомендую **ОТКЛЮЧИТЬ** `Verify Email` чтобы сразу логиниться:
   - Найди "Verify Email"
   - Сними галочку "Default Action"
   - Сними галочку "Enabled"

---

### **Шаг 4: Проверить Client Settings**

1. Перейди в **Clients** → **`ai-video-interview-app`**

2. На вкладке **Settings** проверь:
   ```
   ✅ Client authentication: OFF (public client для SPA)
   ✅ Standard flow: ON
   ✅ Direct access grants: OFF (для безопасности)
   
   Valid redirect URIs:
   ✅ http://localhost:3000/*
   ✅ http://localhost:3000/auth/callback
   
   Web origins:
   ✅ http://localhost:3000
   ```

3. На вкладке **Advanced** проверь:
   ```
   ✅ Access Token Lifespan: 15 minutes (или по вкусу)
   ```

---

### **Шаг 5: Применить кастомную тему**

1. Вернись в **Realm Settings** → **Themes** tab

2. Выбери тему `ai-interview` для:
   ```
   Login theme: ai-interview
   Account theme: (можно оставить keycloak)
   Email theme: (можно оставить keycloak)
   ```

3. Нажми **Save**

4. **ВАЖНО:** Если тема не появилась в dropdown:
   ```bash
   # Перезапусти Keycloak
   docker restart ai-interview-keycloak
   
   # Подожди 10 секунд
   # Refresh Admin Console
   ```

---

## 🧪 **ТЕСТИРОВАНИЕ**

### **Test 1: Проверка registration URL**

```bash
# Проверь что backend генерирует правильный URL
curl "http://localhost:3002/auth/register?redirect_uri=http://localhost:3000/auth/callback" | jq

# Expected response:
{
  "success": true,
  "authUrl": "http://localhost:8090/realms/ai-video-interview/protocol/openid-connect/auth?...&kc_action=register",
  "state": "...",
  "redirectUri": "http://localhost:3000/auth/callback"
}
```

**Проверь что URL содержит `kc_action=register`!**

---

### **Test 2: Manual UI Test**

1. Открой **http://localhost:3000/register**

2. Нажми **"Continue with Keycloak"**

3. Должна открыться **Keycloak registration form** с:
   - ✅ Gradient background (indigo → purple → blue)
   - ✅ Glass morphism карточка
   - ✅ Поля: First Name, Last Name, Email, Password, Password Confirm
   - ✅ Заголовок "Create your account"
   - ✅ Кнопка "Register" (желтая)
   - ✅ Ссылка "Back to Login"

4. Заполни форму:
   ```
   First Name: Test
   Last Name: User
   Email: test@example.com
   Password: Test1234!
   Password Confirm: Test1234!
   ```

5. Нажми **Register**

6. **Если email verification ВЫКЛЮЧЕНА:**
   - Должен сразу редиректнуть на **http://localhost:3000/auth/callback**
   - Затем на **http://localhost:3000/dashboard**

7. **Если email verification ВКЛЮЧЕНА:**
   - Увидишь экран "Verify your email"
   - Проверь email (если настроен SMTP)

---

### **Test 3: Проверка в Admin Console**

1. Открой **Keycloak Admin Console**

2. Перейди в **Users** → **View all users**

3. Должен появиться новый пользователь:
   ```
   Username: test@example.com (если email as username)
   Email: test@example.com
   First Name: Test
   Last Name: User
   Email Verified: ❌ (если verification включена) или ✅ (если выключена)
   ```

---

### **Test 4: Проверка Login после Registration**

1. Logout из приложения

2. Перейди на **http://localhost:3000/login**

3. Войди с новыми credentials:
   ```
   Email: test@example.com
   Password: Test1234!
   ```

4. Должен попасть в **Dashboard**

---

## 🐛 **TROUBLESHOOTING**

### **Проблема: Показывается default Keycloak форма, а не кастомная**

**Решения:**
1. Проверь что тема выбрана: Realm Settings → Themes → Login theme: `ai-interview`
2. Перезапусти Keycloak: `docker restart ai-interview-keycloak`
3. Очисти cache браузера (Cmd+Shift+R)
4. Проверь что файлы темы есть:
   ```bash
   docker exec ai-interview-keycloak ls -la /opt/keycloak/themes/ai-interview/login/
   ```

---

### **Проблема: "User registration not allowed"**

**Решение:**
Realm Settings → Login → User registration: ON → Save

---

### **Проблема: Backend редиректит на login вместо registration**

**Проверь:**
```bash
# URL должен содержать kc_action=register
curl "http://localhost:3002/auth/register?redirect_uri=..." | jq '.authUrl'

# Должен быть примерно:
"http://localhost:8090/realms/ai-video-interview/protocol/openid-connect/auth?response_type=code&client_id=ai-video-interview-app&redirect_uri=...&state=...&scope=openid+profile+email&kc_action=register"
                                                                                                                                                                                             ^^^^^^^^^^^^^^^^^^^^
```

Если `kc_action=register` есть, но все равно показывается login - проверь `User registration: ON`.

---

### **Проблема: После registration попадаю на error page**

**Причины:**
1. Callback URL не в Valid redirect URIs
2. State validation failed
3. Client secret misconfigured

**Проверь:**
```bash
# Logs backend
npm run dev --filter=api-gateway

# Logs Keycloak
docker logs ai-interview-keycloak -f
```

---

### **Проблема: Email verification не работает**

**Для DEV (без SMTP):**
Отключи email verification:
1. Authentication → Required Actions
2. "Verify Email" → Default Action: OFF, Enabled: OFF

**Для PRODUCTION:**
Настрой SMTP в Realm Settings → Email:
```
Host: smtp.gmail.com (или другой)
Port: 587
From: noreply@yourdomain.com
Username: your-email@gmail.com
Password: your-app-password
Enable SSL: ON
```

---

## ✅ **CHECKLIST**

После настройки проверь:

```
□ User registration включена в Realm Settings
□ Login theme = ai-interview
□ Backend генерирует URL с kc_action=register
□ Registration form имеет кастомный дизайн
□ Можно зарегистрировать нового пользователя
□ После registration попадаешь в dashboard
□ Новый пользователь появляется в Users
□ Можно залогиниться с новыми credentials
```

---

## 🎉 **ГОТОВО!**

После выполнения всех шагов:
- ✅ Registration flow работает
- ✅ Кастомная тема применена
- ✅ Users могут регистрироваться
- ✅ Design консистентный с main app

**Next steps:**
- Настрой email verification для production
- Добавь custom user attributes если нужно
- Настрой password policy
- Добавь CAPTCHA для production (optional)
