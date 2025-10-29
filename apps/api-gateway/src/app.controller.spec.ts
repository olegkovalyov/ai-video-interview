import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtRefreshGuard } from './auth/jwt-refresh.guard';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    // Mock JwtRefreshGuard
    const mockJwtRefreshGuard = {
      canActivate: jest.fn().mockReturnValue(true),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: JwtRefreshGuard,
          useValue: mockJwtRefreshGuard,
        },
      ],
    })
      .overrideGuard(JwtRefreshGuard)
      .useValue(mockJwtRefreshGuard)
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API Gateway greeting', () => {
      expect(appController.getHello()).toBe('Hello from API Gateway!');
    });
  });
});
