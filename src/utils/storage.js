const storage = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  },

  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },

  setToken(token) {
    return this.set('authToken', token);
  },

  getToken() {
    return this.get('authToken');
  },

  setUser(user) {
    return this.set('currentUser', user);
  },

  getUser() {
    return this.get('currentUser');
  },

  logout() {
    this.remove('authToken');
    this.remove('currentUser');
    return true;
  },
};

export default storage;