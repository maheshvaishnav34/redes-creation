import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the rate limit. Please try again after a few minutes.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 attempts per 15 mins for auth
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Auth Requests',
    message: 'Too many authentication attempts. Please try again later.',
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI Rate Limit Exceeded',
    message: 'AI generation limit reached. Please wait a minute before requesting more drafts or insights.',
  },
});
