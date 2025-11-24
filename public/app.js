// Abracadabra Web Admin Panel JavaScript

class AbracadabraWebApp {
    constructor() {
        this.socket = null;
        this.sessionId = null;
        this.selectedServer = null;
        this.selectedPlayer = null;
        this.currentCategory = 'main';
        this.pendingCommand = null;

        this.init();
    }

    init() {
        this.createGalaxyBackground();
        this.setupSocket();
        this.setupKeypad();
        this.setupEventListeners();
        this.loadCommands();
    }

    createGalaxyBackground() {
        const starsContainer = document.getElementById('stars');

        // Create many more stars for richer detail
        for (let i = 0; i < 800; i++) {
            const star = document.createElement('div');
            star.className = 'star';

            // Random positioning
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';

            // Varied sizes (tiny to medium)
            const size = Math.random() * 4 + 0.5; // 0.5px to 4.5px
            star.style.width = size + 'px';
            star.style.height = size + 'px';

            // Random animation delays for natural twinkling
            star.style.animationDelay = Math.random() * 5 + 's';

            // Add some stars with different animation durations
            if (Math.random() < 0.3) {
                star.style.animationDuration = (Math.random() * 2 + 2) + 's'; // 2-4 seconds
            }

            starsContainer.appendChild(star);
        }

        // Create more frequent shooting stars
        setInterval(() => {
            if (Math.random() < 0.15) { // 15% chance every interval
                const shootingStar = document.createElement('div');
                shootingStar.className = 'shooting-star';
                shootingStar.style.left = Math.random() * 100 + '%';
                shootingStar.style.top = Math.random() * 60 + '%'; // Higher chance in upper area
                shootingStar.style.animationDelay = Math.random() * 5 + 's';

                // Varied shooting star sizes
                const starSize = Math.random() * 2 + 1; // 1-3px
                shootingStar.style.width = starSize + 'px';
                shootingStar.style.height = starSize + 'px';

                starsContainer.appendChild(shootingStar);

                // Remove shooting star after animation
                setTimeout(() => {
                    if (shootingStar.parentNode) {
                        shootingStar.parentNode.removeChild(shootingStar);
                    }
                }, 4000);
            }
        }, 3000); // Check every 3 seconds for more frequent shooting stars

        // Create cosmic dust particles
        for (let i = 0; i < 50; i++) {
            const dust = document.createElement('div');
            dust.className = 'cosmic-dust';
            dust.style.left = Math.random() * 100 + '%';
            dust.style.top = Math.random() * 100 + '%';
            dust.style.width = (Math.random() * 2 + 1) + 'px';
            dust.style.height = dust.style.width;
            dust.style.animationDelay = Math.random() * 10 + 's';
            dust.style.animationDuration = (Math.random() * 20 + 20) + 's'; // 20-40 seconds
            starsContainer.appendChild(dust);
        }
    }

    setupSocket() {
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus(false);
        });

        // Handle server connections
        this.socket.on('server-connected', (data) => {
            this.addServerOption(data.serverId, data.serverName);
        });

        this.socket.on('server-disconnected', (data) => {
            this.removeServerOption(data.serverId);
        });

        // Handle player updates
        this.socket.on('players-updated', (data) => {
            if (data.serverId === this.selectedServer) {
                this.updatePlayerList(data.players);
            }
        });

        // Handle command responses
        this.socket.on('command-result', (data) => {
            if (data.sessionId === this.sessionId) {
                this.showConsoleMessage(data.response, data.success ? 'success' : 'error');
            }
        });
    }

    setupKeypad() {
        const display = document.getElementById('password-display');
        const keys = document.querySelectorAll('.key');
        const enterKey = document.querySelector('.key.enter');
        const clearKey = document.querySelector('.key.clear');

        keys.forEach(key => {
            if (!key.classList.contains('enter') && !key.classList.contains('clear')) {
                key.addEventListener('click', () => {
                    const value = key.dataset.value;
                    if (display.value.length < 10) { // Limit password length
                        display.value += value;
                    }
                });
            }
        });

        clearKey.addEventListener('click', () => {
            display.value = '';
        });

        enterKey.addEventListener('click', () => {
            this.authenticate(display.value);
        });

        // Allow keyboard input
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('login-screen').classList.contains('active')) {
                if (e.key >= '0' && e.key <= '9') {
                    if (display.value.length < 10) {
                        display.value += e.key;
                    }
                } else if (e.key === 'Backspace') {
                    display.value = display.value.slice(0, -1);
                } else if (e.key === 'Enter') {
                    this.authenticate(display.value);
                } else if (e.key === 'Escape') {
                    display.value = '';
                }
            }
        });
    }

    setupEventListeners() {
        // Logout button
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Server selection
        document.getElementById('server-select').addEventListener('change', (e) => {
            this.selectServer(e.target.value);
        });

        // Select self button
        document.getElementById('select-self-btn').addEventListener('click', () => {
            this.selectPlayer('self');
        });

        // Refresh players button
        document.getElementById('refresh-players-btn').addEventListener('click', () => {
            if (this.selectedServer) {
                this.loadPlayers(this.selectedServer);
            }
        });

        // Quick action buttons
        document.getElementById('heal-target-btn').addEventListener('click', () => {
            if (this.selectedPlayer && this.selectedPlayer !== 'self') {
                this.executeCommand('heal-player', {});
            } else {
                this.showConsoleMessage('Please select a target player first', 'warning');
            }
        });

        document.getElementById('feed-target-btn').addEventListener('click', () => {
            if (this.selectedPlayer && this.selectedPlayer !== 'self') {
                this.executeCommand('feed-player', {});
            } else {
                this.showConsoleMessage('Please select a target player first', 'warning');
            }
        });

        document.getElementById('tp-to-target-btn').addEventListener('click', () => {
            if (this.selectedPlayer && this.selectedPlayer !== 'self') {
                this.executeCommand('tp-to-player', {});
            } else {
                this.showConsoleMessage('Please select a target player first', 'warning');
            }
        });

        document.getElementById('smite-target-btn').addEventListener('click', () => {
            if (this.selectedPlayer && this.selectedPlayer !== 'self') {
                this.executeCommand('strike-lightning', {});
            } else {
                this.showConsoleMessage('Please select a target player first', 'warning');
            }
        });

        document.getElementById('kick-target-btn').addEventListener('click', () => {
            if (this.selectedPlayer && this.selectedPlayer !== 'self') {
                this.executeCommand('kick-player', {});
            } else {
                this.showConsoleMessage('Please select a target player first', 'warning');
            }
        });

        document.getElementById('ban-target-btn').addEventListener('click', () => {
            if (this.selectedPlayer && this.selectedPlayer !== 'self') {
                this.executeCommand('ban-player', {});
            } else {
                this.showConsoleMessage('Please select a target player first', 'warning');
            }
        });

        // Category tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchCategory(tab.dataset.category);
            });
        });

        // Clear console button
        document.getElementById('clear-console').addEventListener('click', () => {
            document.getElementById('console-output').innerHTML = '';
        });

        // Dialog buttons
        document.getElementById('confirm-yes').addEventListener('click', () => {
            this.executePendingCommand();
            this.hideDialog('confirm-dialog');
        });

        document.getElementById('confirm-no').addEventListener('click', () => {
            this.pendingCommand = null;
            this.hideDialog('confirm-dialog');
        });

        document.getElementById('amount-confirm').addEventListener('click', () => {
            const customAmount = document.getElementById('custom-amount').value;
            const amount = customAmount ? parseInt(customAmount) : 1;
            if (amount > 0 && amount <= 2304) {
                this.executeCommandWithAmount(amount);
            }
            this.hideDialog('amount-dialog');
        });

        document.getElementById('amount-cancel').addEventListener('click', () => {
            this.pendingCommand = null;
            this.hideDialog('amount-dialog');
        });

        // Amount buttons
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                this.executeCommandWithAmount(amount);
                this.hideDialog('amount-dialog');
            });
        });
    }

    authenticate(password) {
        if (!password) return;

        fetch('/api/authenticate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.sessionId = data.sessionId;
                this.showAdminPanel();
                this.loadServers();
            } else {
                this.showLoginMessage(data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Authentication error:', error);
            this.showLoginMessage('Invalid password', 'error');
        });
    }

    showLoginMessage(message, type = 'info') {
        const messageEl = document.getElementById('login-message');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        setTimeout(() => {
            messageEl.textContent = '';
            messageEl.className = 'message';
        }, 3000);
    }

    showAdminPanel() {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('admin-screen').classList.add('active');
    }

    logout() {
        this.sessionId = null;
        this.selectedServer = null;
        this.selectedPlayer = null;
        document.getElementById('password-display').value = '';
        document.getElementById('admin-screen').classList.remove('active');
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('server-select').innerHTML = '<option value="">Select Server...</option>';
        document.getElementById('player-list').innerHTML = '<div class="loading">Loading players...</div>';
        document.getElementById('current-target').textContent = 'None selected';
    }

    loadServers() {
        fetch('/api/servers')
            .then(response => response.json())
            .then(data => {
                data.servers.forEach(server => {
                    this.addServerOption(server.serverId, server.serverName);
                });
            })
            .catch(error => {
                console.error('Failed to load servers:', error);
            });
    }

    addServerOption(serverId, serverName) {
        const select = document.getElementById('server-select');
        const option = document.createElement('option');
        option.value = serverId;
        option.textContent = serverName;
        select.appendChild(option);
    }

    removeServerOption(serverId) {
        const select = document.getElementById('server-select');
        const option = select.querySelector(`option[value="${serverId}"]`);
        if (option) {
            option.remove();
        }
        if (this.selectedServer === serverId) {
            this.selectServer('');
        }
    }

    selectServer(serverId) {
        this.selectedServer = serverId;
        this.updateConnectionStatus(!!serverId);

        if (serverId) {
            this.loadPlayers(serverId);
        } else {
            document.getElementById('player-list').innerHTML = '<div class="loading">Select a server to view players</div>';
        }
    }

    updateConnectionStatus(connected) {
        const statusEl = document.getElementById('connection-status');
        statusEl.textContent = connected ? 'Connected' : 'Disconnected';
        statusEl.className = connected ? 'connected' : 'disconnected';
    }

    loadPlayers(serverId) {
        document.getElementById('player-list').innerHTML = '<div class="loading">Loading players...</div>';

        fetch(`/api/servers/${serverId}/players`)
            .then(response => response.json())
            .then(data => {
                this.updatePlayerList(data.players);
            })
            .catch(error => {
                console.error('Failed to load players:', error);
                document.getElementById('player-list').innerHTML = '<div class="loading">Failed to load players</div>';
            });
    }

    updatePlayerList(players) {
        const playerListEl = document.getElementById('player-list');
        playerListEl.innerHTML = '';

        if (players.length === 0) {
            playerListEl.innerHTML = '<div class="loading">No players online</div>';
            return;
        }

        players.forEach(player => {
            const playerItem = document.createElement('div');
            playerItem.className = 'player-item';
            if (this.selectedPlayer === player.name) {
                playerItem.classList.add('selected');
            }

            playerItem.innerHTML = `
                <span class="player-name">${player.name}</span>
                <button class="player-select-btn" data-player="${player.name}">Select</button>
            `;

            playerItem.querySelector('.player-select-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectPlayer(player.name);
            });

            playerListEl.appendChild(playerItem);
        });
    }

    selectPlayer(playerName) {
        this.selectedPlayer = playerName;
        document.getElementById('current-target').textContent = playerName === 'self' ? 'Yourself' : playerName;

        // Update visual selection
        document.querySelectorAll('.player-item').forEach(item => {
            item.classList.remove('selected');
        });

        if (playerName !== 'self') {
            const selectedItem = document.querySelector(`[data-player="${playerName}"]`);
            if (selectedItem) {
                selectedItem.closest('.player-item').classList.add('selected');
            }
        }

        // Send selection to server
        this.executeCommand('select-player', { playerName });
    }

    switchCategory(category) {
        this.currentCategory = category;

        // Update tab styling
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');

        // Load commands for this category
        this.loadCommandsForCategory(category);
    }

    loadCommands() {
        this.commands = {
            main: [
                { id: 'dupe-items', name: 'Dupe Items', icon: '📦', desc: 'Duplicate items from inventory' },
                { id: 'spawn-items', name: 'Spawn Items', icon: '🎁', desc: 'Spawn various items' },
                { id: 'building', name: 'Building', icon: '🏗️', desc: 'Building materials' },
                { id: 'redstone', name: 'Redstone', icon: '🔴', desc: 'Redstone components' },
                { id: 'op-items', name: 'OP Items', icon: '⚡', desc: 'Overpowered items' },
                { id: 'enchanted-books', name: 'Enchanted Books', icon: '📚', desc: 'High-level enchantments' },
                { id: 'server-commands', name: 'Server Commands', icon: '🖥️', desc: 'Server management' },
                { id: 'world-management', name: 'World Management', icon: '🌍', desc: 'World settings' },
                { id: 'player-tools', name: 'Player Tools', icon: '👤', desc: 'Player utilities' },
                { id: 'creative-mode', name: 'Creative Mode', icon: '🎨', desc: 'Creative tools' },
                { id: 'fun-commands', name: 'Fun Commands', icon: '🎉', desc: 'Fun effects' },
                { id: 'troll-tools', name: 'Troll Tools', icon: '😈', desc: 'Trolling commands' },
                { id: 'technical', name: 'Technical', icon: '⚙️', desc: 'Technical tools' },
                { id: 'combat-tools', name: 'Combat Tools', icon: '⚔️', desc: 'Weapons and armor' },
                { id: 'economy', name: 'Economy', icon: '💰', desc: 'Money and trading' },
                { id: 'events', name: 'Events', icon: '🎊', desc: 'Events and minigames' },
                { id: 'security', name: 'Security', icon: '🛡️', desc: 'Anti-cheat and bans' },
                { id: 'utility', name: 'Utility', icon: '🔧', desc: 'General utilities' },
                { id: 'teleportation', name: 'Teleportation', icon: '✈️', desc: 'Advanced teleportation' },
                { id: 'effects', name: 'Potion Effects', icon: '🧪', desc: 'Potion effect management' },
                { id: 'advanced', name: 'Advanced Tools', icon: '🔬', desc: 'Powerful utilities' },
                { id: 'moderation', name: 'Moderation', icon: '👮', desc: 'Player moderation' },
                { id: 'performance', name: 'Performance', icon: '⚡', desc: 'Server optimization' },
                { id: 'op-tools', name: 'OP Tools', icon: '🔨', desc: 'Infinite durability tools' },
                { id: 'destroy-items', name: 'Destroy Items', icon: '💥', desc: 'Delete items' },
                { id: 'inventory-viewer', name: 'Inventory Viewer', icon: '👀', desc: 'View player inventories' },
                { id: 'inventory-destroyer', name: 'Inventory Destroyer', icon: '💣', desc: 'Delete player items' }
            ],
            'dupe-items': [
                { id: 'dupe-stack', name: 'Dupe Stack', icon: '📦', desc: 'Duplicate held item stack' },
                { id: 'dupe-inventory', name: 'Dupe Inventory', icon: '🎒', desc: 'Duplicate entire inventory' },
                { id: 'dupe-armor', name: 'Dupe Armor', icon: '🛡️', desc: 'Duplicate armor set' }
            ],
            'spawn-items': [
                { id: 'spawn-diamond', name: 'Spawn Diamonds', icon: '💎', desc: 'Spawn diamond items', amount: true },
                { id: 'spawn-emerald', name: 'Spawn Emeralds', icon: '💚', desc: 'Spawn emerald items', amount: true },
                { id: 'spawn-gold', name: 'Spawn Gold', icon: '🪙', desc: 'Spawn gold items', amount: true },
                { id: 'spawn-iron', name: 'Spawn Iron', icon: '🔧', desc: 'Spawn iron items', amount: true },
                { id: 'spawn-food', name: 'Spawn Food', icon: '🍖', desc: 'Spawn food items' },
                { id: 'spawn-tools', name: 'Spawn Tools', icon: '🔨', desc: 'Spawn tool set' },
                { id: 'spawn-armor', name: 'Spawn Armor', icon: '🛡️', desc: 'Spawn armor set' }
            ],
            building: [
                { id: 'spawn-wood', name: 'Spawn Wood', icon: '🌳', desc: 'Spawn wooden materials', amount: true },
                { id: 'spawn-stone', name: 'Spawn Stone', icon: '🪨', desc: 'Spawn stone materials', amount: true },
                { id: 'spawn-glass', name: 'Spawn Glass', icon: '🪟', desc: 'Spawn glass blocks', amount: true },
                { id: 'spawn-concrete', name: 'Spawn Concrete', icon: '🎨', desc: 'Spawn concrete blocks', amount: true }
            ],
            redstone: [
                { id: 'spawn-redstone', name: 'Spawn Redstone', icon: '🔴', desc: 'Spawn redstone dust', amount: true },
                { id: 'spawn-repeaters', name: 'Spawn Repeaters', icon: '🔁', desc: 'Spawn redstone repeaters', amount: true },
                { id: 'spawn-comparators', name: 'Spawn Comparators', icon: '📊', desc: 'Spawn redstone comparators', amount: true },
                { id: 'spawn-pistons', name: 'Spawn Pistons', icon: '🔨', desc: 'Spawn pistons', amount: true }
            ],
            'op-items': [
                { id: 'spawn-nether-star', name: 'Nether Star', icon: '⭐', desc: 'Spawn Nether Star' },
                { id: 'spawn-elytra', name: 'Elytra', icon: '🦅', desc: 'Spawn Elytra wings' },
                { id: 'spawn-trident', name: 'Trident', icon: '🔱', desc: 'Spawn Trident' },
                { id: 'spawn-zeus-rod', name: 'Zeus Rod', icon: '⚡', desc: 'Spawn Zeus lightning rod' },
                { id: 'spawn-command-block', name: 'Command Block', icon: '📜', desc: 'Spawn Command Block' },
                { id: 'spawn-structure_block', name: 'Structure Block', icon: '🏗️', desc: 'Spawn Structure Block' },
                { id: 'spawn-debug_stick', name: 'Debug Stick', icon: '🔧', desc: 'Spawn Debug Stick' },
                { id: 'spawn-barrier', name: 'Barrier', icon: '🚫', desc: 'Spawn Barrier blocks' }
            ],
            'enchanted-books': [
                { id: 'sharpness-5', name: 'Sharpness V', icon: '⚔️', desc: 'Max sharpness enchantment' },
                { id: 'protection-4', name: 'Protection IV', icon: '🛡️', desc: 'Max protection enchantment' },
                { id: 'efficiency-5', name: 'Efficiency V', icon: '⛏️', desc: 'Max efficiency enchantment' },
                { id: 'fortune-3', name: 'Fortune III', icon: '💎', desc: 'Max fortune enchantment' }
            ],
            'server-commands': [
                { id: 'time-day', name: 'Set Day', icon: '☀️', desc: 'Set time to day' },
                { id: 'time-night', name: 'Set Night', icon: '🌙', desc: 'Set time to night' },
                { id: 'weather-clear', name: 'Clear Weather', icon: '☀️', desc: 'Clear the weather' },
                { id: 'weather-rain', name: 'Rain', icon: '🌧️', desc: 'Make it rain' },
                { id: 'difficulty-peaceful', name: 'Peaceful', icon: '🕊️', desc: 'Set difficulty to peaceful' },
                { id: 'difficulty-easy', name: 'Easy', icon: '🟢', desc: 'Set difficulty to easy' },
                { id: 'difficulty-normal', name: 'Normal', icon: '🟡', desc: 'Set difficulty to normal' },
                { id: 'difficulty-hard', name: 'Hard', icon: '🔴', desc: 'Set difficulty to hard' }
            ],
            'world-management': [
                { id: 'world-border-reset', name: 'Reset Border', icon: '🌍', desc: 'Reset world border' },
                { id: 'world-border-set', name: 'Set Border', icon: '🎯', desc: 'Set world border size' },
                { id: 'gamerule-keep-inventory', name: 'Keep Inventory', icon: '🎒', desc: 'Toggle keep inventory' },
                { id: 'gamerule-mob-griefing', name: 'Mob Griefing', icon: '👹', desc: 'Toggle mob griefing' }
            ],
            'player-tools': [
                { id: 'heal-player', name: 'Heal Player', icon: '❤️', desc: 'Heal target player' },
                { id: 'feed-player', name: 'Feed Player', icon: '🍖', desc: 'Feed target player' },
                { id: 'give-speed', name: 'Speed Effect', icon: '💨', desc: 'Give speed effect' },
                { id: 'give-strength', name: 'Strength Effect', icon: '💪', desc: 'Give strength effect' },
                { id: 'give-invisibility', name: 'Invisibility', icon: '👻', desc: 'Give invisibility effect' },
                { id: 'clear-effects', name: 'Clear Effects', icon: '🧹', desc: 'Clear all effects' }
            ],
            'creative-mode': [
                { id: 'creative-mode', name: 'Creative Mode', icon: '🎨', desc: 'Enable creative mode' },
                { id: 'survival-mode', name: 'Survival Mode', icon: '⚔️', desc: 'Enable survival mode' },
                { id: 'adventure-mode', name: 'Adventure Mode', icon: '🗺️', desc: 'Enable adventure mode' },
                { id: 'spectator-mode', name: 'Spectator Mode', icon: '👁️', desc: 'Enable spectator mode' }
            ],
            'fun-commands': [
                { id: 'spawn-fireworks', name: 'Fireworks', icon: '🎆', desc: 'Spawn fireworks show' },
                { id: 'spawn-animals', name: 'Spawn Animals', icon: '🐄', desc: 'Spawn random animals' },
                { id: 'random-teleport', name: 'Random TP', icon: '🎲', desc: 'Teleport randomly' },
                { id: 'super-jump', name: 'Super Jump', icon: '🦘', desc: 'Enable super jump' }
            ],
            'troll-tools': [
                { id: 'fake-tnt', name: 'Fake TNT', icon: '💣', desc: 'Spawn fake TNT explosion', confirm: true },
                { id: 'anvil-drop', name: 'Anvil Drop', icon: '⚒️', desc: 'Drop anvil from sky', confirm: true },
                { id: 'fake-lava', name: 'Fake Lava', icon: '🌋', desc: 'Spawn fake lava flood', confirm: true },
                { id: 'strike-lightning', name: 'Lightning Strike', icon: '⚡', desc: 'Strike target with lightning' },
                { id: 'spawn-creeper', name: 'Spawn Creeper', icon: '💥', desc: 'Spawn creeper at target' },
                { id: 'fake-ban', name: 'Fake Ban', icon: '🚫', desc: 'Fake ban message' },
                { id: 'inventory-clear', name: 'Clear Inventory', icon: '🗑️', desc: 'Clear target inventory', confirm: true },
                { id: 'random-teleport', name: 'Random Teleport', icon: '🎲', desc: 'Teleport target randomly' }
            ],
            technical: [
                { id: 'view-inventory', name: 'View Inventory', icon: '👀', desc: 'View target player inventory' },
                { id: 'player-stats', name: 'Player Stats', icon: '📊', desc: 'View player statistics' },
                { id: 'server-info', name: 'Server Info', icon: 'ℹ️', desc: 'View server information' },
                { id: 'plugin-list', name: 'Plugin List', icon: '📋', desc: 'List installed plugins' },
                { id: 'debug-console', name: 'Debug Console', icon: '🔧', desc: 'Server debugging info' },
                { id: 'code-generator', name: 'Code Generator', icon: '💻', desc: 'Generate code templates' },
                { id: 'performance-monitor', name: 'Performance Monitor', icon: '📈', desc: 'Monitor server performance' },
                { id: 'log-analyzer', name: 'Log Analyzer', icon: '📝', desc: 'Analyze server logs' }
            ],
            'combat-tools': [
                { id: 'spawn-netherite-sword', name: 'Netherite Sword', icon: '⚔️', desc: 'Spawn netherite sword' },
                { id: 'spawn-netherite-armor', name: 'Netherite Armor', icon: '🛡️', desc: 'Spawn full netherite armor set' },
                { id: 'spawn-diamond-sword', name: 'Diamond Sword', icon: '💎', desc: 'Spawn diamond sword' },
                { id: 'spawn-diamond-armor', name: 'Diamond Armor', icon: '💎', desc: 'Spawn full diamond armor set' },
                { id: 'spawn-bow', name: 'Bow', icon: '🏹', desc: 'Spawn bow with power enchantment' },
                { id: 'spawn-crossbow', name: 'Crossbow', icon: '🏹', desc: 'Spawn crossbow with enchantments' },
                { id: 'spawn-shield', name: 'Shield', icon: '🛡️', desc: 'Spawn shield' },
                { id: 'spawn-totem', name: 'Totem of Undying', icon: '🗿', desc: 'Spawn totem of undying' }
            ],
            economy: [
                { id: 'give-money', name: 'Give Money', icon: '💰', desc: 'Give money to player', amount: true },
                { id: 'take-money', name: 'Take Money', icon: '💸', desc: 'Take money from player', amount: true },
                { id: 'set-balance', name: 'Set Balance', icon: '🏦', desc: 'Set player balance', amount: true },
                { id: 'clear-balance', name: 'Clear Balance', icon: '🗑️', desc: 'Reset player balance to 0' },
                { id: 'view-balance', name: 'View Balance', icon: '👀', desc: 'Check player balance' },
                { id: 'create-shop', name: 'Create Shop', icon: '🏪', desc: 'Create a shop' },
                { id: 'delete-shop', name: 'Delete Shop', icon: '💥', desc: 'Delete a shop' }
            ],
            events: [
                { id: 'start-event', name: 'Start Event', icon: '🎪', desc: 'Start a server event' },
                { id: 'stop-event', name: 'Stop Event', icon: '⏹️', desc: 'Stop current event' },
                { id: 'create-minigame', name: 'Create Minigame', icon: '🎮', desc: 'Create a minigame' },
                { id: 'start-minigame', name: 'Start Minigame', icon: '▶️', desc: 'Start a minigame' },
                { id: 'stop-minigame', name: 'Stop Minigame', icon: '⏹️', desc: 'Stop current minigame' },
                { id: 'announce-event', name: 'Announce Event', icon: '📢', desc: 'Announce an event to all players' }
            ],
            security: [
                { id: 'ban-player', name: 'Ban Player', icon: '🚫', desc: 'Ban a player' },
                { id: 'unban-player', name: 'Unban Player', icon: '✅', desc: 'Unban a player' },
                { id: 'kick-player', name: 'Kick Player', icon: '👢', desc: 'Kick a player' },
                { id: 'mute-player', name: 'Mute Player', icon: '🤐', desc: 'Mute a player' },
                { id: 'unmute-player', name: 'Unmute Player', icon: '🗣️', desc: 'Unmute a player' },
                { id: 'check-bans', name: 'Check Bans', icon: '📋', desc: 'View banned players' },
                { id: 'ip-ban', name: 'IP Ban', icon: '🌐', desc: 'Ban by IP address' }
            ],
            utility: [
                { id: 'heal-all', name: 'Heal All', icon: '❤️', desc: 'Heal all players' },
                { id: 'feed-all', name: 'Feed All', icon: '🍖', desc: 'Feed all players' },
                { id: 'clear-all-effects', name: 'Clear All Effects', icon: '🧹', desc: 'Clear effects from all players' },
                { id: 'repair-items', name: 'Repair Items', icon: '🔧', desc: 'Repair held item' },
                { id: 'enchant-item', name: 'Enchant Item', icon: '✨', desc: 'Enchant held item' },
                { id: 'give-xp', name: 'Give XP', icon: '⭐', desc: 'Give experience levels', amount: true }
            ],
            teleportation: [
                { id: 'tp-to-player', name: 'TP to Player', icon: '👤', desc: 'Teleport to a player' },
                { id: 'tp-player-here', name: 'TP Player Here', icon: '📍', desc: 'Teleport player to you' },
                { id: 'tp-all-here', name: 'TP All Here', icon: '👥', desc: 'Teleport all players to you' },
                { id: 'tp-random', name: 'Random TP', icon: '🎲', desc: 'Teleport randomly' },
                { id: 'tp-coordinates', name: 'TP to Coordinates', icon: '📍', desc: 'Teleport to specific coordinates' },
                { id: 'set-home', name: 'Set Home', icon: '🏠', desc: 'Set home location' },
                { id: 'tp-home', name: 'TP Home', icon: '🏠', desc: 'Teleport to home' }
            ],
            effects: [
                { id: 'give-regeneration', name: 'Regeneration', icon: '❤️', desc: 'Give regeneration effect' },
                { id: 'give-invisibility', name: 'Invisibility', icon: '👻', desc: 'Give invisibility effect' },
                { id: 'give-night-vision', name: 'Night Vision', icon: '👁️', desc: 'Give night vision effect' },
                { id: 'give-speed', name: 'Speed', icon: '💨', desc: 'Give speed effect' },
                { id: 'give-strength', name: 'Strength', icon: '💪', desc: 'Give strength effect' },
                { id: 'give-jump-boost', name: 'Jump Boost', icon: '🦘', desc: 'Give jump boost effect' },
                { id: 'clear-effects', name: 'Clear Effects', icon: '🧹', desc: 'Clear all potion effects' }
            ],
            advanced: [
                { id: 'execute-command', name: 'Execute Command', icon: '💻', desc: 'Execute custom command' },
                { id: 'world-edit', name: 'World Edit', icon: '🌍', desc: 'Advanced world editing' },
                { id: 'structure-gen', name: 'Structure Gen', icon: '🏗️', desc: 'Generate structures' },
                { id: 'debug-mode', name: 'Debug Mode', icon: '🔧', desc: 'Toggle debug mode' },
                { id: 'recipe-unlock', name: 'Recipe Unlock', icon: '📖', desc: 'Unlock recipes' },
                { id: 'op-mode', name: 'OP Mode', icon: '👑', desc: 'Toggle OP mode' },
                { id: 'god-mode-all', name: 'God Mode All', icon: '🛡️', desc: 'God mode for all players' }
            ],
            moderation: [
                { id: 'kick-all', name: 'Kick All', icon: '👢', desc: 'Kick all players' },
                { id: 'ban-all', name: 'Ban All', icon: '🚫', desc: 'Ban all players (except you)' },
                { id: 'mute-chat', name: 'Mute Chat', icon: '🤐', desc: 'Mute global chat' },
                { id: 'freeze-players', name: 'Freeze Players', icon: '🧊', desc: 'Freeze all players' },
                { id: 'unfreeze-players', name: 'Unfreeze Players', icon: '🔥', desc: 'Unfreeze all players' },
                { id: 'player-list', name: 'Player List', icon: '📋', desc: 'List all online players' },
                { id: 'toggle-pvp', name: 'Toggle PvP', icon: '⚔️', desc: 'Toggle PvP globally' }
            ],
            performance: [
                { id: 'clear-lag', name: 'Clear Lag', icon: '🧹', desc: 'Clear dropped items' },
                { id: 'garbage-collect', name: 'Garbage Collect', icon: '🗑️', desc: 'Force garbage collection' },
                { id: 'entity-count', name: 'Entity Count', icon: '🔢', desc: 'Count entities' },
                { id: 'tps-monitor', name: 'TPS Monitor', icon: '📊', desc: 'Monitor server TPS' },
                { id: 'chunk-unload', name: 'Chunk Unload', icon: '📦', desc: 'Unload unused chunks' },
                { id: 'memory-info', name: 'Memory Info', icon: '💾', desc: 'Show memory usage' }
            ],
            'op-tools': [
                { id: 'infinite-pickaxe', name: 'Infinite Pickaxe', icon: '⛏️', desc: 'Unbreakable netherite pickaxe' },
                { id: 'infinite-sword', name: 'Infinite Sword', icon: '⚔️', desc: 'Unbreakable netherite sword' },
                { id: 'infinite-axe', name: 'Infinite Axe', icon: '🪓', desc: 'Unbreakable netherite axe' },
                { id: 'infinite-shovel', name: 'Infinite Shovel', icon: '⛏️', desc: 'Unbreakable netherite shovel' },
                { id: 'infinite-hoe', name: 'Infinite Hoe', icon: '🌾', desc: 'Unbreakable netherite hoe' },
                { id: 'infinite-bow', name: 'Infinite Bow', icon: '🏹', desc: 'Unbreakable bow with infinity' },
                { id: 'infinite-crossbow', name: 'Infinite Crossbow', icon: '🏹', desc: 'Unbreakable crossbow' }
            ],
            'destroy-items': [
                { id: 'destroy-held', name: 'Destroy Held Item', icon: '💥', desc: 'Destroy item in hand' },
                { id: 'destroy-armor', name: 'Destroy Armor', icon: '💥', desc: 'Destroy armor pieces' },
                { id: 'destroy-inventory', name: 'Destroy Inventory', icon: '💥', desc: 'Clear entire inventory' },
                { id: 'destroy-hotbar', name: 'Destroy Hotbar', icon: '💥', desc: 'Clear hotbar items' }
            ],
            'inventory-viewer': [
                { id: 'view-inventory', name: 'View Inventory', icon: '👀', desc: 'View target player inventory' },
                { id: 'view-armor', name: 'View Armor', icon: '🛡️', desc: 'View target player armor' },
                { id: 'view-enderchest', name: 'View Enderchest', icon: '📦', desc: 'View target enderchest' },
                { id: 'copy-inventory', name: 'Copy Inventory', icon: '📋', desc: 'Copy items from target' }
            ],
            'inventory-destroyer': [
                { id: 'destroy-player-inventory', name: 'Destroy Player Items', icon: '💣', desc: 'Clear target inventory' },
                { id: 'destroy-player-armor', name: 'Destroy Player Armor', icon: '💣', desc: 'Remove target armor' },
                { id: 'destroy-player-enderchest', name: 'Destroy Enderchest', icon: '💣', desc: 'Clear target enderchest' },
                { id: 'selective-destroy', name: 'Selective Destroy', icon: '🎯', desc: 'Destroy specific items' }
            ]
        };

        this.loadCommandsForCategory('main');
    }

    loadCommandsForCategory(category) {
        const grid = document.getElementById('command-grid');
        grid.innerHTML = '';

        const commands = this.commands[category] || [];
        commands.forEach(cmd => {
            const card = document.createElement('div');
            card.className = 'command-card';
            card.innerHTML = `
                <div class="command-icon">${cmd.icon}</div>
                <div class="command-name">${cmd.name}</div>
                <div class="command-desc">${cmd.desc}</div>
            `;

            card.addEventListener('click', () => {
                this.handleCommandClick(cmd);
            });

            grid.appendChild(card);
        });
    }

    handleCommandClick(cmd) {
        if (cmd.confirm) {
            this.showConfirmDialog(`Execute ${cmd.name}?`, cmd.desc, () => {
                this.executeCommand(cmd.id, {});
            });
        } else if (cmd.amount) {
            this.showAmountDialog(cmd.name, (amount) => {
                this.executeCommand(cmd.id, { amount });
            });
        } else {
            this.executeCommand(cmd.id, {});
        }
    }

    executeCommand(command, params = {}) {
        if (!this.sessionId || !this.selectedServer) {
            this.showConsoleMessage('Not authenticated or no server selected', 'error');
            return;
        }

        this.socket.emit('execute-command', {
            serverId: this.selectedServer,
            sessionId: this.sessionId,
            command,
            params
        });

        this.showConsoleMessage(`Executing: ${command}`, 'info');
    }

    showConfirmDialog(title, message, callback) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        this.pendingCommand = callback;
        this.showDialog('confirm-dialog');
    }

    showAmountDialog(title, callback) {
        document.getElementById('amount-title').textContent = title;
        this.pendingCommand = callback;
        this.showDialog('amount-dialog');
    }

    executePendingCommand() {
        if (this.pendingCommand) {
            this.pendingCommand();
            this.pendingCommand = null;
        }
    }

    executeCommandWithAmount(amount) {
        if (this.pendingCommand) {
            this.pendingCommand(amount);
            this.pendingCommand = null;
        }
    }

    showDialog(dialogId) {
        document.getElementById(dialogId).classList.add('active');
    }

    hideDialog(dialogId) {
        document.getElementById(dialogId).classList.remove('active');
    }

    showConsoleMessage(message, type = 'info') {
        const consoleOutput = document.getElementById('console-output');
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        consoleOutput.appendChild(line);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AbracadabraWebApp();
});