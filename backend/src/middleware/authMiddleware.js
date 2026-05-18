import jwt from 'jsonwebtoken';

export function signAccessToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

export function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');

  return jwt.verify(token, secret);
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
}
