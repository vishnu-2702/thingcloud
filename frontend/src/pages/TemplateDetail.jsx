import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Edit, 
  Copy, 
  Download,
  Pin,
  Activity,
  Users,
  Code,
  FileText,
  Zap,
  Cpu,
  Layers,
  Trash2,
  ChevronRight
} from 'lucide-react';
import { templateAPI } from '../services/templateAPI';
import toast from 'react-hot-toast';

const TemplateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const data = await templateAPI.getTemplate(id);
      setTemplate(data.template || data);
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Error loading template');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = () => {
    navigate(`/app/devices/register?template=${template.templateId || template.id}`);
  };

  const handleCopy = async () => {
    try {
      const name = `${template.name} (Copy)`;
      await templateAPI.cloneTemplate(template.templateId, name);
      toast.success('Template cloned successfully');
      window.location.href = '/app/templates';
    } catch (error) {
      console.error('Error cloning template:', error);
      toast.error('Error cloning template');
    }
  };

  const handleDownload = () => {
    if (!template) return;
    
    // Use the same code generation as the display
    const arduinoCode = generateArduinoCode();

    const element = document.createElement('a');
    const file = new Blob([arduinoCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${template.name.replace(/\s+/g, '_').toLowerCase()}.ino`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success('Arduino code downloaded');
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }
    
    try {
      const templateId = template.templateId || template.id;
      await templateAPI.deleteTemplate(templateId);
      toast.success('Template deleted successfully');
      navigate('/app/templates');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Error deleting template');
    }
  };

  const generateArduinoCode = () => {
    if (!template) return 'Loading...';
    
    // Generate variable declarations with correct types
    const variableDeclarations = template.datastreams?.map((stream, index) => {
      const pin = stream.virtualPin || `V${index}`;
      const varName = stream.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      let type = 'float';
      let defaultValue = '0.0';

      switch (stream.dataType) {
        case 'number':
          type = 'float';
          defaultValue = '25.0';
          break;
        case 'boolean':
          type = 'bool';
          defaultValue = 'false';
          break;
        case 'string':
          type = 'String';
          defaultValue = '"Ready"';
          break;
        default:
          type = 'float';
          defaultValue = '0.0';
      }
      
      return `// ${stream.name} (Pin ${pin})
${type} ${varName} = ${defaultValue};`;
    }).join('\n') || '// No sensors configured';

    // Generate sensor update logic
    const sensorUpdates = template.datastreams?.map((stream, index) => {
      const varName = stream.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      switch (stream.dataType) {
        case 'number':
          return `  // Simulate sensor reading
  ${varName} = random(200, 300) / 10.0; // 20.0 - 30.0`;
        case 'boolean':
          return `  // Simulate switch toggle
  ${varName} = !${varName};`;
        case 'string':
          return `  // Update status message
  ${varName} = "Active " + String(millis() / 1000) + "s";`;
        default:
          return `  ${varName} = 0;`;
      }
    }).join('\n') || '  // No sensor updates needed';

    // Generate payload construction
    const payloadLines = template.datastreams?.map((stream, index) => {
      const pin = stream.virtualPin || `V${index}`;
      const varName = stream.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isLast = index === (template.datastreams?.length || 1) - 1;
      
      let valueStr;
      switch (stream.dataType) {
        case 'string':
          // Strings need to be quoted in JSON
          valueStr = `"\\"" + ${varName} + "\\""`; 
          break;
        case 'boolean':
          // Booleans should be true/false in JSON
          valueStr = `(${varName} ? "true" : "false")`;
          break;
        default: // number
          valueStr = `String(${varName})`;
      }

      return `  payload += "\\"${pin}\\":" + ${valueStr}${isLast ? ';' : ' + ",";'}`;
    }).join('\n') || '  // No data to send';

    // Generate serial output
    const serialOutput = template.datastreams?.map((stream, index) => {
      const varName = stream.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const shortName = stream.name.substring(0, 3).toUpperCase();
      
      return `  Serial.print("${shortName}: ");
  Serial.print(${varName});
  Serial.print(" | ");`;
    }).join('\n') || '  Serial.print("No data");';

    return `/*
  ${template.name} - Generated Template Code

  Description: ${template.description || 'No description'}
  Category: ${template.category || 'General'}
  Virtual Pins: ${template.datastreams?.length || 0}

  QUICK SETUP:
  1. Edit WiFi and server settings below
  2. Register device in platform and get API key
  3. Upload to ESP8266 and monitor via Serial (115200 baud)
*/

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h> // Use secure client for HTTPS

// ========================================
// CONFIGURATION - Edit these values only
// ========================================
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* SERVER_URL = "https://iot-platform-backend.vercel.app"; // Your server URL
const char* API_KEY = "YOUR_DEVICE_API_KEY";   // From device registration

// Timing
const unsigned long SEND_INTERVAL = 30000;      // Send every 30 seconds
// ========================================

// Use WiFiClientSecure for HTTPS connections
WiFiClientSecure client;
unsigned long lastSend = 0;

${variableDeclarations}

void setup() {
  Serial.begin(115200);
  Serial.println("\\n=== ${template.name} ===");

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH); // Turn LED on to indicate setup

  // It's good practice to seed the random number generator
  randomSeed(analogRead(A0));

  connectWiFi();
  Serial.println("Ready to send data");
  digitalWrite(LED_BUILTIN, LOW); // Turn LED off when ready
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (millis() - lastSend > SEND_INTERVAL) {
    updateSensors();
    if (checkInternet()) {
      sendData();
    } else {
      Serial.println("No internet – skipping telemetry send");
    }
    lastSend = millis();
  }

  delay(100);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println(" Connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

bool checkInternet() {
  HTTPClient http;
  WiFiClient testClient;

  const char* testURL = "http://clients3.google.com/generate_204";

  Serial.print("Checking internet... ");

  if (http.begin(testClient, testURL)) {
    int code = http.GET();
    http.end();

    if (code == 204) {
      Serial.println("OK");
      return true;
    } else {
      Serial.print("Failed (code: ");
      Serial.print(code);
      Serial.println(")");
      return false;
    }
  }

  Serial.println("Unable to reach test server");
  return false;
}

void updateSensors() {
  // Simulate realistic sensor readings
${sensorUpdates}
}

void sendData() {
  HTTPClient http;
  String url = String(SERVER_URL) + "/api/telemetry";

  // Create JSON payload (matches backend format)
  String payload = "{\\"data\\":{";
${payloadLines}
  payload += "}}";

  // This is required for HTTPS connections to bypass certificate validation
  // For production, you should use fingerprints, but for testing this is fine.
  client.setInsecure();

  Serial.print("Sending data to: ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(payload);

  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-API-Key", API_KEY);

    int responseCode = http.POST(payload);

    Serial.print("  -> ");
${serialOutput}

    if (responseCode > 0) {
        if (responseCode == HTTP_CODE_CREATED) { // 201
            Serial.println(" ✓");
            digitalWrite(LED_BUILTIN, HIGH);
            delay(100);
            digitalWrite(LED_BUILTIN, LOW);
        } else {
            Serial.print(" ✗ Error: ");
            Serial.println(http.errorToString(responseCode).c_str());
        }
    } else {
        Serial.print(" ✗ HTTP request failed: ");
        Serial.println(http.errorToString(responseCode).c_str());
    }

    http.end();
  } else {
    Serial.println("Unable to connect to server!");
  }
}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
          <Layers className="w-6 h-6 text-neutral-400" />
        </div>
        <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">Template not found</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-4">The template you're looking for doesn't exist.</p>
        <Link 
          to="/app/templates" 
          className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to templates
        </Link>
      </div>
    );
  }

  const templateId = template.templateId || template.id;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
        <Link to="/app/templates" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
          Templates
        </Link>
        <ChevronRight size={14} />
        <span className="text-neutral-900 dark:text-white">{template.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">{template.name}</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">{template.description || 'No description'}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                {template.category || 'General'}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {template.datastreams?.length || 0} datastreams
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {template.usage || 0} devices
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCopy} 
            className="inline-flex items-center gap-2 px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Copy size={16} />
            <span className="hidden sm:inline">Clone</span>
          </button>
          <Link
            to={`/app/templates/${templateId}/edit`}
            className="inline-flex items-center gap-2 px-3 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <Edit size={16} />
            <span className="hidden sm:inline">Edit</span>
          </Link>
          <Link 
            to={`/app/devices/register?template=${templateId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
          >
            <Play size={16} />
            <span>Use Template</span>
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold text-neutral-900 dark:text-white">{template.datastreams?.length || 0}</span>
            <Zap size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Datastreams</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold text-neutral-900 dark:text-white">{template.usage || 0}</span>
            <Cpu size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Devices Using</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold text-neutral-900 dark:text-white">{template.usageStats?.activeDevices || 0}</span>
            <Activity size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Active Now</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold text-neutral-900 dark:text-white">{template.isPublic ? 'Public' : 'Private'}</span>
            <Users size={20} className="text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Visibility</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datastream Configuration */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="font-medium text-neutral-900 dark:text-white">Datastream Configuration</h2>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">{template.datastreams?.length || 0} pins</span>
            </div>
            
            {template.datastreams && template.datastreams.length > 0 ? (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {/* Table Header */}
                <div className="hidden sm:grid sm:grid-cols-4 gap-4 px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  <div>Virtual Pin</div>
                  <div>Name</div>
                  <div>Data Type</div>
                  <div>Unit</div>
                </div>
                {/* Datastream Rows */}
                {template.datastreams.map((datastream, index) => (
                  <div key={index} className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div>
                      <code className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded text-xs font-mono">
                        {datastream.virtualPin || `V${index}`}
                      </code>
                    </div>
                    <div className="font-medium text-neutral-900 dark:text-white text-sm">{datastream.name}</div>
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        datastream.dataType === 'number' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                        datastream.dataType === 'string' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        datastream.dataType === 'boolean' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                        'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}>
                        {datastream.dataType}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">{datastream.unit || '-'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Pin className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                <p className="text-neutral-500 dark:text-neutral-400">No datastreams configured</p>
              </div>
            )}
          </div>

          {/* Arduino Code */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <button 
                onClick={() => setShowCode(!showCode)}
                className="flex items-center gap-2 font-medium text-neutral-900 dark:text-white"
              >
                <Code size={18} />
                Arduino Code
                <ChevronRight size={16} className={`text-neutral-400 transition-transform ${showCode ? 'rotate-90' : ''}`} />
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <Download size={14} />
                Download .ino
              </button>
            </div>
            
            {showCode && (
              <div className="bg-neutral-950 p-4 overflow-x-auto max-h-96">
                <pre className="text-neutral-300 text-xs font-mono whitespace-pre">
                  {generateArduinoCode()}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-4">Quick Actions</h3>
            
            <div className="space-y-2">
              <Link
                to={`/app/devices/register?template=${templateId}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
              >
                <Play size={16} />
                Create Device
              </Link>
              
              <button
                onClick={handleCopy}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-sm"
              >
                <Copy size={16} />
                Clone Template
              </button>
              
              <button
                onClick={handleDownload}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-sm"
              >
                <Download size={16} />
                Download Code
              </button>

              <Link
                to={`/app/templates/${templateId}/edit`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors text-sm"
              >
                <Edit size={16} />
                Edit Template
              </Link>

              <button
                onClick={handleDelete}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm"
              >
                <Trash2 size={16} />
                Delete Template
              </button>
            </div>
          </div>

          {/* Template Info */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-4">
            <h3 className="font-medium text-neutral-900 dark:text-white mb-4">Template Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Created</span>
                <span className="text-neutral-900 dark:text-white">
                  {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Updated</span>
                <span className="text-neutral-900 dark:text-white">
                  {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Category</span>
                <span className="text-neutral-900 dark:text-white">{template.category || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">Visibility</span>
                <span className="text-neutral-900 dark:text-white">{template.isPublic ? 'Public' : 'Private'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500 dark:text-neutral-400">ID</span>
                <code className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">{templateId?.slice(0, 12)}...</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetail;