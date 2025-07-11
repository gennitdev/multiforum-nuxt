import { describe, it, expect } from 'vitest';
import { getSuspendedUserFilterValuesFromParams } from '../utils/getSuspendedUserFilterValuesFromParams';
import { getSuspendedModFilterValuesFromParams } from '../utils/getSuspendedModFilterValuesFromParams';

describe('Suspended User and Mod Filter Utilities', () => {
  describe('getSuspendedUserFilterValuesFromParams', () => {
    it('should extract searchInput from route query', () => {
      const route = {
        query: {
          searchInput: 'testuser'
        }
      };
      
      const result = getSuspendedUserFilterValuesFromParams({ route });
      
      expect(result.searchInput).toBe('testuser');
    });

    it('should return empty searchInput when not provided', () => {
      const route = {
        query: {}
      };
      
      const result = getSuspendedUserFilterValuesFromParams({ route });
      
      expect(result.searchInput).toBe('');
    });

    it('should handle undefined route query', () => {
      const route = {};
      
      const result = getSuspendedUserFilterValuesFromParams({ route });
      
      expect(result.searchInput).toBe('');
    });
  });

  describe('getSuspendedModFilterValuesFromParams', () => {
    it('should extract searchInput from route query', () => {
      const route = {
        query: {
          searchInput: 'testmod'
        }
      };
      
      const result = getSuspendedModFilterValuesFromParams({ route });
      
      expect(result.searchInput).toBe('testmod');
    });

    it('should return empty searchInput when not provided', () => {
      const route = {
        query: {}
      };
      
      const result = getSuspendedModFilterValuesFromParams({ route });
      
      expect(result.searchInput).toBe('');
    });

    it('should handle undefined route query', () => {
      const route = {};
      
      const result = getSuspendedModFilterValuesFromParams({ route });
      
      expect(result.searchInput).toBe('');
    });
  });
});