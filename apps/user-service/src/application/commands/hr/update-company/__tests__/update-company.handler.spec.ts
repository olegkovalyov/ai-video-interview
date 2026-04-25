import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { UpdateCompanyHandler } from '../update-company.handler';
import { UpdateCompanyCommand } from '../update-company.command';
import { CompanyUpdateService } from '../../../../services/company-update.service';

/**
 * Handler is a thin CQRS adapter — full use-case logic is covered by
 * `CompanyUpdateService` tests. Here we only verify the command shape is
 * forwarded correctly and errors propagate verbatim.
 */
describe('UpdateCompanyHandler', () => {
  let handler: UpdateCompanyHandler;
  let mockService: jest.Mocked<Pick<CompanyUpdateService, 'update'>>;

  const command = new UpdateCompanyCommand({
    companyId: 'company-id-1',
    name: 'Updated Name',
    description: 'Updated description',
    website: 'https://updated.com',
    logoUrl: 'https://updated.com/logo.png',
    industry: 'Technology',
    size: '51-200',
    location: 'San Francisco, CA',
    userId: 'hr-user-id',
  });

  beforeEach(async () => {
    mockService = { update: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCompanyHandler,
        { provide: CompanyUpdateService, useValue: mockService },
      ],
    }).compile();

    handler = module.get<UpdateCompanyHandler>(UpdateCompanyHandler);
  });

  it('should forward command fields to CompanyUpdateService.update', async () => {
    mockService.update.mockResolvedValue(undefined);

    await handler.execute(command);

    expect(mockService.update).toHaveBeenCalledTimes(1);
    expect(mockService.update).toHaveBeenCalledWith({
      companyId: command.companyId,
      name: command.name,
      description: command.description,
      website: command.website,
      logoUrl: command.logoUrl,
      industry: command.industry,
      size: command.size,
      location: command.location,
      userId: command.userId,
    });
  });

  it('should propagate errors from the service', async () => {
    const error = new Error('boom');
    mockService.update.mockRejectedValue(error);

    await expect(handler.execute(command)).rejects.toBe(error);
  });
});
