/**
 * LocalStorage Service for Templates
 * Provides persistence for mock data during development
 */

import { Template } from '../types/template.types';
import { MOCK_TEMPLATES } from './mock-data';

const STORAGE_KEY = 'ai-interview-templates';
const STORAGE_VERSION = '1.0';

interface StorageData {
  version: string;
  templates: Template[];
  lastUpdated: string;
}

/**
 * Initialize storage with mock data if empty
 */
function initializeStorage(): void {
  if (typeof window === 'undefined') return;
  
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    const data: StorageData = {
      version: STORAGE_VERSION,
      templates: [...MOCK_TEMPLATES],
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('[Storage] Initialized with mock data:', data.templates.length, 'templates');
  }
}

/**
 * Get all templates from storage
 */
export function getTemplatesFromStorage(): Template[] {
  if (typeof window === 'undefined') return MOCK_TEMPLATES;
  
  try {
    initializeStorage();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return MOCK_TEMPLATES;
    
    const data: StorageData = JSON.parse(stored);
    console.log('[Storage] Loaded', data.templates.length, 'templates from localStorage');
    return data.templates;
  } catch (error) {
    console.error('[Storage] Error loading templates:', error);
    return MOCK_TEMPLATES;
  }
}

/**
 * Save templates to storage
 */
export function saveTemplatesToStorage(templates: Template[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const data: StorageData = {
      version: STORAGE_VERSION,
      templates,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log('[Storage] Saved', templates.length, 'templates to localStorage');
  } catch (error) {
    console.error('[Storage] Error saving templates:', error);
  }
}

/**
 * Get single template by ID
 */
export function getTemplateById(id: string): Template | null {
  const templates = getTemplatesFromStorage();
  return templates.find(t => t.id === id) || null;
}

/**
 * Add new template
 */
export function addTemplate(template: Template): void {
  const templates = getTemplatesFromStorage();
  templates.unshift(template);
  saveTemplatesToStorage(templates);
}

/**
 * Update existing template
 */
export function updateTemplate(id: string, updates: Partial<Template>): Template | null {
  const templates = getTemplatesFromStorage();
  const index = templates.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
  templates[index] = {
    ...templates[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  } as Template;
  
  saveTemplatesToStorage(templates);
  return templates[index];
}

/**
 * Delete template
 */
export function deleteTemplateFromStorage(id: string): boolean {
  const templates = getTemplatesFromStorage();
  const filtered = templates.filter(t => t.id !== id);
  
  if (filtered.length === templates.length) return false;
  
  saveTemplatesToStorage(filtered);
  return true;
}

/**
 * Clear all storage (for testing)
 */
export function clearStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  console.log('[Storage] Cleared all data');
}

/**
 * Reset to initial mock data
 */
export function resetToMockData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  initializeStorage();
  console.log('[Storage] Reset to mock data');
}
