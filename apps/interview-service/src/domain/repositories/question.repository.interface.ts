/**
 * Question Repository Interface
 * For operations on individual questions
 */
export interface IQuestionRepository {
  /**
   * Delete a question by ID
   */
  delete(questionId: string): Promise<void>;
}
