import { api } from '../api';

export const createNotification = async (userId, type, data) => {
  const notifications = {
    // When someone books a session with you (tutor)
    SESSION_BOOKED: {
      title: '🎓 New Session Booked!',
      message: `${data.studentName} booked a session for ${data.subject} on ${data.date}`,
      actionUrl: '/sessions'
    },
    
    // When your booking is confirmed (student)
    BOOKING_CONFIRMED: {
      title: '✅ Booking Confirmed!',
      message: `Your session with ${data.tutorName} for ${data.subject} is confirmed`,
      actionUrl: '/sessions'
    },
    
    // When session is completed
    SESSION_COMPLETED: {
      title: '🎉 Session Completed!',
      message: `Your session for ${data.subject} has been completed`,
      actionUrl: '/sessions'
    },
    
    // When someone claims your help request
    HELP_REQUEST_CLAIMED: {
      title: '🙋 Help Request Claimed!',
      message: `${data.tutorName} claimed your help request for ${data.topic}`,
      actionUrl: '/help-requests'
    },
    
    // When you get a review
    NEW_REVIEW: {
      title: '⭐ New Review!',
      message: `${data.studentName} left you a ${data.rating}-star review`,
      actionUrl: '/profile'
    },
    
    // When session is cancelled
    SESSION_CANCELLED: {
      title: '❌ Session Cancelled',
      message: `Your session for ${data.subject} on ${data.date} was cancelled`,
      actionUrl: '/sessions'
    }
  };

  const template = notifications[type];
  if (!template) {
    console.error('Unknown notification type:', type);
    return;
  }

  try {
    await api.notifications.create({
      userId,
      type,
      title: template.title,
      message: template.message,
      actionUrl: template.actionUrl,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};