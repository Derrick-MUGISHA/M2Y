"use client"

import { useState, useEffect } from "react"

// Define event types
export type EventType = "message_received" | "message_read" | "user_status_changed" | "notification_received"

// Simple event emitter for client-side events
class EventEmitter {
  private events: Record<string, Function[]> = {}

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(listener)
    return () => this.off(event, listener)
  }

  off(event: string, listener: Function) {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter((l) => l !== listener)
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return
    this.events[event].forEach((listener) => listener(...args))
  }
}

// Singleton event emitter
const eventEmitter = new EventEmitter()

// Send an event (in a real app, this would send to a server)
export const sendEvent = (type: EventType, data: any) => {
  // In a real implementation, this would send to a server
  // For now, we'll just emit locally for demo purposes
  setTimeout(() => {
    eventEmitter.emit(type, data)
  }, 100) // Simulate network delay
}

// Hook for subscribing to events
export function useRealTimeEvent<T>(eventType: EventType, callback: (data: T) => void) {
  useEffect(() => {
    const unsubscribe = eventEmitter.on(eventType, callback)
    return unsubscribe
  }, [eventType, callback])
}

// Hook for tracking user's active status
export function useActiveStatus() {
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    // Set user as active when the component mounts
    setIsActive(true)

    // Set up event listeners for user activity/inactivity
    const activityEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"]
    let inactivityTimeout: NodeJS.Timeout

    const resetInactivityTimer = () => {
      if (!isActive) {
        setIsActive(true)
      }

      clearTimeout(inactivityTimeout)
      inactivityTimeout = setTimeout(() => {
        setIsActive(false)
      }, 300000) // 5 minutes of inactivity
    }

    // Initialize the timer
    resetInactivityTimer()

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer)
    })

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetInactivityTimer)
      })
      clearTimeout(inactivityTimeout)
    }
  }, [isActive])

  return isActive
}

