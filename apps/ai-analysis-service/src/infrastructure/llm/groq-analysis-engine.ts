import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IAnalysisEngine,
  QuestionAnalysisInput,
  QuestionAnalysisOutput,
  SummaryInput,
  SummaryOutput,
  ANALYSIS_ENGINE,
} from '../../application/ports/analysis-engine.port';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

@Injectable()
export class GroqAnalysisEngine implements IAnalysisEngine {
  private readonly logger = new Logger(GroqAnalysisEngine.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GROQ_API_KEY', '');
    this.model = this.configService.get<string>('GROQ_MODEL', 'openai/gpt-oss-120b');

    if (!this.apiKey) {
      this.logger.warn('GROQ_API_KEY is not set! LLM calls will fail.');
    } else {
      this.logger.log(`Groq initialized with model: ${this.model}`);
    }
  }

  async analyzeResponse(input: QuestionAnalysisInput): Promise<QuestionAnalysisOutput> {
    const systemPrompt = this.getQuestionAnalysisSystemPrompt();
    const userPrompt = this.buildQuestionAnalysisPrompt(input);

    this.logger.debug(`Analyzing question: ${input.questionId}`);
    
    const response = await this.callGroq(systemPrompt, userPrompt);
    const parsed = this.parseQuestionAnalysisResponse(response.content);

    this.logger.debug(`Question ${input.questionId} scored: ${parsed.score}`);

    return {
      ...parsed,
      tokensUsed: response.tokensUsed,
    };
  }

  private readonly MAX_QUESTIONS_PER_SUMMARY = 15;

  async generateSummary(input: SummaryInput): Promise<SummaryOutput> {
    const questionsCount = input.questionAnalyses.length;

    // For <= 30 questions, use single summary
    if (questionsCount <= 30) {
      return this.generateSingleSummary(input);
    }

    // For > 30 questions, use chunked approach
    this.logger.log(`Using chunked summary for ${questionsCount} questions`);
    return this.generateChunkedSummary(input);
  }

  private async generateSingleSummary(input: SummaryInput): Promise<SummaryOutput> {
    const systemPrompt = this.getSummarySystemPrompt();
    const userPrompt = this.buildSummaryPrompt(input);

    this.logger.debug('Generating interview summary...');

    const response = await this.callGroq(systemPrompt, userPrompt);
    const parsed = this.parseSummaryResponse(response.content);

    this.logger.debug(`Summary generated. Recommendation: ${parsed.recommendation}`);

    return {
      ...parsed,
      tokensUsed: response.tokensUsed,
    };
  }

  private async generateChunkedSummary(input: SummaryInput): Promise<SummaryOutput> {
    const chunks = this.chunkArray(input.questionAnalyses, this.MAX_QUESTIONS_PER_SUMMARY);
    
    this.logger.debug(`Split into ${chunks.length} chunks for summary generation`);

    // Generate mini-summaries for each chunk
    const miniSummaries: Array<{ summary: string; avgScore: number; tokensUsed: number }> = [];
    let totalTokens = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkInput: SummaryInput = {
        ...input,
        questionAnalyses: chunk,
      };

      // Rate limit: wait between chunks (Groq free tier: 8000 TPM)
      if (i > 0) {
        this.logger.debug('Waiting 5s for rate limit...');
        await this.delay(5000);
      }

      this.logger.debug(`Generating mini-summary for chunk ${i + 1}/${chunks.length} (${chunk.length} questions)`);

      const systemPrompt = this.getMiniSummarySystemPrompt();
      const userPrompt = this.buildMiniSummaryPrompt(chunkInput, i + 1, chunks.length);

      const response = await this.callGroq(systemPrompt, userPrompt);
      const parsed = JSON.parse(response.content);

      const avgScore = chunk.reduce((sum, q) => sum + q.score, 0) / chunk.length;

      miniSummaries.push({
        summary: parsed.summary || '',
        avgScore: Math.round(avgScore),
        tokensUsed: response.tokensUsed,
      });

      totalTokens += response.tokensUsed;
    }

    // Generate final summary from mini-summaries
    this.logger.debug('Waiting 5s before final summary...');
    await this.delay(5000);
    this.logger.debug('Generating final summary from mini-summaries...');

    const finalSystemPrompt = this.getFinalSummarySystemPrompt();
    const finalUserPrompt = this.buildFinalSummaryPrompt(input, miniSummaries);

    const finalResponse = await this.callGroq(finalSystemPrompt, finalUserPrompt);
    const finalParsed = this.parseSummaryResponse(finalResponse.content);

    totalTokens += finalResponse.tokensUsed;

    this.logger.debug(`Chunked summary complete. Total tokens: ${totalTokens}`);

    return {
      ...finalParsed,
      tokensUsed: totalTokens,
    };
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private getMiniSummarySystemPrompt(): string {
    return `You are an expert interview analyst. Summarize a PORTION of an interview.

You MUST respond with a valid JSON object:
{
  "summary": "<brief 2-3 sentence summary of this portion>",
  "keyStrengths": ["<strength 1>", "<strength 2>"],
  "keyWeaknesses": ["<weakness 1>", "<weakness 2>"]
}

Be concise and focus on the most important observations.`;
  }

  private buildMiniSummaryPrompt(
    input: SummaryInput,
    partNumber: number,
    totalParts: number,
  ): string {
    const questionsText = input.questionAnalyses
      .map((qa, i) => `- Q: ${qa.questionText.slice(0, 100)}... | Score: ${qa.score}/100`)
      .join('\n');

    return `Summarize Part ${partNumber} of ${totalParts} of the interview:

**Position:** ${input.templateTitle}

## Questions in this part:
${questionsText}

Provide a brief summary as JSON.`;
  }

  private getFinalSummarySystemPrompt(): string {
    return this.getSummarySystemPrompt();
  }

  private buildFinalSummaryPrompt(
    input: SummaryInput,
    miniSummaries: Array<{ summary: string; avgScore: number; tokensUsed: number }>,
  ): string {
    const partsText = miniSummaries
      .map((ms, i) => `**Part ${i + 1}** (Avg Score: ${ms.avgScore}/100):\n${ms.summary}`)
      .join('\n\n');

    const overallAvg = Math.round(
      miniSummaries.reduce((sum, ms) => sum + ms.avgScore, 0) / miniSummaries.length
    );

    return `Generate a FINAL interview summary based on these partial summaries:

**Position:** ${input.templateTitle}
**Company:** ${input.companyName}
**Total Questions:** ${input.questionAnalyses.length}
**Overall Average Score:** ${overallAvg}/100

## Partial Summaries:
${partsText}

Combine these into a comprehensive final assessment as JSON.`;
  }

  private async callGroq(
    systemPrompt: string,
    userPrompt: string,
    retryCount = 0,
  ): Promise<{ content: string; tokensUsed: number }> {
    const MAX_RETRIES = 3;
    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const startTime = Date.now();

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle rate limit
      if (response.status === 429) {
        // Check if it's a daily limit (TPD) - no point in retrying
        const isDailyLimit = errorText.includes('tokens per day') || 
                            errorText.includes('TPD') ||
                            errorText.includes('per day');
        
        if (isDailyLimit) {
          this.logger.error(`Daily token limit (TPD) reached. Reset at midnight UTC.`);
          throw new Error(`Daily token limit (TPD) reached. Please try again tomorrow or upgrade to Developer tier.`);
        }
        
        // Retry only for per-minute limits (TPM/RPM)
        if (retryCount < MAX_RETRIES) {
          // Parse retry delay from error message (formats: "X.XXs", "Xms", "X seconds")
          let retryDelay = (retryCount + 1) * 3000; // Default exponential backoff: 3s, 6s, 9s
          
          const secMatch = errorText.match(/try again in ([\d.]+)\s*s(?:econds?)?/i);
          const msMatch = errorText.match(/try again in ([\d.]+)\s*ms/i);
          
          if (secMatch) {
            retryDelay = Math.ceil(parseFloat(secMatch[1]) * 1000) + 500; // Add 500ms buffer
          } else if (msMatch) {
            retryDelay = Math.ceil(parseFloat(msMatch[1])) + 500;
          }
          
          this.logger.warn(`Rate limited (TPM/RPM). Retry ${retryCount + 1}/${MAX_RETRIES} after ${retryDelay}ms`);
          await this.delay(retryDelay);
          
          return this.callGroq(systemPrompt, userPrompt, retryCount + 1);
        }
      }
      
      this.logger.error(`Groq API error: ${response.status} - ${errorText}`);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data: GroqResponse = await response.json();

    this.logger.debug(`Groq call completed in ${duration}ms, tokens: ${data.usage.total_tokens}`);

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage.total_tokens,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getQuestionAnalysisSystemPrompt(): string {
    return `You are an expert interview analyst. Your task is to evaluate candidate responses to interview questions.

You MUST respond with a valid JSON object with this exact structure:
{
  "score": <number 0-100>,
  "feedback": "<string with constructive feedback>",
  "criteriaScores": [
    {"criterion": "relevance", "score": <0-100>, "weight": 0.25},
    {"criterion": "completeness", "score": <0-100>, "weight": 0.25},
    {"criterion": "clarity", "score": <0-100>, "weight": 0.25},
    {"criterion": "depth", "score": <0-100>, "weight": 0.25}
  ]
}

Scoring guidelines:
- 90-100: Exceptional answer, demonstrates expert knowledge
- 75-89: Good answer, shows solid understanding
- 60-74: Adequate answer, meets basic requirements
- 40-59: Below average, missing key points
- 0-39: Poor answer, significant gaps in understanding

Be fair, objective, and provide actionable feedback.`;
  }

  private buildQuestionAnalysisPrompt(input: QuestionAnalysisInput): string {
    let prompt = `Analyze this interview response:

**Question:** ${input.questionText}
**Question Type:** ${input.questionType}
**Candidate's Response:** ${input.responseText}`;

    if (input.correctAnswer) {
      prompt += `\n**Correct Answer:** ${input.correctAnswer}`;
    }

    prompt += '\n\nProvide your analysis as JSON.';

    return prompt;
  }

  private parseQuestionAnalysisResponse(content: string): Omit<QuestionAnalysisOutput, 'tokensUsed'> {
    try {
      const parsed = JSON.parse(content);
      return {
        score: Math.min(100, Math.max(0, Math.round(parsed.score))),
        feedback: parsed.feedback || 'No feedback provided',
        criteriaScores: parsed.criteriaScores || [
          { criterion: 'relevance', score: parsed.score, weight: 0.25 },
          { criterion: 'completeness', score: parsed.score, weight: 0.25 },
          { criterion: 'clarity', score: parsed.score, weight: 0.25 },
          { criterion: 'depth', score: parsed.score, weight: 0.25 },
        ],
      };
    } catch (error) {
      this.logger.error(`Failed to parse LLM response: ${content}`);
      throw new Error('Failed to parse LLM response');
    }
  }

  private getSummarySystemPrompt(): string {
    return `You are an expert interview analyst. Your task is to provide an overall assessment of a candidate's interview performance.

You MUST respond with a valid JSON object with this exact structure:
{
  "summary": "<2-3 paragraph overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "recommendation": "<one of: hire, consider, reject>"
}

Recommendation guidelines:
- "hire": Average score >= 75 AND no critical weaknesses
- "consider": Average score 50-74 OR has some concerns
- "reject": Average score < 50 OR has major red flags

Be professional, constructive, and objective.`;
  }

  private buildSummaryPrompt(input: SummaryInput): string {
    const questionsText = input.questionAnalyses
      .map((qa, i) => `${i + 1}. **Q:** ${qa.questionText}\n   **A:** ${qa.responseText}\n   **Score:** ${qa.score}/100\n   **Feedback:** ${qa.feedback}`)
      .join('\n\n');

    return `Generate an interview summary for:

**Position:** ${input.templateTitle}
**Company:** ${input.companyName}

## Questions and Responses:
${questionsText}

Provide your overall assessment as JSON.`;
  }

  private parseSummaryResponse(content: string): Omit<SummaryOutput, 'tokensUsed'> {
    try {
      const parsed = JSON.parse(content);
      const recommendation = parsed.recommendation?.toLowerCase();
      
      return {
        summary: parsed.summary || 'No summary provided',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        recommendation: ['hire', 'consider', 'reject'].includes(recommendation) 
          ? recommendation 
          : 'consider',
      };
    } catch (error) {
      this.logger.error(`Failed to parse summary response: ${content}`);
      throw new Error('Failed to parse summary response');
    }
  }
}
