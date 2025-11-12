import { IsEnum } from 'class-validator';

export class UpdateExperienceLevelDto {
  @IsEnum(['junior', 'mid', 'senior', 'lead'])
  experienceLevel: string;
}
