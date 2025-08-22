export interface WebSocketMessage {
  type: 'processing_update' | 'status_change' | 'error' | 'complete';
  data: any;
  timestamp: number;
}

export interface ProcessingUpdate {
  processingId: string;
  step: string;
  progress: number;
  status: string;
  message?: string;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, ((message: WebSocketMessage) => void)[]> = new Map();
  private isConnecting = false;

  constructor(private url: string) {}

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(`${this.url}?token=${token}`);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      const token = localStorage.getItem('authToken');
      if (token) {
        this.connect(token).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.listeners.clear();
  }

  subscribe(type: string, callback: (message: WebSocketMessage) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private handleMessage(message: WebSocketMessage) {
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in WebSocket message handler:', error);
        }
      });
    }
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // Subscribe to processing updates for a specific processing ID
  subscribeToProcessing(processingId: string, callback: (update: ProcessingUpdate) => void) {
    return this.subscribe('processing_update', (message) => {
      if (message.data.processingId === processingId) {
        callback(message.data);
      }
    });
  }

  // Subscribe to status changes
  subscribeToStatusChanges(callback: (update: ProcessingUpdate) => void) {
    return this.subscribe('status_change', (message) => {
      callback(message.data);
    });
  }

  // Subscribe to errors
  subscribeToErrors(callback: (error: any) => void) {
    return this.subscribe('error', (message) => {
      callback(message.data);
    });
  }

  // Subscribe to completion events
  subscribeToCompletion(callback: (result: any) => void) {
    return this.subscribe('complete', (message) => {
      callback(message.data);
    });
  }
}

// Create singleton instance
const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
export const websocketService = new WebSocketService(wsUrl); 