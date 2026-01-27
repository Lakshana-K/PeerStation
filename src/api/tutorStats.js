// ========================================
// FILE: src/api/tutorStats.js
// REPLACE: Your existing src/api/tutorStats.js
// ========================================

import { API_URL } from './config';

export const tutorStatsApi = {
  async getAll() {
    const response = await fetch(`${API_URL}/tutorstats`);
    const data = await response.json();
    return { data };
  },

  async getStats(tutorId) {
    const [bookingsRes, reviewsRes] = await Promise.all([
      fetch(`${API_URL}/bookings/tutor/${tutorId}`),
      fetch(`${API_URL}/reviews/tutor/${tutorId}`)
    ]);

    const bookings = await bookingsRes.json();
    const reviews = await reviewsRes.json();

    const totalSessions = bookings.filter(b => b.status === 'completed').length;
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
    const totalReviews = reviews.length;

    const totalEarnings = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.duration || 60), 0) / 60 * 20;

    const recentBookings = bookings
      .sort((a, b) => new Date(b.scheduledDateTime) - new Date(a.scheduledDateTime))
      .slice(0, 5);

    return {
      data: {
        totalSessions,
        averageRating,
        totalReviews,
        totalEarnings,
        recentBookings,
        responseRate: 95,
        completionRate: totalSessions > 0 ? (totalSessions / bookings.length) * 100 : 0
      }
    };
  }
};