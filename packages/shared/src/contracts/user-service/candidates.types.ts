/**
 * Candidates types
 * Includes all candidate profile and skills operations
 */

// ==================== SCHEMAS ====================

export interface AddCandidateSkillDto {
  /**
   * @description Skill ID to add
   * @example uuid
   */
  skillId: string;
  /**
   * @description Skill description or notes
   * @example Used in production for 2 years
   */
  description?: string;
  /**
   * @description Proficiency level
   * @example intermediate
   * @enum {string}
   */
  proficiencyLevel?: "beginner" | "intermediate" | "advanced" | "expert";
  /**
   * @description Years of experience with this skill
   * @example 2
   */
  yearsOfExperience?: number;
}

export interface UpdateCandidateSkillDto {
  /**
   * @description Skill description or notes
   * @example Updated: used in 5 major projects
   */
  description?: string;
  /**
   * @description Proficiency level
   * @example advanced
   * @enum {string}
   */
  proficiencyLevel?: "beginner" | "intermediate" | "advanced" | "expert";
  /**
   * @description Years of experience with this skill
   * @example 3
   */
  yearsOfExperience?: number;
}

// ==================== SCHEMAS COMPONENT TYPE ====================

export interface CandidateSchemas {
  AddCandidateSkillDto: AddCandidateSkillDto;
  UpdateCandidateSkillDto: UpdateCandidateSkillDto;
}

// ==================== PATHS ====================

export interface CandidatePaths {
  "/candidates/search": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Search candidates by skills (HR)
     * @description Search candidates with filters: skills, proficiency, experience level. Returns paginated results with match scores.
     */
    get: CandidateOperations["CandidatesController_searchCandidates"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/candidates/{userId}/profile": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get candidate profile
     * @description Get candidate profile with user info. Access control: own profile, HR, or Admin.
     */
    get: CandidateOperations["CandidatesController_getCandidateProfile"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/candidates/{userId}/skills": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /**
     * Get candidate skills grouped by category
     * @description Returns all candidate skills organized by skill categories. Access control: own skills, HR, or Admin.
     */
    get: CandidateOperations["CandidatesController_getCandidateSkills"];
    put?: never;
    /**
     * Add skill to candidate
     * @description Add a new skill to candidate profile with proficiency level and years of experience.
     */
    post: CandidateOperations["CandidatesController_addCandidateSkill"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/candidates/{userId}/skills/{skillId}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /**
     * Update candidate skill
     * @description Update skill description, proficiency level, or years of experience.
     */
    put: CandidateOperations["CandidatesController_updateCandidateSkill"];
    post?: never;
    /**
     * Remove skill from candidate
     * @description Remove a skill from candidate profile.
     */
    delete: CandidateOperations["CandidatesController_removeCandidateSkill"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}

// ==================== OPERATIONS ====================

export interface CandidateOperations {
  CandidatesController_searchCandidates: {
    parameters: {
      query: {
        /** @description Array of skill IDs to search for */
        skillIds?: string[];
        /** @description Minimum proficiency level filter */
        minProficiency?: "beginner" | "intermediate" | "advanced" | "expert";
        /** @description Minimum years of experience */
        minYears?: number;
        /** @description Experience level filter */
        experienceLevel?: "junior" | "mid" | "senior" | "lead";
        /** @description Page number (default: 1) */
        page?: number;
        /** @description Items per page (default: 20) */
        limit?: number;
        currentUserId: string;
        isHR: boolean;
        isAdmin: boolean;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Search results with pagination */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Invalid query parameters */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CandidatesController_getCandidateProfile: {
    parameters: {
      query: {
        currentUserId: string;
        isHR: boolean;
        isAdmin: boolean;
      };
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Profile retrieved successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Forbidden - not authorized to view this profile */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Profile not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CandidatesController_getCandidateSkills: {
    parameters: {
      query: {
        currentUserId: string;
        isHR: boolean;
        isAdmin: boolean;
      };
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Skills retrieved successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          "application/json": unknown;
        };
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Forbidden - not authorized to view these skills */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CandidatesController_addCandidateSkill: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": AddCandidateSkillDto;
      };
    };
    responses: {
      /** @description Skill added successfully */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Invalid input data */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Candidate or skill not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Skill already added to candidate */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CandidatesController_updateCandidateSkill: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
        skillId: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": UpdateCandidateSkillDto;
      };
    };
    responses: {
      /** @description Skill updated successfully */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Invalid input data */
      400: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Candidate or skill not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CandidatesController_removeCandidateSkill: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        userId: string;
        skillId: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Skill removed successfully */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Unauthorized - invalid or missing internal token */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Candidate or skill not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
}
