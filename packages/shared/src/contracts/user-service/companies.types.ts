/**
 * Companies types
 * Includes all company management operations
 */

// ==================== SCHEMAS ====================

export interface CreateCompanyDto {
  /**
   * @description Company name
   * @example TechCorp Inc.
   */
  name: string;
  /**
   * @description Company industry
   * @example Software Development
   */
  industry: string;
  /**
   * @description Company size
   * @example 50-100 employees
   */
  size: string;
  /**
   * @description Company website URL
   * @example https://techcorp.com
   */
  website?: string;
  /**
   * @description Company description
   * @example Leading software development company
   */
  description?: string;
  /**
   * @description Company location
   * @example San Francisco, CA
   */
  location?: string;
  /**
   * @description HR user ID creating the company
   * @example uuid
   */
  createdBy: string;
}

export interface UpdateCompanyDto {
  /**
   * @description Company name
   * @example TechCorp Inc.
   */
  name?: string;
  /**
   * @description Company industry
   * @example Software Development
   */
  industry?: string;
  /**
   * @description Company size
   * @example 50-100 employees
   */
  size?: string;
  /**
   * @description Company website URL
   * @example https://techcorp.com
   */
  website?: string;
  /**
   * @description Company description
   * @example Leading software development company
   */
  description?: string;
  /**
   * @description Company location
   * @example San Francisco, CA
   */
  location?: string;
  /**
   * @description HR user ID updating the company
   * @example uuid
   */
  updatedBy: string;
}

// ==================== SCHEMAS COMPONENT TYPE ====================

export interface CompanySchemas {
  CreateCompanyDto: CreateCompanyDto;
  UpdateCompanyDto: UpdateCompanyDto;
}

// ==================== PATHS ====================

export interface CompanyPaths {
  "/companies": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** List companies with filters */
    get: CompanyOperations["CompaniesController_listCompanies"];
    put?: never;
    /** Create new company */
    post: CompanyOperations["CompaniesController_createCompany"];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/companies/{id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Get company by ID */
    get: CompanyOperations["CompaniesController_getCompany"];
    /** Update company */
    put: CompanyOperations["CompaniesController_updateCompany"];
    post?: never;
    /** Delete company */
    delete: CompanyOperations["CompaniesController_deleteCompany"];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}

// ==================== OPERATIONS ====================

export interface CompanyOperations {
  CompaniesController_listCompanies: {
    parameters: {
      query?: {
        /** @description Page number (default: 1) */
        page?: number;
        /** @description Items per page (default: 20) */
        limit?: number;
        /** @description Search by company name */
        search?: string;
        /** @description Filter by industry */
        industry?: string;
        /** @description Filter by company size */
        size?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Companies list retrieved successfully */
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
  CompaniesController_createCompany: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        "application/json": CreateCompanyDto;
      };
    };
    responses: {
      /** @description Company created successfully */
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
      /** @description Company already exists */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CompaniesController_getCompany: {
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
      /** @description Company retrieved successfully */
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
      /** @description Company not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CompaniesController_updateCompany: {
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
        "application/json": UpdateCompanyDto;
      };
    };
    responses: {
      /** @description Company updated successfully */
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
      /** @description Company not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
  CompaniesController_deleteCompany: {
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
      /** @description Company deleted successfully */
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
      /** @description Company not found */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
    };
  };
}
