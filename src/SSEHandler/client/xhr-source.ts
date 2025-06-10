/**
 * XhrSource - A custom EventSource-like implementation using XMLHttpRequest
 * This allows for POST requests with SSE, which is not supported by the native EventSource
 * Based on the implementation by Alexander Solovyov: https://solovyov.net/blog/2023/sse-post/
 */

/**
 * Parse an SSE message into a MessageEvent
 */
function sseevent(message: string): MessageEvent {
    let type = 'message';
    let data = '';
    let id = '';
    let retry: number | null = null;

    // Split the message into lines
    const lines = message.split('\n');

    for (const line of lines) {
        if (line.startsWith('event:')) {
            type = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
            // Handle data lines - there can be multiple data lines
            const lineData = line.substring(5).trim();
            if (data) {
                data += '\n' + lineData;
            } else {
                data = lineData;
            }
        } else if (line.startsWith('id:')) {
            id = line.substring(3).trim();
        } else if (line.startsWith('retry:')) {
            retry = parseInt(line.substring(6).trim(), 10);
        }
    }

    // Create the MessageEvent with proper properties
    const eventInit: any = { data: data };
    if (id) {
        eventInit.lastEventId = id;
    }

    return new MessageEvent(type, eventInit);
}

/**
 * XhrSource options
 */
export interface XhrSourceOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
}

/**
 * XhrSource - A custom EventSource-like implementation using XMLHttpRequest
 * This allows for POST requests with SSE, which is not supported by the native EventSource
 */
export function XhrSource(url: string, opts: XhrSourceOptions = {}): EventTarget {
    const eventTarget = new EventTarget();
    const xhr = new XMLHttpRequest();

    xhr.open(opts.method || 'GET', url, true);

    // Set default headers for SSE
    xhr.setRequestHeader('Accept', 'text/event-stream');
    xhr.setRequestHeader('Cache-Control', 'no-cache');

    // Set custom headers
    for (var k in opts.headers || {}) {
        xhr.setRequestHeader(k, opts.headers![k]);
    }

    var ongoing = false, start = 0;

    // Handle ready state changes
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
            // Check if the response is actually an SSE stream
            const contentType = xhr.getResponseHeader('Content-Type');
            if (!contentType || !contentType.includes('text/event-stream')) {
                console.warn('Response is not an SSE stream, Content-Type:', contentType);
            }
        }
    };

    xhr.onprogress = function () {
        if (!ongoing) {
            // Check if we have a successful response
            if (xhr.status >= 200 && xhr.status < 300) {
                ongoing = true;
                console.debug('[XHR-SSE] Connection opened, status:', xhr.status);
                eventTarget.dispatchEvent(new Event('open', {
                    bubbles: false,
                    cancelable: false,
                }));
            } else if (xhr.status >= 400) {
                console.error('[XHR-SSE] HTTP error:', xhr.status, xhr.statusText);
                eventTarget.dispatchEvent(new CloseEvent('error', {
                    bubbles: false,
                    cancelable: false,
                    reason: `HTTP ${xhr.status}: ${xhr.statusText}`
                }));
                return;
            }
        }

        // Debug: Log the current response text length and start position
        console.debug('[XHR-SSE] Progress - Response length:', xhr.responseText.length, 'Start position:', start);

        // Process SSE messages
        var i, chunk;
        while ((i = xhr.responseText.indexOf('\n\n', start)) >= 0) {
            chunk = xhr.responseText.slice(start, i);
            start = i + 2;

            console.debug('[XHR-SSE] Found chunk:', JSON.stringify(chunk));

            if (chunk.length) {
                try {
                    const event = sseevent(chunk);
                    console.debug('[XHR-SSE] Dispatching event:', event.type, 'Data:', event.data);
                    eventTarget.dispatchEvent(event);
                } catch (error) {
                    console.error('[XHR-SSE] Error parsing SSE message:', error, 'Chunk:', chunk);
                }
            }
        }

        // Debug: Log any remaining text that hasn't been processed
        if (start < xhr.responseText.length) {
            const remaining = xhr.responseText.slice(start);
            console.debug('[XHR-SSE] Remaining unprocessed text:', JSON.stringify(remaining));
        }
    };

    xhr.onloadend = () => {
        // Only dispatch close if we haven't already dispatched an error
        if (xhr.status < 400) {
            eventTarget.dispatchEvent(new CloseEvent('close'));
        }
    };

    if (opts.timeout) {
        xhr.timeout = opts.timeout;
    }

    xhr.ontimeout = () => {
        eventTarget.dispatchEvent(new CloseEvent('error', {
            bubbles: false,
            cancelable: false,
            reason: 'Network request timed out'
        }));
    };

    xhr.onerror = () => {
        eventTarget.dispatchEvent(new CloseEvent('error', {
            bubbles: false,
            cancelable: false,
            reason: xhr.responseText || `Network request failed (Status: ${xhr.status})`
        }));
    };

    xhr.onabort = () => {
        eventTarget.dispatchEvent(new CloseEvent('error', {
            bubbles: false,
            cancelable: false,
            reason: 'Network request aborted'
        }));
    };

    // Add a close method to match EventSource API
    (eventTarget as any).close = () => {
        xhr.abort();
    };

    // Send the request with proper body handling
    const body = opts.body ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : null;
    xhr.send(body);
    return eventTarget;
}

// Export a type that matches the EventSource interface for compatibility
export interface IEventSource extends EventTarget {
    close(): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}
