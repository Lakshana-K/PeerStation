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

    // CRITICAL FIX: Add validation checks
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

    // Get the tutor ID - handle both direct tutorId and nested otherUser
    let tutorId;
    if (selectedBooking.isStudent) {
      // If current user is student, the tutor is either in otherUser or tutorId
      tutorId = selectedBooking.otherUser?.userId || selectedBooking.tutorId;
    } else {
      // This shouldn't happen as only students can leave reviews, but just in case
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

      // 🔔 Notify the tutor about the review
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
          <p className="text-gray-600">Manage your tutoring sessions</p>
        </div>

        {/* Role Toggle */}
        {user.role === 'tutor' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1 mb-6 inline-flex">
            <button
              onClick={() => setRoleView('student')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                roleView === 'student'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              As Student
            </button>
            <button
              onClick={() => setRoleView('tutor')}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                roleView === 'tutor'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              As Tutor
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1 mb-8 inline-flex">
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'upcoming', label: `Upcoming (${counts.upcoming})` },
            { key: 'completed', label: `Completed (${counts.completed})` },
            { key: 'cancelled', label: `Cancelled (${counts.cancelled})` }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                filter === key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No sessions found</h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? `You don't have any sessions ${roleView === 'student' ? 'as a student' : 'as a tutor'} yet.`
                : `No ${filter} sessions found ${roleView === 'student' ? 'as a student' : 'as a tutor'}.`}
            </p>
            {roleView === 'student' && (
              <Button onClick={() => navigate('/tutors')}>
                Find a Tutor
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
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

              // Determine what actions are available
              const isPast = sessionDate < new Date();
              const isUpcoming = !isPast && ['upcoming', 'pending', 'confirmed'].includes(booking.status);
              const isCompleted = booking.status === 'completed';
              const isCancelled = booking.status === 'cancelled';

              const canCancel = isUpcoming && !isCancelled;
              const canComplete = booking.isTutor && isUpcoming;
              const canReview = booking.isStudent && isCompleted && !booking.hasReviewed;

              return (
                <div
                  key={booking.bookingId}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xl font-bold">
                            {booking.otherUser?.name?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-0.5">
                            {booking.subject} <span className="text-gray-300">•</span> {booking.specificTopic}
                          </h3>
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold text-indigo-600">{booking.otherUser?.name || 'Unknown User'}</span>
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