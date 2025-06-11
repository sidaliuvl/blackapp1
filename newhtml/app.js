// Loading screen simulation
let loadingMessages = [
    'INITIALIZING GHOST PROTOCOL...',
    'ESTABLISHING ENCRYPTED TUNNEL...',
    'BYPASSING SECURITY FIREWALLS...'
];

let currentMessageIndex = 0;
let loadingProgress = 0;
let currentChatType = 'public';
let currentTargetGang = '';
let username = '';
let playerGang = '';
let playerIsManager = false;
let playerIsHighAuthority = false;

function setChatType(type) {
    currentChatType = type;
    currentTargetGang = '';

    document.querySelectorAll('.chat-type-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.chat-type-btn[data-type="${type}"]`).classList.add('active');

    if (type === 'private') {
        document.getElementById('gang-selector').style.display = 'block';
    } else {
        document.getElementById('gang-selector').style.display = 'none';
    }

    loadChatHistory();
}

function loadChatHistory() {
    const targetGang = currentChatType === 'private' ? document.getElementById('targetGang').value : '';
    currentTargetGang = targetGang;

    fetch(`https://${GetParentResourceName()}/GetChatHistory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatType: currentChatType, targetGang: currentTargetGang, username: username })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';
            data.messages.forEach(msg => {
                const date = new Date(msg.created_at);
                const formattedDate = date.toLocaleString();

                chatMessages.innerHTML += `
                    <div class="chat-message fade-in">
                        <div class="username"><i class="fas fa-user-secret"></i> ${msg.sender_name}</div>
                        <div class="timestamp">${formattedDate}</div>
                        <div class="content">${msg.message}</div>
                    </div>
                `;
            });

            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    });
}

function loadAllowedGangs() {
    fetch(`https://${GetParentResourceName()}/GetAllowedGangs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
    })
    .then(response => response.json())
    .then(gangs => {
        const gangSelector = document.getElementById('targetGang');
        gangSelector.innerHTML = '<option value="">-- Select Target --</option>';
        gangs.forEach(gang => {
            gangSelector.innerHTML += `<option value="${gang}">${gang}</option>`;
        });
    });
}

function sendChatMessage() {
    const message = document.getElementById('chatMessageInput').value;
    if (!message.trim()) return;

    if (typeof username === 'undefined' || !username) {
        console.error('Username is not set. Please log in again.');
        return;
    }

    const targetGang = currentChatType === 'private' ? document.getElementById('targetGang').value : '';
    currentTargetGang = targetGang;

    fetch(`https://${GetParentResourceName()}/SendChatMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: message,
            chatType: currentChatType,
            targetGang: targetGang,
            username: username
        })
    });

    document.getElementById('chatMessageInput').value = '';
}

window.addEventListener('message', function(event) {
    if (event.data.action === 'newChatMessage') {
        if (!username) return;

        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        let displayChat = currentChatType;
        let isGangOnly = !playerIsManager && !playerIsHighAuthority && playerGang !== 'blackmarket';

        if (isGangOnly && event.data.chatType === 'private') {
            displayChat = 'gang';
        } else if (event.data.chatType !== currentChatType) {
            return;
        }

        const date = new Date(event.data.message.timestamp || event.data.message.created_at);
        const formattedDate = date.toLocaleString();

        chatMessages.innerHTML += `
            <div class="chat-message fade-in">
                <div class="username"><i class="fas fa-user-secret"></i> ${event.data.message.sender || event.data.message.sender_name}</div>
                <div class="timestamp">${formattedDate}</div>
                <div class="content">${event.data.message.message}</div>
            </div>
        `;

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

function simulateLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingText = document.getElementById('loading-text');
    const progressBar = document.getElementById('loading-progress');
    
    const interval = setInterval(() => {
        loadingProgress += Math.random() * 15 + 5;
        
        if (loadingProgress >= 100) {
            loadingProgress = 100;
            
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }, 500);
            
            clearInterval(interval);
        }
    }, 200);
}

window.addEventListener('message', function(event) {
    if (event.data.action === 'showLogin') {
        document.body.classList.add('visible');
        document.getElementById('login-window').style.display = 'flex';
        document.getElementById('app-window').style.display = 'none';
        document.getElementById('login-window').classList.add('fade-in');
    } else if (event.data.action === 'showApp') {
        username = event.data.username;
        playerGang = event.data.playerGang;
        playerIsManager = event.data.isManager;
        playerIsHighAuthority = event.data.isHighAuthority;

        document.getElementById('login-window').style.display = 'none';
        document.getElementById('app-window').style.display = 'flex';
        document.getElementById('app-window').classList.add('fade-in');
        showApp(event.data.isManager, event.data.isHighAuthority);
    } else if (event.data.action === 'loginFailed') {
        document.getElementById('login_error').innerHTML = '<i class="fas fa-exclamation-triangle"></i> ACCESS DENIED - INVALID CREDENTIALS';
    } else if (event.data.action === 'hideApp') {
        document.body.classList.remove('visible');
    }
});

function submitLogin() {
    let password = document.getElementById('login_password').value;
    fetch(`https://${GetParentResourceName()}/LoginBlackmarket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            password: password
        })
    });
}

function showApp(isManager, isHighAuthority) {
    document.body.classList.add('visible');

    let sidebarHTML = `
        <button onclick="showTab('orders')" class="slide-in">
            <i class="fas fa-shopping-cart"></i> Asset Requests
        </button>
    `;

    if (isManager) {
        sidebarHTML += `
            <button onclick="showTab('manager')" class="slide-in">
                <i class="fas fa-cogs"></i> Order Management
            </button>
        `;
    }

    if (isHighAuthority) {
        sidebarHTML += `
            <button onclick="showTab('approved')" class="slide-in">
                <i class="fas fa-check-circle"></i> Approved Orders
            </button>
        `;
    }

    sidebarHTML += `
        <button onclick="showTab('chat')" class="slide-in">
            <i class="fas fa-comments"></i> Secure Comms
        </button>
    `;

    document.querySelector('.sidebar').innerHTML = sidebarHTML;
    showTab('orders');
}

function showTab(tab) {
    const mainContent = document.getElementById('main-content');
    
    if (tab === 'orders') {
        mainContent.innerHTML = `
            <div class="fade-in">
                <h2><i class="fas fa-file-contract"></i> Asset Request Terminal</h2>
                
                <div class="info-card">
                    <div class="flex justify-between items-center mb-3">
                        <h3><i class="fas fa-shield-alt"></i> Encrypted Channel</h3>
                        <span class="status-badge status-accepted"><i class="fas fa-lock"></i> SECURED</span>
                    </div>
                    <p>All transmissions are encrypted with military-grade protocols. Ensure request specifications are accurate before transmission.</p>
                </div>
                
                <div class="mb-4">
                    <label for="asset_name"><i class="fas fa-tag"></i> Asset Designation</label>
                    <input type='text' id='asset_name' placeholder='Enter asset codename or identifier...'>
                </div>
                
                <div class="mb-4">
                    <label for="order_details"><i class="fas fa-clipboard-list"></i> Mission Parameters</label>
                    <textarea id='order_details' rows='6' placeholder='Provide detailed specifications, quantities, and operational requirements...'></textarea>
                    <div class="char-counter">
                        <span id="char-count">0</span>/500 characters
                    </div>
                </div>
                
                <button onclick='submitOrder()' class="w-full">
                    <i class="fas fa-paper-plane"></i> Transmit Request
                </button>
            </div>
        `;
        
        const textarea = document.getElementById('order_details');
        const charCount = document.getElementById('char-count');
        textarea.addEventListener('input', function() {
            charCount.textContent = this.value.length;
            if (this.value.length > 450) {
                charCount.style.color = 'var(--warning-color)';
            } else {
                charCount.style.color = 'var(--muted-text)';
            }
        });
        
    } else if (tab === 'manager') {
        mainContent.innerHTML = `
            <div class="fade-in">
                <h2><i class="fas fa-tasks"></i> Order Management Console</h2>
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Scanning for pending operations...</p>
                </div>
            </div>
        `;
        
        fetch(`https://${GetParentResourceName()}/RequestOrders`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: '{}'
        }).then(response => response.json()).then(orders => {
            const pendingOrders = orders.filter(order => order.status === 'Pending');
            
            let content = `
                <div class="fade-in">
                    <h2><i class="fas fa-tasks"></i> Order Management Console</h2>
                    <div class="info-card">
                        <div class="flex justify-between items-center">
                            <div>
                                <h3><i class="fas fa-hourglass-half"></i> Pending Operations</h3>
                                <p>Review and authorize incoming asset requests</p>
                            </div>
                            <div class="text-2xl font-bold text-center">
                                ${pendingOrders.length}
                            </div>
                        </div>
                    </div>
            `;
            
            if (pendingOrders.length === 0) {
                content += `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No Pending Operations</h3>
                        <p>All requests have been processed. New operations will appear here for authorization.</p>
                    </div>
                `;
            } else {
                content += `
                    <div class="rounded-xl overflow-hidden shadow-lg">
                        <table>
                            <thead>
                                <tr>
                                    <th><i class="fas fa-user"></i> Operative</th>
                                    <th><i class="fas fa-users"></i> Faction</th>
                                    <th><i class="fas fa-box"></i> Asset</th>
                                    <th><i class="fas fa-info-circle"></i> Details</th>
                                    <th><i class="fas fa-flag"></i> Status</th>
                                    <th><i class="fas fa-cog"></i> Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                pendingOrders.forEach(order => {
                    content += `
                        <tr>
                            <td class="font-medium">${order.player_name}</td>
                            <td>${order.gang_name}</td>
                            <td class="font-mono">${order.asset_name}</td>
                            <td>${order.order_details}</td>
                            <td><span class="status-badge status-pending"><i class="fas fa-clock"></i> ${order.status}</span></td>
                            <td>
                                <div class="flex gap-2">
                                    <button onclick="updateOrder(${order.id}, 'Accepted')" class="btn-success text-sm">
                                        <i class="fas fa-check"></i> Approve
                                    </button>
                                    <button onclick="updateOrder(${order.id}, 'Rejected')" class="btn-danger text-sm">
                                        <i class="fas fa-times"></i> Deny
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                });
                
                content += `
                            </tbody>
                        </table>
                    </div>
                `;
            }
            
            content += `</div>`;
            mainContent.innerHTML = content;
        }).catch(error => {
            mainContent.innerHTML = `
                <div class="fade-in">
                    <h2><i class="fas fa-tasks"></i> Order Management Console</h2>
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Connection Error</h3>
                        <p>Unable to establish secure connection. Check network status and retry.</p>
                        <button onclick="showTab('manager')" class="mt-3">
                            <i class="fas fa-redo"></i> Retry Connection
                        </button>
                    </div>
                </div>
            `;
        });
        
    } else if (tab === 'approved') {
        mainContent.innerHTML = `
            <div class="fade-in">
                <h2><i class="fas fa-check-circle"></i> Approved Operations</h2>
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading completed operations...</p>
                </div>
            </div>
        `;
        
        fetch(`https://${GetParentResourceName()}/GetApprovedOrders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}'
        }).then(response => response.json()).then(orders => {
            let content = `
                <div class="fade-in">
                    <h2><i class="fas fa-check-circle"></i> Approved Operations</h2>
                    <div class="info-card">
                        <div class="flex justify-between items-center">
                            <div>
                                <h3><i class="fas fa-clipboard-check"></i> Completed Requests</h3>
                                <p>Successfully authorized asset operations</p>
                            </div>
                            <div class="text-2xl font-bold text-center">
                                ${orders.length}
                            </div>
                        </div>
                    </div>
            `;
            
            if (orders.length === 0) {
                content += `
                    <div class="empty-state">
                        <i class="fas fa-clipboard"></i>
                        <h3>No Approved Operations</h3>
                        <p>Authorized operations will be displayed here for review and management.</p>
                    </div>
                `;
            } else {
                content += `
                    <div class="rounded-xl overflow-hidden shadow-lg">
                        <table>
                            <thead>
                                <tr>
                                    <th><i class="fas fa-user"></i> Operative</th>
                                    <th><i class="fas fa-users"></i> Faction</th>
                                    <th><i class="fas fa-box"></i> Asset</th>
                                    <th><i class="fas fa-info-circle"></i> Details</th>
                                    <th><i class="fas fa-flag"></i> Status</th>
                                    <th><i class="fas fa-cog"></i> Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                orders.forEach(order => {
                    content += `
                        <tr>
                            <td class="font-medium">${order.player_name}</td>
                            <td>${order.gang_name}</td>
                            <td class="font-mono">${order.asset_name}</td>
                            <td>${order.order_details}</td>
                            <td><span class="status-badge status-accepted"><i class="fas fa-check"></i> ${order.status}</span></td>
                            <td>
                                <button onclick="deleteOrder(${order.id})" class="btn-danger text-sm">
                                    <i class="fas fa-trash"></i> Purge
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                content += `
                            </tbody>
                        </table>
                    </div>
                `;
            }
            
            content += `</div>`;
            mainContent.innerHTML = content;
        }).catch(error => {
            mainContent.innerHTML = `
                <div class="fade-in">
                    <h2><i class="fas fa-check-circle"></i> Approved Operations</h2>
                    <div class="empty-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Connection Error</h3>
                        <p>Unable to retrieve approved operations. Check network status and retry.</p>
                        <button onclick="showTab('approved')" class="mt-3">
                            <i class="fas fa-redo"></i> Retry Connection
                        </button>
                    </div>
                </div>
            `;
        });
    } else if (tab === 'chat') {
        let isGangOnly = !playerIsManager && !playerIsHighAuthority && playerGang !== 'blackmarket';

        mainContent.innerHTML = `
            <div class="fade-in chat-container">
                <h2><i class="fas fa-satellite-dish"></i> Secure Communications</h2>
                
                <div class="chat-type-selector">
                    ${isGangOnly ? `
                        <button class="chat-type-btn active" data-type="gang" onclick="setChatType('gang')">
                            <i class="fas fa-users"></i> Faction Channel
                        </button>
                    ` : `
                        <button class="chat-type-btn ${currentChatType === 'public' ? 'active' : ''}" data-type="public" onclick="setChatType('public')">
                            <i class="fas fa-globe"></i> Underground Network
                        </button>
                        <button class="chat-type-btn ${currentChatType === 'gang' ? 'active' : ''}" data-type="gang" onclick="setChatType('gang')">
                            <i class="fas fa-users"></i> Faction Channel
                        </button>
                        <button class="chat-type-btn ${currentChatType === 'private' ? 'active' : ''}" data-type="private" onclick="setChatType('private')">
                            <i class="fas fa-lock"></i> Encrypted Direct
                        </button>
                    `}
                </div>
                
                <div id="gang-selector" style="display: ${currentChatType === 'private' ? 'block' : 'none'};">
                    <label for="targetGang"><i class="fas fa-crosshairs"></i> Select Target Faction</label>
                    <select id="targetGang" onchange="loadChatHistory()">
                        <option value="">-- Scanning Networks --</option>
                    </select>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Decrypting messages...</p>
                    </div>
                </div>
                
                <div class="chat-input">
                    <input type="text" id="chatMessageInput" placeholder="Type encrypted message..." onkeypress="if(event.key==='Enter') sendChatMessage()">
                    <button onclick="sendChatMessage()">
                        <i class="fas fa-paper-plane"></i> Transmit
                    </button>
                </div>
            </div>
        `;

        loadAllowedGangs();
        loadChatHistory();
    }
}

function submitOrder() {
    let assetName = document.getElementById('asset_name').value;
    let orderDetails = document.getElementById('order_details').value;

    if (!assetName.trim() || !orderDetails.trim()) {
        return;
    }

    fetch(`https://${GetParentResourceName()}/SubmitOrder`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            assetName: assetName,
            orderDetails: orderDetails
        })
    }).then(res => {
        document.getElementById('main-content').innerHTML = `
            <div class="success-message fade-in">
                <i class="fas fa-check-circle"></i>
                <h2>Request Transmitted Successfully</h2>
                <p>Your asset request has been encrypted and transmitted to our operations center. The request is now pending authorization.</p>
                <div class="info-card mt-4 mb-4">
                    <h3><i class="fas fa-info-circle"></i> Operation Details</h3>
                    <p><strong>Asset:</strong> ${assetName}</p>
                    <p><strong>Operation ID:</strong> #${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
                <p class="mb-4">You will receive notification once your request has been processed by authorized personnel.</p>
                <div class="flex gap-3 justify-center">
                    <button onclick="closeApp()" class="btn-secondary">
                        <i class="fas fa-power-off"></i> Close Terminal
                    </button>
                    <button onclick="showTab('orders')">
                        <i class="fas fa-plus"></i> Submit New Request
                    </button>
                </div>
            </div>
        `;
    }).catch(error => {
        document.getElementById('main-content').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Transmission Failed</h3>
                <p>Unable to transmit your request. Check network connection and retry.</p>
                <button onclick="showTab('orders')" class="mt-3">
                    <i class="fas fa-redo"></i> Retry Transmission
                </button>
            </div>
        `;
    });
}

function updateOrder(id, status) {
    fetch(`https://${GetParentResourceName()}/UpdateOrderStatus`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id: id, status: status })
    }).then(res => {
        showTab('manager');
    }).catch(error => {
        console.error('Failed to update order status:', error);
    });
}

function closeApp() {
    fetch(`https://${GetParentResourceName()}/closeApp`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: '{}'
    });
    document.body.classList.remove('visible');
    document.getElementById('app-window').classList.add('fade-out');
    document.getElementById('login-window').style.display = 'none';
    document.getElementById('app-window').style.display = 'none';
}

function deleteOrder(orderId) {
    fetch(`https://${GetParentResourceName()}/DeleteOrder`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ id: orderId })
    }).then(response => response.json()).then(result => {
        if (result.success) {
            showTab('approved');
        } else {
            console.error('Failed to delete order');
        }
    }).catch(error => {
        console.error('DeleteOrder error:', error);
    });
}