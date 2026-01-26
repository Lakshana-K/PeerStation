const API_URL = 'http://localhost:3001/api';

export const messagesApi = {
  async getAll() {
    const response = await fetch(`${API_URL}/messages`);
    const data = await response.json();
    return { data };
  },

  async getConversation(userId1, userId2) {
    const response = await fetch(`${API_URL}/messages/conversation?userId1=${userId1}&userId2=${userId2}`);
    const data = await response.json();
    return { data };
  },

  async getUserConversations(userId) {
    const response = await fetch(`${API_URL}/messages`);
    const messages = await response.json();
    const userMessages = messages.filter(m => 
      m.senderId === userId || m.receiverId === userId
    );
    
    const conversationMap = new Map();
    userMessages.forEach(msg => {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(otherId) || 
          new Date(msg.sentAt) > new Date(conversationMap.get(otherId).sentAt)) {
        conversationMap.set(otherId, msg);
      }
    });
    
    return { data: Array.from(conversationMap.values()) };
  },

  async getByUser(userId) {
    const response = await fetch(`${API_URL}/messages`);
    const messages = await response.json();
    const userMessages = messages.filter(m => 
      m.senderId === userId || m.receiverId === userId
    );
    
    const conversationMap = {};
    userMessages.forEach(msg => {
      if (!conversationMap[msg.conversationId]) {
        conversationMap[msg.conversationId] = [];
      }
      conversationMap[msg.conversationId].push(msg);
    });
    
    Object.keys(conversationMap).forEach(convId => {
      conversationMap[convId].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    });
    
    return { data: conversationMap };
  },

  async send(messageData) {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...messageData,
        attachments: messageData.attachments || [],
        isRead: false,
        readAt: null
      })
    });
    const data = await response.json();
    return { data };
  },

  async markAsRead(messageId) {
    const response = await fetch(`${API_URL}/messages/${messageId}/read`, {
      method: 'PUT'
    });
    const data = await response.json();
    return { data };
  }
};