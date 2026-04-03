import { format } from "winston";

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

const colorize = (text: string, color: keyof typeof colors): string => {
  return `${colors[color]}${text}${colors.reset}`;
};

export const prettyConsoleFormat = format.printf((info) => {
  const levelColors = {
    error: colorize("[ERROR]", "red"),
    warn: colorize("[WARN] ", "yellow"),
    info: colorize("[INFO] ", "green"),
    debug: colorize("[DEBUG]", "blue"),
  };

  const level =
    levelColors[info.level] ||
    colorize(`[${info.level.toUpperCase()}]`, "white");

  let category = "";
  if (info.category && typeof info.category === "string") {
    const categoryName =
      info.category.charAt(0).toUpperCase() + info.category.slice(1);
    category = colorize(`${categoryName}: `, "cyan");
  }

  let msg = `${level} ${category}${info.message}`;

  const details: string[] = [];

  if (info.topic && typeof info.topic === "string") {
    details.push(info.topic);
  }

  if (info.email && typeof info.email === "string") {
    details.push(colorize(info.email, "cyan"));
  }

  if (info.userId && typeof info.userId === "string" && !info.email) {
    const shortId = info.userId.substring(0, 8);
    details.push(colorize(`(${shortId}...)`, "gray"));
  }

  if (info.eventType && typeof info.eventType === "string") {
    details.push(colorize(info.eventType, "magenta"));
  }

  if (details.length > 0) {
    msg += colorize(" → ", "gray") + details.join(colorize(" | ", "gray"));
  }

  if (info.error && typeof info.error === "string") {
    msg += colorize(` | ${info.error}`, "red");
  }

  return msg;
});

export function shouldEnableConsole(): boolean {
  const env = process.env.NODE_ENV || "development";
  return env !== "production";
}
