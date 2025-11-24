const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// WebSocket server for Minecraft plugin connections
const wss = new WebSocket.Server({ server });

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected Minecraft servers
const connectedServers = new Map();
const authenticatedSessions = new Map();

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle Minecraft plugin connection
    socket.on('minecraft-connect', (data) => {
        const { serverId, serverName } = data;
        connectedServers.set(serverId, {
            socket: socket,
            serverName: serverName,
            connectedAt: new Date(),
            players: []
        });
        console.log(`Minecraft server connected: ${serverName} (${serverId})`);

        // Broadcast server connection to web clients
        socket.broadcast.emit('server-connected', {
            serverId,
            serverName,
            connectedAt: new Date()
        });
    });

    // Handle player list updates from Minecraft
    socket.on('player-update', (data) => {
        const { serverId, players } = data;
        if (connectedServers.has(serverId)) {
            connectedServers.get(serverId).players = players;

            // Broadcast to authenticated web clients
            socket.broadcast.emit('players-updated', {
                serverId,
                players
            });
        }
    });

    // Handle command execution from web interface
    socket.on('execute-command', (data) => {
        const { serverId, sessionId, command, params } = data;

        // Verify session is authenticated
        if (!authenticatedSessions.has(sessionId)) {
            socket.emit('command-error', { error: 'Not authenticated' });
            return;
        }

        // Send command to Minecraft server
        if (connectedServers.has(serverId)) {
            const serverSocket = connectedServers.get(serverId).socket;
            serverSocket.emit('web-command', {
                sessionId,
                command,
                params,
                timestamp: new Date()
            });
        } else {
            socket.emit('command-error', { error: 'Server not connected' });
        }
    });

    // Handle command responses from Minecraft
    socket.on('command-response', (data) => {
        const { sessionId, response, success } = data;
        socket.broadcast.emit('command-result', {
            sessionId,
            response,
            success,
            timestamp: new Date()
        });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        // Remove from connected servers if it was a Minecraft server
        for (const [serverId, serverData] of connectedServers.entries()) {
            if (serverData.socket === socket) {
                connectedServers.delete(serverId);
                console.log(`Minecraft server disconnected: ${serverData.serverName}`);

                // Notify web clients
                socket.broadcast.emit('server-disconnected', { serverId });
                break;
            }
        }
    });
});

// WebSocket connection handling for Minecraft plugin
wss.on('connection', (ws) => {
    console.log('Minecraft plugin connected via WebSocket');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('Received from Minecraft plugin:', data.type);

            switch (data.type) {
                case 'minecraft-connect':
                    const { serverId, serverName } = data;
                    connectedServers.set(serverId, {
                        socket: ws,
                        serverName: serverName,
                        connectedAt: new Date(),
                        players: [],
                        isWebSocket: true
                    });
                    console.log(`Minecraft server connected: ${serverName} (${serverId})`);

                    // Broadcast server connection to web clients
                    io.emit('server-connected', {
                        serverId,
                        serverName,
                        connectedAt: new Date()
                    });
                    break;

                case 'player-update':
                    const { serverId: playerServerId, players } = data;
                    if (connectedServers.has(playerServerId)) {
                        connectedServers.get(playerServerId).players = players;

                        // Broadcast to authenticated web clients
                        io.emit('players-updated', {
                            serverId: playerServerId,
                            players
                        });
                    }
                    break;

                case 'command-response':
                    const { sessionId, response, success } = data;
                    io.emit('command-result', {
                        sessionId,
                        response,
                        success,
                        timestamp: new Date()
                    });
                    break;
            }
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Minecraft plugin disconnected');

        // Remove from connected servers
        for (const [serverId, serverData] of connectedServers.entries()) {
            if (serverData.socket === ws) {
                connectedServers.delete(serverId);
                console.log(`Minecraft server disconnected: ${serverData.serverName}`);

                // Notify web clients
                io.emit('server-disconnected', { serverId });
                break;
            }
        }
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Authentication endpoint
app.post('/api/authenticate', (req, res) => {
    const { password } = req.body;

    // Simple password check (in production, use proper authentication)
    const correctPassword = process.env.ADMIN_PASSWORD || '252622';

    if (password === correctPassword) {
        const sessionId = generateSessionId();
        authenticatedSessions.set(sessionId, {
            authenticatedAt: new Date(),
            lastActivity: new Date()
        });

        res.json({
            success: true,
            sessionId,
            message: 'Authentication successful'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid password'
        });
    }
});

// Get connected servers
app.get('/api/servers', (req, res) => {
    const servers = Array.from(connectedServers.entries()).map(([serverId, data]) => ({
        serverId,
        serverName: data.serverName,
        connectedAt: data.connectedAt,
        playerCount: data.players.length
    }));

    res.json({ servers });
});

// Get players for a server
app.get('/api/servers/:serverId/players', (req, res) => {
    const { serverId } = req.params;

    if (!connectedServers.has(serverId)) {
        return res.status(404).json({ error: 'Server not found' });
    }

    const players = connectedServers.get(serverId).players;
    res.json({ players });
});

// Execute command endpoint
app.post('/api/command', (req, res) => {
    const { sessionId, serverId, command, params } = req.body;

    // Verify authentication
    if (!authenticatedSessions.has(sessionId)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    // Update last activity
    authenticatedSessions.get(sessionId).lastActivity = new Date();

    // Send command to Minecraft server
    if (connectedServers.has(serverId)) {
        const serverData = connectedServers.get(serverId);
        const message = {
            type: 'web-command',
            sessionId,
            command,
            params,
            timestamp: new Date()
        };

        if (serverData.isWebSocket) {
            // Send via WebSocket
            serverData.socket.send(JSON.stringify(message));
        } else {
            // Send via Socket.IO
            serverData.socket.emit('web-command', message);
        }

        res.json({ success: true, message: 'Command sent' });
    } else {
        res.status(404).json({ error: 'Server not connected' });
    }
});

// Select player endpoint
app.post('/api/select-player', (req, res) => {
    const { sessionId, serverId, playerName } = req.body;

    // Verify authentication
    if (!authenticatedSessions.has(sessionId)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    // Send select command to Minecraft server
    if (connectedServers.has(serverId)) {
        const serverData = connectedServers.get(serverId);
        const message = {
            type: 'web-command',
            sessionId,
            command: 'select-player',
            params: { playerName },
            timestamp: new Date()
        };

        if (serverData.isWebSocket) {
            // Send via WebSocket
            serverData.socket.send(JSON.stringify(message));
        } else {
            // Send via Socket.IO
            serverData.socket.emit('web-command', message);
        }

        res.json({ success: true, message: `Selected player: ${playerName}` });
    } else {
        res.status(404).json({ error: 'Server not connected' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        connectedServers: connectedServers.size,
        authenticatedSessions: authenticatedSessions.size,
        timestamp: new Date()
    });
});

// Serve the main web interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Generate session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Clean up expired sessions (run every 5 minutes)
setInterval(() => {
    const now = new Date();
    const expiryTime = 30 * 60 * 1000; // 30 minutes

    for (const [sessionId, sessionData] of authenticatedSessions.entries()) {
        if (now - sessionData.lastActivity > expiryTime) {
            authenticatedSessions.delete(sessionId);
            console.log(`Expired session: ${sessionId}`);
        }
    }
}, 5 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Abracadabra Web Server running on port ${PORT}`);
    console.log(`Access the web interface at: http://localhost:${PORT}`);
});

module.exports = app;