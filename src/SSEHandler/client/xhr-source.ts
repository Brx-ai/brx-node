/**
 * XhrSource - A custom EventSource-like implementation using XMLHttpRequest
 * This allows for POST requests with SSE, which is not supported by the native EventSource
 * Based on the implementation by Alexander Solovyov: https://solovyov.net/blog/2023/sse-post/
 */

/**
 * Parse an SSE message into a MessageEvent
 */
function sseevent(message: string): MessageEvent {
    let type = 'message', start = 0;
    if (message.startsWith('event: ')) {
        start = message.indexOf('\n');
        type = message.slice(7, start);
    }

    // Handle data field properly
    const dataStart = message.indexOf('data: ');
    if (dataStart !== -1) {
        start = dataStart + 6; // Length of 'data: '
        let data = message.slice(start).trim();
        return new MessageEvent(type, { data: data });
    }

    // Fallback for malformed messages
    start = message.indexOf(': ', start) + 2;
    let data = message.slice(start, message.length);
    return new MessageEvent(type, { data: data });
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
                eventTarget.dispatchEvent(new Event('open', {
                    bubbles: false,
                    cancelable: false,
                }));
            } else if (xhr.status >= 400) {
                eventTarget.dispatchEvent(new CloseEvent('error', {
                    bubbles: false,
                    cancelable: false,
                    reason: `HTTP ${xhr.status}: ${xhr.statusText}`
                }));
                return;
            }
        }

        // Process SSE messages
        var i, chunk;
        while ((i = xhr.responseText.indexOf('\n\n', start)) >= 0) {
            chunk = xhr.responseText.slice(start, i);
            start = i + 2;
            if (chunk.length) {
                try {
                    eventTarget.dispatchEvent(sseevent(chunk));
                } catch (error) {
                    console.error('Error parsing SSE message:', error, 'Chunk:', chunk);
                }
            }
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
