// Loading screen simulation
let loadingMessages = [
    'CONFIGURING SECURITY PARAMETERS...',
    'VALIDATING SECURITY PROTOCOLS...',
    'ESTABLISHING SECURE CONNECTION...'
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
                        <div class="username">${msg.sender_name}</div>
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
        gangSelector.innerHTML = '<option value="">-- Select Gang --</option>';
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
                <div class="username">${event.data.message.sender || event.data.message.sender_name}</div>
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
        document.getElementById('login_error').innerText = 'ACCESS DENIED - INVALID CREDENTIALS';
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
            <span>📋</span> Asset Orders
        </button>
    `;

    if (isManager) {
        sidebarHTML += `
            <button onclick="showTab('manager')" class="slide-in">
                <span>⚙️</span> Manage Orders
            </button>
        `;
    }

    if (isHighAuthority) {
        sidebarHTML += `
            <button onclick="showTab('approved')" class="slide-in">
                <span>✅</span> Approved Orders
            </button>
        `;
    }

    sidebarHTML += `
        <button onclick="showTab('chat')" class="slide-in">
            <span>💬</span> Communications
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
                <h2>Asset Request Form</h2>
                
                <div class="info-card">
                    <div class="flex justify-between items-center mb-3">
                        <h3>🔒 Secure Channel</h3>
                        <span class="status-badge status-accepted">ENCRYPTED</span>
                    </div>
                    <p>All communications are encrypted and monitored. Ensure request details are accurate before submission.</p>
                </div>
                
                <div class="mb-4">
                    <label for="asset_name">Asset Designation</label>
                    <input type='text' id='asset_name' placeholder='Enter asset name or code...'>
                </div>
                
                <div class="mb-4">
                    <label for="order_details">Request Details</label>
                    <textarea id='order_details' rows='6' placeholder='Provide detailed specifications and requirements...'></textarea>
                    <div class="char-counter">
                        <span id="char-count">0</span>/500 characters
                    </div>
                </div>
                
                <button onclick='submitOrder()' class="w-full">
                    Submit Request
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
                <h2>Order Management</h2>
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading pending orders...</p>
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
                    <h2>Order Management</h2>
                    <div class="info-card">
                        <div class="flex justify-between items-center">
                            <div>
                                <h3>Pending Orders</h3>
                                <p>Review and process incoming asset requests</p>
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
                        <div class="icon">📭</div>
                        <h3>No Pending Orders</h3>
                        <p>All orders have been processed. New requests will appear here.</p>
                    </div>
                `;
            } else {
                content += `
                    <div class="rounded-xl overflow-hidden shadow-lg">
                        <table>
                            <thead>
                                <tr>
                                    <th>Player</th>
                                    <th>Gang</th>
                                    <th>Asset</th>
                                    <th>Details</th>
                                    <th>Status</th>
                                    <th>Actions</th>
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
                            <td><span class="status-badge status-pending">${order.status}</span></td>
                            <td>
                                <div class="flex gap-2">
                                    <button onclick="updateOrder(${order.id}, 'Accepted')" class="btn-success text-sm">Accept</button>
                                    <button onclick="updateOrder(${order.id}, 'Rejected')" class="btn-danger text-sm">Reject</button>
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
                    <h2>Order Management</h2>
                    <div class="empty-state">
                        <div class="icon">⚠️</div>
                        <h3>Connection Error</h3>
                        <p>Unable to load orders. Please check your connection and try again.</p>
                        <button onclick="showTab('manager')" class="mt-3">Retry</button>
                    </div>
                </div>
            `;
        });
        
    } else if (tab === 'approved') {
        mainContent.innerHTML = `
            <div class="fade-in">
                <h2>Approved Orders</h2>
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading approved orders...</p>
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
                    <h2>Approved Orders</h2>
                    <div class="info-card">
                        <div class="flex justify-between items-center">
                            <div>
                                <h3>Completed Requests</h3>
                                <p>Successfully processed asset orders</p>
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
                        <div class="icon">📋</div>
                        <h3>No Approved Orders</h3>
                        <p>Approved orders will be displayed here for review and management.</p>
                    </div>
                `;
            } else {
                content += `
                    <div class="rounded-xl overflow-hidden shadow-lg">
                        <table>
                            <thead>
                                <tr>
                                    <th>Player</th>
                                    <th>Gang</th>
                                    <th>Asset</th>
                                    <th>Details</th>
                                    <th>Status</th>
                                    <th>Actions</th>
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
                            <td><span class="status-badge status-accepted">${order.status}</span></td>
                            <td>
                                <button onclick="deleteOrder(${order.id})" class="btn-danger text-sm">Delete</button>
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
                    <h2>Approved Orders</h2>
                    <div class="empty-state">
                        <div class="icon">⚠️</div>
                        <h3>Connection Error</h3>
                        <p>Unable to load approved orders. Please check your connection and try again.</p>
                        <button onclick="showTab('approved')" class="mt-3">Retry</button>
                    </div>
                </div>
            `;
        });
    } else if (tab === 'chat') {
        let isGangOnly = !playerIsManager && !playerIsHighAuthority && playerGang !== 'blackmarket';

        mainContent.innerHTML = `
            <div class="fade-in chat-container">
                <h2>Communications Hub</h2>
                
                <div class="chat-type-selector">
                    ${isGangOnly ? `
                        <button class="chat-type-btn active" data-type="gang" onclick="setChatType('gang')">
                            <span>👥</span> Gang Chat
                        </button>
                    ` : `
                        <button class="chat-type-btn ${currentChatType === 'public' ? 'active' : ''}" data-type="public" onclick="setChatType('public')">
                            <span>🌐</span> Black Market
                        </button>
                        <button class="chat-type-btn ${currentChatType === 'gang' ? 'active' : ''}" data-type="gang" onclick="setChatType('gang')">
                            <span>👥</span> Gang Chat
                        </button>
                        <button class="chat-type-btn ${currentChatType === 'private' ? 'active' : ''}" data-type="private" onclick="setChatType('private')">
                            <span>🔒</span> Private Chat
                        </button>
                    `}
                </div>
                
                <div id="gang-selector" style="display: ${currentChatType === 'private' ? 'block' : 'none'};">
                    <label for="targetGang">Select Target Gang</label>
                    <select id="targetGang" onchange="loadChatHistory()">
                        <option value="">-- Loading Gangs --</option>
                    </select>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="loading-state">
                        <div class="spinner"></div>
                        <p>Loading messages...</p>
                    </div>
                </div>
                
                <div class="chat-input">
                    <input type="text" id="chatMessageInput" placeholder="Type your message..." onkeypress="if(event.key==='Enter') sendChatMessage()">
                    <button onclick="sendChatMessage()">
                        <span>📤</span> Send
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
                <div style="font-size: 64px; margin-bottom: 24px;">✅</div>
                <h2>Request Submitted Successfully</h2>
                <p>Your asset request has been transmitted to our operations center and is now pending review.</p>
                <div class="info-card mt-4 mb-4">
                    <h3>Request Details</h3>
                    <p><strong>Asset:</strong> ${assetName}</p>
                    <p><strong>Order ID:</strong> #${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
                <p class="mb-4">You will be notified once your request has been processed by authorized personnel.</p>
                <div class="flex gap-3 justify-center">
                    <button onclick="closeApp()" class="btn-secondary">Close Terminal</button>
                    <button onclick="showTab('orders')">Submit Another Request</button>
                </div>
            </div>
        `;
    }).catch(error => {
        document.getElementById('main-content').innerHTML = `
            <div class="empty-state">
                <div class="icon">❌</div>
                <h3>Submission Failed</h3>
                <p>Unable to submit your request. Please check your connection and try again.</p>
                <button onclick="showTab('orders')" class="mt-3">Try Again</button>
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