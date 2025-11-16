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
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiQuery, ApiBody } from '@nestjs/swagger';

// Guards
import { InternalServiceGuard } from '../guards/internal-service.guard';
import { Public } from '../decorators/public.decorator';

// Commands
import { CreateCompanyCommand } from '../../../application/commands/hr/create-company/create-company.command';
import { UpdateCompanyCommand } from '../../../application/commands/hr/update-company/update-company.command';
import { DeleteCompanyCommand } from '../../../application/commands/hr/delete-company/delete-company.command';

// Queries
import { ListCompaniesQuery } from '../../../application/queries/companies/list-companies.query';
import { GetCompanyQuery } from '../../../application/queries/companies/get-company.query';

// DTOs
import { CreateCompanyDto, UpdateCompanyDto, ListCompaniesDto } from '../dto/companies.dto';
import { CompanyResponseDto, CompanyListResponseDto, CompanySuccessResponseDto } from '../dto/companies.response.dto';

// Mappers
import { CompanyResponseMapper } from '../mappers/company.response.mapper';

// Error Schemas
import {
  BadRequestErrorSchema,
  UnauthorizedErrorSchema,
  ForbiddenErrorSchema,
  NotFoundErrorSchema,
  ConflictErrorSchema,
  ValidationErrorSchema,
} from '../schemas/error.schemas';

/**
 * Companies Controller
 * 
 * HR Companies Management API
 * Protected by InternalServiceGuard (x-internal-token)
 * 
 * Endpoints:
 * - POST   /companies              - Create new company
 * - GET    /companies              - List companies with filters
 * - GET    /companies/:id          - Get company by ID
 * - PUT    /companies/:id          - Update company
 * - DELETE /companies/:id          - Delete company
 */
@ApiTags('companies')
@Controller('companies')
@ApiSecurity('internal-token')
@UseGuards(InternalServiceGuard)
@Public()
export class CompaniesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ============================================
  // Commands
  // ============================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new company' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({ status: 201, type: CompanySuccessResponseDto, description: 'Company created successfully' })
  @ApiResponse({ status: 400, type: ValidationErrorSchema, description: 'Invalid input data' })
  @ApiResponse({ status: 401, type: UnauthorizedErrorSchema, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 409, type: ConflictErrorSchema, description: 'Company already exists' })
  async createCompany(
    @Body() dto: CreateCompanyDto,
  ) {
    try {
      const command = new CreateCompanyCommand(
        dto.name,
        dto.description || null,
        dto.website || null,
        null, // logoUrl
        dto.industry || null,
        dto.size || null,
        dto.location || null,
        null, // position
        dto.createdBy,
      );

      const result = await this.commandBus.execute(command);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // Database unique constraint violation
      if (error.code === '23505' || error.message.includes('duplicate key')) {
        throw new ConflictException({
          success: false,
          error: 'Company with this name already exists',
          code: 'COMPANY_ALREADY_EXISTS',
        });
      }

      if (error.message.includes('already exists')) {
        throw new ConflictException({
          success: false,
          error: error.message,
          code: 'COMPANY_ALREADY_EXISTS',
        });
      }

      if (error.message.includes('Invalid company size')) {
        throw new BadRequestException({
          success: false,
          error: error.message,
          code: 'INVALID_COMPANY_SIZE',
        });
      }

      throw new BadRequestException({
        success: false,
        error: error.message,
      });
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update company' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({ status: 200, type: CompanySuccessResponseDto, description: 'Company updated successfully' })
  @ApiResponse({ status: 400, type: BadRequestErrorSchema, description: 'Invalid input data' })
  @ApiResponse({ status: 401, type: UnauthorizedErrorSchema, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 403, type: ForbiddenErrorSchema, description: 'Forbidden - not authorized to update this company' })
  @ApiResponse({ status: 404, type: NotFoundErrorSchema, description: 'Company not found' })
  async updateCompany(
    @Param('id') companyId: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    try {
      const command = new UpdateCompanyCommand(
        companyId,
        dto.name || '',
        dto.description || null,
        dto.website || null,
        null, // logoUrl
        dto.industry || null,
        dto.size || null,
        dto.location || null,
        dto.updatedBy,
      );

      const result = await this.commandBus.execute(command);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException({
          success: false,
          error: error.message,
          code: 'COMPANY_NOT_FOUND',
        });
      }

      if (error.message.includes('not authorized')) {
        throw new ForbiddenException({
          success: false,
          error: error.message,
          code: 'FORBIDDEN',
        });
      }

      if (error.message.includes('Invalid company size')) {
        throw new BadRequestException({
          success: false,
          error: error.message,
          code: 'INVALID_COMPANY_SIZE',
        });
      }

      throw new BadRequestException({
        success: false,
        error: error.message,
      });
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company' })
  @ApiResponse({ status: 204, description: 'Company deleted successfully' })
  @ApiResponse({ status: 401, type: UnauthorizedErrorSchema, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 403, type: ForbiddenErrorSchema, description: 'Forbidden - not authorized to delete this company' })
  @ApiResponse({ status: 404, type: NotFoundErrorSchema, description: 'Company not found' })
  async deleteCompany(
    @Param('id') companyId: string,
    @Query('userId') userId: string,
  ) {
    try {
      const command = new DeleteCompanyCommand(companyId, userId);
      await this.commandBus.execute(command);
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException({
          success: false,
          error: error.message,
          code: 'COMPANY_NOT_FOUND',
        });
      }

      if (error.message.includes('not authorized')) {
        throw new ForbiddenException({
          success: false,
          error: error.message,
          code: 'FORBIDDEN',
        });
      }

      throw new BadRequestException({
        success: false,
        error: error.message,
      });
    }
  }

  // ============================================
  // Queries
  // ============================================

  @Get()
  @ApiOperation({ summary: 'List companies with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by company name' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'createdBy', required: false, type: String, description: 'Filter by creator user ID' })
  @ApiQuery({ name: 'currentUserId', required: false, type: String, description: 'Current user ID for permissions' })
  @ApiQuery({ name: 'isAdmin', required: false, type: Boolean, description: 'Is admin flag (default: false)' })
  @ApiResponse({ status: 200, description: 'Companies list retrieved successfully' })
  @ApiResponse({ status: 401, type: UnauthorizedErrorSchema, description: 'Unauthorized - invalid or missing internal token' })
  async listCompanies(
    @Query() query: ListCompaniesDto,
  ) {
    const listQuery = new ListCompaniesQuery(
      query.page || 1,
      query.limit || 20,
      query.isActive,
      query.search,
      query.createdBy,
      query.currentUserId,
      query.isAdmin || false,
    );

    const result = await this.queryBus.execute(listQuery);

    return {
      success: true,
      data: CompanyResponseMapper.toCompanyListDto(result.data),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, type: CompanySuccessResponseDto, description: 'Company retrieved successfully' })
  @ApiResponse({ status: 401, type: UnauthorizedErrorSchema, description: 'Unauthorized - invalid or missing internal token' })
  @ApiResponse({ status: 403, type: ForbiddenErrorSchema, description: 'Forbidden - not authorized to view this company' })
  @ApiResponse({ status: 404, type: NotFoundErrorSchema, description: 'Company not found' })
  async getCompany(
    @Param('id') companyId: string,
    @Query('userId') userId?: string,
    @Query('isAdmin') isAdmin?: boolean,
  ) {
    try {
      const query = new GetCompanyQuery(companyId);
      const result = await this.queryBus.execute(query);

      return {
        success: true,
        data: CompanyResponseMapper.toCompanyDto(result),
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException({
          success: false,
          error: error.message,
          code: 'COMPANY_NOT_FOUND',
        });
      }

      if (error.message.includes('not authorized')) {
        throw new ForbiddenException({
          success: false,
          error: error.message,
          code: 'FORBIDDEN',
        });
      }

      throw new BadRequestException({
        success: false,
        error: error.message,
      });
    }
  }
}
