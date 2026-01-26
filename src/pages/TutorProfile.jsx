import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';


export default function TutorProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    subject: '',
    specificTopic: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    format: 'Online',
    location: '',
    additionalNotes: ''
  });

  useEffect(() => {
    loadTutorData();
  }, [id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadTutorData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [id]);

const loadTutorData = async () => {
  try {
    console.log('Loading tutor profile for ID:', id);

    const usersRes = await api.users.getAll();
    const users = usersRes.data || [];
    setUsersData(users);

    const tutorInfo = users.find(u => u.userId === id);

      if (!tutorInfo) {
        console.log('Tutor not found!');
        setLoading(false);
        return;
      }
      console.log('Tutor found:', tutorInfo.name);
      setTutor(tutorInfo);

      const bookingsRes = await api.bookings.getAll();
      const allBookings = bookingsRes.data || [];
      console.log('Total bookings loaded:', allBookings.length);
      
      const tutorBookings = allBookings.filter(b => b.tutorId === id);
      console.log('Tutor bookings:', tutorBookings);
      
      const completedSessions = tutorBookings.filter(b => b.status === 'completed').length;
      console.log('Completed sessions:', completedSessions);

      const reviewsRes = await api.reviews.getByTutor(id);
      const tutorReviews = reviewsRes.data || [];
      console.log('Tutor reviews:', tutorReviews);
      setReviews(tutorReviews);
      
      let averageRating = 0;
      if (tutorReviews.length > 0) {
        const sum = tutorReviews.reduce((acc, r) => acc + r.rating, 0);
        averageRating = sum / tutorReviews.length;
      }
      console.log('Average rating:', averageRating);

      let responseRate = 95; 

      const calculatedStats = {
        totalSessionsGiven: completedSessions,
        averageRating: averageRating,
        totalReviews: tutorReviews.length,
        responseRate: responseRate,
        isVerifiedHelper: completedSessions >= 3
      };
      console.log('Setting stats:', calculatedStats);
      setStats(calculatedStats);

      setReviews(tutorReviews);

      const availabilityRes = await api.availability.getWeeklySchedule(id);
      const weeklySchedule = availabilityRes.data || {};
      setAvailability(weeklySchedule);

    } catch (error) {
      console.error('Error loading tutor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    alert('Booking request sent successfully!');
    setShowBookingModal(false);
    navigate('/sessions');
  };

  const handleMessage = () => {
    navigate(`/messages?chat=${id}`);
  };

  if (loading) return <Loading text="Loading tutor profile..." />;
  
  if (tutor && tutor.userId === user.userId) {
    navigate('/profile');
    return null;
  }
  
  if (!tutor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tutor Not Found</h2>
          <p className="text-gray-600 mb-4">The tutor you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/tutors')}>Browse Tutors</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/tutors')}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tutors
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <div className="text-center">
                {/* Profile Picture */}
                <div className="relative inline-block mb-4">
                  <img
                    src={tutor.profilePicture}
                    alt={tutor.name}
                    className="w-32 h-32 rounded-full mx-auto border-4 border-white shadow-lg"
                  />
                  {stats?.isVerifiedHelper && (
                    <div 
                      className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full p-2 shadow-lg"
                      title="Verified Helper - 3+ sessions completed"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Name & Education */}
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{tutor.name}</h1>
                <p className="text-gray-600 mb-4">{tutor.educationLevel} • Year {tutor.year}</p>

                {/* Stats Grid */}
                {stats && (
                  <div className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{stats.totalSessionsGiven}</div>
                      <div className="text-xs text-gray-600">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600">⭐ Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.responseRate}%</div>
                      <div className="text-xs text-gray-600">Response</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button fullWidth onClick={() => navigate(`/book-session?tutor=${id}`)}>
                    Book a Session
                  </Button>
                  <Button fullWidth variant="secondary" onClick={handleMessage}>
                    Send Message
                  </Button>
                </div>
              </div>
            </Card>

            {/* Subjects Card */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">📚</span>
                Subjects I can help with
              </h3>
              <div className="flex flex-wrap gap-2">
                {tutor.subjects.map((subject, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </Card>

            {/* Qualifications Card */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">🎓</span>
                Qualifications
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700 min-w-[80px]">GPA:</span>
                  <span className="text-gray-900 font-semibold">{tutor.gpa}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700 min-w-[80px]">Institution:</span>
                  <span className="text-gray-600">{tutor.institution}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700 min-w-[80px]">Course:</span>
                  <span className="text-gray-600">{tutor.course}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700 min-w-[80px]">Year:</span>
                  <span className="text-gray-600">Year {tutor.year}</span>
                </div>
              </div>
            </Card>

            {/* Availability Card */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-xl">📅</span>
                Availability
              </h3>
              {availability && Object.values(availability).some(slots => slots.length > 0) ? (
                <div className="space-y-2 text-sm">
                  {Object.keys(availability).map(day => {
                    const daySlots = availability[day];
                    if (daySlots.length === 0) return null;
                    
                    return (
                      <div key={day} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{day}:</span>
                          <span className="text-gray-600 ml-2">
                            {daySlots.map(slot => `${slot.start}-${slot.end}`).join(', ')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    This tutor hasn't set their availability yet. Click "Book a Session" to send a request.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Content - About & Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Me Section */}
            <Card>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{tutor.bio}</p>
            </Card>

            {/* Reviews Section */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Reviews ({reviews.length})
                </h2>
                {stats && stats.averageRating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
                            star <= Math.round(stats.averageRating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-semibold text-gray-900">
                      {stats.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {!reviews || reviews.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-6xl mb-3">📝</div>
                  <p className="text-gray-600 font-medium mb-1">No reviews yet</p>
                  <p className="text-gray-500 text-sm">Be the first to review this tutor!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const reviewer = usersData.find(u => u.userId === review.studentId);
                    return (
                      <div key={review.reviewId} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-start gap-4">
                          {/* Reviewer Avatar */}
                          <img
                            src={reviewer?.profilePicture || 'https://ui-avatars.com/api/?name=User'}
                            alt={reviewer?.name}
                            className="w-12 h-12 rounded-full flex-shrink-0"
                          />
                          
                          <div className="flex-1">
                            {/* Reviewer Name & Rating */}
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">{reviewer?.name || 'Anonymous'}</h4>
                                <p className="text-sm text-gray-500">
                                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                              
                              {/* Star Rating */}
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                            
                            {/* Review Comment */}
                            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title={`Book Session with ${tutor.name}`}
        size="lg"
      >
        <form onSubmit={handleBooking} className="space-y-4">
          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject / Module *
            </label>
            <select
              value={bookingData.subject}
              onChange={(e) => setBookingData({...bookingData, subject: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select subject</option>
              {tutor.subjects.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>
          </div>
          
          {/* Topic */}
          <Input
            label="Specific Topic *"
            name="specificTopic"
            value={bookingData.specificTopic}
            onChange={(e) => setBookingData({...bookingData, specificTopic: e.target.value})}
            placeholder="e.g., React Hooks, OOP Concepts"
            required
          />
          
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Preferred Date *"
              type="date"
              value={bookingData.scheduledDate}
              onChange={(e) => setBookingData({...bookingData, scheduledDate: e.target.value})}
              required
            />
            <Input
              label="Preferred Time *"
              type="time"
              value={bookingData.scheduledTime}
              onChange={(e) => setBookingData({...bookingData, scheduledTime: e.target.value})}
              required
            />
          </div>
          
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Duration *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 120].map(dur => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setBookingData({...bookingData, duration: dur})}
                  className={`py-2 rounded-lg border-2 font-medium transition-all ${
                    bookingData.duration === dur
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {dur} mins
                </button>
              ))}
            </div>
          </div>
          
          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Format *
            </label>
            <select
              value={bookingData.format}
              onChange={(e) => setBookingData({...bookingData, format: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Online">Online (Zoom/Google Meet)</option>
              <option value="In-person">In-person</option>
            </select>
          </div>
          
          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              value={bookingData.additionalNotes}
              onChange={(e) => setBookingData({...bookingData, additionalNotes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
              placeholder="Any specific questions or topics you'd like to cover..."
            ></textarea>
          </div>
          
          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Booking Summary</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>Tutor:</strong> {tutor.name}</p>
              <p><strong>Subject:</strong> {bookingData.subject || 'Not selected'}</p>
              <p><strong>Duration:</strong> {bookingData.duration} minutes</p>
              <p><strong>Format:</strong> {bookingData.format}</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowBookingModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth>
              Send Booking Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}