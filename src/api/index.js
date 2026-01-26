import { usersApi } from './users';
import { bookingsApi } from './bookings';
import { reviewsApi } from './reviews';
import { helpRequestsApi } from './helpRequests';
import { messagesApi } from './messages';
import { tutorStatsApi } from './tutorStats';
import { availabilityApi } from './availability';
import { notificationsApi } from './notifications';

export const api = {
  users: usersApi,
  bookings: bookingsApi,
  reviews: reviewsApi,
  helpRequests: helpRequestsApi,
  messages: messagesApi,
  tutorStats: tutorStatsApi,
  availability: availabilityApi,
  notifications: notificationsApi,
};

export default api;