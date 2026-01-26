import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { api } from '../../api';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Load notification count and notifications
  useEffect(() => {
    if (isAuthenticated && user) {
      loadNotifications();
    }
  }, [isAuthenticated, user]);

  const loadNotifications = async () => {
    try {
      const [countRes, notificationsRes] = await Promise.all([
        api.notifications.getUnreadCount(user.userId),
        api.notifications.getRecent(user.userId, 5)
      ]);
      setNotificationCount(countRes.data?.count || 0);
      setNotifications(notificationsRes.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    await api.notifications.markAsRead(notification.notificationId);

    // Navigate to the action URL
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }

    // Close dropdown and reload
    setShowNotifications(false);
    loadNotifications();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-dropdown') && !event.target.closest('.notification-button')) {
        setShowNotifications(false);
      }
      if (!event.target.closest('.profile-dropdown') && !event.target.closest('.profile-button')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navLinkClass = (path) => {
    const base = "px-4 py-2 rounded-lg font-medium transition-colors duration-200";
    return isActive(path)
      ? `${base} bg-gray-700 text-white`
      : `${base} text-gray-200 hover:bg-gray-700 hover:text-white`;
  };

  return (
    <nav className="bg-gray-800 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-4">
            <img
                src="/peerstation.png"
                alt="PeerStation"
                className="w-12 h-12 object-contain"
            />
            <span className="text-2xl font-bold text-white">PeerStation</span>
            </Link>


          {/* Navigation Links */}
          {!isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link to="/" className={navLinkClass('/')}>
                Home
              </Link>
              <Link to="/login" className={navLinkClass('/login')}>
                Login
              </Link>
              <Link to="/signup" className={navLinkClass('/signup')}>
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                Dashboard
              </Link>
              <Link to="/tutors" className={navLinkClass('/tutors')}>
                Find Tutors
              </Link>
              <Link to="/help-requests" className={navLinkClass('/help-requests')}>
                Help Request
              </Link>
              <Link to="/messages" className={navLinkClass('/messages')}>
                Messages
              </Link>

              {/* Notification Bell with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="notification-button relative p-2 text-gray-200 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Panel */}
                {showNotifications && (
                  <div className="notification-dropdown absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className="text-4xl mb-2">🔔</div>
                          <p className="text-gray-600 text-sm">No notifications yet</p>
                        </div>
                      ) : (
                        <div>
                          {notifications.map((notification) => (
                            <div
                              key={notification.notificationId}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notification.isRead ? 'bg-indigo-50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Icon based on type */}
                                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                  !notification.isRead ? 'bg-indigo-600' : 'bg-gray-300'
                                }`}></div>

                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-sm mb-1 ${
                                    !notification.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <span className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-3 text-center border-t border-gray-200">
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            navigate('/notifications');
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="profile-button flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-200 hover:bg-gray-700 transition-colors"
                >
                  <img 
                    src={user?.profilePicture || 'https://i.pravatar.cc/150?img=1'} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-medium">{user?.name?.split(' ')[0]}</span>
                  <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="profile-dropdown absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/sessions"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Sessions
                    </Link>
                    {user?.roles?.includes('tutor') && (
                      <Link
                        to="/availability"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        Availability
                      </Link>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
