import { AggregateRoot } from '../base.aggregate-root';
import { Entity } from '../base.entity';
import { ValueObject } from '../base.value-object';

// Test implementations
class TestAggregate extends AggregateRoot {
  constructor(public readonly name: string) {
    super();
  }
}

class TestEntity extends Entity<{ name: string }> {
  constructor(id: string, name: string) {
    super(id, { name });
  }

  get name(): string {
    return this.props.name;
  }
}

class TestValueObject extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  get value(): string {
    return this.props.value;
  }
}

describe('Base Classes', () => {
  describe('AggregateRoot', () => {
    it('should create aggregate root', () => {
      const aggregate = new TestAggregate('test');
      expect(aggregate.name).toBe('test');
    });

    it('should apply and track domain events', () => {
      const aggregate = new TestAggregate('test');
      const event = { aggregateId: '123', eventName: 'TestEvent' };

      aggregate.apply(event);

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBe(event);
    });

    it('should clear events after commit', () => {
      const aggregate = new TestAggregate('test');
      aggregate.apply({ aggregateId: '123', eventName: 'Event1' });
      aggregate.apply({ aggregateId: '123', eventName: 'Event2' });

      expect(aggregate.getUncommittedEvents()).toHaveLength(2);

      aggregate.commit();

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should accumulate multiple events before commit', () => {
      const aggregate = new TestAggregate('test');

      aggregate.apply({ aggregateId: '1', eventName: 'Event1' });
      aggregate.apply({ aggregateId: '1', eventName: 'Event2' });
      aggregate.apply({ aggregateId: '1', eventName: 'Event3' });

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(3);
    });
  });

  describe('Entity', () => {
    it('should create entity with id and props', () => {
      const entity = new TestEntity('entity-1', 'Test Entity');

      expect(entity.id).toBe('entity-1');
      expect(entity.name).toBe('Test Entity');
    });

    it('should be equal when same ID', () => {
      const entity1 = new TestEntity('same-id', 'Name 1');
      const entity2 = new TestEntity('same-id', 'Name 2');

      expect(entity1.equals(entity2)).toBe(true);
    });

    it('should not be equal when different ID', () => {
      const entity1 = new TestEntity('id-1', 'Name');
      const entity2 = new TestEntity('id-2', 'Name');

      expect(entity1.equals(entity2)).toBe(false);
    });

    it('should be equal to itself', () => {
      const entity = new TestEntity('id', 'Name');

      expect(entity.equals(entity)).toBe(true);
    });

    it('should not be equal to null', () => {
      const entity = new TestEntity('id', 'Name');

      expect(entity.equals(null as any)).toBe(false);
    });

    it('should not be equal to undefined', () => {
      const entity = new TestEntity('id', 'Name');

      expect(entity.equals(undefined as any)).toBe(false);
    });
  });

  describe('ValueObject', () => {
    it('should create value object with props', () => {
      const vo = new TestValueObject('test-value');

      expect(vo.value).toBe('test-value');
    });

    it('should be equal when props are equal', () => {
      const vo1 = new TestValueObject('same-value');
      const vo2 = new TestValueObject('same-value');

      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should not be equal when props differ', () => {
      const vo1 = new TestValueObject('value-1');
      const vo2 = new TestValueObject('value-2');

      expect(vo1.equals(vo2)).toBe(false);
    });

    it('should be equal to itself', () => {
      const vo = new TestValueObject('value');

      expect(vo.equals(vo)).toBe(true);
    });

    it('should not be equal to null', () => {
      const vo = new TestValueObject('value');

      expect(vo.equals(null as any)).toBe(false);
    });

    it('should not be equal to undefined', () => {
      const vo = new TestValueObject('value');

      expect(vo.equals(undefined as any)).toBe(false);
    });

    it('should handle complex nested objects in equality', () => {
      class ComplexVO extends ValueObject<{ data: { nested: string } }> {
        constructor(nested: string) {
          super({ data: { nested } });
        }
      }

      const vo1 = new ComplexVO('test');
      const vo2 = new ComplexVO('test');
      const vo3 = new ComplexVO('different');

      expect(vo1.equals(vo2)).toBe(true);
      expect(vo1.equals(vo3)).toBe(false);
    });
  });
});
