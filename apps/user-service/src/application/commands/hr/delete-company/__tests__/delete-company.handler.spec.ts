import { DeleteCompanyHandler } from '../delete-company.handler';
import { DeleteCompanyCommand } from '../delete-company.command';
import type { CompanyDeletionService } from '../../../../services/company-deletion.service';

describe('DeleteCompanyHandler (thin CQRS adapter)', () => {
  let companyDeletion: jest.Mocked<Pick<CompanyDeletionService, 'delete'>>;
  let handler: DeleteCompanyHandler;

  beforeEach(() => {
    companyDeletion = { delete: jest.fn() };
    handler = new DeleteCompanyHandler(
      companyDeletion as unknown as CompanyDeletionService,
    );
  });

  it('forwards command fields to CompanyDeletionService.delete', async () => {
    companyDeletion.delete.mockResolvedValue(undefined);

    await handler.execute(
      new DeleteCompanyCommand('company-id-1', 'hr-user-id'),
    );

    expect(companyDeletion.delete).toHaveBeenCalledTimes(1);
    expect(companyDeletion.delete).toHaveBeenCalledWith({
      companyId: 'company-id-1',
      userId: 'hr-user-id',
    });
  });

  it('propagates errors thrown by the service', async () => {
    const failure = new Error('boom');
    companyDeletion.delete.mockRejectedValue(failure);

    await expect(
      handler.execute(new DeleteCompanyCommand('c', 'u')),
    ).rejects.toThrow(failure);
  });
});
