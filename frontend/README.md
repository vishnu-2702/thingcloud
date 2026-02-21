# IoT Device Management Platform - Frontend Dashboard

A **modern React frontend** for the IoT Device Management Platform, featuring real-time monitoring, device control, and comprehensive analytics dashboard.

## 🚀 **Frontend Features**

- ✅ **Modern React 18**: Hooks, concurrent features, and performance optimizations
- ✅ **Real-time Updates**: Live device data via WebSocket connections
- ✅ **Responsive Design**: Mobile-first approach with Tailwind CSS
- ✅ **Dark Mode Support**: Complete dark/light theme implementation
- ✅ **Professional UI**: Clean, intuitive interface with Lucide icons
- ✅ **Authentication**: JWT-based login/register with protected routes
- ✅ **Device Management**: Complete CRUD operations for IoT devices
- ✅ **Analytics Dashboard**: Charts, statistics, and real-time monitoring

## 🛠️ **Technology Stack**

- **React 18** - Modern UI framework with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Lucide React** - Beautiful SVG icons
- **React Hot Toast** - Toast notifications
- **Context API** - State management

## 📁 **Project Structure**

```
frontend/
├── src/
│   ├── components/              # Reusable React components
│   │   ├── Layout.jsx          # Main layout with navigation
│   │   ├── Header.jsx          # Application header
│   │   ├── Sidebar.jsx         # Navigation sidebar
│   │   ├── ProtectedRoute.jsx  # Authentication guard
│   │   └── ErrorBoundary.jsx   # Error handling
│   ├── pages/                  # Page components
│   │   ├── Dashboard.jsx       # Main dashboard with analytics
│   │   ├── Analytics.jsx       # Analytics and charts
│   │   ├── Devices.jsx         # Device management
│   │   ├── DeviceDetail.jsx    # Real-time device monitoring
│   │   ├── DeviceRegister.jsx  # Device registration
│   │   ├── Templates.jsx       # Template management
│   │   ├── TemplateDetail.jsx  # Template details
│   │   ├── TemplateNew.jsx     # New template creation
│   │   ├── Alerts.jsx          # Alert management
│   │   ├── Profile.jsx         # User profile
│   │   ├── Settings.jsx        # App settings
│   │   ├── Users.jsx           # User management
│   │   ├── Login.jsx           # Authentication
│   │   ├── Register.jsx        # User registration
│   │   └── NotFound.jsx        # 404 page
│   ├── contexts/               # React contexts
│   │   ├── AuthContext.jsx     # Authentication state
│   │   └── SocketContext.jsx   # WebSocket connection
│   ├── services/               # API service layer
│   │   ├── authAPI.js          # Authentication API
│   │   └── deviceAPI.js        # Device management API
│   ├── App.jsx                 # Main application component
│   ├── main.jsx                # React application entry point
│   └── index.css               # Global styles and Tailwind
├── public/                     # Static assets
├── .env.example                # Environment variables template
├── .env.production             # Production environment template
├── vercel.json                 # Vercel deployment configuration
├── vite.config.js              # Vite configuration
├── package.json                # Dependencies and scripts
├── tailwind.config.js          # Tailwind CSS configuration
├── .gitignore                  # Git ignore patterns
└── README.md                   # This file
```

## 🚀 **Quick Start**

### Prerequisites
- **Node.js 18+**
- **Backend API** running (see backend repository)

### Installation

```bash
# Clone the frontend repository
git clone <your-frontend-repo-url>
cd iot-platform-frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### Environment Configuration

Create `.env` file with your backend API URL:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
VITE_APP_NAME=IoT Device Management Platform
VITE_ENVIRONMENT=development
```

### Development

```bash
# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

**✅ Frontend running at: http://localhost:3000**

## 🎨 **Pages & Features**

### 🏠 **Dashboard**
- Real-time device statistics
- Recent telemetry data
- System health indicators
- Quick action buttons

### 📊 **Analytics**
- Device performance charts
- Telemetry data visualization
- Historical trends
- Export capabilities

### 🔧 **Device Management**
- Device registration and setup
- Real-time device monitoring
- Device configuration updates
- API key management

### 📋 **Templates**
- Device template creation
- Virtual pin configuration
- Template cloning and sharing
- Arduino code generation

### 🚨 **Alerts**
- Real-time alert notifications
- Alert history and management
- Custom alert rules
- Email/SMS notifications

### 👤 **User Management**
- User profiles and settings
- Team management (admin)
- Role-based permissions
- Account preferences

## 🎯 **UI Components**

### Layout Components
- **Header**: Logo, navigation, user menu
- **Sidebar**: Main navigation with icons
- **Layout**: Responsive grid layout
- **ProtectedRoute**: Authentication wrapper

### Interactive Components
- **Forms**: Styled form inputs with validation
- **Buttons**: Primary, secondary, and icon buttons
- **Cards**: Device cards, statistic cards
- **Modals**: Confirmation dialogs, forms
- **Tables**: Data tables with sorting/filtering
- **Charts**: Real-time data visualization

### Design System
- **Colors**: Consistent color palette
- **Typography**: Readable font hierarchy
- **Spacing**: Consistent margin/padding
- **Animations**: Smooth transitions
- **Icons**: Lucide icon library
- **Dark Mode**: Complete theme support

## 🔌 **Real-time Features**

### WebSocket Integration
```javascript
// Automatic connection to backend
const socket = useSocket();

// Listen for real-time telemetry
useEffect(() => {
  socket.on('telemetry', (data) => {
    updateDeviceData(data);
  });
}, [socket]);
```

### Live Updates
- **Device Status**: Online/offline indicators
- **Telemetry Data**: Instant sensor updates
- **Alerts**: Real-time notifications
- **User Activity**: Live user actions

## 🧪 **Testing**

### Development Testing
```bash
# Start development server
npm run dev

# Test user registration
# 1. Navigate to /register
# 2. Create new account
# 3. Login with credentials

# Test device management
# 1. Go to /devices
# 2. Add new device
# 3. View real-time data
```

### API Integration Testing
```javascript
// Test API connection
fetch('/api/health')
  .then(response => response.json())
  .then(data => console.log('API Status:', data));

// Test authentication
authAPI.login({ email: 'test@example.com', password: 'password' })
  .then(result => console.log('Login successful:', result));
```

## 🚀 **Production Deployment**

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Build for production
npm run build

# Deploy to production
vercel --prod
```

### Environment Variables in Vercel

Set these in your Vercel dashboard:
- `VITE_API_URL` - Your backend API URL
- `VITE_SOCKET_URL` - Your backend WebSocket URL
- `VITE_APP_NAME` - Application name
- `VITE_ENVIRONMENT` - production

### Build Optimization

The production build includes:
- **Code Splitting**: Automatic chunk optimization
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and CSS optimization
- **Caching**: Static asset caching headers
- **Compression**: Gzip/Brotli compression

## 📱 **Responsive Design**

### Breakpoints
```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Mobile Features
- **Touch-friendly**: Large tap targets
- **Responsive Navigation**: Collapsible sidebar
- **Optimized Images**: Responsive image loading
- **Performance**: Fast loading on mobile networks

## 🎨 **Customization**

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        // Custom colors
      }
    }
  }
}
```

### Theme Customization
- **Colors**: Update color palette in Tailwind config
- **Fonts**: Add custom fonts in index.css
- **Components**: Modify component styles
- **Dark Mode**: Toggle via context provider

## 🔒 **Security Features**

- ✅ **JWT Authentication**: Secure token storage
- ✅ **Protected Routes**: Authentication guards
- ✅ **XSS Protection**: Input sanitization
- ✅ **CSRF Protection**: Request validation
- ✅ **Secure Headers**: CSP and security headers

## 📈 **Performance**

- **Bundle Size**: < 500KB gzipped
- **Load Time**: < 3s initial load
- **Runtime Performance**: 60fps animations
- **Memory Usage**: Optimized React components
- **Network**: Efficient API calls and caching

## 🐛 **Troubleshooting**

### Common Issues

#### API Connection Failed
```bash
# Check backend is running
curl http://localhost:3001/api/health

# Verify VITE_API_URL in .env
echo $VITE_API_URL
```

#### Build Errors
```bash
# Clear node modules
rm -rf node_modules package-lock.json
npm install

# Check for syntax errors
npm run build
```

#### WebSocket Connection Issues
```javascript
// Check Socket.IO connection
console.log('Socket connected:', socket.connected);

// Verify backend WebSocket server
// Check browser network tab for WebSocket connection
```

## 📝 **Development**

### Available Scripts

```bash
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint (if configured)
npm run format       # Format code with Prettier (if configured)
```

### Development Workflow

1. **Start Backend**: Ensure backend API is running
2. **Start Frontend**: Run `npm run dev`
3. **Live Reload**: Changes reflect immediately
4. **API Testing**: Use browser dev tools
5. **Build Testing**: Run `npm run build` regularly

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/new-feature`)
3. Follow React best practices
4. Test thoroughly on different devices
5. Commit changes (`git commit -m 'Add new feature'`)
6. Push to branch (`git push origin feature/new-feature`)
7. Open Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 **Related Repositories**

- **Backend**: [IoT Platform Backend Repository](your-backend-repo-url)
- **ESP8266 Client**: [IoT Device Client Repository](your-device-repo-url)

## 📞 **Support**

For issues and questions:
1. Check browser console for errors
2. Verify API connection
3. Review component documentation
4. Create an issue in the repository
5. Contact the development team

---

**🎨 Beautiful dashboard for your IoT platform!**
