# Routes Directory

This directory contains all API route definitions.

## Structure

- `auth.routes.js` - Authentication routes (login, register, logout)
- `resume.routes.js` - Resume upload and management routes
- `analysis.routes.js` - Analysis routes (ATS score, JD match, AI features)
- `payment.routes.js` - Payment and subscription routes
- `admin.routes.js` - Admin dashboard routes
- `user.routes.js` - User profile and settings routes

## Usage

Routes are imported and registered in `server.js`:

```javascript
import authRoutes from './routes/auth.routes.js';
app.use('/api/auth', authRoutes);
```
