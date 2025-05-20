// We'll implement our own EventSource-like functionality using axios for Node.js
// and native EventSource for browsers
import axios from 'axios';
import { SSEConfig } from '../utils/config';
import logger from '../utils/logger';
import { EventEmitter } from 'events';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Only import Node.js specific modules if we're not in a browser
let fs: any;
let path: any;

if (!isBrowser) {
  try {
    // Dynamic imports for Node.js specific modules
    fs = require('fs');
    path = require('path');
  } catch (e) {
    logger.warn('Failed to import Node.js modules: fs, path');
  }
}

/**
 * Event data structure
 */
export interface SSEEvent {
  id?: string;
  type: string;
  data: any;
  timestamp: number;
  retry?: number;
}

/**
 * Connection status
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * SSE Connection class
 */
export class SSEConnection extends EventEmitter {
  private abortController: AbortController | null = null;
  private config: SSEConfig;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private reconnectAttempts: number = 0;
  private events: SSEEvent[] = [];
  private connectionTimeout: NodeJS.Timeout | null = null;
  private lastEventId: string | null = null;
  private eventSource: EventSource | null = null;

  constructor(config: SSEConfig) {
    super();
    this.config = config;
  }

  /**
   * Connect to the SSE endpoint
   */
  public async connect(): Promise<void> {
    if (this.abortController) {
      this.disconnect();
    }

    this.setStatus(ConnectionStatus.CONNECTING);

    try {
      logger.info(`Connecting to SSE endpoint: ${this.config.url}`);

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        logger.error(`Connection timeout after ${this.config.connectionTimeout}ms`);
        this.disconnect();
        this.setStatus(ConnectionStatus.ERROR);
        this.emit('error', new Error('Connection timeout'));

        if (this.config.autoReconnect) {
          this.attemptReconnect();
        }
      }, this.config.connectionTimeout);

      // Use different connection methods based on environment
      if (isBrowser) {
        await this.connectBrowser();
      } else {
        await this.connectNode();
      }

    } catch (error) {
      logger.error('Failed to connect to SSE endpoint', error);
      this.setStatus(ConnectionStatus.ERROR);
      this.emit('error', error);

      if (this.config.autoReconnect) {
        this.attemptReconnect();
      }
    }
  }

  /**
   * Connect using browser's native EventSource
   */
  private async connectBrowser(): Promise<void> {
    // For POST requests in browser, we need to first make a POST request
    // to establish the connection, then use EventSource for the SSE stream
    if (this.config.method === 'POST' && this.config.data) {
      try {
        // Make the initial POST request to establish the connection
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...this.config.headers
        };

        // Remove Accept header as it will be set by EventSource
        delete headers['Accept'];

        // Make the POST request
        await axios.post(this.config.url, this.config.data, { headers });

        // Now connect with EventSource
        this.setupBrowserEventSource();
      } catch (error) {
        throw new Error(`Failed to make initial POST request: ${error}`);
      }
    } else {
      // For GET requests, we can use EventSource directly
      this.setupBrowserEventSource();
    }
  }

  /**
   * Set up browser EventSource
   */
  private setupBrowserEventSource(): void {
    // Prepare URL with query parameters for GET requests
    let url = this.config.url;
    if (this.config.method !== 'POST' && this.config.data) {
      const params = new URLSearchParams();
      Object.entries(this.config.data).forEach(([key, value]) => {
        if (typeof value === 'object') {
          params.append(key, JSON.stringify(value));
        } else {
          params.append(key, String(value));
        }
      });
      url = `${url}?${params.toString()}`;
    }

    // Create EventSource options
    const options: EventSourceInit = {
      withCredentials: true
    };

    // Create EventSource
    this.eventSource = new EventSource(url, options);

    // Set up event listeners
    this.eventSource.onopen = () => {
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }

      this.reconnectAttempts = 0;
      this.setStatus(ConnectionStatus.CONNECTED);
      logger.info('Connected to SSE endpoint');
      this.emit('connected');
    };

    this.eventSource.onerror = (error) => {
      logger.error('SSE connection error', error);
      this.setStatus(ConnectionStatus.ERROR);
      this.emit('error', new Error('EventSource error'));

      if (this.config.autoReconnect) {
        this.attemptReconnect();
      }
    };

    this.eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);

        // Create the event
        const sseEvent: SSEEvent = {
          id: event.lastEventId || undefined,
          type: 'message',
          data: parsedData,
          timestamp: Date.now()
        };

        // Store the event
        this.events.push(sseEvent);

        // Update the last event ID
        if (event.lastEventId) {
          this.lastEventId = event.lastEventId;
        }

        // Emit the event
        logger.debug(`Received message event: ${JSON.stringify(sseEvent)}`);
        this.emit('event', sseEvent);
        this.emit('message', sseEvent);
      } catch (error) {
        logger.error(`Failed to parse event data: ${event.data}`, error);
      }
    };

    // Listen for custom events
    if (this.config.eventTypes && this.config.eventTypes.length > 0) {
      this.config.eventTypes.forEach(eventType => {
        this.eventSource!.addEventListener(eventType, (event: any) => {
          try {
            const parsedData = JSON.parse(event.data);

            // Create the event
            const sseEvent: SSEEvent = {
              id: event.lastEventId || undefined,
              type: eventType,
              data: parsedData,
              timestamp: Date.now()
            };

            // Store the event
            this.events.push(sseEvent);

            // Update the last event ID
            if (event.lastEventId) {
              this.lastEventId = event.lastEventId;
            }

            // Emit the event
            logger.debug(`Received ${eventType} event: ${JSON.stringify(sseEvent)}`);
            this.emit('event', sseEvent);
            this.emit(eventType, sseEvent);
          } catch (error) {
            logger.error(`Failed to parse event data: ${event.data}`, error);
          }
        });
      });
    }
  }

  /**
   * Connect using Node.js axios
   */
  private async connectNode(): Promise<void> {
    // Create a new AbortController for this connection
    this.abortController = new AbortController();

    // Prepare the request options
    const method = this.config.method === 'POST' ? 'post' : 'get';
    const headers: Record<string, string> = {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      ...this.config.headers
    };

    // Add Last-Event-ID header if we have one
    if (this.lastEventId) {
      headers['Last-Event-ID'] = this.lastEventId;
    }

    // Prepare the request config
    const requestConfig: any = {
      url: this.config.url,
      method,
      headers,
      responseType: 'stream',
      signal: this.abortController.signal,
      maxRedirects: 5,
      timeout: 0, // Disable axios timeout, we'll handle it ourselves
    };

    // Add data to the request if provided
    if (this.config.data) {
      if (method === 'post') {
        requestConfig.data = this.config.data;

        // Add Content-Type header if not already set
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      } else {
        // For GET requests, add the data as query parameters
        const params = new URLSearchParams();

        // Convert data object to query parameters
        Object.entries(this.config.data).forEach(([key, value]) => {
          if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
          } else {
            params.append(key, String(value));
          }
        });

        requestConfig.params = params;
      }
    }

    logger.debug(`Connecting to SSE endpoint with ${method.toUpperCase()} method: ${this.config.url}`);

    // Make the request
    const response = await axios(requestConfig);

    // Clear the connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Check if the response is valid
    if (response.status !== 200) {
      throw new Error(`Unexpected status code: ${response.status}`);
    }

    // Set up the event stream
    this.setupNodeEventStream(response.data);

    // Connection established
    this.reconnectAttempts = 0;
    this.setStatus(ConnectionStatus.CONNECTED);
    logger.info('Connected to SSE endpoint');
    this.emit('connected');
  }

  /**
   * Disconnect from the SSE endpoint
   */
  public disconnect(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    if (isBrowser && this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      logger.info('Disconnected from SSE endpoint');
    } else if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      logger.info('Disconnected from SSE endpoint');
    }

    this.setStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Get the current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get all received events
   */
  public getEvents(): SSEEvent[] {
    return [...this.events];
  }

  /**
   * Save events to a file
   * Note: This only works in Node.js environments
   */
  public saveEventsToFile(filePath?: string): void {
    // Skip if we're in a browser environment
    if (isBrowser) {
      logger.warn('saveEventsToFile is not supported in browser environments');
      return;
    }

    // Skip if fs or path modules are not available
    if (!fs || !path) {
      logger.warn('saveEventsToFile failed: fs or path module not available');
      return;
    }

    const savePath = filePath || this.config.eventLogPath || './logs/events.json';
    const dirPath = path.dirname(savePath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    try {
      fs.writeFileSync(savePath, JSON.stringify(this.events, null, 2));
      logger.info(`Events saved to ${savePath}`);
    } catch (error) {
      logger.error(`Failed to save events to ${savePath}`, error);
    }
  }

  /**
   * Set up the event stream for Node.js
   */
  private setupNodeEventStream(stream: any): void {
    let buffer = '';
    let eventType = 'message';
    let eventId: string | null = null;
    let eventData = '';
    let retry: number | null = null;

    // Listen for data events
    stream.on('data', (chunk: Buffer) => {
      // Add the new chunk to the buffer
      buffer += chunk.toString();

      // Process the buffer line by line
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last line in the buffer if it's incomplete

      for (const line of lines) {
        // Empty line means the end of an event
        if (line.trim() === '') {
          if (eventData) {
            try {
              // Parse the event data
              const parsedData = JSON.parse(eventData);

              // Create the event
              const event: SSEEvent = {
                id: eventId || undefined,
                type: eventType,
                data: parsedData,
                timestamp: Date.now(),
                retry: retry || undefined
              };

              // Store the event
              this.events.push(event);

              // Update the last event ID
              if (eventId) {
                this.lastEventId = eventId;
              }

              // Emit the event
              logger.debug(`Received ${eventType} event: ${JSON.stringify(event)}`);
              this.emit('event', event);
              this.emit(eventType, event);

              // Save events if configured
              if (this.config.saveEvents) {
                this.saveEventsToFile();
              }
            } catch (error) {
              logger.error(`Failed to parse event data: ${eventData}`, error);
            }
          }

          // Reset for the next event
          eventType = 'message';
          eventId = null;
          eventData = '';
          retry = null;
          continue;
        }

        // Parse the line
        if (line.startsWith('event:')) {
          eventType = line.substring(6).trim();
        } else if (line.startsWith('id:')) {
          eventId = line.substring(3).trim();
        } else if (line.startsWith('data:')) {
          eventData = line.substring(5).trim();
        } else if (line.startsWith('retry:')) {
          retry = parseInt(line.substring(6).trim(), 10);
        }
      }
    });

    // Listen for error events
    stream.on('error', (error: Error) => {
      logger.error('SSE connection error', error);
      this.setStatus(ConnectionStatus.ERROR);
      this.emit('error', error);

      if (this.config.autoReconnect) {
        this.attemptReconnect();
      }
    });

    // Listen for end events
    stream.on('end', () => {
      logger.info('SSE connection closed');
      this.setStatus(ConnectionStatus.DISCONNECTED);

      if (this.config.autoReconnect) {
        this.attemptReconnect();
      }
    });
  }

  /**
   * Attempt to reconnect to the SSE endpoint
   */
  private attemptReconnect(): void {
    const maxAttempts = this.config.maxReconnectAttempts || 0;

    if (maxAttempts > 0 && this.reconnectAttempts >= maxAttempts) {
      logger.error(`Maximum reconnect attempts (${maxAttempts}) reached`);
      return;
    }

    this.reconnectAttempts++;
    this.setStatus(ConnectionStatus.RECONNECTING);

    const delay = this.config.reconnectDelay || 3000;
    logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Set the connection status and emit a status event
   */
  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.emit('status', status);
    logger.debug(`Connection status: ${status}`);
  }
}
