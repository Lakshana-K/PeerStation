const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const availabilityApi = {
  async getAll() {
    const response = await fetch(`${API_URL}/availability`);
    const data = await response.json();
    return { data };
  },

  async getByTutor(tutorId) {
    const response = await fetch(`${API_URL}/availability/tutor/${tutorId}`);
    const data = await response.json();
    return { data };
  },

  async create(slotData) {
    const response = await fetch(`${API_URL}/availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slotData)
    });
    const data = await response.json();
    return { data };
  },

  async delete(slotId) {
    const response = await fetch(`${API_URL}/availability/${slotId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    return { data };
  },

  async getWeeklySchedule(tutorId) {
    const response = await fetch(`${API_URL}/availability/tutor/${tutorId}`);
    const slots = await response.json();
    
    // Group by day of week
    const schedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    slots.forEach(slot => {
      if (slot.dayOfWeek && schedule[slot.dayOfWeek]) {
        schedule[slot.dayOfWeek].push({
          start: slot.startTime,
          end: slot.endTime,
        });
      }
    });

    return { data: schedule };
  }
};