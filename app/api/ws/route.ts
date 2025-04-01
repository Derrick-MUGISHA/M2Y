import type { NextRequest } from "next/server"
import { WebSocketServer } from "ws"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Store active connections
const clients = new Map()

// Initialize WebSocket server (this would be done once)
let wss: WebSocketServer

if (!wss) {
  wss = new WebSocketServer({ noServer: true })

  wss.on("connection", (ws, userId) => {
    // Store the connection with the user ID
    clients.set(userId, ws)

    ws.on("message", (message) => {
      try {
        const { type, data } = JSON.parse(message.toString())

        // Handle different message types
        switch (type) {
          case "user_status_changed":
            // Broadcast status change to all connected clients
            broadcastToAll({
              type: "user_status_changed",
              data: {
                userId,
                status: data.status,
              },
            })
            break

          case "message_received":
            // Send to specific user
            if (data.receiverId && clients.has(data.receiverId)) {
              sendToUser(data.receiverId, {
                type: "message_received",
                data: {
                  ...data,
                  senderId: userId,
                },
              })
            }
            break

          case "message_read":
            // Notify sender that message was read
            if (data.senderId && clients.has(data.senderId)) {
              sendToUser(data.senderId, {
                type: "message_read",
                data: {
                  messageId: data.messageId,
                  readBy: userId,
                },
              })
            }
            break
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error)
      }
    })

    ws.on("close", () => {
      // Remove the connection when closed
      clients.delete(userId)

      // Notify others that user is offline
      broadcastToAll({
        type: "user_status_changed",
        data: {
          userId,
          status: "offline",
        },
      })
    })
  })
}

// Helper function to send message to specific user
function sendToUser(userId: string, message: any) {
  const client = clients.get(userId)
  if (client && client.readyState === WebSocketServer.OPEN) {
    client.send(JSON.stringify(message))
  }
}

// Helper function to broadcast to all connected clients
function broadcastToAll(message: any) {
  clients.forEach((client) => {
    if (client.readyState === WebSocketServer.OPEN) {
      client.send(JSON.stringify(message))
    }
  })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 })
  }

  // This is a WebSocket upgrade request
  const { socket: res } = req as any

  const userId = session.user.id

  // Handle the WebSocket upgrade
  const upgrade = await new Promise((resolve) => {
    ;(res as any).socket.server.ws = (res as any).socket.server.ws || wss

    if (!(res as any).socket.server.wss) {
      // This is the first WebSocket connection, set up the upgrade handler
      ;(res as any).socket.server.wss = true(
        // Handle the upgrade
        res as any,
      ).socket.server.on("upgrade", (request: any, socket: any, head: any) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, userId)
        })
      })
    }

    resolve(true)
  })

  if (upgrade) {
    // Return a response to acknowledge the upgrade
    return new Response(null, { status: 101 })
  }

  return new Response("WebSocket upgrade failed", { status: 500 })
}

