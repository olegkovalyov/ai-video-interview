import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IQuestionRepository } from '../../../domain/repositories/question.repository.interface';
import { QuestionEntity } from '../entities/question.entity';

@Injectable()
export class TypeOrmQuestionRepository implements IQuestionRepository {
  constructor(
    @InjectRepository(QuestionEntity)
    private readonly repository: Repository<QuestionEntity>,
  ) {}

  async delete(questionId: string): Promise<void> {
    await this.repository.delete(questionId);
  }
}
