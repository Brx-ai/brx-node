/**
 * Configuration for the SSE client
 */
export interface SSEConfig {
  // The URL to connect to for SSE events
  url: string;
  
  // Optional headers to include in the SSE request
  headers?: Record<string, string>;
  
  // Optional data to send with the SSE connection request
  // This will be sent as query parameters or in the request body depending on the method
  data?: any;
  
  // HTTP method to use for the connection (GET or POST)
  method?: 'GET' | 'POST';
  
  // Whether to automatically reconnect on connection loss
  autoReconnect?: boolean;
  
  // Delay in milliseconds before attempting to reconnect
  reconnectDelay?: number;
  
  // Maximum number of reconnection attempts (0 = infinite)
  maxReconnectAttempts?: number;
  
  // Connection timeout in milliseconds
  connectionTimeout?: number;
  
  // Event types to listen for (empty array = all events)
  eventTypes?: string[];
  
  // Whether to save events to a log file
  saveEvents?: boolean;
  
  // Path to save event logs (defaults to ./logs/events.json)
  eventLogPath?: string;
}

/**
 * Default configuration values
 */
export const defaultConfig: SSEConfig = {
  url: '',
  headers: {},
  data: null,
  method: 'GET',
  autoReconnect: false,
  reconnectDelay: 3000,
  maxReconnectAttempts: 5,
  connectionTimeout: 30000,
  eventTypes: [],
  saveEvents: false,
  eventLogPath: './logs/events.json'
};

/**
 * Merge user config with default config
 */
export function mergeConfig(userConfig: Partial<SSEConfig>): SSEConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    // Merge headers separately to preserve defaults
    headers: {
      ...defaultConfig.headers,
      ...userConfig.headers
    }
  };
}
