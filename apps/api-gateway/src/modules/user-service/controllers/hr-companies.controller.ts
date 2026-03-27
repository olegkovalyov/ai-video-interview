import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/guards/roles.decorator';
import { UserServiceClient } from '../clients/user-service.client';
import { LoggerService } from '../../../core/logging/logger.service';
import { ListCompaniesQueryDto } from '../dto/list-companies-query.dto';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyResponseDto,
  CompaniesListResponseDto,
  CompanyDeleteResponseDto,
} from '../dto/companies.dto';

/**
 * HR Companies Controller
 * Endpoints for HR users to manage their companies
 */
@ApiTags('HR - Companies')
@ApiBearerAuth()
@Controller('api/hr/companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('hr', 'admin')
export class HRCompaniesController {
  constructor(
    private readonly userServiceClient: UserServiceClient,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * POST /api/hr/companies
   * Create a new company
   */
  @Post()
  @ApiOperation({
    summary: 'Create company',
    description: 'Creates a new company for the current HR user. The company will be associated with the user who created it. HR users can only manage their own companies, while Admin users can manage all companies.',
  })
  @ApiResponse({
    status: 201,
    description: 'Company created successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data - validation failed for required fields' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - HR or Admin role required' })
  @ApiResponse({ status: 409, description: 'Company with this name already exists for this user' })
  async createCompany(
    @Req() req: Request & { user?: any },
    @Body() dto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    const userId = req.user?.userId;

    this.loggerService.info('HR: Creating company', {
      userId,
      companyName: dto.name,
    });

    const result = await this.userServiceClient.createCompany(dto, userId);

    this.loggerService.info('HR: Company created successfully', {
      userId,
      companyId: result.id,
    });

    return result;
  }

  /**
   * GET /api/hr/companies
   * List companies (HR sees own, Admin sees all)
   */
  @Get()
  @ApiOperation({
    summary: 'List my companies',
    description: 'Returns a paginated list of companies. HR users see only companies they created, while Admin users see all companies in the system.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Tech', description: 'Search by company name (partial match)' })
  @ApiQuery({ name: 'industry', required: false, type: String, example: 'Software Development', description: 'Filter by exact industry name' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, example: true, description: 'Filter by active status (true/false)' })
  @ApiResponse({
    status: 200,
    description: 'Companies list retrieved successfully with pagination info',
    type: CompaniesListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - HR or Admin role required' })
  async listCompanies(
    @Req() req: Request & { user?: any },
    @Query() query: ListCompaniesQueryDto,
  ): Promise<CompaniesListResponseDto> {
    const userId = req.user?.userId;
    const isAdmin = req.user?.roles?.includes('admin') || false;

    this.loggerService.info('HR: Listing companies', {
      userId,
      isAdmin,
      page: query.page,
      limit: query.limit,
      search: query.search,
    });

    const result = await this.userServiceClient.listCompanies(
      {
        page: query.page,
        limit: query.limit,
        search: query.search,
        industry: query.industry,
        isActive: query.isActive !== undefined ? query.isActive === 'true' : undefined,
      },
      userId,
      isAdmin,
    );

    this.loggerService.info('HR: Companies listed', {
      userId,
      total: result.pagination.total,
    });

    return result;
  }

  /**
   * GET /api/hr/companies/:id
   * Get company by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get company by ID',
    description: 'Retrieves detailed information about a specific company. HR users can only view companies they created, Admin users can view any company.',
  })
  @ApiParam({
    name: 'id',
    description: 'Company ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Company retrieved successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to view this company (not the owner)' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getCompany(
    @Req() req: Request & { user?: any },
    @Param('id') id: string,
  ): Promise<CompanyResponseDto> {
    const userId = req.user?.userId;
    const isAdmin = req.user?.roles?.includes('admin') || false;

    this.loggerService.info('HR: Getting company', { userId, companyId: id });

    const result = await this.userServiceClient.getCompanyById(id, userId, isAdmin);

    return result;
  }

  /**
   * PUT /api/hr/companies/:id
   * Update company
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update company',
    description: 'Updates company details. All fields are optional - only provided fields will be updated. HR users can only update companies they created, Admin users can update any company.',
  })
  @ApiParam({
    name: 'id',
    description: 'Company ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Company updated successfully',
    type: CompanyResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to update this company (not the owner)' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async updateCompany(
    @Req() req: Request & { user?: any },
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    const userId = req.user?.userId;
    const isAdmin = req.user?.roles?.includes('admin') || false;

    this.loggerService.info('HR: Updating company', { userId, companyId: id });

    const result = await this.userServiceClient.updateCompany(id, dto, userId, isAdmin);

    this.loggerService.info('HR: Company updated successfully', { userId, companyId: id });

    return result;
  }

  /**
   * DELETE /api/hr/companies/:id
   * Delete company
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete company',
    description: 'Permanently deletes a company. This action cannot be undone. HR users can only delete companies they created, Admin users can delete any company.',
  })
  @ApiParam({
    name: 'id',
    description: 'Company ID (UUID)',
    type: String,
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Company deleted successfully',
    type: CompanyDeleteResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not authorized to delete this company (not the owner)' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async deleteCompany(
    @Req() req: Request & { user?: any },
    @Param('id') id: string,
  ): Promise<CompanyDeleteResponseDto> {
    const userId = req.user?.userId;

    this.loggerService.info('HR: Deleting company', { userId, companyId: id });

    const result = await this.userServiceClient.deleteCompany(id, userId);

    this.loggerService.info('HR: Company deleted successfully', { userId, companyId: id });

    return result;
  }
}
