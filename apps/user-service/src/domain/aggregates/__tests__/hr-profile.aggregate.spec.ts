import { HRProfile } from '../hr-profile.aggregate';
import { DomainException } from '../../exceptions/domain.exception';

describe('HRProfile Aggregate', () => {
  const userId = 'user-123';

  describe('Factory Methods', () => {
    describe('create()', () => {
      it('should create new HR profile with null defaults', () => {
        const profile = HRProfile.create(userId);

        expect(profile.userId).toBe(userId);
        expect(profile.companyName).toBeNull();
        expect(profile.position).toBeNull();
        expect(profile.createdAt).toBeInstanceOf(Date);
        expect(profile.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error for empty userId', () => {
        expect(() => HRProfile.create('')).toThrow(DomainException);
        expect(() => HRProfile.create('')).toThrow('User ID cannot be empty');
      });

      it('should throw error for whitespace-only userId', () => {
        expect(() => HRProfile.create('   ')).toThrow(DomainException);
      });

      it('should start with incomplete profile', () => {
        const profile = HRProfile.create(userId);

        expect(profile.isComplete()).toBe(false);
        expect(profile.getCompletionPercentage()).toBe(0);
      });
    });

    describe('reconstitute()', () => {
      it('should reconstitute profile from persistence', () => {
        const companyName = 'Tech Corp';
        const position = 'Senior HR Manager';
        const createdAt = new Date('2024-01-01');
        const updatedAt = new Date('2024-01-15');

        const profile = HRProfile.reconstitute(
          userId,
          companyName,
          position,
          createdAt,
          updatedAt,
        );

        expect(profile.userId).toBe(userId);
        expect(profile.companyName).toBe(companyName);
        expect(profile.position).toBe(position);
        expect(profile.createdAt).toBe(createdAt);
        expect(profile.updatedAt).toBe(updatedAt);
      });

      it('should reconstitute with null values', () => {
        const profile = HRProfile.reconstitute(
          userId,
          null,
          null,
          new Date(),
          new Date(),
        );

        expect(profile.companyName).toBeNull();
        expect(profile.position).toBeNull();
      });

      it('should reconstitute with partial data', () => {
        const profile = HRProfile.reconstitute(
          userId,
          'Tech Corp',
          null,
          new Date(),
          new Date(),
        );

        expect(profile.companyName).toBe('Tech Corp');
        expect(profile.position).toBeNull();
      });
    });
  });

  describe('Business Logic - Company Name', () => {
    describe('updateCompanyName()', () => {
      it('should set company name', () => {
        const profile = HRProfile.create(userId);
        
        profile.updateCompanyName('Tech Corp');

        expect(profile.companyName).toBe('Tech Corp');
      });

      it('should trim whitespace', () => {
        const profile = HRProfile.create(userId);
        
        profile.updateCompanyName('  Tech Corp  ');

        expect(profile.companyName).toBe('Tech Corp');
      });

      it('should update company name', () => {
        const profile = HRProfile.create(userId);
        profile.updateCompanyName('Old Company');
        
        profile.updateCompanyName('New Company');

        expect(profile.companyName).toBe('New Company');
      });

      it('should throw error for empty company name', () => {
        const profile = HRProfile.create(userId);
        
        expect(() => profile.updateCompanyName('')).toThrow(DomainException);
        expect(() => profile.updateCompanyName('')).toThrow('Company name cannot be empty');
      });

      it('should throw error for whitespace-only company name', () => {
        const profile = HRProfile.create(userId);
        
        expect(() => profile.updateCompanyName('   ')).toThrow(DomainException);
      });

      it('should throw error for company name longer than 255 characters', () => {
        const profile = HRProfile.create(userId);
        const longName = 'a'.repeat(256);
        
        expect(() => profile.updateCompanyName(longName)).toThrow(DomainException);
        expect(() => profile.updateCompanyName(longName)).toThrow('Company name is too long');
      });

      it('should accept company name with 255 characters', () => {
        const profile = HRProfile.create(userId);
        const maxName = 'a'.repeat(255);
        
        profile.updateCompanyName(maxName);

        expect(profile.companyName).toBe(maxName);
      });

      it('should update updatedAt timestamp', () => {
        const profile = HRProfile.create(userId);
        const oldUpdatedAt = profile.updatedAt;
        
        profile.updateCompanyName('Tech Corp');

        expect(profile.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
      });

      it('should accept company names with special characters', () => {
        const profile = HRProfile.create(userId);
        
        profile.updateCompanyName('Tech Corp & Co.');

        expect(profile.companyName).toBe('Tech Corp & Co.');
      });

      it('should accept company names with numbers', () => {
        const profile = HRProfile.create(userId);
        
        profile.updateCompanyName('Tech Corp 2024');

        expect(profile.companyName).toBe('Tech Corp 2024');
      });
    });
  });

  describe('Business Logic - Position', () => {
    describe('updatePosition()', () => {
      it('should set position', () => {
        const profile = HRProfile.create(userId);
        
        profile.updatePosition('Senior HR Manager');

        expect(profile.position).toBe('Senior HR Manager');
      });

      it('should trim whitespace', () => {
        const profile = HRProfile.create(userId);
        
        profile.updatePosition('  HR Manager  ');

        expect(profile.position).toBe('HR Manager');
      });

      it('should update position', () => {
        const profile = HRProfile.create(userId);
        profile.updatePosition('HR Manager');
        
        profile.updatePosition('Senior HR Manager');

        expect(profile.position).toBe('Senior HR Manager');
      });

      it('should throw error for empty position', () => {
        const profile = HRProfile.create(userId);
        
        expect(() => profile.updatePosition('')).toThrow(DomainException);
        expect(() => profile.updatePosition('')).toThrow('Position cannot be empty');
      });

      it('should throw error for whitespace-only position', () => {
        const profile = HRProfile.create(userId);
        
        expect(() => profile.updatePosition('   ')).toThrow(DomainException);
      });

      it('should throw error for position longer than 255 characters', () => {
        const profile = HRProfile.create(userId);
        const longPosition = 'a'.repeat(256);
        
        expect(() => profile.updatePosition(longPosition)).toThrow(DomainException);
        expect(() => profile.updatePosition(longPosition)).toThrow('Position is too long');
      });

      it('should accept position with 255 characters', () => {
        const profile = HRProfile.create(userId);
        const maxPosition = 'a'.repeat(255);
        
        profile.updatePosition(maxPosition);

        expect(profile.position).toBe(maxPosition);
      });

      it('should update updatedAt timestamp', () => {
        const profile = HRProfile.create(userId);
        const oldUpdatedAt = profile.updatedAt;
        
        profile.updatePosition('HR Manager');

        expect(profile.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
      });

      it('should accept positions with special characters', () => {
        const profile = HRProfile.create(userId);
        
        profile.updatePosition('HR Manager & Recruiter');

        expect(profile.position).toBe('HR Manager & Recruiter');
      });

      it('should accept positions with slashes', () => {
        const profile = HRProfile.create(userId);
        
        profile.updatePosition('HR Manager/Team Lead');

        expect(profile.position).toBe('HR Manager/Team Lead');
      });
    });
  });

  describe('Business Logic - Update Profile', () => {
    describe('updateProfile()', () => {
      it('should update both company name and position', () => {
        const profile = HRProfile.create(userId);
        
        profile.updateProfile('Tech Corp', 'Senior HR Manager');

        expect(profile.companyName).toBe('Tech Corp');
        expect(profile.position).toBe('Senior HR Manager');
      });

      it('should trim both values', () => {
        const profile = HRProfile.create(userId);
        
        profile.updateProfile('  Tech Corp  ', '  HR Manager  ');

        expect(profile.companyName).toBe('Tech Corp');
        expect(profile.position).toBe('HR Manager');
      });

      it('should throw error if company name is invalid', () => {
        const profile = HRProfile.create(userId);
        
        expect(() => profile.updateProfile('', 'HR Manager')).toThrow(DomainException);
      });

      it('should throw error if position is invalid', () => {
        const profile = HRProfile.create(userId);
        
        expect(() => profile.updateProfile('Tech Corp', '')).toThrow(DomainException);
      });

      it('should update updatedAt timestamp', () => {
        const profile = HRProfile.create(userId);
        const oldUpdatedAt = profile.updatedAt;
        
        profile.updateProfile('Tech Corp', 'HR Manager');

        expect(profile.updatedAt.getTime()).toBeGreaterThanOrEqual(oldUpdatedAt.getTime());
      });

      it('should complete profile after update', () => {
        const profile = HRProfile.create(userId);
        expect(profile.isComplete()).toBe(false);
        
        profile.updateProfile('Tech Corp', 'HR Manager');

        expect(profile.isComplete()).toBe(true);
        expect(profile.getCompletionPercentage()).toBe(100);
      });
    });
  });

  describe('Business Logic - Profile Completion', () => {
    describe('isComplete()', () => {
      it('should return false for empty profile', () => {
        const profile = HRProfile.create(userId);

        expect(profile.isComplete()).toBe(false);
      });

      it('should return false with only company name', () => {
        const profile = HRProfile.create(userId);
        profile.updateCompanyName('Tech Corp');

        expect(profile.isComplete()).toBe(false);
      });

      it('should return false with only position', () => {
        const profile = HRProfile.create(userId);
        profile.updatePosition('HR Manager');

        expect(profile.isComplete()).toBe(false);
      });

      it('should return true with both company name and position', () => {
        const profile = HRProfile.create(userId);
        profile.updateCompanyName('Tech Corp');
        profile.updatePosition('HR Manager');

        expect(profile.isComplete()).toBe(true);
      });
    });

    describe('getCompletionPercentage()', () => {
      it('should return 0% for empty profile', () => {
        const profile = HRProfile.create(userId);

        expect(profile.getCompletionPercentage()).toBe(0);
      });

      it('should return 50% with only company name', () => {
        const profile = HRProfile.create(userId);
        profile.updateCompanyName('Tech Corp');

        expect(profile.getCompletionPercentage()).toBe(50);
      });

      it('should return 50% with only position', () => {
        const profile = HRProfile.create(userId);
        profile.updatePosition('HR Manager');

        expect(profile.getCompletionPercentage()).toBe(50);
      });

      it('should return 100% when complete', () => {
        const profile = HRProfile.create(userId);
        profile.updateCompanyName('Tech Corp');
        profile.updatePosition('HR Manager');

        expect(profile.getCompletionPercentage()).toBe(100);
      });
    });
  });

  describe('Getters', () => {
    it('should return all properties correctly', () => {
      const profile = HRProfile.create(userId);
      profile.updateCompanyName('Tech Corp');
      profile.updatePosition('HR Manager');

      expect(profile.userId).toBe(userId);
      expect(profile.companyName).toBe('Tech Corp');
      expect(profile.position).toBe('HR Manager');
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null for unset values', () => {
      const profile = HRProfile.create(userId);

      expect(profile.companyName).toBeNull();
      expect(profile.position).toBeNull();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle full profile lifecycle', () => {
      // Create profile
      const profile = HRProfile.create(userId);
      expect(profile.isComplete()).toBe(false);
      expect(profile.getCompletionPercentage()).toBe(0);

      // Set company name
      profile.updateCompanyName('Tech Corp');
      expect(profile.getCompletionPercentage()).toBe(50);
      expect(profile.isComplete()).toBe(false);

      // Set position
      profile.updatePosition('HR Manager');
      expect(profile.isComplete()).toBe(true);
      expect(profile.getCompletionPercentage()).toBe(100);

      // Update company name
      profile.updateCompanyName('New Tech Corp');
      expect(profile.companyName).toBe('New Tech Corp');
      expect(profile.isComplete()).toBe(true);

      // Update position
      profile.updatePosition('Senior HR Manager');
      expect(profile.position).toBe('Senior HR Manager');
      expect(profile.isComplete()).toBe(true);
    });

    it('should update both fields at once', () => {
      const profile = HRProfile.create(userId);
      
      profile.updateProfile('Tech Corp', 'HR Manager');

      expect(profile.companyName).toBe('Tech Corp');
      expect(profile.position).toBe('HR Manager');
      expect(profile.isComplete()).toBe(true);
      expect(profile.getCompletionPercentage()).toBe(100);
    });

    it('should handle multiple updates', () => {
      const profile = HRProfile.create(userId);
      
      profile.updateProfile('Company A', 'Position A');
      expect(profile.companyName).toBe('Company A');
      expect(profile.position).toBe('Position A');
      
      profile.updateProfile('Company B', 'Position B');
      expect(profile.companyName).toBe('Company B');
      expect(profile.position).toBe('Position B');
      
      profile.updateProfile('Company C', 'Position C');
      expect(profile.companyName).toBe('Company C');
      expect(profile.position).toBe('Position C');
    });
  });
});
