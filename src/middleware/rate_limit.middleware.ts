import rateLimit from 'express-rate-limit';

export const forgotPasswordRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.emailOrUsername || req.ip,
  handler: (req, res) => {
    res.status(429).json({ error: 'Demasiadas solicitudes. Intenta más tarde.' });
  }
});