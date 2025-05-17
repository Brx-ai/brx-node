import { SSEConnection, SSEEvent, ConnectionStatus } from './connection';
import { SSEConfig, mergeConfig } from '../utils/config';
import logger from '../utils/logger';
import axios from 'axios';
import { EventEmitter } from 'events';

/**
 * SSE Client class
 * Main interface for the SSE client
 */
export class SSEClient extends EventEmitter {
  private connection: SSEConnection;
  private config: SSEConfig;
  
  /**
   * Create a new SSE client
   */
  constructor(config: Partial<SSEConfig>) {
    super();
    this.config = mergeConfig(config);
    this.connection = new SSEConnection(this.config);
    
    // Set up event listeners
    this.setupEventListeners();
  }
  
  /**
   * Connect to the SSE endpoint
   */
  public connect(): void {
    logger.info('Starting SSE client connection');
    this.connection.connect();
  }
  
  /**
   * Disconnect from the SSE endpoint
   */
  public disconnect(): void {
    logger.info('Disconnecting SSE client');
    this.connection.disconnect();
  }
  
  /**
   * Get the current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.connection.getStatus();
  }
  
  /**
   * Get all received events
   */
  public getEvents(): SSEEvent[] {
    return this.connection.getEvents();
  }
  
  /**
   * Save events to a file
   */
  public saveEvents(filePath?: string): void {
    this.connection.saveEventsToFile(filePath);
  }
  
  /**
   * Send a POST request to trigger an event
   * This is useful for testing your SSE service
   */
  public async triggerEvent(url: string, data: any, headers?: Record<string, string>): Promise<void> {
    try {
      logger.info(`Triggering event at ${url}`);
      
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      });
      
      logger.info(`Event triggered successfully: ${response.status}`);
    } catch (error) {
      logger.error('Failed to trigger event', error);
      throw error;
    }
  }
  
  /**
   * Set up event listeners for the connection
   */
  private setupEventListeners(): void {
    // Connection status changes
    this.connection.on('status', (status: ConnectionStatus) => {
      logger.info(`Connection status changed: ${status}`);
      this.emit('status', status);
    });
    
    // Connection established
    this.connection.on('connected', () => {
      logger.info('Connection established');
      this.emit('connected');
    });
    
    // Connection error
    this.connection.on('error', (error: Error) => {
      logger.error('Connection error', error);
      this.emit('error', error);
    });
    
    // Event received
    this.connection.on('event', (event: SSEEvent) => {
      logger.info(`Event received: ${event.type}`);
      this.emit('event', event);
      // Also emit the specific event type
      this.emit(event.type, event);
    });
  }
}

// Export everything from connection
export * from './connection';
export * from '../utils/config';
