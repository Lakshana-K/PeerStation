import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import Card from '../components/common/Card';
import Loading from '../components/common/Loading';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.notifications.getByUser(user.userId);
      const sorted = (response.data || []).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setNotifications(sorted);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await api.notifications.markAsRead(notification.notificationId);
    }
    
    // Navigate to the action URL
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation(); // Prevent navigation
    
    if (!confirm('Delete this notification?')) return;
    
    try {
      await api.notifications.delete(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (loading) return <Loading text="Loading notifications..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600 text-lg">
            Stay updated with your tutoring activity
          </p>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Card className="text-center py-16">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-600">
              Notifications will appear here when you have activity
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const typeColors = {
                SESSION_BOOKED: 'bg-blue-50 border-blue-200',
                BOOKING_CONFIRMED: 'bg-green-50 border-green-200',
                SESSION_COMPLETED: 'bg-purple-50 border-purple-200',
                SESSION_CANCELLED: 'bg-red-50 border-red-200',
                HELP_REQUEST_CLAIMED: 'bg-yellow-50 border-yellow-200',
                NEW_REVIEW: 'bg-orange-50 border-orange-200'
              };

              const bgColor = typeColors[notification.type] || 'bg-gray-50 border-gray-200';

              return (
                <div
                  key={notification.notificationId}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group relative cursor-pointer transition-all ${
                    notification.isRead 
                      ? 'bg-white hover:bg-gray-50' 
                      : `${bgColor}`
                  } rounded-xl shadow-sm border hover:shadow-md overflow-hidden`}
                >
                  {/* Unread indicator bar */}
                  {!notification.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>
                  )}

                  <div className="p-5 pl-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        notification.isRead ? 'bg-gray-100' : 'bg-white shadow-sm'
                      }`}>
                        {notification.type === 'SESSION_BOOKED' && '🎓'}
                        {notification.type === 'BOOKING_CONFIRMED' && '✅'}
                        {notification.type === 'SESSION_COMPLETED' && '🎉'}
                        {notification.type === 'SESSION_CANCELLED' && '❌'}
                        {notification.type === 'HELP_REQUEST_CLAIMED' && '🙋'}
                        {notification.type === 'NEW_REVIEW' && '⭐'}
                        {!notification.type && '🔔'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-base mb-1 ${
                          notification.isRead 
                            ? 'font-medium text-gray-700' 
                            : 'font-bold text-gray-900'
                        }`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(notification.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                          {!notification.isRead && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => deleteNotification(notification.notificationId, e)}
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete notification"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}