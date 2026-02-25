import { Injectable } from '@nestjs/common';
import {
  IPromptLoader,
  CriteriaConfig,
} from '../../../application/ports/prompt-loader.port';

/**
 * Static prompt loader adapter.
 * Returns hardcoded prompt templates and criteria configs.
 *
 * In the future, prompts can be loaded from a database or config files
 * without changing the application layer (swap this adapter).
 */
@Injectable()
export class StaticPromptLoader implements IPromptLoader {
  getSystemPrompt(): string {
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

  getQuestionAnalysisPrompt(questionType: string, language: string): string {
    const langNote =
      language !== 'en'
        ? `\nProvide your feedback in ${language} language.`
        : '';

    return `Analyze the following interview response for a ${questionType} question.${langNote}

Evaluate on these criteria:
1. **Relevance** — how well the answer addresses the question
2. **Completeness** — coverage of key points
3. **Clarity** — communication quality and structure
4. **Depth** — level of insight, expertise, and examples

Provide your analysis as JSON.`;
  }

  getSummaryPrompt(language: string): string {
    const langNote =
      language !== 'en'
        ? `\nProvide the summary and feedback in ${language} language.`
        : '';

    return `Generate an overall interview assessment based on the individual question analyses provided.${langNote}

Recommendation guidelines:
- "hire": Average score >= 75 AND no critical weaknesses
- "consider": Average score 50-74 OR has some concerns
- "reject": Average score < 50 OR has major red flags

Provide your assessment as JSON.`;
  }

  getCriteria(): CriteriaConfig[] {
    return [
      {
        name: 'relevance',
        weight: 0.25,
        description: 'How well the answer addresses the question',
      },
      {
        name: 'completeness',
        weight: 0.25,
        description: 'Coverage of key points and concepts',
      },
      {
        name: 'clarity',
        weight: 0.25,
        description: 'Communication quality and structure',
      },
      {
        name: 'depth',
        weight: 0.25,
        description: 'Level of insight, expertise, and examples',
      },
    ];
  }
}
