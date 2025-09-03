import rateLimit from 'express-rate-limit';

export const forgotPasswordRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => {
    // Use email/username if available, otherwise use a fallback
    return req.body.emailOrUsername || 'anonymous';
  },
  handler: (req, res) => {
    res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' });
  }
});