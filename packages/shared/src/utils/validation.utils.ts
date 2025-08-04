import { ValidationError } from 'class-validator';

export function formatValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  
  errors.forEach((error) => {
    if (error.constraints) {
      Object.values(error.constraints).forEach((message) => {
        messages.push(message);
      });
    }
    
    if (error.children && error.children.length > 0) {
      messages.push(...formatValidationErrors(error.children));
    }
  });
  
  return messages;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
}
