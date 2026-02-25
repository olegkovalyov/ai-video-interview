import { ValueObject } from '../value-object';
import { Entity } from '../entity';
import { AggregateRoot, DomainEvent } from '../aggregate-root';

class TestValueObject extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }
}

class TestEntity extends Entity<{ name: string }> {
  constructor(name: string, id?: string) {
    super({ name }, id);
  }

  get name(): string {
    return this.props.name;
  }
}

class TestEvent implements DomainEvent {
  readonly eventId = 'event-1';
  readonly occurredAt = new Date();
  constructor(public readonly aggregateId: string) {}
}

class TestAggregate extends AggregateRoot<{ name: string }> {
  constructor(name: string, id?: string) {
    super({ name }, id);
  }

  doSomething(): void {
    this.addDomainEvent(new TestEvent(this.id));
  }
}

describe('Base Classes', () => {
  describe('ValueObject', () => {
    it('should create value object with frozen props', () => {
      const vo = new TestValueObject('test');
      expect(vo.value).toBe('test');
    });

    it('should return true for equal value objects', () => {
      const vo1 = new TestValueObject('test');
      const vo2 = new TestValueObject('test');
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should return false for different value objects', () => {
      const vo1 = new TestValueObject('test1');
      const vo2 = new TestValueObject('test2');
      expect(vo1.equals(vo2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const vo = new TestValueObject('test');
      expect(vo.equals(null as any)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      const vo = new TestValueObject('test');
      expect(vo.equals(undefined)).toBe(false);
    });
  });

  describe('Entity', () => {
    it('should generate id if not provided', () => {
      const entity = new TestEntity('test');
      expect(entity.id).toBeDefined();
      expect(typeof entity.id).toBe('string');
    });

    it('should use provided id', () => {
      const entity = new TestEntity('test', 'custom-id');
      expect(entity.id).toBe('custom-id');
    });

    it('should return true for entities with same id', () => {
      const e1 = new TestEntity('name1', 'same-id');
      const e2 = new TestEntity('name2', 'same-id');
      expect(e1.equals(e2)).toBe(true);
    });

    it('should return false for entities with different ids', () => {
      const e1 = new TestEntity('name', 'id-1');
      const e2 = new TestEntity('name', 'id-2');
      expect(e1.equals(e2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      const entity = new TestEntity('test');
      expect(entity.equals(null as any)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      const entity = new TestEntity('test');
      expect(entity.equals(undefined)).toBe(false);
    });

    it('should return false when comparing with non-entity', () => {
      const entity = new TestEntity('test');
      expect(entity.equals({ _id: entity.id } as any)).toBe(false);
    });
  });

  describe('AggregateRoot', () => {
    it('should start with empty domain events', () => {
      const aggregate = new TestAggregate('test');
      expect(aggregate.domainEvents).toHaveLength(0);
    });

    it('should add domain events', () => {
      const aggregate = new TestAggregate('test');
      aggregate.doSomething();

      expect(aggregate.domainEvents).toHaveLength(1);
      expect(aggregate.domainEvents[0]).toBeInstanceOf(TestEvent);
    });

    it('should return copy of domain events', () => {
      const aggregate = new TestAggregate('test');
      aggregate.doSomething();

      const events1 = aggregate.domainEvents;
      const events2 = aggregate.domainEvents;

      expect(events1).not.toBe(events2);
      expect(events1).toEqual(events2);
    });

    it('should clear domain events', () => {
      const aggregate = new TestAggregate('test');
      aggregate.doSomething();
      aggregate.doSomething();

      expect(aggregate.domainEvents).toHaveLength(2);

      aggregate.clearEvents();

      expect(aggregate.domainEvents).toHaveLength(0);
    });
  });
});
