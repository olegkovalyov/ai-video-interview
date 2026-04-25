import { format } from 'winston';

// ANSI color codes (простой подход без chalk для совместимости)
const colors = {
  reset: '\u001B[0m',
  red: '\u001B[31m',
  green: '\u001B[32m',
  yellow: '\u001B[33m',
  blue: '\u001B[34m',
  magenta: '\u001B[35m',
  cyan: '\u001B[36m',
  white: '\u001B[37m',
  gray: '\u001B[90m',
};

const colorize = (text: string, color: keyof typeof colors): string => {
  return `${colors[color]}${text}${colors.reset}`;
};

/**
 * Pretty Console Formatter для development
 * Формат: [LEVEL] Category: message → details
 *
 * Примеры:
 * [INFO] Kafka: auth-events connected
 * [INFO] User: olegkovalyov@test.com created (05371d57...)
 * [WARN] ID Token missing for logout
 * [ERROR] Database connection failed
 */
const LEVEL_COLORS: Record<string, string> = {
  error: colorize('[ERROR]', 'red'),
  warn: colorize('[WARN] ', 'yellow'),
  info: colorize('[INFO] ', 'green'),
  debug: colorize('[DEBUG]', 'blue'),
};

function formatLevel(rawLevel: string): string {
  return (
    LEVEL_COLORS[rawLevel] || colorize(`[${rawLevel.toUpperCase()}]`, 'white')
  );
}

function formatCategory(category: unknown): string {
  if (typeof category !== 'string' || !category) return '';
  const name = category.charAt(0).toUpperCase() + category.slice(1);
  return colorize(`${name}: `, 'cyan');
}

function collectDetails(info: Record<string, unknown>): string[] {
  const details: string[] = [];
  if (typeof info.topic === 'string') details.push(info.topic);
  if (typeof info.email === 'string')
    details.push(colorize(info.email, 'cyan'));
  if (typeof info.userId === 'string' && !info.email) {
    details.push(colorize(`(${info.userId.slice(0, 8)}...)`, 'gray'));
  }
  if (typeof info.eventType === 'string') {
    details.push(colorize(info.eventType, 'magenta'));
  }
  return details;
}

export const prettyConsoleFormat = format.printf((info) => {
  const level = formatLevel(String(info.level));
  const category = formatCategory(info.category);
  let msg = `${level} ${category}${String(info.message)}`;

  const details = collectDetails(info as Record<string, unknown>);
  if (details.length > 0) {
    msg += colorize(' → ', 'gray') + details.join(colorize(' | ', 'gray'));
  }
  if (typeof info.error === 'string') {
    msg += colorize(` | ${info.error}`, 'red');
  }
  return msg;
});

/**
 * Environment-based console транспорт
 * В production console отключен
 */
export function shouldEnableConsole(): boolean {
  const env = process.env.NODE_ENV || 'development';
  return env !== 'production';
}
