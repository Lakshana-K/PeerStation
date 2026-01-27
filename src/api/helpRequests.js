// ========================================
// FILE: src/api/helpRequests.js
// REPLACE: Your existing src/api/helpRequests.js
// ========================================

import { API_URL } from './config';

export const helpRequestsApi = {
  async getAll() {
    const response = await fetch(`${API_URL}/helprequests`);
    const data = await response.json();
    return { data, status: 200 };
  },

  async getById(id) {
    const response = await fetch(`${API_URL}/helprequests`);
    const requests = await response.json();
    const request = requests.find(r => r.requestId === id);
    return {
      data: request || null,
      status: request ? 200 : 404,
    };
  },

  async getByStudent(studentId) {
    const response = await fetch(`${API_URL}/helprequests`);
    const requests = await response.json();
    const filtered = requests.filter(r => r.studentId === studentId);
    return {
      data: filtered,
      status: 200,
    };
  },

  async getOpen() {
    const response = await fetch(`${API_URL}/helprequests`);
    const requests = await response.json();
    const filtered = requests.filter(r => r.status === 'open');
    return {
      data: filtered,
      status: 200,
    };
  },

  async create(requestData) {
    const response = await fetch(`${API_URL}/helprequests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...requestData,
        status: 'open',
        claimedBy: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
    });
    const data = await response.json();
    return { data, status: 201 };
  },

  async claim(requestId, tutorId) {
    const response = await fetch(`${API_URL}/helprequests/${requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'claimed',
        claimedBy: tutorId,
      })
    });
    const data = await response.json();
    return { data, status: 200 };
  },

  async delete(id) {
    const response = await fetch(`${API_URL}/helprequests/${id}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    return { data, status: 200 };
  },
};