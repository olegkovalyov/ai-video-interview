/**
 * Base class for Entities
 * Entities are compared by identity (id), not by value
 */
export abstract class Entity<T> {
  protected readonly _id: string;
  protected props: T;

  protected constructor(id: string, props: T) {
    this._id = id;
    this.props = props;
  }

  public get id(): string {
    return this._id;
  }

  /**
   * Entities are equal if they have the same id.
   */
  public equals(entity?: Entity<T> | null): boolean {
    if (!entity) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this._id === entity._id;
  }
}
