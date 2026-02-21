# IoT Platform Backend - Modular Architecture

## 🏗️ Architecture Overview

This is a modularized, production-ready Node.js/Express backend for an IoT Device Management Platform. The codebase has been restructured for better maintainability, scalability, and production deployment.

## 📁 Project Structure

```
src/
├── config/          # Configuration files
│   ├── app.js       # Main application configuration
│   └── database.js  # DynamoDB configuration
├── middleware/      # Express middleware
│   ├── auth.js      # Authentication middleware
│   ├── validation.js # Request validation middleware
│   └── errors.js    # Error handling middleware
├── routes/          # API route modules
│   ├── auth.js      # Authentication routes
│   ├── devices.js   # Device management routes
│   ├── telemetry.js # Telemetry data routes
│   ├── templates.js # Template management routes
│   └── admin.js     # Admin management routes
├── services/        # Business logic layer
│   ├── userService.js      # User management service
│   ├── deviceService.js    # Device management service
│   ├── telemetryService.js # Telemetry service
│   └── templateService.js  # Template service
├── sockets/         # WebSocket handling
│   └── socketHandler.js    # Socket.IO event handling
├── utils/           # Utility functions
│   ├── auth.js      # Authentication utilities
│   ├── responses.js # Response formatting utilities
│   └── helpers.js   # General helper functions
├── validators/      # Input validation schemas
│   └── schemas.js   # Joi validation schemas
└── server.js        # Main application entry point
```

## 🚀 Key Improvements

### 1. **Modular Architecture**
- **Separation of Concerns**: Each module has a single responsibility
- **Service Layer**: Business logic separated from route handlers
- **Middleware Organization**: Reusable middleware components
- **Configuration Management**: Centralized configuration with environment validation

### 2. **Production Readiness**
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Enhanced security headers, CORS configuration, input validation
- **Performance**: Request timeouts, compression, graceful shutdowns
- **Monitoring**: Health checks, request logging, error tracking

### 3. **Code Quality**
- **Consistent Structure**: Standardized file organization and naming
- **Reusable Components**: Shared utilities and middleware
- **Type Safety**: Joi validation schemas for all inputs
- **Documentation**: Comprehensive JSDoc comments

## 📋 Environment Variables

### Required Variables
```env
NODE_ENV=production
JWT_SECRET=your-very-long-random-secret-key-at-least-32-characters
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
FRONTEND_URL=https://your-frontend-domain.com
```

### Optional Variables
```env
PORT=3001
CORS_ORIGIN=https://your-domain.com
BCRYPT_ROUNDS=12
REQUEST_TIMEOUT=30000
LOG_LEVEL=info
LOG_FORMAT=combined
```

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Health check
npm run health

# Deploy to Vercel
npm run deploy
```

## 🔒 Security Features

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control (Admin, Manager, User)
- Device API key authentication
- Password hashing with bcrypt

### Security Middleware
- Helmet.js for security headers
- CORS configuration for cross-origin requests
- Request timeout protection
- Input validation and sanitization
- SQL injection prevention (using DynamoDB)

### Production Security
- HTTPS enforcement in production
- Environment variable validation
- Secure cookie configuration
- Rate limiting ready (add express-rate-limit)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Device Management
- `GET /api/devices` - Get user devices
- `POST /api/devices` - Create new device
- `GET /api/devices/:id` - Get device details
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device

### Telemetry
- `POST /api/telemetry` - Receive device data (API key auth)
- `GET /api/devices/:id/telemetry` - Get device telemetry
- `GET /api/devices/:id/pins` - Get device pin states
- `PUT /api/devices/:id/pins/:pin` - Update pin value

### Templates
- `GET /api/templates` - Get all templates
- `POST /api/templates` - Create template
- `GET /api/templates/:id` - Get template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Admin (Role-based access)
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users/invite` - Invite user
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/status` - Update user status

## 🌐 WebSocket Events

### Client to Server
- `join-user-room` - Join user-specific room
- `join-device-room` - Join device-specific room
- `device-command` - Send command to device
- `ping` - Heartbeat

### Server to Client
- `telemetry` - Real-time telemetry data
- `deviceStatusChanged` - Device online/offline status
- `deviceRegistered` - New device registered
- `command` - Command sent to device
- `pong` - Heartbeat response

## 🗄️ Database Schema

### DynamoDB Tables
- **Users**: User accounts and profiles
- **Devices**: IoT device registrations
- **Telemetry**: Time-series sensor data
- **Templates**: Device configuration templates
- **Alerts**: Alert configurations
- **Invitations**: User invitation system

## 📈 Performance Considerations

### Optimizations Implemented
- ✅ Gzip compression
- ✅ Request timeouts
- ✅ Connection pooling (DynamoDB)
- ✅ Efficient queries with indexes
- ✅ Graceful shutdowns

### Potential Enhancements
- Redis caching layer
- Database query optimization
- CDN integration
- Load balancing
- Horizontal scaling

## 🚀 Deployment

### Vercel Deployment
```bash
# Deploy to staging
vercel

# Deploy to production
vercel --prod
```

### Environment Setup
1. Configure environment variables in Vercel dashboard
2. Set up DynamoDB tables in AWS
3. Configure IAM roles and permissions
4. Set up monitoring and alerting

## 🔍 Monitoring & Logging

### Health Checks
- `GET /health` - Service health status
- Uptime monitoring
- Database connectivity checks

### Logging
- Request/response logging with Morgan
- Error logging with stack traces
- Performance monitoring (slow queries)
- Authentication attempt logging

### Metrics to Monitor
- Response times
- Error rates
- Database query performance
- WebSocket connection counts
- Memory usage
- CPU utilization

## 🧪 Testing Strategy

### Unit Tests
- Service layer testing
- Utility function testing
- Middleware testing

### Integration Tests
- API endpoint testing
- Database integration testing
- WebSocket testing

### Load Testing
- Concurrent user testing
- Device telemetry load testing
- Real-time communication stress testing

## 📝 Development Guidelines

### Code Style
- Use ESLint and Prettier for consistent formatting
- Follow RESTful API design principles
- Use descriptive variable and function names
- Write comprehensive JSDoc comments

### Error Handling
- Use try-catch blocks in async functions
- Return consistent error response format
- Log errors with appropriate context
- Handle graceful degradation

### Security Best Practices
- Validate all inputs
- Use parameterized queries
- Implement rate limiting
- Regular security audits
- Keep dependencies updated

## 🔄 Migration Notes

This modularized version maintains 100% backward compatibility with the original API while providing:

- Better code organization and maintainability
- Enhanced error handling and logging
- Improved security and validation
- Production-ready configuration
- Scalable architecture for future growth

All existing integrations and frontend applications will continue to work without any modifications.