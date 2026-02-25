import {
  Controller,
  Get,
  Param,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/guards/roles.decorator';
import { CurrentUser, CurrentUserData, extractPrimaryRole } from '../../../core/auth/decorators/current-user.decorator';
import { AnalysisServiceClient } from '../clients/analysis-service.client';

@ApiTags('Analysis')
@ApiBearerAuth()
@Controller('api/analysis')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalysisController {
  constructor(private readonly analysisClient: AnalysisServiceClient) {}

  @Get(':invitationId')
  @Roles('hr', 'admin')
  @ApiOperation({ 
    summary: 'Get full analysis results',
    description: 'Returns complete analysis results including overall score, summary, strengths, weaknesses, recommendation, and individual question analyses.',
  })
  @ApiParam({ name: 'invitationId', description: 'Invitation UUID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analysis results with question analyses' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Analysis not found' })
  async getAnalysisByInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const role = extractPrimaryRole(user);
    const result = await this.analysisClient.getAnalysisByInvitation(
      invitationId,
      user.userId,
      role,
    );

    if (!result) {
      return {
        success: false,
        message: 'Analysis not found for this invitation',
        data: null,
      };
    }

    return {
      success: true,
      data: result,
    };
  }

  @Get('status/:invitationId')
  @Roles('hr', 'admin', 'candidate')
  @ApiOperation({ 
    summary: 'Get analysis status',
    description: 'Returns the processing status of an analysis. Candidates can check if their interview has been analyzed.',
  })
  @ApiParam({ name: 'invitationId', description: 'Invitation UUID', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analysis status' })
  async getAnalysisStatus(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const role = extractPrimaryRole(user);
    const status = await this.analysisClient.getAnalysisStatus(
      invitationId,
      user.userId,
      role,
    );

    return {
      success: true,
      data: status,
    };
  }
}
