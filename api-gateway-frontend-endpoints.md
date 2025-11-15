# API Gateway - Frontend Endpoints Plan

План эндпоинтов для фронтенда на основе user-service возможностей.

---

## 1️⃣ ADMIN: Управление скиллами

**Цель:** Админ может создавать/удалять/обновлять/фильтровать скиллы

### Эндпоинты:
```
GET    /api/admin/skills              # Список всех скиллов с фильтрами
POST   /api/admin/skills              # Создать новый скилл
GET    /api/admin/skills/:id          # Получить детали скилла
PUT    /api/admin/skills/:id          # Обновить скилл
DELETE /api/admin/skills/:id          # Удалить скилл
GET    /api/admin/skills/categories   # Список категорий скиллов
```

### Query параметры (GET /api/admin/skills):
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `search` (string) - поиск по названию
- `categoryId` (uuid) - фильтр по категории
- `isActive` (boolean) - фильтр по статусу

### Проксирование в user-service:
```
GET    /api/admin/skills              → GET /skills?page=1&limit=20&search=Type&isActive=true
POST   /api/admin/skills              → POST /skills (body + adminId из JWT)
GET    /api/admin/skills/:id          → GET /skills/{id}
PUT    /api/admin/skills/:id          → PUT /skills/{id} (body + adminId из JWT)
DELETE /api/admin/skills/:id          → DELETE /skills/{id}?adminId={fromJWT}
GET    /api/admin/skills/categories   → GET /skills/categories
```

### DTOs:
```typescript
// Request
interface CreateSkillDto {
  name: string;           // "TypeScript"
  slug: string;           // "typescript"
  categoryId?: string;    // uuid
  description?: string;
  // adminId автоматически из JWT
}

interface UpdateSkillDto {
  name?: string;
  description?: string;
  categoryId?: string;
  // adminId автоматически из JWT
}

// Response
interface SkillResponseDto {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SkillsListResponseDto {
  data: SkillResponseDto[];
  pagination: PaginationDto;
}
```

### Guards:
- `JwtAuthGuard` - проверка авторизации
- `RolesGuard(['admin'])` - только админ

---

## 2️⃣ HR: Управление компаниями

**Цель:** HR может создавать/удалять/обновлять/фильтровать свои компании

### Эндпоинты:
```
GET    /api/hr/companies              # Список компаний HR (только свои + активные)
POST   /api/hr/companies              # Создать новую компанию
GET    /api/hr/companies/:id          # Получить детали компании
PUT    /api/hr/companies/:id          # Обновить свою компанию
DELETE /api/hr/companies/:id          # Удалить свою компанию
```

### Query параметры (GET /api/hr/companies):
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `search` (string) - поиск по названию
- `industry` (string) - фильтр по индустрии
- `isActive` (boolean) - фильтр по статусу

### Проксирование в user-service:
```
GET    /api/hr/companies              → GET /companies?currentUserId={fromJWT}&isAdmin=false&createdBy={fromJWT}
POST   /api/hr/companies              → POST /companies (body + createdBy из JWT)
GET    /api/hr/companies/:id          → GET /companies/{id}?userId={fromJWT}&isAdmin=false
PUT    /api/hr/companies/:id          → PUT /companies/{id} (body + updatedBy из JWT)
DELETE /api/hr/companies/:id          → DELETE /companies/{id}?userId={fromJWT}
```

### DTOs:
```typescript
// Request
interface CreateCompanyDto {
  name: string;           // "TechCorp Inc."
  industry: string;       // "Software Development"
  size: string;           // "50-100 employees"
  website?: string;       // "https://techcorp.com"
  description?: string;
  location?: string;      // "San Francisco, CA"
  // createdBy автоматически из JWT
}

interface UpdateCompanyDto {
  name?: string;
  industry?: string;
  size?: string;
  website?: string;
  description?: string;
  location?: string;
  // updatedBy автоматически из JWT
}

// Response
interface CompanyResponseDto {
  id: string;
  name: string;
  industry: string;
  size: string;
  website: string;
  description: string;
  location: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CompaniesListResponseDto {
  data: CompanyResponseDto[];
  pagination: PaginationDto;
}
```

### Guards:
- `JwtAuthGuard` - проверка авторизации
- `RolesGuard(['hr', 'admin'])` - только HR или админ

---

## 3️⃣ HR: Поиск кандидатов по скиллам

**Цель:** HR может по skill находить списки кандидатов

### Эндпоинты:
```
GET    /api/hr/candidates/search      # Найти кандидатов по скиллам
GET    /api/hr/candidates/:id/profile # Посмотреть профиль кандидата
GET    /api/hr/candidates/:id/skills  # Посмотреть скиллы кандидата
```

### Query параметры (GET /api/hr/candidates/search):
- `skillIds` (string[]) - массив uuid скиллов
- `minProficiency` (enum: 'beginner' | 'intermediate' | 'advanced' | 'expert')
- `minYears` (number) - минимум лет опыта
- `experienceLevel` (enum: 'junior' | 'mid' | 'senior' | 'lead')
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)

### Проксирование в user-service:
```
GET    /api/hr/candidates/search      → GET /candidates/search?skillIds[]=uuid1&skillIds[]=uuid2&minProficiency=intermediate
GET    /api/hr/candidates/:id/profile → GET /candidates/{userId}/profile?currentUserId={fromJWT}&isHR=true&isAdmin=false
GET    /api/hr/candidates/:id/skills  → GET /candidates/{userId}/skills?currentUserId={fromJWT}&isHR=true&isAdmin=false
```

### DTOs:
```typescript
// Response
interface CandidateSearchResultDto {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead';
  skills: CandidateSkillDto[];
  matchScore: number;  // 0-100, процент совпадения
}

interface CandidateSkillDto {
  skillId: string;
  skillName: string;
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience: number;
}

interface CandidateSearchResponseDto {
  data: CandidateSearchResultDto[];
  pagination: PaginationDto;
}

interface CandidateProfileDto {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  experienceLevel: 'junior' | 'mid' | 'senior' | 'lead';
  skills: string[];
}

interface CandidateSkillsByCategoryDto {
  categoryId: string;
  categoryName: string;
  skills: {
    skillId: string;
    skillName: string;
    description?: string;
    proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience: number;
  }[];
}
```

### Guards:
- `JwtAuthGuard` - проверка авторизации
- `RolesGuard(['hr', 'admin'])` - только HR или админ

---

## 4️⃣ CANDIDATE: Управление своими скиллами

**Цель:** Кандидат может добавлять/удалять скиллы к себе

### Эндпоинты:
```
GET    /api/me/skills                 # Мои скиллы (группированные по категориям)
POST   /api/me/skills                 # Добавить скилл к себе
PUT    /api/me/skills/:skillId        # Обновить свой скилл (proficiency, years)
DELETE /api/me/skills/:skillId        # Удалить скилл у себя
GET    /api/me/profile                # Мой профиль кандидата
```

### Проксирование в user-service:
```
GET    /api/me/skills                 → GET /candidates/{userId}/skills?currentUserId={userId}&isHR=false&isAdmin=false
POST   /api/me/skills                 → POST /candidates/{userId}/skills
PUT    /api/me/skills/:skillId        → PUT /candidates/{userId}/skills/{skillId}
DELETE /api/me/skills/:skillId        → DELETE /candidates/{userId}/skills/{skillId}
GET    /api/me/profile                → GET /candidates/{userId}/profile?currentUserId={userId}&isHR=false&isAdmin=false
```
Где `{userId}` автоматически берется из JWT токена.

### DTOs:
```typescript
// Request
interface AddCandidateSkillDto {
  skillId: string;        // uuid существующего скилла
  description?: string;   // "Used in production for 2 years"
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;  // 0-50
}

interface UpdateCandidateSkillDto {
  description?: string;
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

// Response - такие же как в HR секции (CandidateSkillsByCategoryDto)
```

### Guards:
- `JwtAuthGuard` - проверка авторизации
- `RolesGuard(['candidate'])` - только кандидат

---

## 5️⃣ ПУБЛИЧНЫЕ: Просмотр скиллов (для всех ролей)

**Цель:** Любой авторизованный пользователь может просматривать активные скиллы для UI селектов

### Эндпоинты:
```
GET    /api/skills                    # Список активных скиллов (для селектов)
GET    /api/skills/categories         # Категории скиллов
```

### Query параметры (GET /api/skills):
- `page` (number, default: 1)
- `limit` (number, default: 100)
- `search` (string) - поиск по названию
- `categoryId` (uuid) - фильтр по категории

### Проксирование в user-service:
```
GET    /api/skills                    → GET /skills?isActive=true&page=1&limit=100
GET    /api/skills/categories         → GET /skills/categories
```

### DTOs:
```typescript
// Response
interface PublicSkillDto {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
}

interface SkillCategoryDto {
  id: string;
  name: string;
  slug: string;
}
```

### Guards:
- `JwtAuthGuard` - только авторизованные пользователи

---

## 🔧 Автоматизация в API Gateway

### Middleware для автоматического добавления параметров:

```typescript
// API Gateway должен автоматически извлекать из JWT и подставлять:
export class UserContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Извлекаем данные из JWT (уже валидированного)
    const user = req.user; // { id: string, roles: string[] }
    
    // Автоматически добавляем параметры для проксирования
    req.query.currentUserId = user.id;
    req.query.isHR = user.roles.includes('hr').toString();
    req.query.isAdmin = user.roles.includes('admin').toString();
    
    // Для body запросов (POST/PUT)
    if (req.body) {
      if (req.method === 'POST') {
        req.body.createdBy = user.id;
        req.body.adminId = user.id;
      }
      if (req.method === 'PUT') {
        req.body.updatedBy = user.id;
        req.body.adminId = user.id;
      }
    }
    
    next();
  }
}
```

### Guards для проверки ролей:

```typescript
@Controller('api/admin/skills')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')  // Только админ
export class AdminSkillsController {}

@Controller('api/hr/companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('hr', 'admin')  // HR или админ
export class HRCompaniesController {}

@Controller('api/me/skills')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('candidate')  // Только кандидат
export class CandidateSkillsController {}
```

---

## 📋 План реализации (пошаговый)

### Шаг 1: Создать структуру модулей в API Gateway
```
/apps/api-gateway/src/modules/
├── admin/
│   └── skills/
│       ├── admin-skills.controller.ts
│       └── admin-skills.service.ts
├── hr/
│   ├── companies/
│   │   ├── hr-companies.controller.ts
│   │   └── hr-companies.service.ts
│   └── candidates/
│       ├── hr-candidates.controller.ts
│       └── hr-candidates.service.ts
├── candidate/
│   ├── skills/
│   │   ├── candidate-skills.controller.ts
│   │   └── candidate-skills.service.ts
│   └── profile/
│       ├── candidate-profile.controller.ts
│       └── candidate-profile.service.ts
└── public/
    └── skills/
        ├── public-skills.controller.ts
        └── public-skills.service.ts
```

### Шаг 2: Создать UserServiceClient методы
Добавить в `/apps/api-gateway/src/modules/user-service/clients/user-service.client.ts`:
- Skills методы (listSkills, getSkill, createSkill, updateSkill, deleteSkill)
- Companies методы (listCompanies, getCompany, createCompany, updateCompany, deleteCompany)
- Candidates методы (searchCandidates, getCandidateProfile, getCandidateSkills, addSkill, updateSkill, removeSkill)

### Шаг 3: Создать контроллеры с Guards
- Добавить RolesGuard для проверки ролей
- Настроить middleware для автоматического добавления userId, isHR, isAdmin

### Шаг 4: Создать DTOs в shared package
- Переиспользовать DTOs из `/packages/shared/src/contracts/user-service/`
- Создать response DTOs для фронтенда

### Шаг 5: Тестирование
- E2E тесты для каждого контроллера
- Проверка прав доступа (admin не может использовать HR эндпоинты и т.д.)

---

## 🎯 Прогресс реализации:

### ✅ Фронтенд (Completed):
1. ✅ Header обновлен:
   - Admin: `Dashboard | Interviews | Users | Skills`
   - HR: `Dashboard | Search | Interviews | Companies`
   - Candidate: `Dashboard | Interviews` + Skills в профиле (вкладка)
   
2. ✅ Mock API созданы:
   - `/lib/api/skills.ts` - 22 mock скилла с CRUD
   - `/lib/api/companies.ts` - 8 mock компаний с CRUD
   - `/lib/api/candidate-skills.ts` - 10 mock скиллов кандидата
   - `/lib/api/candidate-search.ts` - 8 mock кандидатов для поиска

3. ✅ Feature components созданы:
   - `/features/skills/` - SkillsList, SkillsTable, SkillFilters, SkillStatsCards
   - `/features/companies/` - CompaniesList, CompaniesTable, CompanyFilters, CompanyStatsCards
   - `/features/candidate-skills/` - CandidateSkillsList, CandidateSkillsTable, AddSkillForm, EditSkillForm
   - `/features/profile/` - ProfileNav (с вкладкой Skills), ProfileWrapper

4. ✅ Страницы созданы:
   - **Admin Skills:**
     - `/admin/skills` - Skills List (таблица + фильтры)
     - `/admin/skills/create` - Create Skill
     - `/admin/skills/[id]/edit` - Edit Skill
   - **HR Companies:**
     - `/hr/companies` - Companies List (таблица + фильтры)
     - `/hr/companies/create` - Create Company
     - `/hr/companies/[id]/edit` - Edit Company
   - **HR Candidate Search:**
     - `/hr/candidates/search` - Search candidates by skills
   - **Candidate Profile:**
     - `/profile` - Personal Info (вкладка)
     - `/profile/security` - Security (вкладка)
     - `/profile/skills` - My Skills (вкладка с Add/Edit/Remove)

### ⏳ Бэкенд (TODO):
1. ⏳ Создать структуру модулей в API Gateway
2. ⏳ Реализовать Admin Skills контроллер в API Gateway
3. ⏳ Реализовать HR Companies контроллер в API Gateway
4. ⏳ Реализовать HR Candidates Search в API Gateway
5. ⏳ Реализовать Candidate Skills управление в API Gateway
6. ⏳ Реализовать публичные Skills эндпоинты в API Gateway
7. ⏳ Подключить реальные API вместо mock данных

### 🚀 Можно тестировать:

**Admin Skills:**
- `/admin/skills` - просмотр всех скиллов (22 mock)
- Фильтры: search, category, active/inactive
- Toggle status (ON/OFF), Delete skill
- `/admin/skills/create` - создать новый скилл (форма с auto-slug)
- `/admin/skills/[id]/edit` - редактировать скилл

**HR Companies:**
- `/hr/companies` - просмотр моих компаний (8 mock)
- Фильтры: search, industry, active/inactive
- Toggle status (ON/OFF), Delete company
- `/hr/companies/create` - создать новую компанию
- `/hr/companies/[id]/edit` - редактировать компанию

**HR Candidate Search:**
- `/hr/candidates/search` - поиск кандидатов по скиллам (8 mock кандидатов)
- Мульти-выбор скиллов (22 доступных)
- Фильтры: min proficiency, min years, experience level
- Match score отображение (0-100%)
- Просмотр скиллов каждого кандидата с proficiency stars

**Candidate Skills:**
- `/profile/skills` - мои скиллы (10 mock)
- Вкладка в профиле (Personal Info | Security | **Skills**)
- Группировка по категориям (Frontend, Backend, DevOps, Database)
- **Add Skill** - форма выбора из 22 доступных скиллов (те же что у админа)
  - Выбор skill из dropdown (с категориями)
  - Proficiency level (1-4 stars: beginner → expert)
  - Years of experience
  - Description (optional)
- **Edit Skill** - inline форма редактирования
- **Remove Skill** (с подтверждением)
- Отображение proficiency stars и years для каждого скилла

Все операции работают с mock данными (изменения сохраняются в памяти до перезагрузки страницы).
