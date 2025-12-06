import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
  extractPrimaryRole,
} from '../../../core/auth/decorators/current-user.decorator';
import { InterviewServiceClient, ListInvitationsQuery } from '../clients/interview-service.client';
import {
  CreateInvitationDto,
  SubmitResponseDto,
  CompleteInvitationDto,
  CreateInvitationResponseDto,
  SubmitResponseResponseDto,
  SuccessResponseDto,
  InvitationResponseDto,
  PaginatedInvitationsResponseDto,
} from '../dto/invitation.dto';

/**
 * Invitations Controller
 * Proxies interview invitation requests to Interview Service
 * 
 * All endpoints:
 * - Require JWT authentication (@UseGuards(JwtAuthGuard))
 * - Extract userId and role from JWT payload
 * - Forward requests to Interview Service with user context
 * - Interview Service handles RBAC and ownership checks
 */
@ApiTags('Invitations')
@ApiBearerAuth()
@Controller('api/invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private readonly interviewService: InterviewServiceClient) {}

  // ════════════════════════════════════════════════════════════════
  // Commands
  // ════════════════════════════════════════════════════════════════

  /**
   * POST /api/invitations
   * Create invitation (HR only)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create invitation',
    description: 'HR creates an interview invitation for a candidate. Template must be active (published).',
  })
  @ApiResponse({ status: 201, description: 'Invitation created', type: CreateInvitationResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate invitation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async create(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ id: string }> {
    const role = extractPrimaryRole(user);
    return this.interviewService.createInvitation(dto, user.userId, role);
  }

  /**
   * POST /api/invitations/:id/start
   * Start interview (Candidate only)
   */
  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start interview',
    description: 'Candidate starts the interview. Sets status to "in_progress".',
  })
  @ApiParam({ name: 'id', description: 'Invitation ID (UUID)', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Interview started', type: SuccessResponseDto })
  @ApiResponse({ status: 400, description: 'Already started or expired' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the invited candidate' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async start(
    @Param('id') invitationId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean }> {
    const role = extractPrimaryRole(user);
    return this.interviewService.startInvitation(invitationId, user.userId, role);
  }

  /**
   * POST /api/invitations/:id/responses
   * Submit response (Candidate only)
   */
  @Post(':id/responses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit response',
    description: 'Candidate submits an answer to a question. Interview must be in progress.',
  })
  @ApiParam({ name: 'id', description: 'Invitation ID (UUID)', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Response submitted', type: SubmitResponseResponseDto })
  @ApiResponse({ status: 400, description: 'Not in progress or duplicate response' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the invited candidate' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async submitResponse(
    @Param('id') invitationId: string,
    @Body() dto: SubmitResponseDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ id: string }> {
    const role = extractPrimaryRole(user);
    return this.interviewService.submitResponse(invitationId, dto, user.userId, role);
  }

  /**
   * POST /api/invitations/:id/complete
   * Complete interview (Candidate only)
   */
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete interview',
    description: 'Candidate completes the interview. All questions must be answered.',
  })
  @ApiParam({ name: 'id', description: 'Invitation ID (UUID)', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Interview completed', type: SuccessResponseDto })
  @ApiResponse({ status: 400, description: 'Not in progress or questions not answered' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the invited candidate' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async complete(
    @Param('id') invitationId: string,
    @Body() dto: CompleteInvitationDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean }> {
    const role = extractPrimaryRole(user);
    return this.interviewService.completeInvitation(invitationId, dto, user.userId, role);
  }

  /**
   * POST /api/invitations/:id/heartbeat
   * Heartbeat for non-pausable interviews
   */
  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Heartbeat',
    description: 'Update last activity for non-pausable interviews (allowPause=false). Used to detect if candidate left.',
  })
  @ApiParam({ name: 'id', description: 'Invitation ID (UUID)', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Activity updated', type: SuccessResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not the invited candidate' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async heartbeat(
    @Param('id') invitationId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ success: boolean }> {
    const role = extractPrimaryRole(user);
    return this.interviewService.heartbeat(invitationId, user.userId, role);
  }

  // ════════════════════════════════════════════════════════════════
  // Queries
  // ════════════════════════════════════════════════════════════════

  /**
   * GET /api/invitations/candidate
   * List invitations for current candidate
   */
  @Get('candidate')
  @ApiOperation({
    summary: 'List candidate invitations',
    description: 'Get paginated list of invitations for the current candidate.',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'in_progress', 'completed', 'expired'], description: 'Filter by invitation status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)', example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of invitations', type: PaginatedInvitationsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listCandidateInvitations(
    @Query('status') status?: 'pending' | 'in_progress' | 'completed' | 'expired',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: CurrentUserData,
  ): Promise<PaginatedInvitationsResponseDto> {
    const role = extractPrimaryRole(user!);
    const query: ListInvitationsQuery = {
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    return this.interviewService.listCandidateInvitations(user!.userId, role, query);
  }

  /**
   * GET /api/invitations/hr
   * List invitations created by current HR
   */
  @Get('hr')
  @ApiOperation({
    summary: 'List HR invitations',
    description: 'Get paginated list of invitations created by current HR.',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'in_progress', 'completed', 'expired'], description: 'Filter by invitation status' })
  @ApiQuery({ name: 'templateId', required: false, type: String, description: 'Filter by template UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)', example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of invitations', type: PaginatedInvitationsResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listHRInvitations(
    @Query('status') status?: 'pending' | 'in_progress' | 'completed' | 'expired',
    @Query('templateId') templateId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: CurrentUserData,
  ): Promise<PaginatedInvitationsResponseDto> {
    const role = extractPrimaryRole(user!);
    const query: ListInvitationsQuery = {
      status,
      templateId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    };
    return this.interviewService.listHRInvitations(user!.userId, role, query);
  }

  /**
   * GET /api/invitations/:id
   * Get invitation by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get invitation',
    description: 'Get invitation details. Only candidate, inviter, or admin can view. Use includeTemplate=true to get full template with questions for interview.',
  })
  @ApiParam({ name: 'id', description: 'Invitation ID (UUID)', format: 'uuid' })
  @ApiQuery({ name: 'includeTemplate', required: false, type: Boolean, description: 'Include template with questions (returns InvitationWithTemplateDto)' })
  @ApiResponse({ status: 200, description: 'Invitation details (InvitationResponseDto or InvitationWithTemplateDto if includeTemplate=true)', type: InvitationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not authorized to view' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async getOne(
    @Param('id') invitationId: string,
    @Query('includeTemplate') includeTemplate?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    const role = extractPrimaryRole(user!);
    return this.interviewService.getInvitation(
      invitationId,
      user!.userId,
      role,
      includeTemplate === 'true',
    );
  }
}
