import { API_URL } from './config';

export const reviewsApi = {
  async getAll() {
    const response = await fetch(`${API_URL}/reviews`);
    const data = await response.json();
    return { data };
  },

  async getById(reviewId) {
    const response = await fetch(`${API_URL}/reviews`);
    const reviews = await response.json();
    const review = reviews.find(r => r.reviewId === reviewId);
    if (!review) {
      throw new Error('Review not found');
    }
    return { data: review };
  },

  async getByTutor(tutorId) {
    const response = await fetch(`${API_URL}/reviews/tutor/${tutorId}`);
    const data = await response.json();
    return { data };
  },

  async getByStudent(studentId) {
    const response = await fetch(`${API_URL}/reviews`);
    const reviews = await response.json();
    const filtered = reviews.filter(r => r.studentId === studentId);
    return { data: filtered };
  },

  async create(reviewData) {
    const response = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    const data = await response.json();
    return { data };
  },

  async markHelpful(reviewId) {
    const response = await fetch(`${API_URL}/reviews/${reviewId}/helpful`, {
      method: 'PUT'
    });
    const data = await response.json();
    return { data };
  }
};