import { User } from '../types/user.types';

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getInitials(user: User): string {
  return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
}

export function getFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}
