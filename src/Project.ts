export interface ProjectRequest {
    options?: {
        /**
         * The run mode for the project.
         * Default value: "execute"
         */
        projectRunMode?: string;
        /**
         * Optional flag to specify if history should be used.
         */
        useHistory?: string;
        /**
         * Optional flag to use SSE for the response.
         * When true, the server will return a Server-Sent Events stream.
         */
        sse?: boolean;
    };
    /**
     * The unique ID of the project.
     */
    projectId: string;
    /**
     * The associated application ID.
     */
    appId: string;
    /**
     * A key-value map for the project's input data.
     */
    inputs: { [key: string]: any };
}

export interface OutputNode {
    type: "OutputNode"
    id: string
    outputName: string
    data: any
}

export interface AwaitResponseNode {
    type: "AwaitResponseNode"
    id: string
    data: any
    respond: Function
}

export interface ProjectEvent {
    type: string;
    data: OutputNode | AwaitResponseNode | any;
    id?: string;
}

import { SSEClient, SSEConfig, SSEEvent, ConnectionStatus, EventEmitter } from './SSEHandler/client/index.js';

export class BRXProjectSession extends EventEmitter {
    sessionId: string;
    accessToken: string;
    private sseClient: SSEClient | null = null;
    private baseUrl: string;
    private useApiKey: boolean;
    private verbose: boolean;
    private projectRequest: ProjectRequest;
    private connected: boolean = false;

    constructor(
        sessionId: string,
        accessToken: string,
        projectRequest: ProjectRequest,
        options: {
            baseUrl?: string;
            useApiKey?: boolean;
            verbose?: boolean;
        } = {}
    ) {
        super();
        this.sessionId = sessionId;
        this.accessToken = accessToken;
        this.projectRequest = projectRequest;
        this.baseUrl = options.baseUrl || 'https://api.brx.ai';
        this.useApiKey = options.useApiKey !== undefined ? options.useApiKey : true;
        this.verbose = options.verbose || false;
    }

    /** 
     * Open the connection to the session
     * @returns Promise that resolves when the connection is established
     */
    public async connect(): Promise<void> {
        if (this.connected) {
            return;
        }

        if (!this.projectRequest.options) {
            this.projectRequest.options = {};
        }
        this.projectRequest.options.sse = true;

        const sseConfig: SSEConfig = {
            url: `${this.baseUrl}/v0/project/execute`,
            method: 'POST',
            headers: this.getHeaders(),
            data: this.projectRequest,
            autoReconnect: true,
            reconnectDelay: 3000,
            maxReconnectAttempts: 5,
            eventTypes: ['connection', 'error', 'complete', 'output', 'await_response', 'workflow_stopped', 'job_status']
        };

        this.sseClient = new SSEClient(sseConfig);
        this.setupEventListeners();
        this.sseClient.connect();

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 30000);

            this.sseClient!.once('connected', () => {
                clearTimeout(timeout);
                this.connected = true;
                resolve();
            });

            this.sseClient!.once('error', (error: Error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    /**
     * Stop listening to the session
     * @returns true if disconnected successfully
     */
    public disconnect(): boolean {
        if (this.sseClient) {
            this.sseClient.disconnect();
            this.sseClient = null;
            this.connected = false;
            return true;
        }
        return false;
    }

    /**
     * Forcefully stop the session.
     * Note that this does not terminate currently resolving nodes.
     * @returns true if stopped successfully
     */
    public stop(): boolean {
        // Send a stop request to the server
        if (this.connected && this.sseClient) {
            return this.disconnect();
        }
        return false;
    }

    /**
     * Check if the session is connected
     * @returns true if connected
     */
    public isConnected(): boolean {
        return this.connected && this.sseClient !== null &&
            this.sseClient.getStatus() === ConnectionStatus.CONNECTED;
    }

    /**
     * Set up event listeners for the SSE client
     */
    private setupEventListeners(): void {
        if (!this.sseClient) return;

        this.sseClient.on('status', (status: ConnectionStatus) => {
            if (this.verbose) {
                console.log(`SSE connection status: ${status}`);
            }
            this.emit('status', status);
        });

        this.sseClient.on('error', (error: Error) => {
            if (this.verbose) {
                console.error('SSE connection error:', error);
            }
            this.emit('error', error);
        });

        this.sseClient.on('event', (event: SSEEvent) => {
            if (this.verbose) {
                console.log(`Received SSE event: ${event.type}`, event.data);
            }

            // Convert SSE event to ProjectEvent
            const projectEvent: ProjectEvent = {
                type: event.type,
                data: event.data,
                id: event.id
            };

            this.emit('event', projectEvent);
            this.emit(event.type, projectEvent);

            // Handle specific event types
            if (event.type === 'output') {
                this.emit('output', projectEvent.data as OutputNode);
            } else if (event.type === 'await_response') {
                this.emit('await_response', projectEvent.data as AwaitResponseNode);
            } else if (event.type === 'complete') {
                this.emit('complete', projectEvent.data);
                // Automatically disconnect when the session is complete
                this.disconnect();
            }
        });
    }

    /**
     * Get the headers for the SSE request
     */
    private getHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        };

        if (this.useApiKey) {
            headers['key'] = this.accessToken;
        } else {
            headers['authorization'] = this.accessToken;
        }

        return headers;
    }
}
