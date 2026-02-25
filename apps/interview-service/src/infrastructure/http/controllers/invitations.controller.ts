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
  Headers,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { InternalServiceGuard } from '../guards/internal-service.guard';
import {
  CreateInvitationDto,
  SubmitResponseDto,
  CompleteInvitationDto,
  ListInvitationsQueryDto,
} from '../../../application/dto/invitation.request.dto';
import {
  CreateInvitationResponseDto,
  SubmitResponseResponseDto,
  SuccessResponseDto,
  InvitationResponseDto,
  InvitationWithTemplateDto,
  PaginatedInvitationsResponseDto,
} from '../../../application/dto/invitation.response.dto';
import {
  CreateInvitationCommand,
  StartInvitationCommand,
  SubmitResponseCommand,
  CompleteInvitationCommand,
} from '../../../application/commands';
import {
  GetInvitationQuery,
  ListCandidateInvitationsQuery,
  ListHRInvitationsQuery,
} from '../../../application/queries';

@ApiTags('Invitations')
@ApiSecurity('internal-token')
@ApiHeader({ name: 'x-user-id', description: 'Current user UUID', required: true })
@ApiHeader({ name: 'x-user-role', description: 'User role (admin, hr, candidate)', required: true })
@Controller('api/invitations')
@UseGuards(InternalServiceGuard)
export class InvitationsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ==================== COMMANDS ====================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create invitation', 
    description: 'HR creates an interview invitation for a candidate. Template must be active (published). Cannot create duplicate invitations for same candidate+template combination.',
  })
  @ApiResponse({ status: 201, description: 'Invitation created successfully', type: CreateInvitationResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or template is not active' })
  @ApiResponse({ status: 409, description: 'Invitation for this candidate+template already exists' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async create(
    @Body() dto: CreateInvitationDto,
    @Headers('x-user-id') userId: string,
  ): Promise<{ id: string }> {
    const command = new CreateInvitationCommand(
      dto.templateId,
      dto.candidateId,
      dto.companyName,
      userId, // invitedBy = current HR user
      new Date(dto.expiresAt),
      dto.allowPause ?? true,
      dto.showTimer ?? true,
    );

    const invitationId = await this.commandBus.execute(command);

    return { id: invitationId };
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Start interview', 
    description: 'Candidate starts the interview. Sets status to "in_progress" and records startedAt timestamp. Can only be started by the invited candidate.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Invitation ID' })
  @ApiResponse({ status: 200, description: 'Interview started successfully', type: SuccessResponseDto })
  @ApiResponse({ status: 410, description: 'Invitation has expired' })
  @ApiResponse({ status: 422, description: 'Invitation cannot be started (already in progress or completed)' })
  @ApiResponse({ status: 403, description: 'Not the invited candidate' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async start(
    @Param('id') invitationId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<{ success: boolean }> {
    const command = new StartInvitationCommand(invitationId, userId);
    await this.commandBus.execute(command);

    return { success: true };
  }

  @Post(':id/responses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Submit response', 
    description: 'Candidate submits an answer to a question. Interview must be in "in_progress" status. Each question can only be answered once.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Invitation ID' })
  @ApiResponse({ status: 201, description: 'Response submitted successfully', type: SubmitResponseResponseDto })
  @ApiResponse({ status: 409, description: 'Response for this question already submitted' })
  @ApiResponse({ status: 422, description: 'Interview is not in progress' })
  @ApiResponse({ status: 403, description: 'Not the invited candidate' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async submitResponse(
    @Param('id') invitationId: string,
    @Body() dto: SubmitResponseDto,
    @Headers('x-user-id') userId: string,
  ): Promise<{ id: string }> {
    const command = new SubmitResponseCommand(
      invitationId,
      userId,
      dto.questionId,
      dto.questionIndex,
      dto.questionText,
      dto.responseType,
      dto.duration,
      dto.textAnswer,
      dto.codeAnswer,
      dto.videoUrl,
    );

    const responseId = await this.commandBus.execute(command);

    return { id: responseId };
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Complete interview', 
    description: 'Candidate completes the interview. All questions must be answered before completion. Sets status to "completed" and records completedAt timestamp.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Invitation ID' })
  @ApiResponse({ status: 200, description: 'Interview completed successfully', type: SuccessResponseDto })
  @ApiResponse({ status: 422, description: 'Interview is not in progress, or not all questions answered' })
  @ApiResponse({ status: 403, description: 'Not the invited candidate' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async complete(
    @Param('id') invitationId: string,
    @Body() dto: CompleteInvitationDto,
    @Headers('x-user-id') userId: string,
  ): Promise<{ success: boolean }> {
    const command = new CompleteInvitationCommand(
      invitationId,
      userId,
      dto.reason || 'manual',
    );

    await this.commandBus.execute(command);

    return { success: true };
  }

  // ==================== QUERIES ====================

  @Get('candidate')
  @ApiOperation({ 
    summary: 'List candidate invitations', 
    description: 'Get paginated list of all invitations for the current authenticated candidate. Supports filtering by status.',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'in_progress', 'completed', 'expired'], description: 'Filter by invitation status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)', example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of candidate invitations', type: PaginatedInvitationsResponseDto })
  async listCandidateInvitations(
    @Query() query: ListInvitationsQueryDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<PaginatedInvitationsResponseDto> {
    const listQuery = new ListCandidateInvitationsQuery(
      userId, // candidateId = current user
      userId,
      role,
      query.status,
      query.page || 1,
      query.limit || 10,
    );

    return this.queryBus.execute(listQuery);
  }

  @Get('hr')
  @ApiOperation({ 
    summary: 'List HR invitations', 
    description: 'Get paginated list of all invitations created by the current HR user. Supports filtering by status and template.',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'in_progress', 'completed', 'expired'], description: 'Filter by invitation status' })
  @ApiQuery({ name: 'templateId', required: false, type: String, description: 'Filter by template UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-based)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)', example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of HR invitations', type: PaginatedInvitationsResponseDto })
  async listHRInvitations(
    @Query() query: ListInvitationsQueryDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<PaginatedInvitationsResponseDto> {
    const listQuery = new ListHRInvitationsQuery(
      userId, // hrUserId = current user
      userId,
      role,
      query.status,
      query.templateId,
      query.page || 1,
      query.limit || 10,
    );

    return this.queryBus.execute(listQuery);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get invitation', 
    description: 'Get invitation details by ID. Only the invited candidate, the HR who created it, or an admin can view. Use includeTemplate=true to get full template with questions.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Invitation ID' })
  @ApiQuery({ name: 'includeTemplate', required: false, type: Boolean, description: 'Include full template with questions (for candidate taking interview)' })
  @ApiResponse({ status: 200, description: 'Invitation details', type: InvitationResponseDto })
  @ApiResponse({ status: 403, description: 'Not authorized to view this invitation' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async getOne(
    @Param('id') invitationId: string,
    @Query('includeTemplate') includeTemplate: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') role: string,
  ): Promise<InvitationResponseDto | InvitationWithTemplateDto> {
    const query = new GetInvitationQuery(
      invitationId,
      userId,
      role,
      includeTemplate === 'true',
    );

    return this.queryBus.execute(query);
  }

  // ==================== HEARTBEAT (for allowPause=false) ====================

  @Post(':id/heartbeat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Heartbeat', 
    description: 'Update last activity timestamp for non-pausable interviews (allowPause=false). Used to detect if candidate left the interview.',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'Invitation ID' })
  @ApiResponse({ status: 200, description: 'Activity updated', type: SuccessResponseDto })
  async heartbeat(
    @Param('id') invitationId: string,
    @Headers('x-user-id') userId: string,
  ): Promise<{ success: boolean }> {
    // TODO: Implement heartbeat command or use repository directly
    // For now, just return success - will be implemented with cron job
    return { success: true };
  }
}
