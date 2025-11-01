# Authentication Tests

This directory contains comprehensive tests for the authentication system, covering password hashing, JWT token generation, and complete authentication flows.

## Test Structure

```
__tests__/
├── utils/
│   ├── password.util.test.js    # Unit tests for password hashing
│   └── jwt.util.test.js         # Unit tests for JWT token generation
└── integration/
    └── auth.integration.test.js # Integration tests for auth flows
```

## Test Coverage

### Unit Tests

#### Password Utility Tests (`password.util.test.js`)
- ✅ Password hashing with bcrypt (salt rounds = 12)
- ✅ Hash uniqueness for same password
- ✅ Password comparison (matching and non-matching)
- ✅ Case sensitivity
- ✅ Special character handling

#### JWT Utility Tests (`jwt.util.test.js`)
- ✅ Access token generation
- ✅ Refresh token generation
- ✅ Token payload verification
- ✅ Token expiration handling
- ✅ Invalid token detection
- ✅ Token signature verification
- ✅ Expired token handling

### Integration Tests

#### Authentication Flow Tests (`auth.integration.test.js`)
- ✅ User registration with validation
- ✅ Email format validation
- ✅ Password strength validation
- ✅ Duplicate user prevention
- ✅ User login with credentials
- ✅ Case-insensitive email handling
- ✅ Last login timestamp updates
- ✅ Protected route access with JWT
- ✅ Token validation in middleware
- ✅ Logout functionality
- ✅ Complete authentication flow (register → login → access protected routes)

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npm test -- --testPathPattern=password.util.test.js
npm test -- --testPathPattern=jwt.util.test.js
npm test -- --testPathPattern=auth.integration.test.js
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run tests in watch mode (for development)
```bash
npm test -- --watch
```

### Run tests with verbose output
```bash
npm test -- --verbose
```

## Test Results

All 51 tests passing:
- 8 password utility tests
- 17 JWT utility tests
- 26 authentication integration tests

## Requirements Coverage

These tests verify the following requirements from the spec:

### Requirement 7.1: User Registration
- ✅ Email and password validation
- ✅ Minimum security standards for passwords
- ✅ User creation in database

### Requirement 7.2: User Login
- ✅ JWT token issuance (24-hour validity)
- ✅ Credential validation
- ✅ Token generation and verification

### Requirement 7.3: Token Management
- ✅ Token expiration handling
- ✅ Token refresh mechanism
- ✅ Invalid token detection

## Test Environment

- **Framework**: Jest with ES modules support
- **Database**: MongoDB Memory Server (in-memory for testing)
- **HTTP Testing**: Supertest
- **Node Version**: 20+

## Notes

- Tests use in-memory MongoDB to avoid affecting production/development databases
- JWT secrets are set to test values in the test environment
- Console errors in test output are expected for negative test cases
- Tests run sequentially (`--runInBand`) to avoid database conflicts
