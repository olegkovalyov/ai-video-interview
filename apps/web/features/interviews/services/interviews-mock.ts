import { Interview } from '../types/interview.types';

export const MOCK_INTERVIEWS: Interview[] = [
  {
    id: '1',
    title: 'Frontend Developer Interview',
    description: 'React, TypeScript, and modern frontend development',
    status: 'active',
    questionsCount: 5,
    candidatesCount: 8,
    responsesCount: 5,
    createdAt: '2025-01-15T10:00:00Z',
    duration: 45,
    publicUrl: 'https://interview.app/i/abc123',
  },
  {
    id: '2',
    title: 'Senior Backend Engineer',
    description: 'Node.js, microservices, and system design',
    status: 'draft',
    questionsCount: 7,
    candidatesCount: 0,
    responsesCount: 0,
    createdAt: '2025-01-18T14:30:00Z',
    duration: 60,
  },
  {
    id: '3',
    title: 'Product Manager Assessment',
    description: 'Strategy, roadmapping, and stakeholder management',
    status: 'completed',
    questionsCount: 6,
    candidatesCount: 12,
    responsesCount: 12,
    createdAt: '2025-01-10T09:15:00Z',
    duration: 30,
    publicUrl: 'https://interview.app/i/def456',
  },
];
