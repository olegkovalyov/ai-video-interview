import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CreateCompanyHandler } from '../create-company.handler';
import { CreateCompanyCommand } from '../create-company.command';
import { CompanyCreationService } from '../../../../services/company-creation.service';

/**
 * Handler is a thin CQRS adapter — full use-case logic is covered by
 * `CompanyCreationService` tests. Here we only verify the command shape is
 * forwarded correctly and the service result is returned verbatim.
 */
describe('CreateCompanyHandler', () => {
  let handler: CreateCompanyHandler;
  let mockService: jest.Mocked<Pick<CompanyCreationService, 'create'>>;

  const command = new CreateCompanyCommand({
    name: 'Tech Corp',
    description: 'Leading technology company',
    website: 'https://techcorp.com',
    logoUrl: 'https://techcorp.com/logo.png',
    industry: 'Technology',
    size: '51-200',
    location: 'San Francisco, CA',
    position: 'HR Manager',
    createdBy: 'hr-user-id',
  });

  beforeEach(async () => {
    mockService = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCompanyHandler,
        { provide: CompanyCreationService, useValue: mockService },
      ],
    }).compile();

    handler = module.get<CreateCompanyHandler>(CreateCompanyHandler);
  });

  it('should forward command fields to CompanyCreationService.create', async () => {
    const fakeResult = { companyId: 'company-id-1' };
    mockService.create.mockResolvedValue(fakeResult);

    const result = await handler.execute(command);

    expect(mockService.create).toHaveBeenCalledTimes(1);
    expect(mockService.create).toHaveBeenCalledWith({
      name: command.name,
      description: command.description,
      website: command.website,
      logoUrl: command.logoUrl,
      industry: command.industry,
      size: command.size,
      location: command.location,
      position: command.position,
      createdBy: command.createdBy,
    });
    expect(result).toBe(fakeResult);
  });

  it('should propagate errors from the service', async () => {
    const error = new Error('boom');
    mockService.create.mockRejectedValue(error);

    await expect(handler.execute(command)).rejects.toBe(error);
  });
});
