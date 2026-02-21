import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Cloud, 
  Wifi, 
  BarChart3, 
  Shield, 
  Zap, 
  ArrowRight,
  CheckCircle2,
  Cpu,
  Activity,
  Sparkles,
  LineChart,
  Layout,
  Bell,
  Users,
  Layers,
  Settings,
  Database,
  Code,
  TrendingUp,
  Radio,
  Gauge
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    gsap.killTweensOf('*');
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    
    tl.from('.hero-content', { opacity: 0, y: 30, duration: 0.8 });

    gsap.from('.scroll-reveal', {
      scrollTrigger: {
        trigger: '.feature-showcase',
        start: 'top 80%',
        toggleActions: 'play none none reverse'
      },
      opacity: 0,
      y: 40,
      stagger: 0.15,
      duration: 0.7,
      ease: 'power2.out'
    });

    return () => {
      gsap.killTweensOf('*');
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-950">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-900 border-b border-neutral-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <Cloud className="w-6 h-6 text-black" />
              </div>
              <span className="text-xl font-bold text-white">
                ThingCloud
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-neutral-400 hover:text-white transition-colors font-medium">
                Features
              </a>
              <a href="#showcase" className="text-neutral-400 hover:text-white transition-colors font-medium">
                Platform
              </a>
              <Link to="/login" className="text-neutral-400 hover:text-white transition-colors font-medium">
                Login
              </Link>
              <Link to="/register" className="px-6 py-2.5 bg-white text-black rounded-lg font-semibold hover:bg-neutral-200 transition-all">
                Try Demo
              </Link>
            </div>

            <div className="md:hidden">
              <Link to="/register" className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Gridlines Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 hero-content">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              IoT Made Simple
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Manage IoT Devices{' '}
              <span className="text-neutral-400">at Scale</span>
            </h1>

            <p className="text-xl sm:text-2xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
              Connect, monitor, and control devices with real-time dashboards, smart alerts, and powerful analytics.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black rounded-xl font-semibold text-lg hover:bg-neutral-200 transition-all group"
              >
                Try Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#showcase"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-neutral-900 border border-neutral-800 text-white rounded-xl font-semibold text-lg hover:bg-neutral-800 transition-all"
              >
                View Demo
              </a>
            </div>
          </div>


        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative py-24 bg-neutral-900 overflow-hidden">
        {/* Subtle gridlines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#404040_1px,transparent_1px),linear-gradient(to_bottom,#404040_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-20"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-neutral-950 border border-neutral-800 text-neutral-300 rounded-full text-sm font-medium mb-4">
              Core Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Built for developers. Designed for scale.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {[
              {
                icon: Wifi,
                title: 'Real-Time Monitoring',
                description: 'Stream live telemetry data with WebSocket connections and instant updates.'
              },
              {
                icon: Layout,
                title: 'Custom Dashboards',
                description: 'Drag-and-drop builder with 11+ widget types for data visualization.'
              },
              {
                icon: Bell,
                title: 'Smart Alerts',
                description: 'Rule-based notifications with custom conditions and thresholds.'
              },
              {
                icon: Layers,
                title: 'Device Templates',
                description: 'Reusable configurations for rapid device provisioning.'
              },
              {
                icon: BarChart3,
                title: 'Analytics',
                description: 'Time-series charts, gauges, sparklines, and data tables.'
              },
              {
                icon: Users,
                title: 'Team Access',
                description: 'Granular permissions and role-based access control.'
              },
              {
                icon: Shield,
                title: 'Secure by Default',
                description: 'JWT authentication, API keys, and encrypted connections.'
              },
              {
                icon: Database,
                title: 'Scalable Storage',
                description: 'DynamoDB backend with automatic TTL and efficient queries.'
              },
              {
                icon: Code,
                title: 'REST API',
                description: 'Simple HTTP endpoints for device integration.'
              }
            ].map((feature, i) => (
              <div key={i} className="feature-card bg-neutral-800 border border-neutral-700 rounded-xl p-8 hover:border-neutral-600 transition-all">
                <div className="w-12 h-12 bg-neutral-900 rounded-lg flex items-center justify-center mb-5">
                  <feature.icon className="w-6 h-6 text-neutral-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-neutral-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase */}
      <section id="showcase" className="feature-showcase relative py-24 overflow-hidden">
        {/* Gridlines background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-30"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="max-w-6xl mx-auto space-y-32">
            
            {/* Dashboard Builder */}
            <div className="scroll-reveal grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-full text-sm font-medium">
                  <Layout className="w-4 h-4" />
                  Dashboard Builder
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white">
                  Design Custom Dashboards
                </h3>
                <p className="text-lg text-neutral-400 leading-relaxed">
                  Create beautiful, responsive dashboards with our intuitive drag-and-drop builder. Choose from 11 widget types to visualize your data.
                </p>
                <ul className="space-y-3">
                  {[
                    'Flexible grid layout for any design',
                    'Live data preview with real updates',
                    'Save and load custom layouts',
                    'Works perfectly on any device'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-400">
                      <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all">
                  Try it yourself
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="relative">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg">
                  <div className="grid grid-cols-12 gap-2 h-80">
                    {/* Simulated dashboard widgets */}
                    <div className="col-span-4 bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex flex-col">
                      <Gauge className="w-6 h-6 text-neutral-400 mb-2" />
                      <div className="text-xs text-neutral-400 mb-1">Temperature</div>
                      <div className="text-2xl font-bold text-white mt-auto">24.5°C</div>
                    </div>
                    <div className="col-span-4 bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex flex-col">
                      <Activity className="w-6 h-6 text-neutral-400 mb-2" />
                      <div className="text-xs text-neutral-400 mb-1">Status</div>
                      <div className="text-2xl font-bold text-white mt-auto">Active</div>
                    </div>
                    <div className="col-span-4 bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex flex-col">
                      <TrendingUp className="w-6 h-6 text-neutral-400 mb-2" />
                      <div className="text-xs text-neutral-400 mb-1">Uptime</div>
                      <div className="text-2xl font-bold text-white mt-auto">99.8%</div>
                    </div>
                    <div className="col-span-8 bg-neutral-800 border border-neutral-700 rounded-lg p-4">
                      <LineChart className="w-6 h-6 text-neutral-400 mb-2" />
                      <div className="text-xs text-neutral-400 mb-2">Data Stream</div>
                      <div className="h-24 flex items-end gap-1">
                        {[45, 52, 48, 65, 58, 72, 68, 75].map((h, i) => (
                          <div key={i} className="flex-1 bg-white rounded-t" style={{ height: `${h}%` }}></div>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-4 bg-neutral-800 border border-neutral-700 rounded-lg p-4 flex flex-col">
                      <Radio className="w-6 h-6 text-neutral-400 mb-2" />
                      <div className="text-xs text-neutral-400 mb-1">Connection</div>
                      <div className="flex items-center gap-2 mt-auto">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-white">Online</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Device Management */}
            <div className="scroll-reveal grid lg:grid-cols-2 gap-12 items-center">
              <div className="lg:order-2 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-full text-sm font-medium">
                  <Cpu className="w-4 h-4" />
                  Device Management
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white">
                  Manage Thousands of Devices
                </h3>
                <p className="text-lg text-neutral-400 leading-relaxed">
                  Register devices with templates, generate API keys, monitor status, and control remotely—all from one dashboard.
                </p>
                <ul className="space-y-3">
                  {[
                    'Bulk registration with templates',
                    'Unique API keys per device',
                    'Real-time status tracking',
                    'Remote control capabilities'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-400">
                      <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all">
                  Start managing devices
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="lg:order-1 relative">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg space-y-3">
                  {[
                    { name: 'Smart Thermostat', status: 'online', value: '22°C' },
                    { name: 'Security Camera', status: 'online', value: 'Recording' },
                    { name: 'Door Lock', status: 'offline', value: 'Locked' },
                    { name: 'Motion Sensor', status: 'online', value: 'Active' }
                  ].map((device, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-neutral-800 border border-neutral-700 rounded-lg hover:border-neutral-600 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-neutral-400'}`}></div>
                        <Cpu className="w-5 h-5 text-neutral-400" />
                        <span className="font-medium text-white">{device.name}</span>
                      </div>
                      <span className="text-sm text-neutral-400">{device.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="scroll-reveal grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-full text-sm font-medium">
                  <Bell className="w-4 h-4" />
                  Smart Alerts
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold text-white">
                  Never Miss Critical Events
                </h3>
                <p className="text-lg text-neutral-400 leading-relaxed">
                  Set up intelligent alert rules with custom conditions. Get notified when sensors exceed limits or devices go offline.
                </p>
                <ul className="space-y-3">
                  {[
                    'Condition-based triggers',
                    'Support for all data types',
                    'Real-time evaluation',
                    'Alert history tracking'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-neutral-400">
                      <CheckCircle2 className="w-5 h-5 text-white mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all">
                  Configure alerts
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="relative">
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg space-y-3">
                  {[
                    { severity: 'critical', message: 'Temperature exceeds 85°C', value: '87.2°C' },
                    { severity: 'warning', message: 'Battery level below 20%', value: '18%' },
                    { severity: 'info', message: 'Device came online', value: 'Active' }
                  ].map((alert, i) => (
                    <div key={i} className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-neutral-400" />
                          <span className="text-xs font-bold text-neutral-300 uppercase">{alert.severity}</span>
                        </div>
                        <span className="text-xs text-neutral-400">2 min ago</span>
                      </div>
                      <p className="text-white font-medium mb-1">{alert.message}</p>
                      <p className="text-sm text-neutral-400 font-bold">{alert.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-neutral-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-white">
              Ready to Explore the Platform?
            </h2>
            <p className="text-xl text-neutral-400">
              Try the demo and see how easy it is to manage IoT devices.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-black rounded-xl text-lg font-bold hover:bg-neutral-200 transition-all group"
              >
                Try Demo
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-neutral-950 border border-neutral-800 text-white rounded-xl text-lg font-bold hover:bg-neutral-900 transition-all"
              >
                Sign In
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-neutral-400 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Full-featured demo</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">No setup required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-950 border-t border-neutral-800 text-neutral-400 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <Cloud className="w-6 h-6 text-black" />
                </div>
                <span className="text-2xl font-bold text-white">ThingCloud</span>
              </div>
              <p className="text-neutral-400 text-lg leading-relaxed max-w-md">
                Demo IoT platform for managing and monitoring connected devices in real-time.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white text-lg mb-6">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#showcase" className="hover:text-white transition-colors">Platform</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-lg mb-6">Account</h4>
              <ul className="space-y-3">
                <li><Link to="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-8 text-center">
            <p className="text-neutral-500">© 2026 ThingCloud. Built for IoT.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
