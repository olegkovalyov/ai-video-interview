import { ResponseType, ResponseTypeEnum } from '../response-type.vo';

describe('ResponseType Value Object', () => {
  describe('create', () => {
    it('should create type from valid string', () => {
      const type = ResponseType.create('text');
      expect(type.value).toBe(ResponseTypeEnum.TEXT);
    });

    it('should throw error for invalid type', () => {
      expect(() => ResponseType.create('invalid')).toThrow(
        'Invalid response type: invalid',
      );
    });
  });

  describe('factory methods', () => {
    it('should create text type', () => {
      const type = ResponseType.text();
      expect(type.isText()).toBe(true);
      expect(type.value).toBe(ResponseTypeEnum.TEXT);
    });

    it('should create code type', () => {
      const type = ResponseType.code();
      expect(type.isCode()).toBe(true);
      expect(type.value).toBe(ResponseTypeEnum.CODE);
    });

    it('should create video type', () => {
      const type = ResponseType.video();
      expect(type.isVideo()).toBe(true);
      expect(type.value).toBe(ResponseTypeEnum.VIDEO);
    });
  });

  describe('type checks', () => {
    it('text type should only be text', () => {
      const type = ResponseType.text();
      expect(type.isText()).toBe(true);
      expect(type.isCode()).toBe(false);
      expect(type.isVideo()).toBe(false);
    });

    it('code type should only be code', () => {
      const type = ResponseType.code();
      expect(type.isText()).toBe(false);
      expect(type.isCode()).toBe(true);
      expect(type.isVideo()).toBe(false);
    });

    it('video type should only be video', () => {
      const type = ResponseType.video();
      expect(type.isText()).toBe(false);
      expect(type.isCode()).toBe(false);
      expect(type.isVideo()).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      expect(ResponseType.text().toString()).toBe('text');
      expect(ResponseType.code().toString()).toBe('code');
      expect(ResponseType.video().toString()).toBe('video');
    });
  });

  describe('equals', () => {
    it('should return true for equal types', () => {
      const type1 = ResponseType.text();
      const type2 = ResponseType.text();
      expect(type1.equals(type2)).toBe(true);
    });

    it('should return false for different types', () => {
      const type1 = ResponseType.text();
      const type2 = ResponseType.code();
      expect(type1.equals(type2)).toBe(false);
    });
  });
});
