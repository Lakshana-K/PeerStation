import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';

export default function ClaimRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { request, studentId } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    if (!request) {
      navigate('/help-requests');
      return;
    }
    loadAvailableSlots();
  }, [request, navigate]);

  const loadAvailableSlots = async () => {
    try {
      console.log('Loading slots for tutor:', user.userId);
      const response = await api.availability.getByTutor(user.userId);
      console.log('Raw response:', response.data);
      
      const futureSlots = (response.data || []).filter(slot => {
        const slotDate = new Date(slot.date + 'T' + slot.startTime);
        const isFuture = slotDate > new Date();
        console.log('Slot:', slot.date, slot.startTime, 'Is future:', isFuture);
        return isFuture;
      });
      
      console.log('Future slots:', futureSlots);
      setAvailableSlots(futureSlots);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      alert('Please select an available time slot.');
      return;
    }

    setSubmitting(true);

    try {
      // Calculate duration from slot
      const start = new Date(`2000-01-01T${selectedSlot.startTime}`);
      const end = new Date(`2000-01-01T${selectedSlot.endTime}`);
      const duration = Math.round((end - start) / (1000 * 60)); 

      // Create booking
      await api.bookings.create({
        studentId: studentId,
        tutorId: user.userId,
        subject: request.subject,
        specificTopic: request.title,
        scheduledDate: selectedSlot.date,
        scheduledTime: selectedSlot.startTime,
        duration: duration.toString(),
        format: selectedSlot.format,
        location: selectedSlot.location || '',
        additionalNotes: additionalNotes
      });

      // Claim the help request
      await api.helpRequests.claim(request.requestId, user.userId);

      // Delete the booked slot from availability
      await api.availability.delete(selectedSlot.slotId);

      alert('Session booked successfully! 🎉\n\nThe student has been notified. The time slot has been removed from your availability.');
      navigate('/sessions');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to book session. Please try again.');
      setSubmitting(false);
    }
  };

  if (!request) {
    return null;
  }

  if (loading) {
    return <Loading text="Loading your available slots..." />;
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
            onClick={() => navigate('/help-requests')}
            className="flex items-center text-indigo-600 hover:text-indigo-700 mb-4 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Help Requests
          </button>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Select Your Available Time Slot</h1>
          <p className="text-gray-600 text-lg">
            Choose from your available slots to help this student
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Request Details */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Help Request</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="text-gray-900 font-medium mt-1">{request.title}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Subject</label>
                  <div className="mt-1">
                    <Badge variant="primary" size="large">{request.subject}</Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-700 text-sm mt-1 leading-relaxed">{request.description}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Urgency</label>
                  <div className="mt-1">
                    <Badge 
                      variant={
                        request.urgency === 'urgent' ? 'danger' : 
                        request.urgency === 'flexible' ? 'default' : 
                        'warning'
                      }
                    >
                      {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right: Available Slots */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Available Slot</h2>
                
                {availableSlots.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Available Slots</h3>
                    <p className="text-gray-600 mb-4">
                      You need to add available time slots before claiming requests.
                    </p>
                    <Button
                      type="button"
                      onClick={() => navigate('/availability')}
                      variant="secondary"
                    >
                      Go to Availability Settings
                    </Button>
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
                                    <p className="text-gray-600 text-xs mt-1">{slot.location}</p>
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

              {availableSlots.length > 0 && (
                <>
                  <Card>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={additionalNotes}
                      onChange={(e) => setAdditionalNotes(e.target.value)}
                      rows="4"
                      placeholder="Any preparation needed, materials to bring, or additional information for the student..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    ></textarea>
                  </Card>

                  {selectedSlot && (
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
                      <h4 className="font-bold text-green-900 mb-3">✅ Selected Session Details</h4>
                      <div className="space-y-2 text-sm text-green-800">
                        <p><strong>Subject:</strong> {request.subject}</p>
                        <p><strong>Topic:</strong> {request.title}</p>
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

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      onClick={() => navigate('/help-requests')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      fullWidth 
                      disabled={!selectedSlot || submitting}
                    >
                      {submitting ? 'Booking...' : 'Confirm & Book Session'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}