import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Configure Swagger for User Service module
 */
export function setupUserServiceSwagger(app: INestApplication, globalPrefix = 'api') {
  const config = new DocumentBuilder()
    .setTitle('User Service API (via API Gateway)')
    .setDescription(`
User Service endpoints exposed through API Gateway

**Available APIs:**
- User Profile Management
- Admin User Management  
- Role Management
- User Actions (suspend/activate)

**Authentication:**
All endpoints require JWT Bearer token in Authorization header.
Admin endpoints require 'admin' role.
    `)
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Enter JWT token from /auth/login',
      in: 'header',
    })
    .addTag('Users', 'Current user profile operations')
    .addTag('Admin - Users', 'Admin user management operations')
    .addTag('Admin - User Actions', 'Admin user action operations (suspend/activate)')
    .addTag('Admin - Roles', 'Admin role management operations')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [
      // Include only User Service module controllers
      // This will automatically find all controllers in the module
    ],
    deepScanRoutes: true,
    // operationIdFactory: (controllerKey: string, methodKey: string) =>
    //   `${controllerKey}_${methodKey}`,
  });

  // Setup Swagger UI at /api/user-service/docs
  SwaggerModule.setup(`${globalPrefix}/user-service/docs`, app, document, {
    customSiteTitle: 'User Service API',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true, // Save JWT token in browser
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  return document;
}
