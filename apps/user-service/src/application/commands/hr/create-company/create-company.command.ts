import { Command } from '@nestjs/cqrs';

export interface CreateCompanyCommandProps {
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  position: string | null;
  createdBy: string;
}

export class CreateCompanyCommand extends Command<{ companyId: string }> {
  public readonly name: string;
  public readonly description: string | null;
  public readonly website: string | null;
  public readonly logoUrl: string | null;
  public readonly industry: string | null;
  public readonly size: string | null;
  public readonly location: string | null;
  public readonly position: string | null;
  public readonly createdBy: string;

  constructor(props: CreateCompanyCommandProps) {
    super();
    this.name = props.name;
    this.description = props.description;
    this.website = props.website;
    this.logoUrl = props.logoUrl;
    this.industry = props.industry;
    this.size = props.size;
    this.location = props.location;
    this.position = props.position;
    this.createdBy = props.createdBy;
  }
}
