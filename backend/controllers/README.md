# Controllers Directory

This directory contains all route controllers that handle business logic.

## Structure

- `auth.controller.js` - Authentication logic
- `resume.controller.js` - Resume handling logic
- `analysis.controller.js` - Analysis processing logic
- `payment.controller.js` - Payment processing logic
- `admin.controller.js` - Admin operations logic
- `user.controller.js` - User management logic

## Pattern

Controllers receive requests, call services, and return responses:

```javascript
export const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
```
