# 🚀 Abracadabra Web Admin Interface

A stunning, comprehensive web-based admin interface for the Abracadabra Minecraft plugin with a breathtaking galaxy background and full command execution capabilities.

## ✨ Features

### 🌌 Visual Experience
- **800+ Twinkling Stars** with varied sizes and colors
- **Multiple Nebula Layers** with cosmic gradients
- **Cosmic Dust Particles** with drifting animations
- **Rotating Galaxy Arms** that slowly spin
- **Frequent Shooting Stars** every 3 seconds
- **Deep Visual Depth** with multiple z-layers

### 🎮 Complete Command System
- **20+ Command Categories** with 100+ individual commands
- **Real-time Player Selection** with live updates
- **Quick Action Buttons** for common admin tasks
- **Amount Selection** for spawn commands
- **Confirmation Dialogs** for destructive actions

### 👥 Advanced Player Management
- **Live Player List** with real-time updates
- **One-Click Player Selection** from dropdown
- **Quick Actions**: Heal, Feed, TP, Smite, Kick, Ban
- **Refresh Button** for instant player list updates

### ⚡ Command Categories
- **Main Menu** - All category access
- **Dupe Items** - Duplicate inventory items
- **Spawn Items** - Diamonds, emeralds, building materials
- **Building** - Construction materials
- **Redstone** - Redstone components
- **OP Items** - Nether stars, elytra, command blocks
- **Enchanted Books** - Max-level enchantments
- **Server Commands** - Time, weather, difficulty
- **World Management** - Borders, gamerules
- **Player Tools** - Effects, teleportation
- **Creative Mode** - Gamemode switching
- **Fun Commands** - Fireworks, animals, effects
- **Troll Tools** - Anvil drops, fake explosions
- **Combat Tools** - Full armor sets, weapons
- **Economy** - Money management (requires plugin)
- **Events** - Server events and minigames
- **Security** - Bans, kicks, mutes
- **Utility** - Mass heal/feed, XP management
- **Teleportation** - Advanced TP commands
- **Potion Effects** - All effect types
- **Advanced Tools** - OP mode, world editing
- **Moderation** - Mass actions, PvP control
- **Performance** - Server monitoring, lag clearing
- **OP Tools** - Infinite durability items
- **Destroy Items** - Selective item destruction
- **Inventory Viewer** - View/copy player inventories
- **Inventory Destroyer** - Remote inventory management

## 🛠️ Setup & Installation

### Prerequisites
- **Node.js** (v14 or higher)
- **Minecraft Server** with Abracadabra plugin installed
- **Web Browser** (Chrome, Firefox, Safari, Edge)

### Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/possiblyforaacc-dotcom/commandrunner.git
   cd commandrunner
   npm install
   ```

2. **Start the Web Server**
   ```bash
   npm start
   # or
   node server.js
   ```

3. **Access the Interface**
   - Open `http://localhost:3000` in your browser
   - Enter password: `Himgyiocc1#`
   - Select your Minecraft server
   - Choose target players and execute commands!

### Minecraft Plugin Setup

1. **Install the Plugin**
   - Copy `abracadabra-plugin.jar` to your server's `plugins/` folder
   - Restart your Minecraft server

2. **Plugin Configuration**
   - The plugin automatically connects to the web interface
   - Authorized users: `chaseeyyy` and `phoyix`
   - WebSocket connection: `ws://localhost:3000`

## 🎯 Usage Guide

### Authentication
1. Enter password: `Himgyiocc1#`
2. Click the number buttons or type on keyboard
3. Press Enter or click the green Enter button

### Server Selection
1. Choose your Minecraft server from the dropdown
2. Wait for "Connected" status (green indicator)

### Player Management
1. **Select Target**: Click any player name in the list
2. **Quick Actions**: Use the buttons below player list
   - ❤️ Heal Target
   - 🍖 Feed Target
   - 📍 TP to Target
   - ⚡ Smite Target
   - 👢 Kick Target
   - 🚫 Ban Target
3. **Refresh Players**: Click 🔄 to update player list

### Command Execution
1. **Browse Categories**: Click tabs at the top
2. **Select Command**: Click any command card
3. **Amount Selection**: Some commands let you choose quantity
4. **Confirm Actions**: Destructive commands show confirmation
5. **View Results**: Check the console for command feedback

## 🔧 Configuration

### Environment Variables
```bash
# Set custom password
ADMIN_PASSWORD=Himgyiocc1#

# Set custom port
PORT=3000

# Set custom web server URL for plugin
ABRACADABRA_WEB_URL=ws://your-server.com:3000
```

### Plugin Configuration
- Edit `plugin.yml` for command permissions
- Modify `config.yml` for plugin settings
- Authorized users are hardcoded in the plugin

## 🌐 Deployment Options

### Local Development
```bash
# Run locally
npm start

# Development mode with auto-restart
npm run dev
```

### Production Deployment
- **Railway**: Connect GitHub repo, auto-deploys
- **Heroku**: Use buildpack for Node.js
- **VPS**: Use PM2 for process management
- **Docker**: Use included Dockerfile

### Static Deployment (Limited)
- Deploy to Netlify/Vercel for static files only
- **Note**: Authentication and commands won't work without backend server
- Use for demo purposes only

## 🐛 Troubleshooting

### "Invalid password" Error
- Check password: `Himgyiocc1#` (case-sensitive)
- Ensure web server is running on port 3000
- Check browser console for connection errors

### "Server not connected" Error
- Verify Minecraft server is running
- Check plugin is installed and enabled
- Confirm WebSocket connection in server logs

### Commands not executing
- Ensure player is selected as target
- Check plugin permissions
- Verify server connection status

### Web interface not loading
- Ensure Node.js is installed
- Run `npm install` to install dependencies
- Check port 3000 is not in use
- Try different browser

## 📋 System Requirements

- **Node.js**: v14+
- **Memory**: 512MB minimum
- **Storage**: 100MB for dependencies
- **Network**: Stable internet connection

## 🔒 Security Features

- Password-protected access
- Session-based authentication
- Rate limiting on API endpoints
- CORS protection
- Input validation and sanitization

## 🎨 Customization

### Galaxy Background
- Edit `public/styles.css` for visual changes
- Modify star generation in `public/app.js`
- Adjust animation timings and colors

### Commands
- Add new commands in `public/app.js` commands object
- Implement handlers in plugin `AbracadabraPlugin.java`
- Update command mappings in both files

### UI Themes
- Modify CSS variables in `public/styles.css`
- Change color schemes and animations
- Add new visual effects

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Check server and browser console logs
4. Ensure plugin and web server versions match

## 📝 License

This project is proprietary software for authorized users only.

---

**🌟 Enjoy your cosmic admin experience! The galaxy-themed interface provides an immersive way to manage your Minecraft server with style and power. 🌟**

### Features Available via Web

#### Player Management
- ✅ View all online players
- ✅ Click to select targets
- ✅ Real-time player updates

#### Command Categories
- ✅ **Dupe Items**: Duplicate player inventories
- ✅ **Spawn Items**: Spawn valuable resources
- ✅ **Building Materials**: Construction blocks
- ✅ **Redstone Components**: Redstone items
- ✅ **OP Items**: Overpowered items (Nether Star, Elytra, Zeus Rod, etc.)
- ✅ **Enchanted Books**: High-level enchantments
- ✅ **Server Commands**: Time, weather, difficulty controls
- ✅ **World Management**: World border and gamerules
- ✅ **Player Tools**: Effects, teleportation, healing
- ✅ **Creative Mode**: Creative building tools
- ✅ **Fun Commands**: Fireworks, animal spawns
- ✅ **Troll Tools**: Anvil drops, lightning strikes, fake effects
- ✅ **Technical Tools**: Advanced utilities

#### Troll Commands Available
- Anvil Drop (from 200 blocks up)
- Fake TNT explosions
- Lightning strikes
- Fake negative effects
- Random teleportation
- Inventory clearing
- Fake ban messages
- And many more!

## 🔧 Configuration

### Environment Variables

```bash
# Web Server
PORT=3000
ADMIN_PASSWORD=your_secure_password

# Minecraft Plugin
-Dabracadabra.web.url=ws://your-web-server-url:3000
```

### Default Settings

- **Web Server Port**: 3000
- **Default Password**: `1234`
- **WebSocket URL**: `ws://localhost:3000`

## 🌐 Deployment Options

### Netlify Deployment

1. **Build and deploy**:
   ```bash
   npm run build
   netlify deploy --prod --dir=public
   ```

2. **Set environment variables** in Netlify dashboard

### Local Development

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Access at**: `http://localhost:3000`

## 🔒 Security Features

- **Keypad Authentication**: Secure numeric password entry
- **Session Management**: Automatic logout after inactivity
- **Rate Limiting**: Prevents brute force attacks
- **CORS Protection**: Configured for secure cross-origin requests
- **Input Validation**: All inputs validated and sanitized

## 📱 Interface Features

### Keypad Login
- Numeric keypad interface
- Visual feedback
- Secure password entry

### Admin Dashboard
- Server connection status
- Live player count
- Command categories with icons
- Real-time console output
- Player selection interface

### Responsive Design
- Works on desktop, tablet, and mobile
- Touch-friendly interface
- Optimized layouts for different screen sizes

## 🔗 Integration

### Minecraft Plugin
- Automatic WebSocket connection on startup
- Real-time player list updates
- Command execution through existing GUI system
- Maintains all existing in-game functionality

### Web Server
- Handles multiple Minecraft server connections
- Session management for web clients
- Command routing and response handling
- Real-time updates via WebSocket

## 📋 File Structure

```
abracadabra-web/
├── server.js              # Express server with WebSocket
├── package.json           # Dependencies and scripts
├── netlify.toml          # Netlify deployment config
├── run-web-server.bat    # Windows startup script
├── README.md             # Web interface documentation
└── public/
    ├── index.html        # Main web interface
    ├── styles.css        # Styling and animations
    └── app.js           # Frontend JavaScript

abracadabra-plugin/
├── src/main/java/com/abracadabra/AbracadabraPlugin.java
│   # Enhanced with WebSocket client
└── build/libs/abracadabra-plugin-1.0.0.jar
    # Updated plugin with web integration
```

## 🎯 Key Achievements

✅ **Complete Web Interface**: Full admin panel accessible via web browser
✅ **Keypad Authentication**: Secure login system with numeric keypad
✅ **Real-time Communication**: Live updates between web and Minecraft server
✅ **Player Selection**: Click-to-select players from web interface
✅ **All Commands Available**: Every GUI feature accessible via web
✅ **Deployment Ready**: Configured for Netlify and other platforms
✅ **Security Features**: Rate limiting, session management, input validation
✅ **Responsive Design**: Works on all devices
✅ **Plugin Integration**: Seamless integration with existing Minecraft plugin

## 🚀 Getting Started

1. **Start the web server**:
   ```bash
   cd abracadabra-web
   npm install
   npm start
   ```

2. **Install the updated plugin** in your Minecraft server

3. **Access the web interface** at `http://localhost:3000`

4. **Login with keypad** and start administering your server remotely!

## 🎉 You're All Set!

The Abracadabra web interface is now complete and ready to use. You can administer your Minecraft server from anywhere with a web browser, while keeping all the existing in-game GUI functionality intact.

**Enjoy your enhanced admin experience!** 🔮⚡