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

  async generateSummary(input: SummaryInput): Promise<SummaryOutput> {
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

  private async callGroq(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{ content: string; tokensUsed: number }> {
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
      const error = await response.text();
      this.logger.error(`Groq API error: ${response.status} - ${error}`);
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data: GroqResponse = await response.json();

    this.logger.debug(`Groq call completed in ${duration}ms, tokens: ${data.usage.total_tokens}`);

    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage.total_tokens,
    };
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
