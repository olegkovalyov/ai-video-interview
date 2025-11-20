import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

/**
 * Pipe to transform string query parameters to boolean
 * Handles 'true', 'false', '1', '0' (case-insensitive)
 * Returns undefined for missing/empty values
 */
@Injectable()
export class ParseBoolPipe implements PipeTransform<string | boolean | undefined, boolean | undefined> {
  transform(value: string | boolean | undefined): boolean | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase().trim();
      
      if (lowerValue === 'true' || lowerValue === '1') {
        return true;
      }
      
      if (lowerValue === 'false' || lowerValue === '0') {
        return false;
      }
      
      throw new BadRequestException(`Invalid boolean value: "${value}". Expected: true, false, 1, or 0`);
    }

    throw new BadRequestException(`Cannot convert ${typeof value} to boolean`);
  }
}
