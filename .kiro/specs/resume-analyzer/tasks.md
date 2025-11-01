# Implementation Plan

- [x] 1. Set up project structure and development environment

  - Initialize Angular workspace with standalone components and Material UI
  - Initialize NestJS backend project with TypeScript configuration
  - Configure MongoDB Atlas connection and create database schemas
  - Set up AWS S3 bucket with lifecycle policies for file deletion
  - Configure Redis for caching and queue management
  - Create Docker Compose file for local development environment
  - Set up environment variable management for different environments
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Implement user authentication system
- [x] 2.1 Create user data model and database schema

  - Define User model with fields for email, password hash, user tier, subscription details, and usage tracking
  - Create MongoDB indexes for email lookup and user tier queries
  - _Requirements: 7.1, 7.2, 7.4_

- [x] 2.2 Implement authentication service and JWT handling

  - Create registration endpoint with email validation and password hashing using bcrypt
  - Create login endpoint that validates credentials and issues JWT tokens
  - Implement JWT middleware for token validation and user context injection
  - Create refresh token mechanism with rotation
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 2.3 Build Angular authentication module

  - Create login and registration components with reactive forms
  - Implement AuthService for token storage and management
  - Create HTTP interceptor to attach JWT tokens to requests
  - Implement AuthGuard for route protection based on user roles
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [x] 2.4 Write authentication tests

  - Create unit tests for password hashing and token generation
  - Write integration tests for registration and login flows
  - Test token expiration and refresh mechanisms
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 3. Implement resume upload and parsing functionality
- [x] 3.1 Create file upload service and S3 integration

  - Implement file upload endpoint with multipart form data handling
  - Create S3 service for uploading files with unique keys
  - Implement file validation for type (PDF/DOCX) and size (5MB limit)
  - Set up S3 lifecycle policy for automatic file deletion after 24 hours
  - _Requirements: 1.1, 1.4, 1.5, 1.6_

- [x] 3.2 Build resume parser service

  - Integrate PDF parsing library (pdf-parse) for text extraction
  - Integrate DOCX parsing library (mammoth) for text extraction
  - Implement section identification logic (contact, summary, experience, education, skills)
  - Create contact information extraction using regex patterns
  - _Requirements: 1.2, 1.3_

- [x] 3.3 Create Angular upload component

  - Build drag-and-drop file upload interface with progress indicator
  - Implement file validation on client side
  - Create upload service with retry logic for failed uploads
  - Display parsing status and results to user
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3.4 Write upload and parsing tests

  - Test file validation logic for various file types and sizes
  - Test PDF and DOCX parsing with sample resumes
  - Test S3 upload and signed URL generation
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 4. Implement ATS scoring system
- [x] 4.1 Create ATS scoring service with algorithm implementation

  - Implement structure scoring (25%): check for standard sections, proper headings
  - Implement keyword scoring (30%): analyze industry keywords and action verbs
  - Implement readability scoring (25%): calculate Flesch reading ease, sentence complexity
  - Implement formatting scoring (20%): check for consistent formatting, bullet points, dates
  - Calculate total score and create breakdown object
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4.2 Build recommendation engine

  - Create rule-based system to generate actionable recommendations
  - Implement critical issue detection for scores below 60
  - Categorize recommendations by priority (critical, important, suggested)
  - _Requirements: 2.4, 2.5_

- [x] 4.3 Create Angular ATS score display components

  - Build score card component with visual progress indicators
  - Create score breakdown component showing category scores
  - Implement recommendations list component with priority indicators
  - Add visual highlighting for critical issues
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ]\* 4.4 Write ATS scoring tests

  - Test scoring algorithms with various resume samples
  - Verify score calculations and breakdowns
  - Test recommendation generation logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. Implement job description matching functionality
- [x] 5.1 Create JD matching service

  - Implement job description parsing to extract requirements and skills
  - Create keyword extraction algorithm using NLP techniques
  - Implement matching algorithm to compare resume keywords with JD requirements
  - Calculate match percentage based on keyword overlap and relevance
  - Identify missing keywords and matched keywords with frequency
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.2 Build Angular JD comparison interface

  - Create job description input component with character limit (10,000)
  - Build match result display showing percentage and visual indicator
  - Create missing keywords component with suggestions
  - Create matched keywords component with frequency visualization
  - Implement improvement suggestions for low match scores
  - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6_

- [ ]\* 5.3 Write JD matching tests

  - Test keyword extraction from various job descriptions
  - Test matching algorithm with different resume-JD combinations
  - Verify match percentage calculations
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 6. Integrate AI services for rewrite and cover letter generation
- [x] 6.1 Create AI integration service

  - Set up OpenAI or Gemini API client with authentication
  - Implement bullet point rewrite function with prompt engineering
  - Implement summary rewrite function generating multiple alternatives
  - Implement cover letter generation using resume and JD as context
  - Add error handling and retry logic for API failures
  - Implement timeout handling (30 seconds) with user notification
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 5.1, 5.2, 5.3_

- [x] 6.2 Build Angular AI features components

  - Create AI rewrite component showing original and suggested versions
  - Implement track-changes style formatting for suggestions
  - Build cover letter editor with inline editing capability
  - Add loading indicators and progress notifications
  - Implement premium feature access control
  - _Requirements: 4.1, 4.3, 4.4, 4.5, 5.3, 5.4_

- [ ]\* 6.3 Write AI integration tests

  - Test AI service with mocked API responses
  - Verify prompt construction and response parsing
  - Test error handling and retry mechanisms
  - _Requirements: 4.1, 4.2, 4.5, 5.1, 5.2_

- [x] 7. Implement report generation and download
- [x] 7.1 Create report generation service

  - Integrate PDF generation library (PDFKit or Puppeteer)
  - Design PDF report template with branding
  - Implement report data compilation from analysis results
  - Create watermark application for free tier reports
  - Implement report upload to S3 with signed URLs
  - Generate download links with 7-day expiry
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7.2 Build Angular report components

  - Create on-screen report preview component
  - Build download interface with format options
  - Implement report generation status tracking
  - Add retry mechanism for failed report generation
  - _Requirements: 6.1, 6.2, 6.5, 6.6_

- [ ]\* 7.3 Write report generation tests

  - Test PDF generation with sample data
  - Verify watermark application for free users
  - Test S3 upload and signed URL generation
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Implement payment integration and subscription management
- [x] 8.1 Create payment service with gateway integration

  - Integrate Razorpay SDK for Indian payments
  - Integrate Stripe SDK for international payments
  - Implement payment intent creation for one-time and subscription payments
  - Create webhook handlers for payment success, failure, and subscription events
  - Implement account upgrade logic upon successful payment
  - Create refund processing with 7-day window
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 8.2 Build Angular payment and subscription components

  - Create pricing page displaying plans (₹99 one-time, ₹499/month)
  - Build checkout component with payment gateway integration
  - Create subscription management interface for active subscriptions
  - Implement payment status notifications and error handling
  - Add upgrade prompts for free users accessing premium features
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 7.5_

- [x] 8.3 Implement subscription lifecycle management

  - Create background job for subscription renewal processing
  - Implement grace period handling (3 days) for failed payments
  - Create email notifications for payment failures and subscription expiry
  - Implement automatic downgrade after subscription expiry
  - Add refund rate monitoring with admin alerts (>3%)
  - _Requirements: 8.5, 8.6, 8.7_

- [ ]\* 8.4 Write payment integration tests

  - Test payment intent creation and processing
  - Test webhook handling with mocked gateway events
  - Verify account upgrade and downgrade logic
  - Test refund processing
  - _Requirements: 8.2, 8.3, 8.4, 8.6_

- [ ] 9. Implement usage limits and rate limiting
- [ ] 9.1 Create usage tracking service

  - Implement usage counter increment on each analysis
  - Create daily usage reset job using cron
  - Implement tier-based limit checking (anonymous: 1, free: 3/day, premium: unlimited)
  - Create usage limit exceeded response with upgrade prompt
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 9.2 Implement rate limiting middleware

  - Set up Redis-based rate limiter
  - Configure rate limits by user tier (anonymous: 10/hr, free: 50/hr, premium: 500/hr, admin: 1000/hr)
  - Implement IP-based rate limiting for authentication endpoints
  - Return 429 status with retry-after header when limits exceeded
  - Add suspicious activity detection and IP blocking
  - _Requirements: 10.5, 10.6_

- [ ]\* 9.3 Write usage and rate limiting tests

  - Test usage counter increment and reset
  - Test tier-based limit enforcement
  - Test rate limiting with concurrent requests
  - Verify 429 responses and retry-after headers
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 10. Build admin dashboard and management features
- [ ] 10.1 Create admin service with management functions

  - Implement dashboard metrics calculation (users, subscriptions, revenue)
  - Create user search and filtering functionality
  - Implement manual account upgrade/downgrade with audit logging
  - Create feature toggle system with database-backed configuration
  - Implement audit log retrieval with filtering
  - Create system health monitoring endpoint
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 10.2 Build Angular admin module

  - Create admin dashboard component with KPI cards
  - Build user management interface with search and filters
  - Create user detail view with action buttons (upgrade/downgrade)
  - Implement feature toggle interface
  - Build audit log viewer with filtering
  - Create system health monitoring display
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 10.3 Implement audit logging system

  - Create audit log middleware to capture admin actions
  - Log all user management operations with admin ID and timestamp
  - Log feature toggle changes
  - Store IP address and action details
  - _Requirements: 9.6, 11.7_

- [ ]\* 10.4 Write admin functionality tests

  - Test metrics calculation accuracy
  - Test user search and filtering
  - Verify audit logging for all admin actions
  - Test feature toggle functionality
  - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_

- [ ] 11. Implement security measures and data protection
- [ ] 11.1 Set up HTTPS and secure communication

  - Configure Nginx reverse proxy with SSL
  - Set up Certbot for automatic SSL certificate renewal
  - Enforce HTTPS for all API endpoints
  - Configure security headers (CSP, HSTS, X-Frame-Options)
  - _Requirements: 11.1_

- [ ] 11.2 Implement data encryption and protection

  - Configure bcrypt password hashing with salt rounds = 12
  - Set up S3 bucket encryption at rest
  - Configure MongoDB connection encryption
  - Implement signed URLs for S3 with 1-hour expiry
  - Create automated file deletion job for 24-hour lifecycle
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6_

- [ ] 11.3 Add input validation and sanitization

  - Implement file type whitelist validation (PDF, DOCX only)
  - Add file size validation (5MB max)
  - Create input sanitization middleware for XSS prevention
  - Implement parameterized queries for MongoDB to prevent injection
  - Add Content-Type verification for uploads
  - _Requirements: 1.1, 1.4_

- [ ]\* 11.4 Perform security testing

  - Test for SQL/NoSQL injection vulnerabilities
  - Test XSS prevention mechanisms
  - Verify CSRF protection
  - Test JWT token manipulation attempts
  - Test file upload security with malicious files
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 12. Set up monitoring, logging, and alerting
- [ ] 12.1 Implement application logging

  - Set up structured logging with Winston or Pino
  - Log all API requests with response times
  - Log errors with stack traces and context
  - Log payment transactions and status changes
  - Log AI API calls with costs
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 12.2 Configure monitoring and metrics

  - Set up Prometheus for metrics collection
  - Configure Grafana dashboards for visualization
  - Track API response times (p50, p95, p99)
  - Monitor error rates by endpoint
  - Track AI API costs and usage
  - Monitor database query performance
  - Track active user sessions
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 12.3 Set up alerting system

  - Configure alerts for response time > 2 seconds for 5 minutes
  - Set up alerts for error rate > 5% for 10 minutes
  - Create alerts for AI API cost spikes > 50% of daily budget
  - Configure alerts for payment failure rate > 10%
  - Set up alerts for disk usage > 80%
  - Configure alerts for memory usage > 85%
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 13. Implement backup and recovery procedures
- [ ] 13.1 Set up automated database backups

  - Configure daily MongoDB backups to S3
  - Implement 30-day backup retention policy
  - Encrypt backup files
  - Create backup verification job
  - _Requirements: 11.6_

- [ ] 13.2 Configure S3 versioning and lifecycle

  - Enable S3 versioning for resume files
  - Configure lifecycle policy for automatic deletion
  - Set up cross-region replication for disaster recovery
  - _Requirements: 1.6, 11.3_

- [ ]\* 13.3 Test backup and recovery procedures

  - Test database restore from backup
  - Verify backup encryption
  - Test S3 file recovery from versions
  - _Requirements: 11.6_

- [ ] 14. Set up CI/CD pipeline and deployment
- [ ] 14.1 Configure GitHub Actions workflow

  - Create workflow for running tests on pull requests
  - Set up Docker image building on merge to main
  - Configure deployment to staging on develop branch
  - Configure deployment to production on main branch
  - Implement health check after deployment
  - Add automatic rollback on failed health check
  - _Requirements: All requirements depend on reliable deployment_

- [ ] 14.2 Create Docker configuration

  - Write Dockerfile for backend service
  - Write Dockerfile for frontend service
  - Create docker-compose.yml for local development
  - Configure environment-specific Docker Compose overrides
  - _Requirements: All requirements depend on containerized deployment_

- [ ] 14.3 Set up hosting and infrastructure

  - Configure Render or AWS Lightsail for hosting
  - Set up auto-scaling rules based on CPU and memory
  - Configure environment variables for production
  - Set up database connection pooling
  - Configure Redis for production use
  - _Requirements: 12.5_

- [ ]\* 14.4 Perform deployment testing

  - Test CI/CD pipeline with sample changes
  - Verify health checks and rollback mechanism
  - Test auto-scaling under load
  - _Requirements: All requirements depend on reliable deployment_

- [ ] 15. Build main dashboard and user interface integration
- [ ] 15.1 Create main analysis dashboard

  - Build dashboard layout with Material UI components
  - Integrate all analysis components (ATS score, JD match, recommendations)
  - Implement navigation between different analysis sections
  - Add loading states and error handling
  - Create responsive design for mobile devices
  - _Requirements: 2.2, 2.3, 2.4, 3.3, 3.4, 3.5_

- [ ] 15.2 Implement user profile and history

  - Create user profile component showing account details
  - Build analysis history list showing past analyses
  - Implement analysis result retrieval and display
  - Add subscription status display
  - _Requirements: 7.4, 8.1_

- [ ] 15.3 Create landing page and marketing site

  - Build landing page with feature highlights
  - Create pricing section with plan comparison
  - Add testimonials and social proof sections
  - Implement call-to-action buttons
  - Optimize for SEO with meta tags and structured data
  - _Requirements: All requirements support the marketing goals_

- [ ]\* 15.4 Perform end-to-end testing

  - Test complete resume analysis flow from upload to report download
  - Test user registration, login, and payment flow
  - Test JD matching workflow
  - Test AI rewrite and cover letter generation
  - Test admin user management workflow
  - Verify cross-browser compatibility
  - Test mobile responsiveness
  - _Requirements: All requirements_

- [ ] 16. Implement email notifications
- [ ] 16.1 Create email service integration

  - Integrate SendGrid or Resend API
  - Create email templates for registration confirmation
  - Create email templates for payment confirmation
  - Create email templates for subscription renewal reminders
  - Create email templates for payment failure notifications
  - Create email templates for subscription expiry warnings
  - _Requirements: 8.5_

- [ ] 16.2 Implement email sending logic

  - Send welcome email on user registration
  - Send payment confirmation on successful payment
  - Send subscription renewal reminder 3 days before expiry
  - Send payment failure notification with retry instructions
  - Send subscription expiry warning 7 days before expiry
  - _Requirements: 8.5_

- [ ]\* 16.3 Test email delivery

  - Test email sending with various scenarios
  - Verify email template rendering
  - Test email delivery failure handling
  - _Requirements: 8.5_

- [ ] 17. Optimize performance and implement caching
- [ ] 17.1 Implement caching strategy

  - Cache parsed resume data in Redis for 1 hour
  - Cache ATS scoring results for identical resumes
  - Cache JD analysis results for repeated job descriptions
  - Implement cache invalidation on user data updates
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 17.2 Optimize database queries

  - Add indexes for frequently queried fields
  - Implement query result pagination
  - Optimize aggregation pipelines for dashboard metrics
  - Use projection to limit returned fields
  - _Requirements: 12.1, 12.2_

- [ ] 17.3 Optimize frontend performance

  - Implement lazy loading for Angular modules
  - Add image optimization and lazy loading
  - Minimize bundle size with tree shaking
  - Implement service worker for PWA capabilities
  - Add client-side caching for API responses
  - _Requirements: 12.1, 12.2, 12.3_

- [ ]\* 17.4 Perform performance testing
  - Test with 100 concurrent users
  - Measure response times under sustained load
  - Test AI API response time under load
  - Verify database query performance with large datasets
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
