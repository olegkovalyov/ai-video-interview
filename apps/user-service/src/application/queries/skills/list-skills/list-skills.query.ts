export class ListSkillsQuery {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 50,
    public readonly categoryId?: string,
    public readonly isActive?: boolean,
    public readonly search?: string,
  ) {}
}
