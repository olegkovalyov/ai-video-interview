import { Command } from '@nestjs/cqrs';

export interface UpdateCompanyCommandProps {
  companyId: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  userId: string;
}

export class UpdateCompanyCommand extends Command<void> {
  public readonly companyId: string;
  public readonly name: string;
  public readonly description: string | null;
  public readonly website: string | null;
  public readonly logoUrl: string | null;
  public readonly industry: string | null;
  public readonly size: string | null;
  public readonly location: string | null;
  public readonly userId: string;

  constructor(props: UpdateCompanyCommandProps) {
    super();
    this.companyId = props.companyId;
    this.name = props.name;
    this.description = props.description;
    this.website = props.website;
    this.logoUrl = props.logoUrl;
    this.industry = props.industry;
    this.size = props.size;
    this.location = props.location;
    this.userId = props.userId;
  }
}
