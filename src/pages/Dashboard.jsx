import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    hoursLearned: 0,
    favoriteSubject: 'N/A',
    learningStreak: 0
  });
  const [tutorStats, setTutorStats] = useState({
    totalSessions: 0,
    upcomingSessions: 0,
    completedSessions: 0,
    hoursTaught: 0,
    studentsHelped: 0,
    averageRating: 0,
    isVerified: false
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  // Reload data when navigating back to dashboard
  useEffect(() => {
    // Reload when component mounts
    loadDashboardData();

    // Also reload when page becomes visible (user switches tabs)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load all bookings
      const allBookingsRes = await api.bookings.getAll();
      const allBookings = allBookingsRes.data || [];

      // Separate student and tutor bookings
      const studentBookings = allBookings.filter(b => b.studentId === user.userId);
      const tutorBookings = allBookings.filter(b => b.tutorId === user.userId);

      // Calculate student stats
      const studentUpcoming = studentBookings.filter(b => {
        const dateTime = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
        return ['upcoming', 'pending', 'confirmed'].includes(b.status) && dateTime > new Date();
      }).length;

      const studentCompleted = studentBookings.filter(b => b.status === 'completed').length;

      const studentHours = studentBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.duration / 60), 0);

      // Find favorite subject
      const subjectCount = {};
      studentBookings.forEach(b => {
        subjectCount[b.subject] = (subjectCount[b.subject] || 0) + 1;
      });

      const favoriteSubject =
        Object.keys(subjectCount).sort((a, b) => subjectCount[b] - subjectCount[a])[0] || 'N/A';

      // Calculate learning streak (consecutive days with completed sessions)
      const calculateStreak = (bookings) => {
        const completedDates = bookings
          .filter(b => b.status === 'completed')
          .map(b => {
            // normalize to midnight so “same day” counts as one
            const d = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
            return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          })
          .sort((a, b) => b - a); // newest first

        if (completedDates.length === 0) return 0;

        const uniqueDates = [...new Set(completedDates)];
        let streak = 1;
        const oneDayMs = 24 * 60 * 60 * 1000;

        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const dayDiff = (uniqueDates[i] - uniqueDates[i + 1]) / oneDayMs;
          if (dayDiff === 1) {
            streak++;
          } else if (dayDiff > 1) {
            break; // streak broken
          }
        }

        return streak;
      };

      const learningStreak = calculateStreak(studentBookings);

      setStudentStats({
        totalSessions: studentBookings.length,
        upcomingSessions: studentUpcoming,
        completedSessions: studentCompleted,
        hoursLearned: Math.round(studentHours * 10) / 10,
        favoriteSubject,
        learningStreak
      });

      // Calculate tutor stats
      const tutorUpcoming = tutorBookings.filter(b => {
        const dateTime = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
        return ['upcoming', 'pending', 'confirmed'].includes(b.status) && dateTime > new Date();
      }).length;

      const tutorCompleted = tutorBookings.filter(b => b.status === 'completed').length;

      const tutorHours = tutorBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.duration / 60), 0);

      const studentsHelped = new Set(
        tutorBookings.filter(b => b.status === 'completed').map(b => b.studentId)
      ).size;

      // Check if verified (3+ completed sessions)
      const isVerified = tutorCompleted >= 3;

      // Get average rating
      let averageRating = 0;
      if (user.roles?.includes('tutor')) {
        try {
          const reviewsRes = await api.reviews.getByTutor(user.userId);
          const reviews = reviewsRes.data || [];
          if (reviews.length > 0) {
            averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          }
        } catch (error) {
          console.error('Error loading reviews:', error);
        }
      }

      setTutorStats({
        totalSessions: tutorBookings.length,
        upcomingSessions: tutorUpcoming,
        completedSessions: tutorCompleted,
        hoursTaught: Math.round(tutorHours * 10) / 10,
        studentsHelped,
        averageRating: Math.round(averageRating * 10) / 10,
        isVerified
      });

      // Create recent activity feed
      const allUserBookings = [...studentBookings, ...tutorBookings]
        .sort((a, b) => {
          const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`);
          const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
          return dateB - dateA;
        })
        .slice(0, 5);

      setRecentActivity(
        allUserBookings.map(b => ({
          ...b,
          isStudent: b.studentId === user.userId
        }))
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Milestone progress (clamped so it never exceeds 100%)
  const MILESTONE_TARGET = 10;
  const milestoneProgress = Math.min(
    100,
    Math.round((studentStats.completedSessions / MILESTONE_TARGET) * 100)
  );

  if (loading) return <Loading text="Loading your dashboard..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-600 text-lg">Here's your peer learning overview</p>
        </div>

        {/* Dual Role Stats Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Student Stats Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <span className="text-3xl">🎓</span>
                <div>
                  <h2 className="text-2xl font-bold">My Learning</h2>
                  <p className="text-indigo-100 text-sm">Sessions where I'm the student</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-indigo-600">{studentStats.totalSessions}</div>
                  <div className="text-sm text-gray-600 mt-1">Total Sessions</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-blue-600">{studentStats.upcomingSessions}</div>
                  <div className="text-sm text-gray-600 mt-1">Upcoming</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-green-600">{studentStats.completedSessions}</div>
                  <div className="text-sm text-gray-600 mt-1">Completed</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-purple-600">{studentStats.hoursLearned}h</div>
                  <div className="text-sm text-gray-600 mt-1">Hours Learned</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="text-sm text-gray-600 mb-1">Favorite Subject</div>
                <div className="text-lg font-semibold text-gray-900">📘 {studentStats.favoriteSubject}</div>
              </div>

              <Link to="/tutors">
                <Button fullWidth>
                  <span className="flex items-center justify-center gap-2">
                    <span>🔍</span>
                    <span>Find Tutors</span>
                  </span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Tutor Stats Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                <span className="text-3xl">👨‍🏫</span>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">My Teaching</h2>
                  <p className="text-green-100 text-sm">Sessions where I'm the tutor</p>
                </div>
                {tutorStats.isVerified && (
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-semibold">Verified</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {tutorStats.totalSessions === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🌟</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Start Teaching!</h3>
                  <p className="text-gray-600 mb-6">Help your peers and become a verified tutor</p>
                  <Link to="/availability">
                    <Button>Set Your Availability</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 rounded-xl p-4">
                      <div className="text-3xl font-bold text-green-600">{tutorStats.totalSessions}</div>
                      <div className="text-sm text-gray-600 mt-1">Total Sessions</div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="text-3xl font-bold text-blue-600">{tutorStats.upcomingSessions}</div>
                      <div className="text-sm text-gray-600 mt-1">Upcoming</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4">
                      <div className="text-3xl font-bold text-purple-600">{tutorStats.hoursTaught}h</div>
                      <div className="text-sm text-gray-600 mt-1">Hours Taught</div>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4">
                      <div className="text-3xl font-bold text-yellow-600">{tutorStats.studentsHelped}</div>
                      <div className="text-sm text-gray-600 mt-1">Students Helped</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Average Rating</div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-gray-900">{tutorStats.averageRating}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(star => (
                              <svg
                                key={star}
                                className={`w-5 h-5 ${
                                  star <= tutorStats.averageRating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      {!tutorStats.isVerified && tutorStats.completedSessions > 0 && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Progress to Verified</div>
                          <div className="text-lg font-bold text-green-600">{tutorStats.completedSessions}/3</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link to="/availability">
                    <Button fullWidth variant="secondary">
                      <span className="flex items-center justify-center gap-2">
                        <span>📅</span>
                        <span>Manage Availability</span>
                      </span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Subject Breakdown */}
          <Card className="bg-white shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span>
              <span>Subject Breakdown</span>
            </h3>
            <div className="space-y-3">
              {(() => {
                const subjectCounts = {};
                recentActivity.forEach(b => {
                  if (b.isStudent) {
                    subjectCounts[b.subject] = (subjectCounts[b.subject] || 0) + 1;
                  }
                });
                const total = Object.values(subjectCounts).reduce((a, b) => a + b, 0) || 1;

                return Object.keys(subjectCounts).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📚</div>
                    <p className="text-sm">No subjects yet</p>
                  </div>
                ) : (
                  Object.entries(subjectCounts).map(([subject, count]) => {
                    const percentage = Math.round((count / total) * 100);
                    const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                    const colorIndex = Object.keys(subjectCounts).indexOf(subject) % colors.length;

                    return (
                      <div key={subject}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">{subject}</span>
                          <span className="text-sm font-semibold text-gray-900">{count} sessions</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`${colors[colorIndex]} h-2 rounded-full transition-all`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                );
              })()}
            </div>
          </Card>

          {/* Session Stats */}
          <Card className="bg-white shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📈</span>
              <span>Session Statistics</span>
            </h3>
            <div className="space-y-4">
              {/* Completion Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="text-lg font-bold text-green-600">
                    {studentStats.totalSessions > 0
                      ? Math.round((studentStats.completedSessions / studentStats.totalSessions) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${
                        studentStats.totalSessions > 0
                          ? Math.min(100, (studentStats.completedSessions / studentStats.totalSessions) * 100)
                          : 0
                      }%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Average Session Duration */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Avg Session Duration</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {studentStats.completedSessions > 0
                    ? Math.round((studentStats.hoursLearned / studentStats.completedSessions) * 60)
                    : 0}{' '}
                  mins
                </div>
              </div>

              {/* This Week */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Sessions This Week</div>
                <div className="text-2xl font-bold text-blue-600">
                  {recentActivity.filter(b => {
                    const sessionDate = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return sessionDate >= weekAgo;
                  }).length}
                </div>
              </div>
            </div>
          </Card>

          {/* Learning Progress */}
          <Card className="bg-white shadow-lg border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🎯</span>
              <span>Learning Progress</span>
            </h3>
            <div className="space-y-4">
              {/* Total Hours */}
              <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                <div className="text-4xl font-bold text-purple-600 mb-1">{studentStats.hoursLearned}h</div>
                <div className="text-sm text-gray-600">Total Time Learning</div>
              </div>

              {/* Milestone Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Next Milestone</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {studentStats.completedSessions}/{MILESTONE_TARGET}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${milestoneProgress}%` }}
                  ></div>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Complete {MILESTONE_TARGET} sessions to unlock achievements!
                </p>
              </div>

              {/* Streak */}
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-3xl mb-1">🔥</div>
                <div className="text-sm text-gray-600">Learning Streak</div>
                <div className="text-2xl font-bold text-orange-600">
                  {studentStats.learningStreak} {studentStats.learningStreak === 1 ? 'day' : 'days'}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Sessions Calendar */}
        <Card className="bg-white shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>📅</span>
              <span>Upcoming Sessions</span>
            </h2>
            <Button variant="secondary" size="sm" onClick={() => navigate('/sessions')}>
              View All
            </Button>
          </div>

          {(() => {
            const upcoming = recentActivity
              .filter(b => {
                const dateTime = new Date(`${b.scheduledDate}T${b.scheduledTime}`);
                return ['upcoming', 'pending', 'confirmed'].includes(b.status) && dateTime > new Date();
              })
              .slice(0, 5);

            return upcoming.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming sessions</h3>
                <p className="text-gray-600 mb-6">Book a session to start learning!</p>
                <Button onClick={() => navigate('/tutors')}>Find Tutors</Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcoming.map((booking) => {
                  const date = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
                  const dateStr = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  });
                  const timeStr = date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={booking.bookingId}
                      className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border-2 border-indigo-100 hover:border-indigo-300 transition-all cursor-pointer"
                      onClick={() => navigate('/sessions')}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                            booking.isStudent ? 'bg-indigo-200' : 'bg-green-200'
                          }`}
                        >
                          {booking.isStudent ? '🎓' : '👨‍🏫'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-gray-900 truncate">{booking.subject}</div>
                          <div className="text-sm text-gray-600 truncate">{booking.specificTopic}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {dateStr}
                        </span>
                        <span className="font-semibold text-indigo-700">{timeStr}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card>
      </div>
    </div>
  );
}
