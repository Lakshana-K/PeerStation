import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { createNotification } from '../utils/notificationHelper';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import Modal from '../components/common/Modal';

export default function Sessions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [roleView, setRoleView] = useState('student');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const usersRes = await api.users.getAll();
      const users = usersRes.data || [];
      setUsersData(users);

      const allBookingsResponse = await api.bookings.getAll();
      const userBookings = allBookingsResponse.data.filter(
        b => b.studentId === user.userId || b.tutorId === user.userId
      );

      // Load reviews from API to check which bookings have been reviewed
      const allReviewsResponse = await api.reviews.getAll();
      const allReviews = allReviewsResponse.data || [];

      const bookingsWithInfo = userBookings.map(booking => {
        const isStudent = booking.studentId === user.userId;
        const otherUserId = isStudent ? booking.tutorId : booking.studentId;
        const otherUser = users.find(u => u.userId === otherUserId);

        const hasReviewed = allReviews.some(
          r => r.bookingId === booking.bookingId && r.studentId === user.userId
        );

        return {
          ...booking,
          otherUser,
          isStudent,
          isTutor: !isStudent,
          hasReviewed
        };
      });

      // Sort by date (newest first)
      bookingsWithInfo.sort((a, b) => {
        const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
        const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
        return dateB - dateA;
      });

      setBookings(bookingsWithInfo);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this session?')) return;

    try {
      const booking = bookings.find(b => b.bookingId === bookingId);

      await api.bookings.update(bookingId, { status: 'cancelled' });

      // 🔔 Notify the other person
      const otherUserId = booking.isStudent ? booking.tutorId : booking.studentId;
      await createNotification(otherUserId, 'SESSION_CANCELLED', {
        subject: booking.subject,
        date: new Date(booking.scheduledDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      });

      loadBookings();
      alert('Session cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel session');
    }
  };

  const handleCompleteSession = async (bookingId) => {
    if (!confirm('Mark this session as completed?')) return;

    try {
      const booking = bookings.find(b => b.bookingId === bookingId);

      await api.bookings.update(bookingId, { status: 'completed' });

      // 🔔 Notify the student
      await createNotification(booking.studentId, 'SESSION_COMPLETED', {
        subject: booking.subject
      });

      loadBookings();
      alert('Session marked as completed!');
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to complete session');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.reviews.create({
        bookingId: selectedBooking.bookingId,
        tutorId: selectedBooking.otherUser.userId,
        studentId: user.userId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        createdAt: new Date().toISOString()
      });

      // 🔔 Notify the tutor about the review
      await createNotification(selectedBooking.otherUser.userId, 'NEW_REVIEW', {
        studentName: user.name,
        rating: reviewData.rating
      });

      setShowReviewModal(false);
      setReviewData({ rating: 5, comment: '' });
      loadBookings();

      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  if (loading) return <Loading text="Loading sessions..." />;

  // Filter by role first
  const roleFilteredBookings = bookings.filter(b =>
    roleView === 'student' ? b.isStudent : b.isTutor
  );

  // Then filter by status
  const filteredBookings = filter === 'all'
    ? roleFilteredBookings
    : filter === 'upcoming'
      ? roleFilteredBookings.filter(b => {
          const dateTime = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
          return ['upcoming', 'pending', 'confirmed'].includes(b.status) && dateTime > new Date();
        })
      : roleFilteredBookings.filter(b => b.status === filter);

  // Calculate counts based on role view
  const counts = {
    all: roleFilteredBookings.length,
    completed: roleFilteredBookings.filter(b => b.status === 'completed').length,
    upcoming: roleFilteredBookings.filter(b => {
      const dateTime = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
      return ['upcoming', 'pending', 'confirmed'].includes(b.status) && dateTime > new Date();
    }).length,
    cancelled: roleFilteredBookings.filter(b => b.status === 'cancelled').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Sessions</h1>
          <p className="text-gray-600 text-lg">View and manage all your tutoring sessions</p>
        </div>

        {/* Role Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 rounded-full p-1.5">
            <button
              onClick={() => {
                setRoleView('student');
                setFilter('all');
              }}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                roleView === 'student'
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-xl">🎓</span>
              <span>I'm Learning</span>
            </button>
            <button
              onClick={() => {
                setRoleView('tutor');
                setFilter('all');
              }}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                roleView === 'tutor'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md transform scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-xl">👨‍🏫</span>
              <span>I'm Teaching</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`bg-white rounded-xl p-5 transition-all ${
            counts.all === 0 ? 'opacity-50' : 'shadow-sm hover:shadow-md'
          }`}>
            <div className={`text-4xl font-bold mb-1 bg-gradient-to-r ${
              roleView === 'student' ? 'from-indigo-600 to-indigo-800' : 'from-green-600 to-green-800'
            } bg-clip-text text-transparent`}>
              {counts.all}
            </div>
            <div className="text-xs font-semibold text-gray-500 tracking-wide">Total</div>
          </div>

          <div className={`bg-white rounded-xl p-5 transition-all ${
            counts.upcoming === 0
              ? 'opacity-50'
              : 'shadow-md hover:shadow-lg border-2 border-blue-100 transform hover:scale-105'
          }`}>
            <div className="text-4xl font-bold text-blue-600 mb-1">{counts.upcoming}</div>
            <div className="text-xs font-semibold text-gray-500 tracking-wide">Upcoming</div>
          </div>

          <div className={`bg-white rounded-xl p-5 transition-all ${
            counts.completed === 0 ? 'opacity-50' : 'shadow-sm hover:shadow-md'
          }`}>
            <div className="text-4xl font-bold text-green-600 mb-1">{counts.completed}</div>
            <div className="text-xs font-semibold text-gray-500 tracking-wide">Completed</div>
          </div>

          <div className={`bg-white rounded-xl p-5 transition-all ${
            counts.cancelled === 0 ? 'opacity-40' : 'opacity-70 hover:opacity-100'
          }`}>
            <div className="text-4xl font-bold text-red-400 mb-1">{counts.cancelled}</div>
            <div className="text-xs font-semibold text-gray-400 tracking-wide">Cancelled</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 bg-white rounded-lg p-1.5 shadow-sm border border-gray-200 overflow-x-auto">
          {[
            { key: 'all', label: 'All', icon: '📚' },
            { key: 'upcoming', label: 'Upcoming', icon: '🔜' },
            { key: 'completed', label: 'Completed', icon: '✅' },
            { key: 'cancelled', label: 'Cancelled', icon: '❌' }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold whitespace-nowrap transition-all ${
                filter === key
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
              {counts[key] > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  filter === key ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sessions List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-16 text-center">
            <div className="text-8xl mb-6">📭</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No sessions found</h3>
            <p className="text-gray-600 text-lg mb-8">
              {filter === 'all'
                ? roleView === 'student'
                  ? "You haven't booked any sessions yet"
                  : "You haven't hosted any sessions yet"
                : `No ${filter} sessions at the moment`
              }
            </p>
            {filter === 'all' && roleView === 'student' && (
              <Button onClick={() => navigate('/tutors')} size="lg">
                Find Tutors
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const dateTimeStr = `${booking.scheduledDate}T${booking.scheduledTime}`;
              const date = new Date(dateTimeStr);

              const dateStr = !isNaN(date) ? date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }) : 'Invalid Date';

              const timeStr = !isNaN(date) ? date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
              }) : 'Invalid Time';

              const dateTime = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
              const canCancel = ['upcoming', 'pending', 'confirmed'].includes(booking.status) && dateTime > new Date();
              const canReview = booking.status === 'completed' && booking.isStudent && !booking.hasReviewed;
              const canComplete = ['upcoming', 'pending', 'confirmed'].includes(booking.status) && dateTime < new Date() && !booking.isStudent;

              const accentColor =
                booking.status === 'completed' ? 'bg-green-500' :
                ['upcoming', 'pending', 'confirmed'].includes(booking.status) ? 'bg-blue-500' :
                'bg-red-500';

              return (
                <div
                  key={booking.bookingId}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="flex">
                    <div className={`w-1.5 ${accentColor}`}></div>
                    <div className="flex-1 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4 flex-1">
                          <img
                            src={booking.otherUser?.profilePicture || 'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff'}
                            alt={booking.otherUser?.name}
                            className="w-14 h-14 rounded-xl"
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-0.5">
                              {booking.subject} <span className="text-gray-300">•</span> {booking.specificTopic}
                            </h3>
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold text-indigo-600">{booking.otherUser?.name}</span>
                              <span className="text-gray-400 mx-1.5">•</span>
                              <span className="text-gray-500">{roleView === 'student' ? 'Tutor' : 'Student'}</span>
                            </p>
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-lg font-semibold text-xs capitalize ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                          ['upcoming', 'pending', 'confirmed'].includes(booking.status) ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {['pending', 'confirmed'].includes(booking.status) ? 'Upcoming' : booking.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 mb-4 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{timeStr}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-indigo-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-semibold">{booking.duration} mins</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="font-medium">{booking.format}</span>
                        </div>
                      </div>

                      {canReview && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">⭐</span>
                            <p className="text-sm font-semibold text-yellow-900">
                              Help others by leaving a review!
                            </p>
                          </div>
                        </div>
                      )}

                      {booking.hasReviewed && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2.5">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-semibold text-green-900">Review submitted</p>
                          </div>
                        </div>
                      )}

                      {booking.additionalNotes && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Notes:</span> {booking.additionalNotes}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/profile/${booking.otherUser?.userId}`)}
                        >
                          View Profile
                        </Button>

                        {canCancel && (
                          <button
                            onClick={() => handleCancelBooking(booking.bookingId)}
                            className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}

                        {canComplete && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteSession(booking.bookingId)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            ✓ Mark Complete
                          </Button>
                        )}

                        {canReview && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowReviewModal(true);
                            }}
                          >
                            Leave Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Leave a Review"
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewData({ ...reviewData, rating: star })}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <svg
                    className={`w-12 h-12 ${star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Review *</label>
            <textarea
              value={reviewData.comment}
              onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows="4"
              placeholder="Share your experience with this tutor..."
              required
            ></textarea>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowReviewModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth>
              Submit Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
