/**
 * Skills types
 * Includes all skill management operations
 */

// ==================== SCHEMAS ====================

export interface CreateSkillDto {
  /**
   * @description Skill name
   * @example TypeScript
   */
  name: string;
  /**
   * @description Skill slug (URL-friendly)
   * @example typescript
   */
  slug: string;
  /**
   * @description Skill category ID
   * @example uuid
   */
  categoryId?: string;
  /**
   * @description Skill description
   * @example JavaScript superset with static typing
   */
  description?: string;
  /**
   * @description Admin ID performing the action
   * @example uuid
   */
  adminId?: string;
}

export interface UpdateSkillDto {
  /**
   * @description Skill name
   * @example TypeScript
   */
  name?: string;
  /**
   * @description Skill description
   * @example JavaScript superset with static typing
   */
  description?: string;
  /**
   * @description Skill category ID
   * @example uuid
   */
  categoryId?: string;
  /**
   * @description Admin ID performing the action
   * @example uuid
   */
  adminId?: string;
}

// ==================== SCHEMAS COMPONENT TYPE ====================

export interface SkillSchemas {
  CreateSkillDto: CreateSkillDto;
  UpdateSkillDto: UpdateSkillDto;
}

// ==================== PATHS ====================

export interface SkillPaths {
  "/skills": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List skills with filters and pagination */
    get: SkillOperations["SkillsController_listSkills"];
    put?: never;
    /** Create new skill */
    post: SkillOperations["SkillsController_createSkill"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/skills/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get skill by ID */
    get: SkillOperations["SkillsController_getSkill"];
    /** Update skill */
    put: SkillOperations["SkillsController_updateSkill"];
    post?: never;
    /** Delete skill */
    delete: SkillOperations["SkillsController_deleteSkill"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/skills/categories": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List all skill categories */
    get: SkillOperations["SkillsController_listCategories"];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}

// ==================== OPERATIONS ====================

export interface SkillOperations {
  SkillsController_listSkills: {
    parameters: {
      query?: {
        /** @description Page number (default: 1) */
        page?: number;
        /** @description Items per page (default: 20) */
        limit?: number;
        /** @description Search by skill name */
        search?: string;
        /** @description Filter by skill category ID */
        categoryId?: string;
        /** @description Filter by active status */
        isActive?: boolean;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Skills list retrieved successfully */
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
    };
  };
  SkillsController_createSkill: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": CreateSkillDto;
      };
    };
    responses: {
      /** @description Skill created successfully */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      /** @description Invalid request body */
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
      /** @description Skill already exists */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  SkillsController_getSkill: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Skill retrieved successfully */
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
      /** @description Skill not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  SkillsController_updateSkill: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": UpdateSkillDto;
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
      /** @description Invalid request body */
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
      /** @description Skill not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  SkillsController_deleteSkill: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Skill deleted successfully */
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
      /** @description Skill not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  SkillsController_listCategories: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Categories list retrieved successfully */
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
    };
  };
}
