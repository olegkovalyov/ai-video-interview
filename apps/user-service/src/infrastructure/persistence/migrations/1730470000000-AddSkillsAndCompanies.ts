import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Skills & Companies Migration
 * Adds skill categories, skills, companies, and candidate skills system
 * Includes seed data for IT skills
 */
export class AddSkillsAndCompanies1730470000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // 1. SKILL_CATEGORIES TABLE
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'skill_categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sort_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'skill_categories',
      new TableIndex({
        name: 'idx_skill_categories_slug',
        columnNames: ['slug'],
        isUnique: true,
      }),
    );

    // ============================================
    // 2. SKILLS TABLE
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'skills',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'category_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'skills',
      new TableIndex({
        name: 'idx_skills_slug',
        columnNames: ['slug'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'skills',
      new TableIndex({
        name: 'idx_skills_category',
        columnNames: ['category_id'],
      }),
    );

    await queryRunner.createIndex(
      'skills',
      new TableIndex({
        name: 'idx_skills_active',
        columnNames: ['is_active'],
      }),
    );

    // FK: category_id → skill_categories(id) ON DELETE SET NULL
    await queryRunner.createForeignKey(
      'skills',
      new TableForeignKey({
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'skill_categories',
        onDelete: 'SET NULL',
      }),
    );

    // ============================================
    // 3. COMPANIES TABLE
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'companies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'website',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'logo_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'industry',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'size',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: '1-10, 11-50, 51-200, 200+',
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_companies_active',
        columnNames: ['is_active'],
      }),
    );

    await queryRunner.createIndex(
      'companies',
      new TableIndex({
        name: 'idx_companies_created_by',
        columnNames: ['created_by'],
      }),
    );

    // FK: created_by → users(id) ON DELETE SET NULL
    await queryRunner.createForeignKey(
      'companies',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // ============================================
    // 4. USER_COMPANIES TABLE (Many-to-Many)
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'user_companies',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'company_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'position',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'User position in this company',
          },
          {
            name: 'is_primary',
            type: 'boolean',
            default: false,
            comment: 'Is this the primary company for the user',
          },
          {
            name: 'joined_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'user_companies',
      new TableIndex({
        name: 'idx_user_companies_user',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_companies',
      new TableIndex({
        name: 'idx_user_companies_company',
        columnNames: ['company_id'],
      }),
    );

    await queryRunner.createIndex(
      'user_companies',
      new TableIndex({
        name: 'idx_user_companies_primary',
        columnNames: ['is_primary'],
      }),
    );

    // UNIQUE constraint: (user_id, company_id)
    await queryRunner.createIndex(
      'user_companies',
      new TableIndex({
        name: 'idx_user_companies_unique',
        columnNames: ['user_id', 'company_id'],
        isUnique: true,
      }),
    );

    // FK: user_id → users(id) ON DELETE CASCADE
    await queryRunner.createForeignKey(
      'user_companies',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // FK: company_id → companies(id) ON DELETE CASCADE
    await queryRunner.createForeignKey(
      'user_companies',
      new TableForeignKey({
        columnNames: ['company_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'companies',
        onDelete: 'CASCADE',
      }),
    );

    // ============================================
    // 5. CANDIDATE_SKILLS TABLE (Many-to-Many + Metadata)
    // ============================================
    await queryRunner.createTable(
      new Table({
        name: 'candidate_skills',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'candidate_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'skill_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Candidate personal description of their experience with this skill',
          },
          {
            name: 'proficiency_level',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'beginner, intermediate, advanced, expert (nullable)',
          },
          {
            name: 'years_of_experience',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'candidate_skills',
      new TableIndex({
        name: 'idx_candidate_skills_candidate',
        columnNames: ['candidate_id'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_skills',
      new TableIndex({
        name: 'idx_candidate_skills_skill',
        columnNames: ['skill_id'],
      }),
    );

    await queryRunner.createIndex(
      'candidate_skills',
      new TableIndex({
        name: 'idx_candidate_skills_proficiency',
        columnNames: ['proficiency_level'],
      }),
    );

    // UNIQUE constraint: (candidate_id, skill_id)
    await queryRunner.createIndex(
      'candidate_skills',
      new TableIndex({
        name: 'idx_candidate_skills_unique',
        columnNames: ['candidate_id', 'skill_id'],
        isUnique: true,
      }),
    );

    // FK: candidate_id → users(id) ON DELETE CASCADE
    await queryRunner.createForeignKey(
      'candidate_skills',
      new TableForeignKey({
        columnNames: ['candidate_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // FK: skill_id → skills(id) ON DELETE CASCADE
    await queryRunner.createForeignKey(
      'candidate_skills',
      new TableForeignKey({
        columnNames: ['skill_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'skills',
        onDelete: 'CASCADE',
      }),
    );

    // ============================================
    // 6. UPDATE EXISTING TABLES
    // ============================================

    // Drop skills column from candidate_profiles
    await queryRunner.query(`ALTER TABLE candidate_profiles DROP COLUMN IF EXISTS skills`);

    // Drop company_name from hr_profiles
    await queryRunner.query(`ALTER TABLE hr_profiles DROP COLUMN IF EXISTS company_name`);

    // Drop position from hr_profiles (if exists)
    await queryRunner.query(`ALTER TABLE hr_profiles DROP COLUMN IF EXISTS position`);

    // ============================================
    // 7. SEED DATA - IT CATEGORIES & SKILLS
    // ============================================
    await queryRunner.query(`
      DO $$
      DECLARE
        cat_programming UUID;
        cat_frontend UUID;
        cat_backend UUID;
        cat_databases UUID;
        cat_devops UUID;
        cat_mobile UUID;
        cat_testing UUID;
        cat_tools UUID;
      BEGIN
        -- ==========================================
        -- SEED: Skill Categories
        -- ==========================================
        INSERT INTO skill_categories (name, slug, description, sort_order)
        VALUES ('Programming Languages', 'programming-languages', 'Core programming languages', 1)
        RETURNING id INTO cat_programming;
        
        INSERT INTO skill_categories (name, slug, description, sort_order)
        VALUES ('Frontend Frameworks', 'frontend-frameworks', 'Frontend frameworks and libraries', 2)
        RETURNING id INTO cat_frontend;
        
        INSERT INTO skill_categories (name, slug, description, sort_order)
        VALUES ('Backend Frameworks', 'backend-frameworks', 'Backend frameworks and technologies', 3)
        RETURNING id INTO cat_backend;
        
        INSERT INTO skill_categories (name, slug, description, sort_order)
        VALUES ('Databases', 'databases', 'Database systems and technologies', 4)
        RETURNING id INTO cat_databases;
        
        INSERT INTO skill_categories (name, slug, description, sort_order)
        VALUES ('DevOps & Cloud', 'devops-cloud', 'DevOps tools and cloud platforms', 5)
        RETURNING id INTO cat_devops;
        
        INSERT INTO skill_categories (name, slug, description, sort_order)
        VALUES ('Mobile Development', 'mobile-development', 'Mobile app development', 6)
        RETURNING id INTO cat_mobile;
        
        INSERT INTO skill_categories (name, slug, description, sort_order)
        VALUES ('Testing & QA', 'testing-qa', 'Testing frameworks and QA tools', 7)
        RETURNING id INTO cat_testing;
        
        INSERT INTO skill_categories (name, slug, description, sort_order)
        VALUES ('Tools & IDEs', 'tools-ides', 'Development tools and IDEs', 8)
        RETURNING id INTO cat_tools;

        -- ==========================================
        -- SEED: Programming Languages
        -- ==========================================
        INSERT INTO skills (name, slug, category_id, description) VALUES
          ('JavaScript', 'javascript', cat_programming, 'Popular web programming language'),
          ('TypeScript', 'typescript', cat_programming, 'Typed superset of JavaScript'),
          ('Python', 'python', cat_programming, 'Versatile programming language'),
          ('Java', 'java', cat_programming, 'Enterprise programming language'),
          ('Go', 'go', cat_programming, 'Google programming language'),
          ('Rust', 'rust', cat_programming, 'Systems programming language'),
          ('C#', 'csharp', cat_programming, '.NET programming language'),
          ('PHP', 'php', cat_programming, 'Server-side scripting language'),
          ('Ruby', 'ruby', cat_programming, 'Dynamic programming language'),
          ('C++', 'cpp', cat_programming, 'High-performance programming language');
        
        -- ==========================================
        -- SEED: Frontend Frameworks
        -- ==========================================
        INSERT INTO skills (name, slug, category_id, description) VALUES
          ('React', 'react', cat_frontend, 'Popular JavaScript library'),
          ('Vue.js', 'vuejs', cat_frontend, 'Progressive JavaScript framework'),
          ('Angular', 'angular', cat_frontend, 'TypeScript-based framework'),
          ('Next.js', 'nextjs', cat_frontend, 'React framework'),
          ('Svelte', 'svelte', cat_frontend, 'Compiler-based framework'),
          ('Nuxt.js', 'nuxtjs', cat_frontend, 'Vue.js framework'),
          ('Tailwind CSS', 'tailwindcss', cat_frontend, 'Utility-first CSS framework');
        
        -- ==========================================
        -- SEED: Backend Frameworks
        -- ==========================================
        INSERT INTO skills (name, slug, category_id, description) VALUES
          ('Node.js', 'nodejs', cat_backend, 'JavaScript runtime'),
          ('Express.js', 'expressjs', cat_backend, 'Node.js framework'),
          ('NestJS', 'nestjs', cat_backend, 'Progressive Node.js framework'),
          ('Django', 'django', cat_backend, 'Python web framework'),
          ('FastAPI', 'fastapi', cat_backend, 'Modern Python framework'),
          ('Spring Boot', 'spring-boot', cat_backend, 'Java framework'),
          ('Laravel', 'laravel', cat_backend, 'PHP framework'),
          ('Ruby on Rails', 'ruby-on-rails', cat_backend, 'Ruby framework'),
          ('.NET Core', 'dotnet-core', cat_backend, 'Microsoft framework');
        
        -- ==========================================
        -- SEED: Databases
        -- ==========================================
        INSERT INTO skills (name, slug, category_id, description) VALUES
          ('PostgreSQL', 'postgresql', cat_databases, 'Advanced SQL database'),
          ('MySQL', 'mysql', cat_databases, 'Popular SQL database'),
          ('MongoDB', 'mongodb', cat_databases, 'NoSQL document database'),
          ('Redis', 'redis', cat_databases, 'In-memory data store'),
          ('Elasticsearch', 'elasticsearch', cat_databases, 'Search engine'),
          ('Oracle', 'oracle', cat_databases, 'Enterprise database'),
          ('Microsoft SQL Server', 'mssql', cat_databases, 'Microsoft database');
        
        -- ==========================================
        -- SEED: DevOps & Cloud
        -- ==========================================
        INSERT INTO skills (name, slug, category_id, description) VALUES
          ('Docker', 'docker', cat_devops, 'Containerization platform'),
          ('Kubernetes', 'kubernetes', cat_devops, 'Container orchestration'),
          ('AWS', 'aws', cat_devops, 'Amazon Web Services'),
          ('Azure', 'azure', cat_devops, 'Microsoft cloud platform'),
          ('GCP', 'gcp', cat_devops, 'Google Cloud Platform'),
          ('Jenkins', 'jenkins', cat_devops, 'CI/CD automation'),
          ('GitHub Actions', 'github-actions', cat_devops, 'CI/CD platform'),
          ('Terraform', 'terraform', cat_devops, 'Infrastructure as Code'),
          ('Ansible', 'ansible', cat_devops, 'Configuration management');
        
        -- ==========================================
        -- SEED: Mobile Development
        -- ==========================================
        INSERT INTO skills (name, slug, category_id, description) VALUES
          ('React Native', 'react-native', cat_mobile, 'Cross-platform mobile framework'),
          ('Flutter', 'flutter', cat_mobile, 'Google mobile framework'),
          ('Swift', 'swift', cat_mobile, 'iOS programming language'),
          ('Kotlin', 'kotlin', cat_mobile, 'Android programming language'),
          ('Xamarin', 'xamarin', cat_mobile, 'Microsoft mobile framework');
        
        -- ==========================================
        -- SEED: Testing & QA
        -- ==========================================
        INSERT INTO skills (name, slug, category_id, description) VALUES
          ('Jest', 'jest', cat_testing, 'JavaScript testing framework'),
          ('Cypress', 'cypress', cat_testing, 'E2E testing framework'),
          ('Selenium', 'selenium', cat_testing, 'Browser automation'),
          ('Playwright', 'playwright', cat_testing, 'Modern E2E testing'),
          ('Mocha', 'mocha', cat_testing, 'JavaScript test framework'),
          ('JUnit', 'junit', cat_testing, 'Java testing framework');
        
        -- ==========================================
        -- SEED: Tools & IDEs
        -- ==========================================
        INSERT INTO skills (name, slug, category_id, description) VALUES
          ('Git', 'git', cat_tools, 'Version control system'),
          ('VS Code', 'vscode', cat_tools, 'Code editor'),
          ('IntelliJ IDEA', 'intellij', cat_tools, 'Java IDE'),
          ('Postman', 'postman', cat_tools, 'API testing tool'),
          ('Jira', 'jira', cat_tools, 'Project management tool'),
          ('Figma', 'figma', cat_tools, 'Design tool');
        
        RAISE NOTICE '✅ Seeded 8 categories and 52 IT skills';
      END $$;
    `);

    console.log('✅ Created all tables: skill_categories, skills, companies, user_companies, candidate_skills');
    console.log('✅ Updated existing tables: candidate_profiles, hr_profiles');
    console.log('✅ Seeded 8 categories and 52 IT skills');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting FK constraints)
    await queryRunner.dropTable('candidate_skills', true);
    await queryRunner.dropTable('user_companies', true);
    await queryRunner.dropTable('companies', true);
    await queryRunner.dropTable('skills', true);
    await queryRunner.dropTable('skill_categories', true);

    // Restore candidate_profiles.skills column
    await queryRunner.query(`
      ALTER TABLE candidate_profiles 
      ADD COLUMN skills text[] DEFAULT '{}' NOT NULL
    `);

    // Restore hr_profiles columns
    await queryRunner.query(`
      ALTER TABLE hr_profiles 
      ADD COLUMN company_name VARCHAR(255),
      ADD COLUMN position VARCHAR(255)
    `);

    console.log('✅ Dropped all skills & companies tables');
    console.log('✅ Restored candidate_profiles.skills and hr_profiles columns');
  }
}
