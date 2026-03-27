import { describe, it, expect } from 'vitest';
import { companyKeys, invitationKeys, userKeys, templateKeys, skillKeys } from '../query-keys';

describe('companyKeys', () => {
  it('has correct base key', () => {
    expect(companyKeys.all).toEqual(['companies']);
  });

  it('creates lists key', () => {
    expect(companyKeys.lists()).toEqual(['companies', 'list']);
  });

  it('creates list key without filters', () => {
    expect(companyKeys.list()).toEqual(['companies', 'list', undefined]);
  });

  it('creates list key with filters', () => {
    const key = companyKeys.list({ search: 'test' });
    expect(key).toEqual(['companies', 'list', { search: 'test' }]);
  });

  it('creates detail key', () => {
    expect(companyKeys.detail('abc-123')).toEqual(['companies', 'detail', 'abc-123']);
  });

  it('list and detail keys share entity prefix but differ in scope', () => {
    const listKey = companyKeys.lists();
    const detailKey = companyKeys.detail('123');
    expect(detailKey[0]).toBe(listKey[0]); // same entity
    expect(detailKey[1]).not.toBe(listKey[1]); // different scope
  });
});

describe('invitationKeys', () => {
  it('has correct base key', () => {
    expect(invitationKeys.all).toEqual(['invitations']);
  });

  it('creates hr key', () => {
    expect(invitationKeys.hr()).toEqual(['invitations', 'hr']);
  });

  it('creates hrList key with filters', () => {
    const key = invitationKeys.hrList({ status: 'pending' });
    expect(key).toEqual(['invitations', 'hr', { status: 'pending' }]);
  });

  it('creates candidate key', () => {
    expect(invitationKeys.candidate()).toEqual(['invitations', 'candidate']);
  });

  it('creates candidateList key with filters', () => {
    const key = invitationKeys.candidateList({ status: 'completed', page: 3 });
    expect(key).toEqual(['invitations', 'candidate', { status: 'completed', page: 3 }]);
  });

  it('creates detail key', () => {
    expect(invitationKeys.detail('inv-456')).toEqual(['invitations', 'detail', 'inv-456']);
  });

  it('hr and candidate keys are distinct scopes', () => {
    const hrKey = invitationKeys.hr();
    const candidateKey = invitationKeys.candidate();
    expect(hrKey[0]).toBe(candidateKey[0]); // same entity
    expect(hrKey[1]).not.toBe(candidateKey[1]); // different scope
  });
});

describe('userKeys', () => {
  it('creates me key', () => {
    expect(userKeys.me()).toEqual(['users', 'me']);
  });

  it('creates detail key', () => {
    expect(userKeys.detail('user-1')).toEqual(['users', 'detail', 'user-1']);
  });
});

describe('templateKeys', () => {
  it('creates list key with filters', () => {
    const key = templateKeys.list({ status: 'active', search: 'eng' });
    expect(key).toEqual(['templates', 'list', { status: 'active', search: 'eng' }]);
  });

  it('creates questions key', () => {
    expect(templateKeys.questions('tpl-1')).toEqual(['templates', 'tpl-1', 'questions']);
  });
});

describe('query key uniqueness', () => {
  it('all entity base keys are unique', () => {
    const baseKeys = [
      companyKeys.all[0],
      invitationKeys.all[0],
      userKeys.all[0],
      templateKeys.all[0],
      skillKeys.all[0],
    ];
    const unique = new Set(baseKeys);
    expect(unique.size).toBe(baseKeys.length);
  });
});
