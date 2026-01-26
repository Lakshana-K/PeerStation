import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

export default function Home() {
  const { isAuthenticated } = useAuth();

  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  useEffect(() => {
    const loadTutors = async () => {
      try {
        setLoadingTutors(true);

        // Pull real users + reviews 
        const [usersRes, reviewsRes] = await Promise.all([
          api.users.getAll(),
          api.reviews.getAll()
        ]);

        const users = usersRes.data || [];
        const reviews = reviewsRes.data || [];

        // ratings by tutorId
        const ratingMap = {};
        for (const r of reviews) {
          if (!r?.tutorId) continue;
          if (!ratingMap[r.tutorId]) ratingMap[r.tutorId] = [];
          ratingMap[r.tutorId].push(Number(r.rating || 0));
        }

        const tutorUsers = users
          .filter(u => Array.isArray(u.roles) && u.roles.includes('tutor'))
          .map(u => {
            const arr = ratingMap[u.userId] || [];
            const avg =
              arr.length > 0
                ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
                : null;

            return {
              ...u,
              avgRating: avg,
              ratingCount: arr.length
            };
          });

        // Sort: rated tutors first, higher rating first, then more reviews
        tutorUsers.sort((a, b) => {
          const aHas = a.avgRating !== null;
          const bHas = b.avgRating !== null;

          if (aHas && !bHas) return -1;
          if (!aHas && bHas) return 1;

          if (aHas && bHas && a.avgRating !== b.avgRating) return b.avgRating - a.avgRating;
          if ((b.ratingCount || 0) !== (a.ratingCount || 0)) return (b.ratingCount || 0) - (a.ratingCount || 0);

          return String(a.name || '').localeCompare(String(b.name || ''));
        });

        setTutors(tutorUsers.slice(0, 3)); 
      } catch (err) {
        console.error('Error loading tutors for home page:', err);
        setTutors([]);
      } finally {
        setLoadingTutors(false);
      }
    };

    loadTutors();
  }, []);

  // Prevent redirecting to protected pages when logged out
  const primaryCtaLink = useMemo(() => (isAuthenticated ? '/tutors' : '/login'), [isAuthenticated]);
  const browseAllTutorsLink = useMemo(() => (isAuthenticated ? '/tutors' : '/login'), [isAuthenticated]);
  const tutorProfileLink = (tutorId) => (isAuthenticated ? `/tutors/${tutorId}` : '/login');

  const renderStars = (avgRating) => {
    if (avgRating === null) return null;
    const rounded = Math.round(avgRating);
    return (
      <>
        {[1, 2, 3, 4, 5].map(i => (
          <svg
            key={i}
            className={`w-5 h-5 ${i <= rounded ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center animate-fadeIn">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Peer Tutor
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with students offering tutoring in different subjects. View profiles, book sessions, and message tutors
            — all within PeerStation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!isAuthenticated ? (
              <>
                <Link to="/signup">
                  <Button className="px-8 py-3 text-lg">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="px-8 py-3 text-lg">
                    Login
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/tutors">
                  <Button className="px-8 py-3 text-lg">
                    Find Tutors
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="secondary" className="px-8 py-3 text-lg">
                    Go to Dashboard
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <Card hover className="text-center animate-slideIn">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Browse Tutor Profiles</h3>
            <p className="text-gray-600">
              Search tutors by subject and view their profile details before booking.
            </p>
          </Card>

          <Card hover className="text-center animate-slideIn" style={{ animationDelay: '0.1s' }}>
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Book & Manage Sessions</h3>
            <p className="text-gray-600">
              Book a session and track your upcoming and completed sessions in one place.
            </p>
          </Card>

          <Card hover className="text-center animate-slideIn" style={{ animationDelay: '0.2s' }}>
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Chat & Get Updates</h3>
            <p className="text-gray-600">
              Message tutors and receive notifications for important session updates.
            </p>
          </Card>
        </div>
      </section>

      {/* How PeerStation Works */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How PeerStation Works</h2>
            <p className="text-xl text-gray-600">Simple, fast, and effective peer-to-peer learning</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <h3 className="ml-4 text-2xl font-bold text-gray-900">Search for Tutors</h3>
              </div>

              <p className="text-gray-600 ml-16">
                Filter by subject and browse tutor profiles to find someone who fits your needs.
              </p>

              <div className="mt-6 ml-16">
                <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-indigo-500 rounded-full"></div>
                    <div>
                      <div className="h-3 bg-gray-300 rounded w-24 mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 bg-indigo-200 rounded w-20"></div>
                    <div className="h-2 bg-purple-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <h3 className="ml-4 text-2xl font-bold text-gray-900">Book a Session</h3>
              </div>
              <p className="text-gray-600 ml-16">
                Pick a slot and share what you want to cover so the tutor can prepare.
              </p>
              <div className="mt-6 ml-16">
                <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-200">
                  <div className="mb-3">
                    <div className="h-3 bg-gray-300 rounded w-20 mb-2"></div>
                    <div className="h-8 bg-white rounded border border-gray-300"></div>
                  </div>
                  <div className="mb-3">
                    <div className="h-3 bg-gray-300 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-white rounded border border-gray-300"></div>
                  </div>
                  <div className="h-10 bg-indigo-600 rounded"></div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <h3 className="ml-4 text-2xl font-bold text-gray-900">Learn Together</h3>
              </div>
              <p className="text-gray-600 ml-16">
                Join the session, ask questions, and leave a review after to help future students choose confidently.
              </p>
              <div className="mt-6 ml-16">
                <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-2 bg-gray-300 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="bg-white rounded p-2 mb-2">
                    <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-indigo-500 rounded-lg px-3 py-1">
                      <div className="h-2 bg-indigo-300 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Unique Features */}
      <section className="py-20 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Makes PeerStation Stand Out?</h2>
            <p className="text-xl text-gray-600">Built for students, by students</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-l-4 border-indigo-600">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Student-to-Student Tutoring</h3>
                  <p className="text-gray-600">
                    A simple way for students to offer tutoring and for others to get support. Book sessions and learn in a friendly, peer setting.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-purple-600">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Help Request Board</h3>
                  <p className="text-gray-600">
                    Not sure who to book? Post what you need help with. Tutors can view requests and respond.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-pink-600">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Reviews & Transparency</h3>
                  <p className="text-gray-600">
                    After sessions, students can leave reviews so others can make better choices when booking.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-green-600">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Built-in Messaging</h3>
                  <p className="text-gray-600">
                    Communicate inside the app to clarify details before sessions and keep everything in one place.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Tutors Preview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Some Tutors</h2>
            <p className="text-xl text-gray-600">
              Showing real tutors from your app (not hard-coded)
            </p>
          </div>

          {loadingTutors ? (
            <div className="text-center text-gray-600">Loading tutors...</div>
          ) : tutors.length === 0 ? (
            <div className="text-center text-gray-600">
              No tutors found yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {tutors.map((tutor) => (
                <Link key={tutor.userId} to={tutorProfileLink(tutor.userId)} className="block">
                  <Card hover className="text-center">
                    <img
                      src={
                        tutor.profilePicture ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name || 'Tutor')}&background=6366f1&color=fff&size=200`
                      }
                      alt={tutor.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4"
                    />

                    <div className="flex items-center justify-center mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{tutor.name || 'Tutor'}</h3>
                      <svg className="w-5 h-5 text-green-500 ml-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {tutor.course || 'Student'}{tutor.year ? ` • Year ${tutor.year}` : ''}
                    </p>

                    <div className="flex items-center justify-center mb-3">
                      <div className="flex items-center">
                        {tutor.avgRating !== null ? (
                          <>
                            {renderStars(tutor.avgRating)}
                            <span className="ml-2 text-gray-700 font-medium">
                              {tutor.avgRating} ({tutor.ratingCount})
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">New tutor (no reviews yet)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center mb-2">
                      {(tutor.subjects || tutor.skills || tutor.tags || [])
                        .slice(0, 3)
                        .map((s) => (
                          <span
                            key={s}
                            className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                          >
                            {s}
                          </span>
                        ))}
                    </div>

                    <p className="text-gray-600 text-sm">
                      {isAuthenticated ? 'View profile to see details' : 'Login to view profile'}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to={browseAllTutorsLink}>
              <Button className="px-8 py-3 text-lg">
                {isAuthenticated ? 'Browse All Tutors' : 'Login to Browse Tutors'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-indigo-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl text-indigo-100">
            Join students helping each other succeed
          </p>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img
              src="/peerstation.png"
              alt="PeerStation Logo"
              className="w-10 h-10 rounded-xl"
            />
            <span className="text-xl font-bold text-white">PeerStation</span>
          </div>

          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Connecting students through peer-to-peer learning
          </p>

          <div className="border-t border-gray-800 mt-8 pt-6 text-sm text-gray-500">
            <p>&copy; 2026 PeerStation. Built for students.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
