export const PROMPT_LOADER = Symbol('IPromptLoader');

export interface CriteriaConfig {
  name: string;
  weight: number;
  description: string;
}

export interface IPromptLoader {
  getQuestionAnalysisPrompt(questionType: string, language: string): string;
  getSummaryPrompt(language: string): string;
  getCriteria(): CriteriaConfig[];
  getSystemPrompt(): string;
}
