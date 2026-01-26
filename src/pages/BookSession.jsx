import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { createNotification } from '../utils/notificationHelper';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';

export default function BookSession() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tutorIdFromUrl = searchParams.get('tutor');
  
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [bookingData, setBookingData] = useState({
    subject: '',
    specificTopic: '',
    additionalNotes: ''
  });

  useEffect(() => {
    if (tutorIdFromUrl) {
      loadData();
    }
  }, [tutorIdFromUrl]);

  const loadData = async () => {
    try {
      // Get all users to find tutor info
      const usersResponse = await api.users.getAll();
      const users = usersResponse.data || [];
      
      // Get tutor info
      const tutorInfo = users.find(u => u.userId === tutorIdFromUrl);
      setTutor(tutorInfo);
      
      // Get tutor's available slots
      const response = await api.availability.getByTutor(tutorIdFromUrl);
      console.log('Available slots:', response.data);
      
      // Show all slots 
      setAvailableSlots(response.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot) {
      alert('Please select a time slot.');
      return;
    }
    
    if (!bookingData.subject || !bookingData.specificTopic) {
      alert('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    
    try {
      // Calculate duration from slot
      const start = new Date(`2000-01-01T${selectedSlot.startTime}`);
      const end = new Date(`2000-01-01T${selectedSlot.endTime}`);
      const duration = Math.round((end - start) / (1000 * 60));

      // Create booking
      const bookingResponse = await api.bookings.create({
        studentId: user.userId,
        tutorId: tutorIdFromUrl,
        subject: bookingData.subject,
        specificTopic: bookingData.specificTopic,
        scheduledDate: selectedSlot.date,
        scheduledTime: selectedSlot.startTime,
        duration: duration.toString(),
        format: selectedSlot.format,
        location: selectedSlot.location || '',
        additionalNotes: bookingData.additionalNotes,
        status: 'upcoming'
      });

      console.log('✅ Booking created:', bookingResponse);

      // Delete the booked slot from availability
      await api.availability.delete(selectedSlot.slotId);
      console.log('✅ Slot deleted from availability');
      
      await createNotification(tutorIdFromUrl, 'SESSION_BOOKED', {
        studentName: user.name,
        subject: bookingData.subject,
        date: new Date(selectedSlot.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      });

      await createNotification(user.userId, 'BOOKING_CONFIRMED', {
        tutorName: tutor.name,
        subject: bookingData.subject
      });
      
      alert('🎉 Session booked successfully!');
      
      // Redirect to sessions page
      navigate('/sessions');
      
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) return <Loading text="Loading booking form..." />;

  if (!tutor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Request</h2>
          <p className="text-gray-600 mb-4">No tutor specified for booking.</p>
          <Button onClick={() => navigate('/tutors')}>Browse Tutors</Button>
        </Card>
      </div>
    );
  }

  // Group slots by date
  const groupedSlots = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedSlots).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-4 transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Book Session with {tutor.name}</h1>
          <p className="text-gray-600 text-lg">Select an available time slot and provide session details</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Tutor Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <div className="text-center">
                <img
                  src={tutor.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random`}
                  alt={tutor.name}
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                />
                <h2 className="text-xl font-semibold text-gray-900 mb-1">{tutor.name}</h2>
                <p className="text-gray-600 mb-4">{tutor.educationLevel} • Year {tutor.year}</p>
                
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">Subjects</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tutor.subjects?.map((subject, i) => (
                      <Badge key={i} variant="primary">{subject}</Badge>
                    ))}
                  </div>
                  
                  {tutor.bio && (
                    <>
                      <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                      <p className="text-sm text-gray-700">{tutor.bio}</p>
                    </>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Booking Form */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Session Details */}
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Details</h2>
                
                <div className="space-y-4">
                  {/* Subject Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject / Module <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bookingData.subject}
                      onChange={(e) => setBookingData({...bookingData, subject: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select subject</option>
                      {tutor.subjects?.map((s, i) => (
                        <option key={i} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Specific Topic */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specific Topic <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bookingData.specificTopic}
                      onChange={(e) => setBookingData({...bookingData, specificTopic: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., React Hooks, OOP Concepts, Database Queries"
                    />
                    <p className="text-sm text-gray-500 mt-1">Be specific about what you need help with</p>
                  </div>
                  
                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={bookingData.additionalNotes}
                      onChange={(e) => setBookingData({...bookingData, additionalNotes: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows="3"
                      placeholder="Any specific questions or topics you'd like to cover?"
                    ></textarea>
                  </div>
                </div>
              </Card>

              {/* Available Time Slots */}
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Select Time Slot <span className="text-red-500">*</span>
                </h2>
                
                {availableSlots.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Available Slots</h3>
                    <p className="text-gray-600 mb-4">
                      {tutor.name} hasn't set any available time slots yet.
                    </p>
                    <p className="text-sm text-gray-500">
                      Try messaging them or check back later!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedDates.map(date => {
                      const slots = groupedSlots[date];
                      
                      return (
                        <div key={date}>
                          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(date).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {slots.map(slot => (
                              <button
                                key={slot.slotId}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`text-left border-2 rounded-lg p-4 transition-all ${
                                  selectedSlot?.slotId === slot.slotId
                                    ? 'border-indigo-600 bg-indigo-50 shadow-md'
                                    : 'border-gray-200 hover:border-indigo-300 hover:shadow'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-bold text-gray-900 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {slot.startTime} - {slot.endTime}
                                  </span>
                                  {selectedSlot?.slotId === slot.slotId && (
                                    <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                                
                                <div className="space-y-1 text-sm">
                                  <Badge variant={slot.format === 'Online' ? 'primary' : 'success'}>
                                    {slot.format === 'Online' ? '💻 Online' : '🏫 In-person'}
                                  </Badge>
                                  {slot.location && (
                                    <p className="text-gray-600 text-xs mt-1">📍 {slot.location}</p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Booking Summary */}
              {selectedSlot && (
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
                  <h4 className="font-bold text-green-900 mb-3">✅ Booking Summary</h4>
                  <div className="space-y-2 text-sm text-green-800">
                    <p><strong>Tutor:</strong> {tutor.name}</p>
                    {bookingData.subject && <p><strong>Subject:</strong> {bookingData.subject}</p>}
                    {bookingData.specificTopic && <p><strong>Topic:</strong> {bookingData.specificTopic}</p>}
                    <p><strong>Date:</strong> {new Date(selectedSlot.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}</p>
                    <p><strong>Time:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}</p>
                    <p><strong>Format:</strong> {selectedSlot.format}</p>
                    {selectedSlot.location && (
                      <p><strong>Location:</strong> {selectedSlot.location}</p>
                    )}
                  </div>
                </Card>
              )}

              {/* Action Buttons */}
              {availableSlots.length > 0 && (
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button"
                    fullWidth 
                    disabled={!selectedSlot || !bookingData.subject || !bookingData.specificTopic || submitting}
                    onClick={handleBooking}
                  >
                    {submitting ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}