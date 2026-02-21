/**
 * IoT Platform API Server (Modularized)
 * Main application entry point
 */

require('dotenv').config();

// Core imports
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

// Configuration
const config = require('./config/app');

// Middleware
const { 
  requestTimeout, 
  requestLogger, 
  errorHandler, 
  notFoundHandler, 
  productionSecurity 
} = require('./middleware/errors');

// Routes
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const telemetryRoutes = require('./routes/telemetry');
const templateRoutes = require('./routes/templates');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const alertRoutes = require('./routes/alerts');
const alertRuleRoutes = require('./routes/alertRules');
const dashboardLayoutRoutes = require('./routes/dashboardLayouts');

// Socket handler
const SocketHandler = require('./sockets/socketHandler');

// Utilities
const { sendSuccess } = require('./utils/responses');

/**
 * Initialize Express application
 */
const app = express();
const server = http.createServer(app);

/**
 * Configure Socket.IO (only in non-serverless environments)
 * Serverless platforms like Vercel don't support long-lived WebSocket connections
 */
const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME);
let io = null;
let socketHandler = null;

if (!isServerless) {
  try {
    io = socketIo(server, {
      cors: {
        origin: config.CORS.ORIGIN === '*' ? '*' : [config.CORS.ORIGIN, config.FRONTEND_URL],
        methods: config.SOCKET.CORS_METHODS,
        credentials: config.CORS.CREDENTIALS
      },
      transports: ['websocket', 'polling'], // Allow polling fallback
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Initialize socket handler
    socketHandler = new SocketHandler(io);
    console.log('✅ WebSocket enabled (Socket.IO initialized)');
  } catch (socketError) {
    console.error('❌ Failed to initialize WebSocket:', socketError.message);
    console.log('⚠️  Continuing without WebSocket - polling fallback will be used');
    socketHandler = null;
  }
} else {
  console.log('⚠️  Serverless environment detected - WebSocket disabled, using polling fallback');
}

// Initialize alert service with socket handler (may be null in serverless)
const alertService = require('./services/alertService');
if (socketHandler) {
  alertService.setSocketHandler(socketHandler);
  console.log('✅ Alert service configured with real-time notifications');
} else {
  console.log('⚠️  Alert service will use polling (WebSocket unavailable)');
}

/**
 * Device monitoring for serverless environments
 * In serverless, we don't have WebSocket/SocketHandler, so we run monitoring on each request
 */
if (isServerless) {
  const deviceService = require('./services/deviceService');
  
  // Run device inactivity check on startup
  console.log('[Serverless] Starting device inactivity monitoring...');
  deviceService.checkDeviceInactivity()
    .then(() => console.log('[Serverless] Initial device inactivity check complete'))
    .catch(err => console.error('[Serverless] Device inactivity check failed:', err));
  
  // In serverless, we'll check on API requests instead of intervals
  // This middleware runs device monitoring periodically (throttled to avoid overhead)
  let lastMonitorCheck = 0;
  const MONITOR_INTERVAL = 60000; // 1 minute
  
  app.use(async (req, res, next) => {
    const now = Date.now();
    if (now - lastMonitorCheck > MONITOR_INTERVAL) {
      lastMonitorCheck = now;
      // In serverless, we must await background tasks to ensure they complete
      // This might add latency to this specific request, but ensures reliability
      try {
        console.log('[Serverless] Running background device check...');
        await deviceService.checkDeviceInactivity();
        console.log('[Serverless] Background device check complete');
      } catch (err) {
        console.error('[Serverless] Background device check failed:', err);
      }
    }
    next();
  });
  
  console.log('✅ Serverless device monitoring enabled (request-based)');
}

/**
 * Security middleware
 */
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

/**
 * Request logging
 */
app.use(morgan(config.LOGGING.FORMAT));
app.use(requestLogger);

/**
 * CORS configuration with special handling for telemetry endpoint
 */
// FULLY UNRESTRICTED CORS for telemetry endpoint (IoT devices from any network)
app.use('/api/telemetry', cors({
  origin: '*', // Allow ALL origins
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: '*', // Allow ALL headers
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // Cache preflight for 24 hours
}));

// Standard CORS for other endpoints
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (IoT devices, mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check against configured origins
    if (config.CORS.ORIGIN === '*') {
      return callback(null, true);
    }
    
    const allowedOrigins = [config.CORS.ORIGIN, config.FRONTEND_URL];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, allow any localhost origin
    if (config.IS_DEVELOPMENT && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: config.CORS.CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'Origin', 'Accept'],
  optionsSuccessStatus: 200
}));

/**
 * Handle preflight requests
 */
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, Origin, Accept');
  res.sendStatus(200);
});

/**
 * Production security
 */
app.use(productionSecurity);

/**
 * Request processing middleware
 */
app.use(requestTimeout);

/**
 * Body parsing middleware
 */
app.use(express.json({ 
  limit: config.SECURITY.MAX_FILE_SIZE,
  verify: (req, res, buf) => {
    // Skip verification for empty body
    if (buf.length === 0) return;
    
    try {
      JSON.parse(buf);
    } catch (e) {
      // Throw error instead of sending response directly
      // Express will catch this and pass it to error handler
      throw new Error('Invalid JSON in request body');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: config.SECURITY.MAX_FILE_SIZE 
}));

/**
 * Root endpoint - API Information
 */
app.get('/', (req, res) => {
  sendSuccess(res, {
    message: 'IoT Platform API',
    version: '1.0.0',
    environment: config.NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      devices: '/api/devices',
      telemetry: '/api/telemetry',
      templates: '/api/templates',
      users: '/api/users',
      admin: '/api/admin',
      health: '/api/health'
    },
    documentation: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      getProfile: 'GET /api/auth/me',
      listDevices: 'GET /api/devices',
      createDevice: 'POST /api/devices',
      sendTelemetry: 'POST /api/telemetry',
      listTemplates: 'GET /api/templates'
    }
  }, 'Welcome to IoT Platform API');
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    serverless: isServerless,
    features: {
      websocket: !!socketHandler,
      polling: true,
      deviceMonitoring: !!socketHandler // Device monitoring requires WebSocket handler
    }
  }, 'Service is healthy');
});

/**
 * API health check (alternative endpoint)
 */
app.get('/api/health', (req, res) => {
  sendSuccess(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    database: 'AWS DynamoDB',
    websocket: 'Socket.IO'
  }, 'API is healthy');
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/alert-rules', alertRuleRoutes);
app.use('/api/dashboard-layouts', dashboardLayoutRoutes);

// Legacy route aliases for backward compatibility
app.use('/api/users/devices', deviceRoutes);

/**
 * Error handling middleware
 */
app.use(notFoundHandler);
app.use(errorHandler);

// Export socket handler for use in routes  
app.locals.socketHandler = socketHandler;

/**
 * Server startup
 */
const startupBanner = () => {
  const startTime = new Date().toISOString();
  const nodeVersion = process.version;
  const platform = process.platform;
  const arch = process.arch;
  
  console.log('='.repeat(60));
  console.log('🚀 IoT Platform API Server Starting...');
  console.log('='.repeat(60));
  console.log(`✅ IoT Platform API Server Online`);
  console.log(`🌐 Server URL: http://localhost:${config.PORT}`);
  console.log(`📱 Frontend URL: ${config.FRONTEND_URL}`);
  console.log(`🏥 Health Check: http://localhost:${config.PORT}/health`);
  console.log('─'.repeat(60));
  console.log(`🔧 Environment: ${config.NODE_ENV}`);
  console.log(`🗄️  AWS Region: ${config.AWS.REGION}`);
  console.log(`🔌 WebSocket: ${socketHandler ? 'Enabled (Socket.IO)' : 'Disabled (Serverless - Polling fallback)'}`);
  console.log(`📊 Database: AWS DynamoDB`);
  console.log('─'.repeat(60));
  console.log(`💻 Platform: ${platform} (${arch})`);
  console.log(`🟢 Node.js: ${nodeVersion}`);
  console.log(`⏰ Started: ${startTime}`);
  console.log(`🚀 Status: Ready for IoT connections`);
  console.log('='.repeat(60) + '\n');
};

if (config.IS_VERCEL) {
  // For Vercel serverless deployment
  console.log('🔥 Running in Vercel serverless mode');
} else {
  // Start server for local development or traditional hosting
  server.listen(config.PORT, (err) => {
    if (err) {
      console.error('❌ Failed to start server:', err);
      process.exit(1);
    }
    startupBanner();
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM. Starting graceful shutdown...');
    server.close(() => {
      console.log('✅ Server closed gracefully');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT. Starting graceful shutdown...');
    server.close(() => {
      console.log('✅ Server closed gracefully');
      process.exit(0);
    });
  });
}

// Export the Express app
module.exports = app;