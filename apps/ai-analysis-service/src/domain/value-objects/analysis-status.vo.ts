import { ValueObject } from '../../shared/base/value-object';
import { InvalidStatusTransitionException, InvalidAnalysisStatusException } from '../exceptions/analysis.exceptions';

export enum AnalysisStatusEnum {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

interface AnalysisStatusProps {
  value: AnalysisStatusEnum;
}

export class AnalysisStatus extends ValueObject<AnalysisStatusProps> {
  private constructor(props: AnalysisStatusProps) {
    super(props);
  }

  public static pending(): AnalysisStatus {
    return new AnalysisStatus({ value: AnalysisStatusEnum.PENDING });
  }

  public static inProgress(): AnalysisStatus {
    return new AnalysisStatus({ value: AnalysisStatusEnum.IN_PROGRESS });
  }

  public static completed(): AnalysisStatus {
    return new AnalysisStatus({ value: AnalysisStatusEnum.COMPLETED });
  }

  public static failed(): AnalysisStatus {
    return new AnalysisStatus({ value: AnalysisStatusEnum.FAILED });
  }

  public static fromString(value: string): AnalysisStatus {
    const status = Object.values(AnalysisStatusEnum).find((s) => s === value);
    if (!status) {
      throw new InvalidAnalysisStatusException(value);
    }
    return new AnalysisStatus({ value: status });
  }

  get value(): AnalysisStatusEnum {
    return this.props.value;
  }

  get isPending(): boolean {
    return this.props.value === AnalysisStatusEnum.PENDING;
  }

  get isInProgress(): boolean {
    return this.props.value === AnalysisStatusEnum.IN_PROGRESS;
  }

  get isCompleted(): boolean {
    return this.props.value === AnalysisStatusEnum.COMPLETED;
  }

  get isFailed(): boolean {
    return this.props.value === AnalysisStatusEnum.FAILED;
  }

  get isTerminal(): boolean {
    return this.isCompleted || this.isFailed;
  }

  public canTransitionTo(newStatus: AnalysisStatus): boolean {
    if (this.isTerminal) return false;

    if (this.isPending) {
      return newStatus.isInProgress;
    }

    if (this.isInProgress) {
      return newStatus.isCompleted || newStatus.isFailed;
    }

    return false;
  }

  public transitionTo(newStatus: AnalysisStatus): AnalysisStatus {
    if (!this.canTransitionTo(newStatus)) {
      throw new InvalidStatusTransitionException(this.value, newStatus.value);
    }
    return newStatus;
  }
}
