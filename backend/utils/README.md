# Utils Directory

This directory contains utility functions and helpers.

## Structure

- `jwt.util.js` - JWT token generation and verification
- `password.util.js` - Password hashing and comparison
- `validation.util.js` - Input validation helpers
- `file.util.js` - File processing utilities
- `date.util.js` - Date manipulation helpers
- `response.util.js` - Standardized API response helpers
- `logger.util.js` - Logging utilities

## Pattern

Utility functions are pure, reusable helpers:

```javascript
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};
```
