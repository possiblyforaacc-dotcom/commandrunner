console.log('=== ABRACADABRA WEB SERVER STARTING ===');
console.log('Node.js version:', process.version);
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', process.env.PORT || 3000);

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

console.log('Initializing Express app...');
const app = express();

console.log('Creating HTTP server...');
const server = http.createServer(app);

console.log('Setting up Socket.IO...');
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// WebSocket server for Minecraft plugin connections
console.log('Setting up WebSocket server for Minecraft connections...');
const wss = new WebSocket.Server({ server });

// Security middleware
console.log('Applying security middleware...');
app.use(helmet());
app.use(cors());

// Rate limiting
console.log('Setting up rate limiting...');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Middleware
console.log('Setting up middleware...');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected Minecraft servers
const connectedServers = new Map();
const authenticatedSessions = new Map();

console.log('Data structures initialized');
console.log('Connected servers map created');
console.log('Authenticated sessions map created');

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
    console.log('=== MINECRAFT PLUGIN WEBSOCKET CONNECTION ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('WebSocket connection established');
    console.log('Total connected servers before:', connectedServers.size);

    ws.on('message', (message) => {
        try {
            const rawMessage = message.toString();
            console.log('=== WEBSOCKET MESSAGE RECEIVED ===');
            console.log('Timestamp:', new Date().toISOString());
            console.log('Raw message:', rawMessage);

            const data = JSON.parse(rawMessage);
            console.log('Parsed message type:', data.type);
            console.log('Full parsed data:', JSON.stringify(data, null, 2));

            switch (data.type) {
                case 'minecraft-connect':
                    console.log('=== MINECRAFT SERVER CONNECTING ===');
                    const { serverId, serverName } = data;
                    console.log('Server ID:', serverId);
                    console.log('Server Name:', serverName);

                    connectedServers.set(serverId, {
                        socket: ws,
                        serverName: serverName,
                        connectedAt: new Date(),
                        players: [],
                        isWebSocket: true
                    });
                    console.log(`✅ Minecraft server connected: ${serverName} (${serverId})`);
                    console.log('Total connected servers now:', connectedServers.size);

                    // Broadcast server connection to web clients
                    console.log('Broadcasting server connection to web clients...');
                    io.emit('server-connected', {
                        serverId,
                        serverName,
                        connectedAt: new Date()
                    });
                    break;

                case 'player-update':
                    console.log('=== PLAYER UPDATE RECEIVED ===');
                    const { serverId: playerServerId, players } = data;
                    console.log('Server ID:', playerServerId);
                    console.log('Player count:', players.length);
                    console.log('Players:', JSON.stringify(players, null, 2));

                    if (connectedServers.has(playerServerId)) {
                        connectedServers.get(playerServerId).players = players;
                        console.log('✅ Player list updated for server:', playerServerId);

                        // Broadcast to authenticated web clients
                        console.log('Broadcasting player update to web clients...');
                        io.emit('players-updated', {
                            serverId: playerServerId,
                            players
                        });
                    } else {
                        console.log('❌ Server not found for player update:', playerServerId);
                    }
                    break;

                case 'command-response':
                    console.log('=== COMMAND RESPONSE RECEIVED ===');
                    const { sessionId, response, success } = data;
                    console.log('Session ID:', sessionId);
                    console.log('Success:', success);
                    console.log('Response:', response);

                    console.log('Broadcasting command response to web clients...');
                    io.emit('command-result', {
                        sessionId,
                        response,
                        success,
                        timestamp: new Date()
                    });
                    break;

                default:
                    console.log('⚠️ UNKNOWN MESSAGE TYPE:', data.type);
                    console.log('Full message:', JSON.stringify(data, null, 2));
            }
            console.log('=== WEBSOCKET MESSAGE PROCESSED ===\n');
        } catch (error) {
            console.error('❌ ERROR PARSING WEBSOCKET MESSAGE:', error);
            console.error('Raw message that caused error:', message.toString());
        }
    });

    ws.on('close', () => {
        console.log('=== MINECRAFT PLUGIN WEBSOCKET DISCONNECTED ===');
        console.log('Timestamp:', new Date().toISOString());

        // Remove from connected servers
        for (const [serverId, serverData] of connectedServers.entries()) {
            if (serverData.socket === ws) {
                connectedServers.delete(serverId);
                console.log(`❌ Minecraft server disconnected: ${serverData.serverName} (${serverId})`);
                console.log('Total connected servers now:', connectedServers.size);

                // Notify web clients
                console.log('Notifying web clients of server disconnection...');
                io.emit('server-disconnected', { serverId });
                break;
            }
        }
        console.log('=== DISCONNECTION HANDLED ===\n');
    });

    ws.on('error', (error) => {
        console.error('❌ WEBSOCKET ERROR:', error);
        console.error('Error details:', error.message);
    });
});

// Authentication endpoint
app.post('/api/authenticate', (req, res) => {
    console.log('=== AUTHENTICATION ATTEMPT ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('IP Address:', req.ip);
    console.log('User Agent:', req.get('User-Agent'));
    console.log('Request Method:', req.method);
    console.log('Request URL:', req.url);

    const { password } = req.body;
    console.log('Password provided:', password ? 'YES (length: ' + password.length + ')' : 'NO');
    console.log('Password value:', password || 'empty');

    // Simple password check (in production, use proper authentication)
    const correctPassword = process.env.ADMIN_PASSWORD || 'Himgyiocc1#';
    console.log('Expected password: Himgyiocc1#');
    console.log('Environment password set:', !!process.env.ADMIN_PASSWORD);
    console.log('Password match:', password === correctPassword ? 'YES' : 'NO');

    if (password === correctPassword) {
        const sessionId = generateSessionId();
        authenticatedSessions.set(sessionId, {
            authenticatedAt: new Date(),
            lastActivity: new Date()
        });

        console.log('✅ AUTHENTICATION SUCCESSFUL');
        console.log('Generated session ID:', sessionId);
        console.log('Session created at:', new Date().toISOString());
        console.log('Total authenticated sessions:', authenticatedSessions.size);

        const response = {
            success: true,
            sessionId,
            message: 'Authentication successful'
        };
        console.log('Response:', JSON.stringify(response, null, 2));
        res.json(response);
    } else {
        console.log('❌ AUTHENTICATION FAILED - INVALID PASSWORD');
        console.log('Provided password was:', password || 'empty');
        console.log('Expected password was: Himgyiocc1#');

        const response = {
            success: false,
            message: 'Invalid password'
        };
        console.log('Response:', JSON.stringify(response, null, 2));
        res.status(401).json(response);
    }
    console.log('=== AUTHENTICATION ATTEMPT END ===\n');
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
    console.log('=== COMMAND EXECUTION ATTEMPT ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('IP Address:', req.ip);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    const { sessionId, serverId, command, params } = req.body;
    console.log('Session ID:', sessionId);
    console.log('Server ID:', serverId);
    console.log('Command:', command);
    console.log('Parameters:', JSON.stringify(params, null, 2));

    // Verify authentication
    if (!authenticatedSessions.has(sessionId)) {
        console.log('❌ AUTHENTICATION FAILED - INVALID SESSION');
        console.log('Available sessions:', Array.from(authenticatedSessions.keys()));
        return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log('✅ SESSION AUTHENTICATED');
    // Update last activity
    authenticatedSessions.get(sessionId).lastActivity = new Date();

    // Send command to Minecraft server
    if (connectedServers.has(serverId)) {
        const serverData = connectedServers.get(serverId);
        console.log('✅ SERVER FOUND:', serverData.serverName);
        console.log('Server connection type:', serverData.isWebSocket ? 'WebSocket' : 'Socket.IO');

        const message = {
            type: 'web-command',
            sessionId,
            command,
            params,
            timestamp: new Date()
        };

        console.log('Sending message to Minecraft server:', JSON.stringify(message, null, 2));

        if (serverData.isWebSocket) {
            // Send via WebSocket
            console.log('Sending via WebSocket...');
            serverData.socket.send(JSON.stringify(message));
        } else {
            // Send via Socket.IO
            console.log('Sending via Socket.IO...');
            serverData.socket.emit('web-command', message);
        }

        console.log('✅ COMMAND SENT SUCCESSFULLY');
        const response = { success: true, message: 'Command sent' };
        console.log('Response:', JSON.stringify(response, null, 2));
        res.json(response);
    } else {
        console.log('❌ SERVER NOT CONNECTED');
        console.log('Available servers:', Array.from(connectedServers.keys()));
        res.status(404).json({ error: 'Server not connected' });
    }
    console.log('=== COMMAND EXECUTION END ===\n');
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
    console.log('=== HEALTH CHECK REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('IP Address:', req.ip);

    const healthData = {
        status: 'healthy',
        connectedServers: connectedServers.size,
        authenticatedSessions: authenticatedSessions.size,
        timestamp: new Date(),
        serverList: Array.from(connectedServers.keys()),
        sessionList: Array.from(authenticatedSessions.keys())
    };

    console.log('Health data:', JSON.stringify(healthData, null, 2));
    res.json(healthData);
    console.log('=== HEALTH CHECK RESPONSE SENT ===\n');
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
console.log('=== STARTING SERVER ===');
console.log('Configured port:', PORT);
console.log('Environment port:', process.env.PORT || 'not set (using default 3000)');

server.listen(PORT, () => {
    console.log('✅ SERVER STARTED SUCCESSFULLY');
    console.log('Timestamp:', new Date().toISOString());
    console.log(`🚀 Abracadabra Web Server running on port ${PORT}`);
    console.log(`🌐 Access the web interface at: http://localhost:${PORT}`);
    console.log(`🔐 Authentication password: Himgyiocc1#`);
    console.log('=== SERVER READY ===\n');
});

module.exports = app;