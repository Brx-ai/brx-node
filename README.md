![img](https://img.shields.io/npm/v/brx-node)
![img](https://img.shields.io/npm/dt/brx-node)

# brx-node

`brx-node` is the official Node.js and browser SDK for BRX.ai. It provides comprehensive functionality for interacting with BRX including BRK execution, project management, real-time streaming, and CRUD operations.

**🚀 We're currently in BETA. Expect package changes and improvements in the future!**

## Features

- 🔥 **BRK Execution**: Run individual BRKs with input variables
- 🚀 **Project Sessions**: Execute complex projects with real-time updates
- 📡 **Server-Sent Events (SSE)**: Real-time streaming for long-running operations
- 🔄 **WebSocket Support**: Efficient bi-directional communication
- 🛠️ **CRUD Operations**: Create, read, update, delete, and clone BRKs
- 🌐 **Cross-Platform**: Works in both Node.js and browser environments
- 🔐 **Flexible Authentication**: API key or Firebase auth support
- 🔌 **Auto-Reconnection**: Robust connection management with retry logic
- 📝 **TypeScript Support**: Full type definitions included

## Installation

```bash
# npm
npm install brx-node

# yarn
yarn add brx-node

# pnpm
pnpm add brx-node
```

## Quick Start

```typescript
import BRX, { BRK } from 'brx-node';

// Initialize the BRX client
const brx = new BRX('your-api-key');

// Fetch a BRK schema
const schema = await brx.get('your-brk-id');

// Create a BRK instance
const myBRK = new BRK(schema);

// Set input variables
myBRK.input['Variable Name'] = 'Your input value';

// Execute the BRK
const result = await brx.run(myBRK);
console.log(result);
```

## Core Concepts

### BRX Client
The main interface for interacting with BRX.ai services. Handles authentication, connection management, and API operations.

### BRK (BRX Knowledge)
A BRK represents a prompt template with variables and dependencies. BRKs can be chained together to create complex workflows.

### Projects
Projects are collections of BRKs organized into workflows that can be executed with real-time monitoring and interaction.

## API Reference

### BRX Class

#### Constructor

```typescript
new BRX(accessToken: string, options?: BRXOptions)
```

**Parameters:**
- `accessToken`: Your BRX.ai API key or Firebase auth token
- `options`: Configuration options

**Options:**
```typescript
interface BRXOptions {
  use_brx_key?: boolean;     // Use BRX API key (default: true)
  verbose?: boolean;         // Enable verbose logging (default: false)
  send_local?: boolean;      // Use local development server (default: false)
  force_client?: boolean;    // Force browser mode (default: false)
  silent?: boolean;          // Suppress console output (default: false)
}
```

**Example:**
```typescript
const brx = new BRX('your-api-key', {
  verbose: true,
  send_local: false
});
```

#### Methods

##### `get(brkId: string): Promise<GetSchemaObject>`

Fetches a BRK schema by ID.

```typescript
const schema = await brx.get('d5683979-772d-464e-9dda-94ca854d6194');
```

##### `run(brk: BRK, callback?: (message: RunResult) => void): Promise<RunResult[]>`

Executes a BRK and returns the results.

```typescript
// Simple execution
const results = await brx.run(myBRK);

// With real-time callbacks
const results = await brx.run(myBRK, (message) => {
  console.log('Received:', message);
});
```

##### `modify(request: ModifyRequest): Promise<ModifyResponse>`

Create, update, delete, or clone BRKs.

```typescript
// Create a new BRK
const createResult = await brx.create({
  modifyBrxMode: modifyBrxMode.CREATE,
  brxId: 'new-brk-id',
  brx: brxData
});

// Update existing BRK
const updateResult = await brx.update({
  modifyBrxMode: modifyBrxMode.UPDATE,
  brxId: 'existing-brk-id',
  brx: updatedBrxData
});

// Clone a BRK
const cloneResult = await brx.clone({
  modifyBrxMode: modifyBrxMode.CLONE,
  brxId: 'source-brk-id'
});

// Delete a BRK
const deleteResult = await brx.delete({
  modifyBrxMode: modifyBrxMode.DELETE,
  brxId: 'brk-to-delete'
});
```

##### `project(request: ProjectRequest, options?: ProjectOptions): Promise<BRXProjectSession | any>`

Execute projects with optional real-time streaming.

```typescript
const projectRequest = {
  projectId: 'your-project-id',
  appId: 'your-app-id',
  inputs: {
    variable1: 'value1',
    variable2: 'value2'
  },
  options: {
    projectRunMode: 'execute',
    sse: true  // Enable real-time streaming
  }
};

// With SSE streaming
const session = await brx.project(projectRequest, {
  useSSE: true,
  onEvent: (event) => {
    console.log('Event:', event.type, event.data);
  }
});
```

### BRK Class

#### Constructor

```typescript
new BRK(schema?: GetSchemaObject, brxClient?: BRX)
```

#### Properties

- `input`: Object containing input variables for the BRK
- `brxQuery`: Internal query structure
- `inprogress`: Boolean indicating if BRK is currently executing

#### Methods

##### `run(callback?: (message: RunResult) => void): Promise<RunResult[]>`

Execute the BRK using its associated BRX client.

```typescript
const myBRK = new BRK(schema, brx);
myBRK.input['Variable Name'] = 'Input value';

const results = await myBRK.run();
```

### Project Sessions

Project sessions provide real-time execution monitoring with Server-Sent Events.

#### BRXProjectSession Class

```typescript
const session = new BRXProjectSession(
  sessionId,
  accessToken,
  projectRequest,
  options
);

// Connect to the session
await session.connect();

// Listen for events
session.on('output', (outputNode) => {
  console.log('Output:', outputNode.outputName, outputNode.data);
});

session.on('await_response', (awaitNode) => {
  console.log('Awaiting response:', awaitNode.data);
  // Respond to interactive prompts
  awaitNode.respond({ response: 'User input' });
});

session.on('complete', (data) => {
  console.log('Project completed:', data);
});

// Disconnect when done
session.disconnect();
```

#### Project Events

- `output`: Fired when a node produces output
- `await_response`: Fired when user input is required
- `complete`: Fired when the project finishes
- `error`: Fired on errors
- `status`: Connection status changes

## Advanced Usage

### Real-time BRK Execution with Callbacks

```typescript
import BRX, { BRK } from 'brx-node';

const brx = new BRX('your-api-key');
const schema = await brx.get('your-brk-id');
const myBRK = new BRK(schema);

myBRK.input['Question'] = 'What is the capital of France?';

// Execute with real-time updates
const results = await brx.run(myBRK, (message) => {
  console.log(`BRK ${message.brxName} completed:`, message.brxRes.output);
});

console.log('Final results:', results);
```

### Project Execution with SSE

```typescript
import BRX from 'brx-node';

const brx = new BRX('your-api-key');

const projectRequest = {
  projectId: 'your-project-id',
  appId: 'your-app-id',
  inputs: {
    prompt: 'Generate a creative story',
    length: 'medium'
  },
  options: {
    sse: true
  }
};

const session = await brx.project(projectRequest, {
  useSSE: true,
  onEvent: (event) => {
    switch (event.type) {
      case 'output':
        console.log('Generated output:', event.data);
        break;
      case 'await_response':
        console.log('Waiting for user input:', event.data);
        // Handle interactive prompts
        event.data.respond({ response: 'Continue with the story' });
        break;
      case 'complete':
        console.log('Project finished!');
        break;
    }
  }
});
```

### Custom SSE Client

For advanced use cases, you can use the SSE client directly:

```typescript
import { SSEClient } from 'brx-node';

const sseClient = new SSEClient({
  url: 'https://api.brx.ai/v0/project/execute',
  method: 'POST',
  headers: {
    'key': 'your-api-key',
    'Content-Type': 'application/json'
  },
  data: projectRequest,
  autoReconnect: true,
  reconnectDelay: 3000,
  maxReconnectAttempts: 5
});

sseClient.on('event', (event) => {
  console.log('Received event:', event);
});

sseClient.connect();
```

### Error Handling

```typescript
try {
  const schema = await brx.get('invalid-brk-id');
} catch (error) {
  if (error.message.includes('Unauthorized')) {
    console.error('Invalid API key or insufficient permissions');
  } else if (error.message.includes('no emails')) {
    console.error('BRK not found or access denied');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

### Connection Management

```typescript
// Configure connection options
const brx = new BRX('your-api-key', {
  verbose: true,           // Enable detailed logging
  send_local: false,       // Use production servers
  force_client: false,     // Auto-detect environment
  silent: false           // Show connection info
});

// The client automatically handles:
// - WebSocket connections for real-time communication
// - Connection retries and error recovery
// - Browser vs Node.js environment detection
// - Authentication header management
```

## Browser Usage

The package works seamlessly in browser environments:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import BRX, { BRK } from 'https://unpkg.com/brx-node/lib/esm/index.js';
    
    const brx = new BRX('your-api-key');
    
    // Use the same API as Node.js
    const schema = await brx.get('your-brk-id');
    const myBRK = new BRK(schema);
    myBRK.input['Variable'] = 'Browser input';
    
    const results = await brx.run(myBRK);
    console.log(results);
  </script>
</head>
<body>
  <h1>BRX in Browser</h1>
</body>
</html>
```

## Environment Variables

For Node.js applications, you can use environment variables:

```bash
# .env file
BRXAI_API_KEY=your-api-key-here
```

```typescript
import dotenv from 'dotenv';
dotenv.config();

const brx = new BRX(process.env.BRXAI_API_KEY!);
```

## TypeScript Support

The package includes comprehensive TypeScript definitions:

```typescript
import BRX, { 
  BRK, 
  RunResult, 
  GetSchemaObject, 
  ProjectRequest,
  BRXProjectSession,
  SSEClient,
  ConnectionStatus 
} from 'brx-node';

// All types are fully defined and documented
const brx: BRX = new BRX('api-key');
const results: RunResult[] = await brx.run(myBRK);
```

## Configuration Options

### BRX Client Options

```typescript
interface BRXOptions {
  use_brx_key?: boolean;     // Use BRX API key vs Firebase auth
  verbose?: boolean;         // Enable debug logging
  send_local?: boolean;      // Connect to local development server
  force_client?: boolean;    // Force browser mode in Node.js
  silent?: boolean;          // Suppress startup messages
}
```

### SSE Configuration

```typescript
interface SSEConfig {
  url: string;                    // SSE endpoint URL
  method?: 'GET' | 'POST';       // HTTP method
  headers?: Record<string, string>; // Custom headers
  data?: any;                    // Request payload
  autoReconnect?: boolean;       // Auto-reconnect on disconnect
  reconnectDelay?: number;       // Delay between reconnect attempts
  maxReconnectAttempts?: number; // Max reconnection attempts
  connectionTimeout?: number;    // Connection timeout in ms
  eventTypes?: string[];         // Specific events to listen for
}
```

## Examples

### Basic BRK Chain

```typescript
// Execute a BRK with dependencies
const mainBRK = await brx.get('main-brk-id');
mainBRK.input['Primary Input'] = 'Main question';
mainBRK.input['Secondary Input'] = 'Additional context';

const results = await brx.run(mainBRK, (message) => {
  console.log(`Step ${message.brxName}: ${message.brxRes.output}`);
});
```

### Interactive Project

```typescript
const interactiveProject = {
  projectId: 'interactive-project-id',
  appId: 'your-app-id',
  inputs: { topic: 'AI Ethics' },
  options: { sse: true }
};

const session = await brx.project(interactiveProject, {
  useSSE: true,
  onEvent: (event) => {
    if (event.type === 'await_response') {
      // Simulate user interaction
      setTimeout(() => {
        event.data.respond({ 
          response: 'Please continue with more details' 
        });
      }, 1000);
    }
  }
});
```

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   ```typescript
   // Ensure your API key is valid
   const brx = new BRX('your-valid-api-key');
   ```

2. **Connection Timeouts**
   ```typescript
   // Increase timeout for slow connections
   const brx = new BRX('api-key', { verbose: true });
   ```

3. **CORS Issues in Browser**
   ```typescript
   // The BRX.ai API handles CORS automatically
   // No additional configuration needed
   ```

4. **WebSocket Connection Issues**
   ```typescript
   // Enable verbose logging to debug
   const brx = new BRX('api-key', { verbose: true });
   ```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@brx.ai
- 🐛 Issues: [GitHub Issues](https://github.com/Brx-ai/brx-node/issues)
- 📖 Documentation: [BRX.ai Docs](https://docs.brx.ai)
- 💬 Community: [Discord](https://discord.gg/brx-ai)

---

**Made with ❤️ by the BRX.ai team**
