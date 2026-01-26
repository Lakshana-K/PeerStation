const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const notificationsApi = {
  async getAll() {
    const response = await fetch(`${API_URL}/notifications`);
    const data = await response.json();
    return { data };
  },

  async getByUser(userId) {
    const response = await fetch(`${API_URL}/notifications`);
    const notifications = await response.json();
    const userNotifications = notifications.filter(n => n.userId === userId);
    return { data: userNotifications };
  },

  async getUnreadCount(userId) {
    const response = await fetch(`${API_URL}/notifications`);
    const notifications = await response.json();
    const unread = notifications.filter(n => n.userId === userId && !n.isRead);
    return { data: { count: unread.length } };
  },

  async getRecent(userId, limit = 5) {
    const response = await fetch(`${API_URL}/notifications`);
    const notifications = await response.json();
    const userNotifications = notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
    return { data: userNotifications };
  },

  async markAsRead(notificationId) {
    const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead: true, readAt: new Date().toISOString() })
    });
    const data = await response.json();
    return { data };
  },

  async markAllAsRead(userId) {
    try {
      // Get all notifications for this user
      const response = await fetch(`${API_URL}/notifications`);
      const notifications = await response.json();
      const unread = notifications.filter(n => n.userId === userId && !n.isRead);
      
      // Mark each unread notification as read
      const updatePromises = unread.map(notification => 
        fetch(`${API_URL}/notifications/${notification.notificationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true, readAt: new Date().toISOString() })
        })
      );
      
      await Promise.all(updatePromises);
      
      return { data: { success: true, count: unread.length } };
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      throw error;
    }
  },

  async create(notificationData) {
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...notificationData,
        isRead: false,
        readAt: null,
        createdAt: new Date().toISOString()
      })
    });
    const data = await response.json();
    return { data };
  },

  async delete(notificationId) {
    const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    return { data };
  }
};
