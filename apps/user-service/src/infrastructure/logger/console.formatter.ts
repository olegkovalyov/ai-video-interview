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
export const prettyConsoleFormat = format.printf((info) => {
  // Цветные уровни как в NestJS
  const levelColors = {
    error: colorize('[ERROR]', 'red'),
    warn: colorize('[WARN] ', 'yellow'),
    info: colorize('[INFO] ', 'green'),
    debug: colorize('[DEBUG]', 'blue'),
  };

  const level =
    levelColors[info.level] ||
    colorize(`[${info.level.toUpperCase()}]`, 'white');

  // Категория (если есть)
  let category = '';
  if (info.category && typeof info.category === 'string') {
    const categoryName =
      info.category.charAt(0).toUpperCase() + info.category.slice(1);
    category = colorize(`${categoryName}: `, 'cyan');
  }

  // Базовое сообщение
  let msg = `${level} ${category}${String(info.message)}`;

  // Добавляем контекстные детали (средний уровень)
  const details: string[] = [];

  // Kafka topics
  if (info.topic && typeof info.topic === 'string') {
    details.push(info.topic);
  }

  // Email (для user операций)
  if (info.email && typeof info.email === 'string') {
    details.push(colorize(info.email, 'cyan'));
  }

  // User ID (короткий)
  if (info.userId && typeof info.userId === 'string' && !info.email) {
    const shortId = info.userId.slice(0, 8);
    details.push(colorize(`(${shortId}...)`, 'gray'));
  }

  // Action результат
  if (
    info.action &&
    (info.action === 'connect' || info.action === 'subscribe')
  ) {
    // Уже включено в message, пропускаем
  }

  // Event Type для Kafka
  if (info.eventType && typeof info.eventType === 'string') {
    details.push(colorize(info.eventType, 'magenta'));
  }

  // Добавляем детали
  if (details.length > 0) {
    msg += colorize(' → ', 'gray') + details.join(colorize(' | ', 'gray'));
  }

  // Ошибка (если есть)
  if (info.error && typeof info.error === 'string') {
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
