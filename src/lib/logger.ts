type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, meta?: unknown) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta !== undefined ? { meta } : {}),
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
  } else if (level === "warn") {
    console.warn(JSON.stringify(payload));
  } else if (process.env.NODE_ENV !== "production" || level === "info") {
    console.log(JSON.stringify(payload));
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => log("debug", msg, meta),
  info: (msg: string, meta?: unknown) => log("info", msg, meta),
  warn: (msg: string, meta?: unknown) => log("warn", msg, meta),
  error: (msg: string, meta?: unknown) => log("error", msg, meta),
};
