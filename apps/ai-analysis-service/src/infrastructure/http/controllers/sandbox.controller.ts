import { Controller, Post, Body, Get, Logger, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyzeRequestDto } from '../dto/analyze-request.dto';
import { ANALYSIS_ENGINE } from '../../../application/ports/analysis-engine.port';
import type { IAnalysisEngine, QuestionAnalysisInput } from '../../../application/ports/analysis-engine.port';

@ApiTags('Sandbox')
@Controller('sandbox')
export class SandboxController {
  private readonly logger = new Logger(SandboxController.name);

  constructor(
    @Inject(ANALYSIS_ENGINE)
    private readonly analysisEngine: IAnalysisEngine,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  health() {
    return { status: 'ok', service: 'ai-analysis-service', timestamp: new Date().toISOString() };
  }

  @Get('test-groq')
  @ApiOperation({ summary: 'Test Groq API connection' })
  @ApiResponse({ status: 200, description: 'Groq API is working' })
  async testGroq() {
    this.logger.log('Testing Groq API connection...');

    const testInput: QuestionAnalysisInput = {
      questionId: 'test-q-1',
      questionText: 'What is 2 + 2?',
      questionType: 'text',
      responseText: 'The answer is 4.',
    };

    const startTime = Date.now();
    const result = await this.analysisEngine.analyzeResponse(testInput);
    const duration = Date.now() - startTime;

    this.logger.log(`Groq test completed in ${duration}ms`);
    console.log('\n' + '='.repeat(60));
    console.log('GROQ TEST RESULT:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(result, null, 2));
    console.log('='.repeat(60) + '\n');

    return {
      status: 'success',
      duration: `${duration}ms`,
      tokensUsed: result.tokensUsed,
      result,
    };
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze interview (sandbox mode - output to console)' })
  @ApiResponse({ status: 200, description: 'Analysis completed' })
  async analyze(@Body() dto: AnalyzeRequestDto) {
    const startTime = Date.now();
    let totalTokensUsed = 0;

    this.logger.log(`\n${'='.repeat(60)}`);
    this.logger.log(`STARTING ANALYSIS FOR INVITATION: ${dto.invitationId}`);
    this.logger.log(`Template: ${dto.templateTitle} | Company: ${dto.companyName}`);
    this.logger.log(`Questions: ${dto.questions.length} | Responses: ${dto.responses.length}`);
    this.logger.log('='.repeat(60));

    const questionAnalyses: Array<{
      questionId: string;
      questionText: string;
      responseText: string;
      score: number;
      feedback: string;
      criteriaScores: any[];
      tokensUsed: number;
    }> = [];

    for (const response of dto.responses) {
      const question = dto.questions.find(q => q.id === response.questionId);
      if (!question) {
        this.logger.warn(`Question not found for response: ${response.questionId}`);
        continue;
      }

      const responseText = this.getResponseText(response, question);
      if (!responseText) {
        this.logger.warn(`Empty response for question: ${question.id}`);
        continue;
      }

      const correctAnswer = this.getCorrectAnswer(question);

      const input: QuestionAnalysisInput = {
        questionId: question.id,
        questionText: question.text,
        questionType: question.type,
        responseText,
        correctAnswer,
      };

      this.logger.log(`\n--- Analyzing Question: ${question.id} ---`);
      this.logger.log(`Q: ${question.text.substring(0, 100)}...`);
      this.logger.log(`A: ${responseText.substring(0, 100)}...`);

      const result = await this.analysisEngine.analyzeResponse(input);
      totalTokensUsed += result.tokensUsed;

      this.logger.log(`Score: ${result.score}/100 | Tokens: ${result.tokensUsed}`);
      this.logger.log(`Feedback: ${result.feedback.substring(0, 150)}...`);

      questionAnalyses.push({
        questionId: question.id,
        questionText: question.text,
        responseText,
        score: result.score,
        feedback: result.feedback,
        criteriaScores: result.criteriaScores,
        tokensUsed: result.tokensUsed,
      });
    }

    this.logger.log(`\n${'='.repeat(60)}`);
    this.logger.log('GENERATING SUMMARY...');
    this.logger.log('='.repeat(60));

    const summaryResult = await this.analysisEngine.generateSummary({
      questionAnalyses: questionAnalyses.map(qa => ({
        questionText: qa.questionText,
        responseText: qa.responseText,
        score: qa.score,
        feedback: qa.feedback,
      })),
      templateTitle: dto.templateTitle,
      companyName: dto.companyName,
    });

    totalTokensUsed += summaryResult.tokensUsed;
    const processingTime = Date.now() - startTime;

    const overallScore = questionAnalyses.length > 0
      ? Math.round(questionAnalyses.reduce((sum, qa) => sum + qa.score, 0) / questionAnalyses.length)
      : 0;

    const finalResult = {
      invitationId: dto.invitationId,
      candidateId: dto.candidateId,
      templateId: dto.templateId,
      templateTitle: dto.templateTitle,
      companyName: dto.companyName,
      status: 'completed',
      overallScore,
      summary: summaryResult.summary,
      strengths: summaryResult.strengths,
      weaknesses: summaryResult.weaknesses,
      recommendation: summaryResult.recommendation,
      metadata: {
        totalTokensUsed,
        processingTimeMs: processingTime,
        questionsAnalyzed: questionAnalyses.length,
        language: dto.language || 'en',
      },
      questionAnalyses,
    };

    console.log('\n' + '='.repeat(60));
    console.log('FINAL ANALYSIS RESULT:');
    console.log('='.repeat(60));
    console.log(JSON.stringify(finalResult, null, 2));
    console.log('='.repeat(60));
    console.log(`\nTotal processing time: ${processingTime}ms`);
    console.log(`Total tokens used: ${totalTokensUsed}`);
    console.log(`Recommendation: ${summaryResult.recommendation.toUpperCase()}`);
    console.log('='.repeat(60) + '\n');

    return finalResult;
  }

  private getResponseText(
    response: { textAnswer?: string; selectedOptionId?: string },
    question: { options?: Array<{ id: string; text: string }> },
  ): string {
    if (response.textAnswer) {
      return response.textAnswer;
    }
    if (response.selectedOptionId && question.options) {
      const selectedOption = question.options.find(o => o.id === response.selectedOptionId);
      return selectedOption?.text || '';
    }
    return '';
  }

  private getCorrectAnswer(
    question: { type: string; options?: Array<{ text: string; isCorrect: boolean }> },
  ): string | undefined {
    if (question.type === 'multiple_choice' && question.options) {
      const correctOption = question.options.find(o => o.isCorrect);
      return correctOption?.text;
    }
    return undefined;
  }
}
