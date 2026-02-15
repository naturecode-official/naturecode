// Real-time collaboration system for team projects
// Supports WebSocket-based collaboration, live editing, chat, and notifications

import { WebSocketServer } from "ws";
import { createServer } from "http";
import { TeamMemberManager } from "./member-manager.js";
import { TeamProjectManager } from "./project-manager.js";
import crypto from "crypto";
import EventEmitter from "events";

export class RealtimeCollaborationServer extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      port: config.port || 8080,
      host: config.host || "localhost",
      memberManager: config.memberManager || new TeamMemberManager(),
      projectManager: config.projectManager || new TeamProjectManager(),
      maxConnections: config.maxConnections || 100,
      heartbeatInterval: config.heartbeatInterval || 30000, // 30 seconds
      ...config,
    };

    this.wss = null;
    this.httpServer = null;
    this.clients = new Map(); // clientId -> { ws, memberId, projectId, roomId }
    this.rooms = new Map(); // roomId -> Set of clientIds
    this.projectRooms = new Map(); // projectId -> roomId
    this.collaborationSessions = new Map(); // sessionId -> collaboration data

    this.messageHandlers = {
      auth: this.handleAuth.bind(this),
      join: this.handleJoin.bind(this),
      leave: this.handleLeave.bind(this),
      chat: this.handleChat.bind(this),
      edit: this.handleEdit.bind(this),
      cursor: this.handleCursor.bind(this),
      presence: this.handlePresence.bind(this),
      notification: this.handleNotification.bind(this),
      heartbeat: this.handleHeartbeat.bind(this),
    };
  }

  async initialize() {
    try {
      // Initialize member and project managers
      await this.config.memberManager.initialize();
      await this.config.projectManager.initialize();

      // Create HTTP server for WebSocket
      this.httpServer = createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            service: "naturecode-realtime-collaboration",
            version: "1.0.0",
            connections: this.clients.size,
            rooms: this.rooms.size,
          }),
        );
      });

      // Create WebSocket server
      this.wss = new WebSocketServer({ server: this.httpServer });

      // Set up WebSocket event handlers
      this.wss.on("connection", this.handleConnection.bind(this));

      // Start heartbeat interval
      this.startHeartbeat();

      this.emit("initialized", { port: this.config.port });
      return true;
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.config.port, this.config.host, () => {
        console.log(
          `Realtime collaboration server running on ws://${this.config.host}:${this.config.port}`,
        );
        this.emit("started", {
          port: this.config.port,
          host: this.config.host,
        });
        resolve();
      });

      this.httpServer.on("error", (error) => {
        this.emit("error", error);
        reject(error);
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      // Close all client connections
      for (const [clientId, client] of this.clients) {
        if (client.ws.readyState === 1) {
          // OPEN
          client.ws.close(1000, "Server shutting down");
        }
      }

      // Clear intervals
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // Close WebSocket server
      if (this.wss) {
        this.wss.close(() => {
          // Close HTTP server
          if (this.httpServer) {
            this.httpServer.close(() => {
              this.emit("stopped");
              resolve();
            });
          } else {
            this.emit("stopped");
            resolve();
          }
        });
      } else {
        this.emit("stopped");
        resolve();
      }
    });
  }

  // Connection Management

  handleConnection(ws, req) {
    const clientId = this.generateClientId();
    const client = {
      id: clientId,
      ws,
      memberId: null,
      projectId: null,
      roomId: null,
      authenticated: false,
      lastActivity: Date.now(),
      ip: req.socket.remoteAddress,
    };

    this.clients.set(clientId, client);

    // Set up message handler
    ws.on("message", (data) => {
      this.handleMessage(clientId, data);
    });

    // Set up close handler
    ws.on("close", (code, reason) => {
      this.handleDisconnect(clientId, code, reason);
    });

    // Set up error handler
    ws.on("error", (error) => {
      this.handleError(clientId, error);
    });

    // Send welcome message
    this.sendToClient(clientId, {
      type: "welcome",
      clientId,
      timestamp: Date.now(),
      serverInfo: {
        name: "NatureCode Collaboration",
        version: "1.0.0",
        features: ["chat", "editing", "presence", "notifications"],
      },
    });

    this.emit("clientConnected", { clientId, ip: client.ip });
  }

  handleDisconnect(clientId, code, reason) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from room
    if (client.roomId) {
      this.leaveRoom(clientId, client.roomId);
    }

    // Notify others in the room
    if (client.roomId && client.memberId) {
      this.broadcastToRoom(
        client.roomId,
        {
          type: "presence",
          action: "left",
          memberId: client.memberId,
          clientId,
          timestamp: Date.now(),
        },
        clientId,
      );
    }

    // Remove client
    this.clients.delete(clientId);

    this.emit("clientDisconnected", {
      clientId,
      code,
      reason,
      memberId: client.memberId,
    });
  }

  handleError(clientId, error) {
    this.emit("clientError", { clientId, error });

    // Close connection on error
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === 1) {
      client.ws.close(1011, "Internal error");
    }
  }

  // Message Handling

  async handleMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message = JSON.parse(data.toString());

      // Update last activity
      client.lastActivity = Date.now();

      // Validate message
      if (!message.type) {
        throw new Error("Message type is required");
      }

      // Handle message based on type
      const handler = this.messageHandlers[message.type];
      if (handler) {
        await handler(clientId, message);
      } else {
        throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.sendToClient(clientId, {
        type: "error",
        error: error.message,
        timestamp: Date.now(),
      });
      this.emit("messageError", { clientId, error });
    }
  }

  // Message Handlers

  async handleAuth(clientId, message) {
    const { token, memberId, projectId } = message;

    // Validate authentication
    // In a real implementation, you would validate JWT tokens or session tokens
    // For now, we'll accept any token for demo purposes

    const client = this.clients.get(clientId);
    client.memberId = memberId;
    client.authenticated = true;

    // Get member info
    const member = await this.config.memberManager.getMember(memberId);

    this.sendToClient(clientId, {
      type: "auth",
      success: true,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
      },
      timestamp: Date.now(),
    });

    this.emit("clientAuthenticated", { clientId, memberId, member });
  }

  async handleJoin(clientId, message) {
    const { projectId, roomType = "project" } = message;
    const client = this.clients.get(clientId);

    if (!client.authenticated) {
      throw new Error("Authentication required");
    }

    // Validate project access
    const project = await this.config.projectManager.getProject(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if member has access to project
    const hasAccess = project.members.some(
      (m) => m.memberId === client.memberId,
    );
    if (!hasAccess) {
      throw new Error("Access denied to project");
    }

    // Create or get room for project
    let roomId = this.projectRooms.get(projectId);
    if (!roomId) {
      roomId = `room_${projectId}`;
      this.projectRooms.set(projectId, roomId);
      this.rooms.set(roomId, new Set());
    }

    // Join room
    this.joinRoom(clientId, roomId);
    client.projectId = projectId;
    client.roomId = roomId;

    // Get room members
    const roomMembers = this.getRoomMembers(roomId);

    // Send join confirmation
    this.sendToClient(clientId, {
      type: "join",
      success: true,
      projectId,
      roomId,
      roomType,
      members: roomMembers.filter((m) => m.clientId !== clientId),
      timestamp: Date.now(),
    });

    // Notify others in the room
    this.broadcastToRoom(
      roomId,
      {
        type: "presence",
        action: "joined",
        memberId: client.memberId,
        clientId,
        timestamp: Date.now(),
      },
      clientId,
    );

    this.emit("clientJoinedRoom", {
      clientId,
      memberId: client.memberId,
      projectId,
      roomId,
    });
  }

  async handleLeave(clientId, message) {
    const client = this.clients.get(clientId);

    if (!client.roomId) {
      throw new Error("Not in a room");
    }

    const roomId = client.roomId;

    // Leave room
    this.leaveRoom(clientId, roomId);

    // Clear room reference
    client.projectId = null;
    client.roomId = null;

    // Send leave confirmation
    this.sendToClient(clientId, {
      type: "leave",
      success: true,
      roomId,
      timestamp: Date.now(),
    });

    // Notify others in the room
    this.broadcastToRoom(roomId, {
      type: "presence",
      action: "left",
      memberId: client.memberId,
      clientId,
      timestamp: Date.now(),
    });

    this.emit("clientLeftRoom", {
      clientId,
      memberId: client.memberId,
      roomId,
    });
  }

  async handleChat(clientId, message) {
    const { content, roomId } = message;
    const client = this.clients.get(clientId);

    if (!client.authenticated) {
      throw new Error("Authentication required");
    }

    // Validate room access
    if (roomId && client.roomId !== roomId) {
      throw new Error("Not in specified room");
    }

    const targetRoomId = roomId || client.roomId;
    if (!targetRoomId) {
      throw new Error("Not in a room");
    }

    // Create chat message
    const chatMessage = {
      type: "chat",
      messageId: this.generateMessageId(),
      content,
      sender: {
        memberId: client.memberId,
        clientId,
      },
      timestamp: Date.now(),
      roomId: targetRoomId,
    };

    // Broadcast to room
    this.broadcastToRoom(targetRoomId, chatMessage);

    // Store chat message (in a real implementation, you'd save to database)
    this.emit("chatMessage", chatMessage);
  }

  async handleEdit(clientId, message) {
    const { filePath, changes, roomId } = message;
    const client = this.clients.get(clientId);

    if (!client.authenticated) {
      throw new Error("Authentication required");
    }

    // Validate room access
    if (roomId && client.roomId !== roomId) {
      throw new Error("Not in specified room");
    }

    const targetRoomId = roomId || client.roomId;
    if (!targetRoomId) {
      throw new Error("Not in a room");
    }

    // Create edit message
    const editMessage = {
      type: "edit",
      editId: this.generateEditId(),
      filePath,
      changes,
      sender: {
        memberId: client.memberId,
        clientId,
      },
      timestamp: Date.now(),
      roomId: targetRoomId,
    };

    // Broadcast to room (except sender)
    this.broadcastToRoom(targetRoomId, editMessage, clientId);

    // Store edit (in a real implementation, you'd save to database)
    this.emit("editMessage", editMessage);
  }

  async handleCursor(clientId, message) {
    const { position, filePath, roomId } = message;
    const client = this.clients.get(clientId);

    if (!client.authenticated) {
      throw new Error("Authentication required");
    }

    // Validate room access
    if (roomId && client.roomId !== roomId) {
      throw new Error("Not in specified room");
    }

    const targetRoomId = roomId || client.roomId;
    if (!targetRoomId) {
      throw new Error("Not in a room");
    }

    // Create cursor message
    const cursorMessage = {
      type: "cursor",
      position,
      filePath,
      sender: {
        memberId: client.memberId,
        clientId,
      },
      timestamp: Date.now(),
      roomId: targetRoomId,
    };

    // Broadcast to room (except sender)
    this.broadcastToRoom(targetRoomId, cursorMessage, clientId);
  }

  async handlePresence(clientId, message) {
    const { status, roomId } = message;
    const client = this.clients.get(clientId);

    if (!client.authenticated) {
      throw new Error("Authentication required");
    }

    // Validate room access
    if (roomId && client.roomId !== roomId) {
      throw new Error("Not in specified room");
    }

    const targetRoomId = roomId || client.roomId;
    if (!targetRoomId) {
      throw new Error("Not in a room");
    }

    // Create presence message
    const presenceMessage = {
      type: "presence",
      status,
      sender: {
        memberId: client.memberId,
        clientId,
      },
      timestamp: Date.now(),
      roomId: targetRoomId,
    };

    // Broadcast to room
    this.broadcastToRoom(targetRoomId, presenceMessage);
  }

  async handleNotification(clientId, message) {
    const { notification, roomId, targetMemberId } = message;
    const client = this.clients.get(clientId);

    if (!client.authenticated) {
      throw new Error("Authentication required");
    }

    // Create notification message
    const notificationMessage = {
      type: "notification",
      notificationId: this.generateNotificationId(),
      notification,
      sender: {
        memberId: client.memberId,
      },
      timestamp: Date.now(),
      roomId,
    };

    // Send to specific member or broadcast to room
    if (targetMemberId) {
      this.sendToMember(targetMemberId, notificationMessage);
    } else if (roomId) {
      this.broadcastToRoom(roomId, notificationMessage);
    } else {
      throw new Error("Either roomId or targetMemberId is required");
    }

    this.emit("notificationSent", notificationMessage);
  }

  async handleHeartbeat(clientId, message) {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastActivity = Date.now();

      this.sendToClient(clientId, {
        type: "heartbeat",
        timestamp: Date.now(),
      });
    }
  }

  // Room Management

  joinRoom(clientId, roomId) {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = new Set();
      this.rooms.set(roomId, room);
    }

    room.add(clientId);

    const client = this.clients.get(clientId);
    client.roomId = roomId;

    this.emit("roomJoined", { clientId, roomId });
  }

  leaveRoom(clientId, roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(clientId);

      // Clean up empty rooms
      if (room.size === 0) {
        this.rooms.delete(roomId);

        // Remove from projectRooms if it's a project room
        for (const [projectId, projRoomId] of this.projectRooms) {
          if (projRoomId === roomId) {
            this.projectRooms.delete(projectId);
            break;
          }
        }
      }
    }

    const client = this.clients.get(clientId);
    if (client && client.roomId === roomId) {
      client.roomId = null;
    }

    this.emit("roomLeft", { clientId, roomId });
  }

  getRoomMembers(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    const members = [];
    for (const clientId of room) {
      const client = this.clients.get(clientId);
      if (client && client.memberId) {
        members.push({
          clientId,
          memberId: client.memberId,
          authenticated: client.authenticated,
          lastActivity: client.lastActivity,
        });
      }
    }

    return members;
  }

  // Message Broadcasting

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === 1) {
      // OPEN
      client.ws.send(JSON.stringify(message));
    }
  }

  sendToMember(memberId, message) {
    for (const [clientId, client] of this.clients) {
      if (client.memberId === memberId && client.ws.readyState === 1) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  broadcastToRoom(roomId, message, excludeClientId = null) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const clientId of room) {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    }
  }

  broadcastToAll(message, excludeClientId = null) {
    for (const [clientId, client] of this.clients) {
      if (clientId !== excludeClientId && client.ws.readyState === 1) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  // Heartbeat Management

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, this.config.heartbeatInterval);
  }

  checkHeartbeats() {
    const now = Date.now();
    const timeout = this.config.heartbeatInterval * 2; // 2x interval

    for (const [clientId, client] of this.clients) {
      if (now - client.lastActivity > timeout) {
        console.log(`Client ${clientId} timed out, disconnecting`);
        if (client.ws.readyState === 1) {
          client.ws.close(1000, "Heartbeat timeout");
        }
      }
    }
  }

  // Utility Methods

  generateClientId() {
    return `client_${crypto.randomBytes(8).toString("hex")}`;
  }

  generateMessageId() {
    return `msg_${crypto.randomBytes(8).toString("hex")}`;
  }

  generateEditId() {
    return `edit_${crypto.randomBytes(8).toString("hex")}`;
  }

  generateNotificationId() {
    return `notif_${crypto.randomBytes(8).toString("hex")}`;
  }

  // Collaboration Session Management

  async createCollaborationSession(projectId, options = {}) {
    const sessionId = `session_${crypto.randomBytes(8).toString("hex")}`;

    const session = {
      id: sessionId,
      projectId,
      type: options.type || "code",
      status: "active",
      participants: new Set(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...options,
    };

    this.collaborationSessions.set(sessionId, session);

    this.emit("sessionCreated", session);
    return session;
  }

  async joinCollaborationSession(sessionId, memberId) {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    session.participants.add(memberId);
    session.updatedAt = Date.now();

    this.emit("sessionJoined", { sessionId, memberId });
    return session;
  }

  async leaveCollaborationSession(sessionId, memberId) {
    const session = this.collaborationSessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    session.participants.delete(memberId);
    session.updatedAt = Date.now();

    // Clean up empty sessions
    if (session.participants.size === 0) {
      this.collaborationSessions.delete(sessionId);
      this.emit("sessionEnded", session);
    } else {
      this.emit("sessionLeft", { sessionId, memberId });
    }

    return session;
  }

  // Statistics and Monitoring

  getStatistics() {
    return {
      totalClients: this.clients.size,
      authenticatedClients: Array.from(this.clients.values()).filter(
        (c) => c.authenticated,
      ).length,
      totalRooms: this.rooms.size,
      collaborationSessions: this.collaborationSessions.size,
      uptime: process.uptime(),
    };
  }

  getClientInfo(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return null;

    return {
      clientId,
      memberId: client.memberId,
      projectId: client.projectId,
      roomId: client.roomId,
      authenticated: client.authenticated,
      lastActivity: client.lastActivity,
      ip: client.ip,
    };
  }

  getRoomInfo(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    return {
      roomId,
      clientCount: room.size,
      clients: Array.from(room)
        .map((clientId) => this.getClientInfo(clientId))
        .filter(Boolean),
      createdAt: Date.now(), // In real implementation, store creation time
    };
  }
}

// Client-side collaboration helper
export class RealtimeCollaborationClient {
  constructor(config = {}) {
    this.config = {
      serverUrl: config.serverUrl || "ws://localhost:8080",
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 25000,
      ...config,
    };

    this.ws = null;
    this.clientId = null;
    this.memberId = null;
    this.projectId = null;
    this.roomId = null;
    this.authenticated = false;
    this.reconnectAttempts = 0;
    this.messageHandlers = new Map();
    this.eventListeners = new Map();
    this.heartbeatInterval = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.serverUrl);

        this.ws.onopen = () => {
          console.log("Connected to collaboration server");
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit("connected");
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          console.log(
            "Disconnected from collaboration server",
            event.code,
            event.reason,
          );
          this.stopHeartbeat();
          this.emit("disconnected", { code: event.code, reason: event.reason });
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.emit("error", error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, "Client disconnecting");
    }
    this.stopHeartbeat();
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      this.emit("reconnectFailed");
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`,
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("Reconnection failed:", error);
        this.handleReconnect();
      });
    }, this.config.reconnectInterval);
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);

      // Update last activity on heartbeat
      if (message.type === "heartbeat") {
        return;
      }

      // Call registered message handlers
      const handler = this.messageHandlers.get(message.type);
      if (handler) {
        handler(message);
      }

      // Emit event
      this.emit(message.type, message);
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Authentication

  async authenticate(token, memberId, projectId = null) {
    const message = {
      type: "auth",
      token,
      memberId,
      projectId,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageHandlers.delete("auth");
        reject(new Error("Authentication timeout"));
      }, 10000);

      this.messageHandlers.set("auth", (response) => {
        clearTimeout(timeout);
        this.messageHandlers.delete("auth");

        if (response.success) {
          this.memberId = memberId;
          this.projectId = projectId;
          this.authenticated = true;
          this.emit("authenticated", response);
          resolve(response);
        } else {
          reject(new Error(response.error || "Authentication failed"));
        }
      });

      if (!this.sendMessage(message)) {
        clearTimeout(timeout);
        this.messageHandlers.delete("auth");
        reject(new Error("Not connected to server"));
      }
    });
  }

  // Room Management

  async joinRoom(projectId, roomType = "project") {
    const message = {
      type: "join",
      projectId,
      roomType,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageHandlers.delete("join");
        reject(new Error("Join timeout"));
      }, 10000);

      this.messageHandlers.set("join", (response) => {
        clearTimeout(timeout);
        this.messageHandlers.delete("join");

        if (response.success) {
          this.projectId = projectId;
          this.roomId = response.roomId;
          this.emit("roomJoined", response);
          resolve(response);
        } else {
          reject(new Error(response.error || "Join failed"));
        }
      });

      if (!this.sendMessage(message)) {
        clearTimeout(timeout);
        this.messageHandlers.delete("join");
        reject(new Error("Not connected to server"));
      }
    });
  }

  async leaveRoom() {
    if (!this.roomId) {
      return Promise.resolve();
    }

    const message = {
      type: "leave",
      roomId: this.roomId,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageHandlers.delete("leave");
        reject(new Error("Leave timeout"));
      }, 5000);

      this.messageHandlers.set("leave", (response) => {
        clearTimeout(timeout);
        this.messageHandlers.delete("leave");

        if (response.success) {
          const oldRoomId = this.roomId;
          this.roomId = null;
          this.emit("roomLeft", { ...response, oldRoomId });
          resolve(response);
        } else {
          reject(new Error(response.error || "Leave failed"));
        }
      });

      if (!this.sendMessage(message)) {
        clearTimeout(timeout);
        this.messageHandlers.delete("leave");
        reject(new Error("Not connected to server"));
      }
    });
  }

  // Collaboration Features

  sendChatMessage(content) {
    return this.sendMessage({
      type: "chat",
      content,
      roomId: this.roomId,
    });
  }

  sendEdit(filePath, changes) {
    return this.sendMessage({
      type: "edit",
      filePath,
      changes,
      roomId: this.roomId,
    });
  }

  sendCursor(position, filePath) {
    return this.sendMessage({
      type: "cursor",
      position,
      filePath,
      roomId: this.roomId,
    });
  }

  sendPresence(status) {
    return this.sendMessage({
      type: "presence",
      status,
      roomId: this.roomId,
    });
  }

  sendNotification(notification, targetMemberId = null) {
    return this.sendMessage({
      type: "notification",
      notification,
      roomId: this.roomId,
      targetMemberId,
    });
  }

  // Event Handling

  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(handler);
  }

  off(event, handler) {
    if (!this.eventListeners.has(event)) return;

    const handlers = this.eventListeners.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Heartbeat

  startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      this.sendMessage({
        type: "heartbeat",
        timestamp: Date.now(),
      });
    }, this.config.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Utility Methods

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  isAuthenticated() {
    return this.authenticated;
  }

  isInRoom() {
    return !!this.roomId;
  }

  getStatus() {
    return {
      connected: this.isConnected(),
      authenticated: this.isAuthenticated(),
      inRoom: this.isInRoom(),
      memberId: this.memberId,
      projectId: this.projectId,
      roomId: this.roomId,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}
