import { env } from '../config/env.js';

// Deliberately minimal - no external dependency. Emits JSON lines in
// production so any log aggregator (Railway/Render logs, Datadog, etc.)
// can parse fields directly; falls back to readable text in development.
function emit(level, message, meta = {}) {
  if (env.NODE_ENV === 'production') {
    console[level === 'error' ? 'error' : 'log'](
      JSON.stringify({ level, message, time: new Date().toISOString(), ...meta })
    );
  } else {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    console[level === 'error' ? 'error' : 'log'](`[${level}] ${message}${metaStr}`);
  }
}

export const logger = {
  info: (message, meta) => emit('info', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  error: (message, meta) => emit('error', message, meta),
};

export default logger;
