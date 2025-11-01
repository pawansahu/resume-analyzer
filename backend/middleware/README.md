# Middleware Directory

This directory contains Express middleware functions.

## Structure

- `auth.middleware.js` - JWT authentication middleware
- `validate.middleware.js` - Request validation middleware
- `rate-limit.middleware.js` - Rate limiting middleware
- `upload.middleware.js` - File upload middleware (multer)
- `error.middleware.js` - Global error handler
- `logger.middleware.js` - Request logging middleware

## Pattern

Middleware functions process requests before they reach controllers:

```javascript
export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId);
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};
```
