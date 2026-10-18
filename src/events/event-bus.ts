/**
 * Event Bus Implementation
 * Typed asynchronous event bus for distributed pub/sub within application services
 */
import { IEventBus } from '../services/interfaces';

type EventHandler<T = unknown> = (payload: T) => void;

export class AppEventBus implements IEventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  public publish<T>(eventType: string, payload: T): void {
    const set = this.handlers.get(eventType);
    if (set) {
      set.forEach((handler) => {
        try {
          handler(payload);
        } catch {
          // Prevent handler errors from crashing event bus
        }
      });
    }
  }

  public subscribe<T>(eventType: string, handler: (payload: T) => void): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    const set = this.handlers.get(eventType)!;
    const castedHandler = handler as EventHandler;
    set.add(castedHandler);

    return () => {
      set.delete(castedHandler);
      if (set.size === 0) {
        this.handlers.delete(eventType);
      }
    };
  }
}

export const ELECTION_EVENTS = {
  VOTE_CAST: 'ELECTION:VOTE_CAST',
  METRICS_UPDATE: 'ELECTION:METRICS_UPDATE',
  ALERT_GENERATED: 'ELECTION:ALERT_GENERATED',
  ALERT_STATUS_CHANGED: 'ELECTION:ALERT_STATUS_CHANGED',
  STATE_TRANSITION: 'ELECTION:STATE_TRANSITION',
  VALIDATOR_STATUS_CHANGED: 'ELECTION:VALIDATOR_STATUS_CHANGED',
  EMERGENCY_LOCKDOWN: 'ELECTION:EMERGENCY_LOCKDOWN',
  SIMULATION_TRIGGERED: 'ELECTION:SIMULATION_TRIGGERED',
} as const;

export type ElectionEventType = typeof ELECTION_EVENTS[keyof typeof ELECTION_EVENTS];

export const globalEventBus = new AppEventBus();
