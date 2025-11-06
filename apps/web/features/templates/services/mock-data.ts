/**
 * Mock Data for Templates
 * TODO: Replace with real API calls to API Gateway
 */

import { Template, Question, PaginatedTemplates, TemplateStats } from '../types/template.types';

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'Describe your experience with React and modern frontend development',
    type: 'video',
    order: 1,
    timeLimit: 180,
    required: true,
    hints: 'Focus on recent projects, component architecture, and state management',
    createdAt: new Date('2024-11-01T10:00:00Z').toISOString(),
  },
  {
    id: 'q2',
    text: 'What is your understanding of TypeScript and its benefits?',
    type: 'video',
    order: 2,
    timeLimit: 120,
    required: true,
    createdAt: new Date('2024-11-01T10:05:00Z').toISOString(),
  },
  {
    id: 'q3',
    text: 'Explain the difference between var, let, and const',
    type: 'text',
    order: 3,
    timeLimit: 300,
    required: false,
    hints: 'Include examples and scoping rules',
    createdAt: new Date('2024-11-01T10:10:00Z').toISOString(),
  },
];

export const MOCK_TEMPLATES: Template[] = [
  {
    id: 'tpl-1',
    title: 'Frontend Developer Interview',
    description: 'Comprehensive interview for senior frontend developers with focus on React, TypeScript, and modern development practices',
    status: 'active',
    createdBy: 'user-123',
    questionsCount: 8,
    createdAt: new Date('2024-11-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-11-03T15:30:00Z').toISOString(),
    settings: {
      totalTimeLimit: 45,
      allowRetakes: false,
      showTimer: true,
      randomizeQuestions: false,
    },
  },
  {
    id: 'tpl-2',
    title: 'Backend Developer Interview',
    description: 'Node.js, NestJS, databases, and API design questions',
    status: 'draft',
    createdBy: 'user-123',
    questionsCount: 5,
    createdAt: new Date('2024-10-28T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-10-28T14:20:00Z').toISOString(),
    settings: {
      totalTimeLimit: 30,
      allowRetakes: true,
      showTimer: true,
      randomizeQuestions: false,
    },
  },
  {
    id: 'tpl-3',
    title: 'QA Automation Engineer',
    description: 'Testing frameworks, automation tools, and quality assurance practices',
    status: 'active',
    createdBy: 'user-456',
    questionsCount: 6,
    createdAt: new Date('2024-10-20T11:00:00Z').toISOString(),
    updatedAt: new Date('2024-10-25T16:45:00Z').toISOString(),
    settings: {
      totalTimeLimit: 40,
      allowRetakes: false,
      showTimer: false,
      randomizeQuestions: true,
    },
  },
  {
    id: 'tpl-4',
    title: 'DevOps Engineer Interview',
    description: 'CI/CD, Docker, Kubernetes, cloud platforms, and infrastructure as code',
    status: 'active',
    createdBy: 'user-123',
    questionsCount: 10,
    createdAt: new Date('2024-10-15T08:00:00Z').toISOString(),
    updatedAt: new Date('2024-10-22T12:00:00Z').toISOString(),
    settings: {
      totalTimeLimit: 60,
      allowRetakes: false,
      showTimer: true,
      randomizeQuestions: false,
    },
  },
  {
    id: 'tpl-5',
    title: 'Data Science Position',
    description: 'Machine learning, statistics, Python, and data analysis',
    status: 'draft',
    createdBy: 'user-789',
    questionsCount: 7,
    createdAt: new Date('2024-10-10T13:00:00Z').toISOString(),
    updatedAt: new Date('2024-10-10T17:30:00Z').toISOString(),
    settings: {
      totalTimeLimit: 50,
      allowRetakes: true,
      showTimer: true,
      randomizeQuestions: false,
    },
  },
  {
    id: 'tpl-6',
    title: 'Mobile Developer (React Native)',
    description: 'React Native, mobile development patterns, and cross-platform considerations',
    status: 'archived',
    createdBy: 'user-123',
    questionsCount: 4,
    createdAt: new Date('2024-09-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-09-15T14:00:00Z').toISOString(),
    settings: {
      totalTimeLimit: 35,
      allowRetakes: false,
      showTimer: true,
      randomizeQuestions: false,
    },
  },
];

export const MOCK_STATS: TemplateStats = {
  total: MOCK_TEMPLATES.length,
  active: MOCK_TEMPLATES.filter(t => t.status === 'active').length,
  draft: MOCK_TEMPLATES.filter(t => t.status === 'draft').length,
  archived: MOCK_TEMPLATES.filter(t => t.status === 'archived').length,
};

/**
 * Helper to simulate API delay
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
