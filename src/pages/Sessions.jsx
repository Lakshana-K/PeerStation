import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { createNotification } from '../utils/notificationHelper';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import Modal from '../components/common/Modal';

export default function Sessions() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('currentUser'));
  const [bookings, setBookings] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [roleView, setRoleView] = useState('learning'); // 'learning' or 'teaching'
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

    if (!user || !user.userId) {
      console.error('❌ User data is missing:', user);
      alert('Error: User information is not available. Please try logging in again.');
      return;
    }

    if (!selectedBooking) {
      console.error('❌ No booking selected');
      alert('Error: No session selected for review.');
      return;
    }

    let tutorId;
    if (selectedBooking.isStudent) {
      tutorId = selectedBooking.otherUser?.userId || selectedBooking.tutorId;
    } else {
      tutorId = selectedBooking.tutorId;
    }

    if (!tutorId) {
      console.error('❌ Tutor ID is missing from booking:', selectedBooking);
      alert('Error: Tutor information is missing. Please try again.');
      return;
    }

    console.log('📝 Submitting review with data:', {
      bookingId: selectedBooking.bookingId,
      tutorId: tutorId,
      studentId: user.userId,
      rating: reviewData.rating,
      comment: reviewData.comment
    });

    try {
      const reviewPayload = {
        bookingId: selectedBooking.bookingId,
        tutorId: tutorId,
        studentId: user.userId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        createdAt: new Date().toISOString()
      };

      await api.reviews.create(reviewPayload);

      await createNotification(tutorId, 'NEW_REVIEW', {
        studentName: user.name,
        rating: reviewData.rating
      });

      setShowReviewModal(false);
      setReviewData({ rating: 5, comment: '' });
      loadBookings();

      alert('Review submitted successfully!');
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Failed to submit review: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) return <Loading text="Loading sessions..." />;

  const roleFilteredBookings = bookings.filter(b =>
    roleView === 'learning' ? b.isStudent : b.isTutor
  );

  const filteredBookings = filter === 'all'
    ? roleFilteredBookings
    : filter === 'upcoming'
      ? roleFilteredBookings.filter(b => {
          const dateTime = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
          return ['upcoming', 'pending', 'confirmed'].includes(b.status) && dateTime > new Date();
        })
      : filter === 'completed'
        ? roleFilteredBookings.filter(b => b.status === 'completed')
        : roleFilteredBookings.filter(b => b.status === 'cancelled');

  const stats = {
    total: roleFilteredBookings.length,
    upcoming: roleFilteredBookings.filter(b => {
      const dateTime = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
      return ['upcoming', 'pending', 'confirmed'].includes(b.status) && dateTime > new Date();
    }).length,
    completed: roleFilteredBookings.filter(b => b.status === 'completed').length,
    cancelled: roleFilteredBookings.filter(b => b.status === 'cancelled').length
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-indigo-500',
      'bg-red-500'
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="mt-1 text-sm text-gray-600">View and manage all your tutoring sessions</p>
        </div>

        {/* Role Toggle - NEW UI */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full bg-gray-100 p-1">
            <button
              onClick={() => setRoleView('learning')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                roleView === 'learning'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">🎓</span>
              I'm Learning
            </button>
            <button
              onClick={() => setRoleView('teaching')}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                roleView === 'teaching'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">🍎</span>
              I'm Teaching
            </button>
          </div>
        </div>

        {/* Stats Cards - NEW UI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-4xl font-bold text-emerald-500 mb-1">{stats.total}</div>
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-4xl font-bold text-blue-500 mb-1">{stats.upcoming}</div>
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Upcoming</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-4xl font-bold text-emerald-500 mb-1">{stats.completed}</div>
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Completed</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-4xl font-bold text-red-300 mb-1">{stats.cancelled}</div>
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Cancelled</div>
          </div>
        </div>

        {/* Filter Tabs - NEW UI */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === 'all'
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span>📚</span>
            All
            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
              filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'
            }`}>{stats.total}</span>
          </button>
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === 'upcoming'
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span>🕐</span>
            Upcoming
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === 'completed'
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span>✅</span>
            Completed
            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
              filter === 'completed' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>{stats.completed}</span>
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === 'cancelled'
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span>❌</span>
            Cancelled
          </button>
        </div>

        {/* Sessions List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No sessions found</h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? `You don't have any sessions ${roleView === 'learning' ? 'as a student' : 'as a tutor'} yet.`
                : `No ${filter} sessions found ${roleView === 'learning' ? 'as a student' : 'as a tutor'}.`}
            </p>
            {roleView === 'learning' && (
              <Button onClick={() => navigate('/tutors')}>
                Find a Tutor
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const sessionDate = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
              const dateStr = sessionDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const timeStr = sessionDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });

              const isPast = sessionDate < new Date();
              const isUpcoming = !isPast && ['upcoming', 'pending', 'confirmed'].includes(booking.status);
              const isCompleted = booking.status === 'completed';
              const isCancelled = booking.status === 'cancelled';

              const canCancel = isUpcoming && !isCancelled;
              const canComplete = booking.isTutor && isUpcoming;
              const canReview = booking.isStudent && isCompleted && !booking.hasReviewed;

              const borderColor = isCompleted ? 'border-l-emerald-500' :
                                 isUpcoming ? 'border-l-blue-500' :
                                 'border-l-red-300';

              return (
                <div
                  key={booking.bookingId}
                  className={`bg-white rounded-2xl shadow-sm border-l-4 ${borderColor} border-t border-r border-b border-gray-100 overflow-hidden hover:shadow-md transition-all`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`w-14 h-14 rounded-xl ${getAvatarColor(booking.otherUser?.name)} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-lg font-bold">
                          {getInitials(booking.otherUser?.name)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {booking.subject} • {booking.specificTopic}
                            </h3>
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">{booking.otherUser?.name || 'Unknown User'}</span>
                              <span className="text-gray-400 mx-2">•</span>
                              <span>{roleView === 'learning' ? 'Tutor' : 'Student'}</span>
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            isCompleted ? 'bg-emerald-100 text-emerald-700' :
                            isUpcoming ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {isCompleted ? 'Completed' : isUpcoming ? 'Upcoming' : 'Cancelled'}
                          </span>
                        </div>

                        {/* Session Details */}
                        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <span>📅</span>
                            <span>{dateStr}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>🕐</span>
                            <span>{timeStr}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>⏱️</span>
                            <span className="font-semibold text-gray-900">{booking.duration} mins</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>📍</span>
                            <span>{booking.format}</span>
                          </div>
                        </div>

                        {/* Review Prompts */}
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

                        {/* Notes */}
                        {booking.additionalNotes && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">Notes:</span> {booking.additionalNotes}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/profile/${booking.otherUser?.userId}`)}
                            disabled={!booking.otherUser?.userId}
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
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