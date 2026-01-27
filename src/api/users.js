import { API_URL } from './config';

export const usersApi = {
  async getAll() {
    const response = await fetch(`${API_URL}/users`);
    const data = await response.json();
    return { data, status: 200 };
  },

  async getById(id) {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    const user = users.find(u => u.userId === id);
    return {
      data: user || null,
      status: user ? 200 : 404,
    };
  },

  async getByRole(role) {
    const response = await fetch(`${API_URL}/users`);
    const users = await response.json();
    const filtered = users.filter(u => u.roles?.includes(role) || u.role === role);
    return {
      data: filtered,
      status: 200,
    };
  },

  async login(email, password) {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const user = await response.json();
      return { data: user, status: 200 };
    } else {
      return {
        data: null,
        status: 401,
        error: 'Invalid credentials',
      };
    }
  },

  async create(userData) {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...userData,
        emailVerified: true,
        isActive: true,
        createdAt: new Date().toISOString()
      })
    });
    const data = await response.json();
    return { data, status: 201 };
  },

  async update(id, userData) {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    return { data, status: 200 };
  },

  async search(filters = {}) {
    const response = await fetch(`${API_URL}/users`);
    let users = await response.json();
    users = users.filter(u => u.roles?.includes('tutor') || u.role === 'tutor');

    if (filters.subject) {
      users = users.filter(u => 
        u.subjects?.some(s => s.toLowerCase().includes(filters.subject.toLowerCase()))
      );
    }

    if (filters.educationLevel) {
      users = users.filter(u => u.educationLevel === filters.educationLevel);
    }

    return {
      data: users,
      status: 200,
    };
  },
};