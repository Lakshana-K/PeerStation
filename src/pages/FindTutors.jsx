import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import Loading from '../components/common/Loading';

export default function FindTutors() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: '',
    educationLevel: '',
    minRating: '',
    verifiedOnly: false
  });

  useEffect(() => {
    loadTutors();
  }, []);

  const loadTutors = async () => {
    try {
      const usersRes = await api.users.getAll();
      const users = usersRes.data || [];

      const tutorsOnly = users.filter(u =>
        Array.isArray(u.roles) &&
        u.roles.map(r => r.toLowerCase()).includes('tutor') &&
        u.userId !== user.userId
      );

      const bookingsRes = await api.bookings.getAll();
      const allBookings = bookingsRes.data || [];

      const reviewsRes = await api.reviews.getAll();
      const allReviews = reviewsRes.data || [];

      const tutorsWithStats = tutorsOnly.map(tutor => {
        const completedSessions = allBookings.filter(
          b => b.tutorId === tutor.userId && b.status === 'completed'
        ).length;

        const tutorReviews = allReviews.filter(
          r => r.tutorId === tutor.userId
        );

        let averageRating = 0;
        if (tutorReviews.length > 0) {
          const sum = tutorReviews.reduce((acc, r) => acc + r.rating, 0);
          averageRating = sum / tutorReviews.length;
        }

        return {
          ...tutor,
          calculatedStats: {
            sessionsGiven: completedSessions,
            averageRating,
            responseRate: 95,
            isVerifiedHelper: completedSessions >= 3,
            totalReviews: tutorReviews.length
          }
        };
      });

      setTutors(tutorsWithStats);
      setFilteredTutors(tutorsWithStats);
    } catch (error) {
      console.error('Error loading tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, tutors]);

  const applyFilters = () => {
    let filtered = [...tutors];

    if (filters.subject) {
      filtered = filtered.filter(t =>
        t.subjects?.some(s =>
          s.toLowerCase().includes(filters.subject.toLowerCase())
        )
      );
    }

    if (filters.educationLevel) {
      filtered = filtered.filter(
        t => t.educationLevel === filters.educationLevel
      );
    }

    if (filters.minRating) {
      const minRating = parseFloat(filters.minRating);
      filtered = filtered.filter(
        t => t.calculatedStats.averageRating >= minRating
      );
    }

    if (filters.verifiedOnly) {
      filtered = filtered.filter(
        t => t.calculatedStats.isVerifiedHelper
      );
    }

    setFilteredTutors(filtered);
  };

  const handleMessageTutor = (tutorId) => {
    navigate(`/messages?chat=${tutorId}`);
  };

  if (loading) {
    return <Loading text="Loading tutors..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Find Your Peer Tutor
        </h1>

        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search by subject..."
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={filters.educationLevel}
              onChange={(e) => setFilters({ ...filters, educationLevel: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Education Levels</option>
              <option value="Polytechnic">Polytechnic</option>
              <option value="University">University</option>
              <option value="ITE">ITE</option>
            </select>

            <select
              value={filters.minRating}
              onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Any Rating</option>
              <option value="4.5">4.5+ ⭐</option>
              <option value="4.0">4.0+ ⭐</option>
              <option value="3.5">3.5+ ⭐</option>
              <option value="3.0">3.0+ ⭐</option>
            </select>

            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white">
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Verified Only</span>
            </label>

            <div className="text-gray-600 flex items-center px-4">
              <span className="font-semibold">{filteredTutors.length}</span>
              <span className="ml-1">tutors found</span>
            </div>
          </div>
        </Card>

        {filteredTutors.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-600 mb-4">
              No tutors found matching your criteria
            </p>
            <Button
              onClick={() =>
                setFilters({
                  subject: '',
                  educationLevel: '',
                  minRating: '',
                  verifiedOnly: false
                })
              }
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor) => (
              <Card key={tutor.userId} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={tutor.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random`}
                    alt={tutor.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{tutor.name}</h3>
                    <p className="text-sm text-gray-600">
                      {tutor.educationLevel} • Year {tutor.year}
                    </p>
                    {tutor.calculatedStats.isVerifiedHelper && (
                      <Badge variant="success" size="small">✓ Verified</Badge>
                    )}
                  </div>
                </div>

                {/* Subjects */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">SUBJECTS</p>
                  <div className="flex flex-wrap gap-2">
                    {tutor.subjects?.slice(0, 3).map((subject, idx) => (
                      <Badge key={idx} variant="primary">{subject}</Badge>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {tutor.calculatedStats.averageRating > 0 
                        ? tutor.calculatedStats.averageRating.toFixed(1) 
                        : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {tutor.calculatedStats.sessionsGiven}
                    </div>
                    <div className="text-xs text-gray-600">Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {tutor.calculatedStats.totalReviews}
                    </div>
                    <div className="text-xs text-gray-600">Reviews</div>
                  </div>
                </div>

                {/* About */}
                {tutor.bio && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {tutor.bio}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link to={`/tutors/${tutor.userId}`} className="flex-1">
                    <Button fullWidth>View Profile</Button>
                  </Link>
                  <Button
                    variant="secondary"
                    onClick={() => handleMessageTutor(tutor.userId)}
                  >
                    Message
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}