const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const bookingsApi = {
  async getAll() {
    const response = await fetch(`${API_URL}/bookings`);
    const data = await response.json();

    const normalized = (data || []).map((b) => {
      if ((!b.scheduledDate || !b.scheduledTime) && b.scheduledDateTime) {
        const dt = new Date(b.scheduledDateTime);
        if (!Number.isNaN(dt.getTime())) {
          const yyyy = dt.getUTCFullYear();
          const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(dt.getUTCDate()).padStart(2, '0');
          const hh = String(dt.getUTCHours()).padStart(2, '0');
          const min = String(dt.getUTCMinutes()).padStart(2, '0');

          return {
            ...b,
            scheduledDate: b.scheduledDate || `${yyyy}-${mm}-${dd}`,
            scheduledTime: b.scheduledTime || `${hh}:${min}`,
          };
        }
      }
      return b;
    });

    return { data: normalized };
  },

  async getById(bookingId) {
    const response = await fetch(`${API_URL}/bookings`);
    const bookings = await response.json();
    const booking = (bookings || []).find((b) => b.bookingId === bookingId);

    if (!booking) {
      throw new Error('Booking not found');
    }

    if ((!booking.scheduledDate || !booking.scheduledTime) && booking.scheduledDateTime) {
      const dt = new Date(booking.scheduledDateTime);
      if (!Number.isNaN(dt.getTime())) {
        const yyyy = dt.getUTCFullYear();
        const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(dt.getUTCDate()).padStart(2, '0');
        const hh = String(dt.getUTCHours()).padStart(2, '0');
        const min = String(dt.getUTCMinutes()).padStart(2, '0');

        return {
          data: {
            ...booking,
            scheduledDate: booking.scheduledDate || `${yyyy}-${mm}-${dd}`,
            scheduledTime: booking.scheduledTime || `${hh}:${min}`,
          },
        };
      }
    }

    return { data: booking };
  },

  async getByStudent(studentId) {
    const response = await fetch(`${API_URL}/bookings/student/${studentId}`);
    const data = await response.json();

    const normalized = (data || []).map((b) => {
      if ((!b.scheduledDate || !b.scheduledTime) && b.scheduledDateTime) {
        const dt = new Date(b.scheduledDateTime);
        if (!Number.isNaN(dt.getTime())) {
          const yyyy = dt.getUTCFullYear();
          const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(dt.getUTCDate()).padStart(2, '0');
          const hh = String(dt.getUTCHours()).padStart(2, '0');
          const min = String(dt.getUTCMinutes()).padStart(2, '0');

          return {
            ...b,
            scheduledDate: b.scheduledDate || `${yyyy}-${mm}-${dd}`,
            scheduledTime: b.scheduledTime || `${hh}:${min}`,
          };
        }
      }
      return b;
    });

    return { data: normalized };
  },

  async getByTutor(tutorId) {
    const response = await fetch(`${API_URL}/bookings/tutor/${tutorId}`);
    const data = await response.json();

    const normalized = (data || []).map((b) => {
      if ((!b.scheduledDate || !b.scheduledTime) && b.scheduledDateTime) {
        const dt = new Date(b.scheduledDateTime);
        if (!Number.isNaN(dt.getTime())) {
          const yyyy = dt.getUTCFullYear();
          const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(dt.getUTCDate()).padStart(2, '0');
          const hh = String(dt.getUTCHours()).padStart(2, '0');
          const min = String(dt.getUTCMinutes()).padStart(2, '0');

          return {
            ...b,
            scheduledDate: b.scheduledDate || `${yyyy}-${mm}-${dd}`,
            scheduledTime: b.scheduledTime || `${hh}:${min}`,
          };
        }
      }
      return b;
    });

    return { data: normalized };
  },

  async create(bookingData) {
    const scheduledDateTime = `${bookingData.scheduledDate}T${bookingData.scheduledTime}:00Z`;

    const isPast = new Date(scheduledDateTime) < new Date();

    const newBooking = {
      studentId: bookingData.studentId,
      tutorId: bookingData.tutorId,
      subject: bookingData.subject,
      specificTopic: bookingData.specificTopic,

      scheduledDate: bookingData.scheduledDate,
      scheduledTime: bookingData.scheduledTime,

      scheduledDateTime: scheduledDateTime,

      duration: bookingData.duration,
      format: bookingData.format,
      location: bookingData.location || '',
      additionalNotes: bookingData.additionalNotes || '',

      status: isPast ? 'completed' : 'pending',
      confirmedAt: isPast ? new Date().toISOString() : null,
      completedAt: isPast ? new Date().toISOString() : null,
    };

    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBooking),
    });

    const data = await response.json();
    return { data };
  },

  async update(bookingId, updates) {
    if (updates.status === 'confirmed' && !updates.confirmedAt) {
      updates.confirmedAt = new Date().toISOString();
    }
    if (updates.status === 'completed' && !updates.completedAt) {
      updates.completedAt = new Date().toISOString();
    }

    const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const data = await response.json();
    return { data };
  },

  async cancel(bookingId) {
    return this.update(bookingId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
    });
  },

  async getUpcoming(userId) {
    const response = await fetch(`${API_URL}/bookings`);
    const bookings = await response.json();
    const now = new Date();

    const upcoming = (bookings || []).filter((b) => {
      const dt = b.scheduledDateTime
        ? new Date(b.scheduledDateTime)
        : new Date(`${b.scheduledDate}T${b.scheduledTime}:00Z`);

      return (
        (b.studentId === userId || b.tutorId === userId) &&
        (b.status === 'confirmed' || b.status === 'pending') &&
        dt >= now
      );
    });

    const normalized = upcoming.map((b) => {
      if ((!b.scheduledDate || !b.scheduledTime) && b.scheduledDateTime) {
        const dt = new Date(b.scheduledDateTime);
        if (!Number.isNaN(dt.getTime())) {
          const yyyy = dt.getUTCFullYear();
          const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
          const dd = String(dt.getUTCDate()).padStart(2, '0');
          const hh = String(dt.getUTCHours()).padStart(2, '0');
          const min = String(dt.getUTCMinutes()).padStart(2, '0');

          return {
            ...b,
            scheduledDate: b.scheduledDate || `${yyyy}-${mm}-${dd}`,
            scheduledTime: b.scheduledTime || `${hh}:${min}`,
          };
        }
      }
      return b;
    });

    return { data: normalized };
  },
};
