import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Loading from '../components/common/Loading';
import Badge from '../components/common/Badge';

export default function HelpRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [tutorStats, setTutorStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const [formData, setFormData] = useState({
    topic: '',
    description: '',
    subject: '',
    urgency: 'medium'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activeTab, requests, users, urgencyFilter]);

  const loadData = async () => {
    try {
      const [requestsRes, statsRes, usersRes] = await Promise.all([
        api.helpRequests.getAll(),
        api.tutorStats.getAll(),
        api.users.getAll()
      ]);

      setRequests(requestsRes.data || []);
      setUsers(usersRes.data || []);

      // Create stats map for quick lookup
      const statsMap = {};
      // FIX 1: Ensure statsRes.data is an array before using forEach
      const statsData = Array.isArray(statsRes.data) ? statsRes.data : [];
      statsData.forEach(stat => {
        statsMap[stat.tutorId] = stat;
      });
      setTutorStats(statsMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (activeTab === 'my-requests') {
      filtered = filtered.filter(r => r.studentId === user.userId);
    } else if (activeTab === 'my-claims') {
      filtered = filtered.filter(r => r.claimedBy === user.userId);
    }

    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(r => r.urgency === urgencyFilter);
    }

    // Sort: unclaimed open > claimed > resolved, then by urgency, then by date
    filtered.sort((a, b) => {
      // Priority order: unclaimed open > claimed > resolved
      const getPriority = (request) => {
        if (request.status === 'resolved') return 3; // Lowest priority
        if (request.claimedBy) return 2; // Middle priority (claimed but not resolved)
        return 1; // Highest priority (unclaimed)
      };

      const aPriority = getPriority(a);
      const bPriority = getPriority(b);

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Then by urgency (high > medium > low)
      const urgencyOrder = { high: 0, medium: 1, low: 2 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }

      // Finally by date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setFilteredRequests(filtered);
  };

  const getUserById = (userId) => {
    return users.find(u => u.userId === userId);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();

    try {
      await api.helpRequests.create({
        studentId: user.userId,
        studentName: user.name,
        topic: formData.topic,
        subject: formData.subject,
        description: formData.description,
        urgency: formData.urgency,
        status: 'open',
        createdAt: new Date().toISOString(),
        responses: []
      });

      setShowCreateModal(false);
      setFormData({
        topic: '',
        description: '',
        subject: '',
        urgency: 'medium'
      });
      loadData();
      alert(
        'Help request posted successfully! 🎉\n\nTutors can now claim your request and book a session with you from their available time slots.'
      );
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create request. Please try again.');
    }
  };

  const handleClaimRequest = (request) => {
    if (!user.roles.includes('tutor')) {
      alert('Only tutors can claim help requests. Update your profile to become a tutor!');
      return;
    }

    // Redirect to claim page with request data
    navigate('/claim-request', {
      state: {
        request: request,
        studentId: request.studentId
      }
    });
  };

  const handleDeleteRequest = async (requestId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this help request?');
    if (!confirmDelete) return;

    try {
      await api.helpRequests.delete(requestId);
      loadData();
      alert('Help request deleted successfully.');
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request. Please try again.');
    }
  };

  if (loading) {
    return <Loading text="Loading help requests..." />;
  }

  // Calculate counts based on what will actually be displayed
  const allRequestsToShow = requests.filter(r => r.status !== 'resolved');
  const openCount = allRequestsToShow.length;
  const myRequestsCount = requests.filter(r => r.studentId === user.userId).length;
  const myClaimsCount = requests.filter(r => r.claimedBy === user.userId).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Help Request Board</h1>
              <p className="text-gray-600 text-lg">
                Post what you need help with or claim requests to help fellow students
              </p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post Help Request
            </Button>
          </div>

          {/* Info Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 mb-2">📅 How It Works</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>
                      <strong>Students:</strong> Post what you need help with. Tutors will claim your request and book a session from their available time slots.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>
                      <strong>Tutors:</strong> Claim requests that match your expertise and schedule a session from your available time slots.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>
                      <strong>Time is fixed:</strong> No back-and-forth needed! Tutors select from their own available slots when claiming.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-lg p-1.5 shadow-sm border border-gray-200 inline-flex gap-2">
            <button
              onClick={() => {
                setActiveTab('all');
                setUrgencyFilter('all');
              }}
              className={`px-6 py-3 rounded-md font-semibold whitespace-nowrap transition-all ${
                activeTab === 'all'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📚 All Requests
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'all' ? 'bg-white/20' : 'bg-gray-100'
                }`}
              >
                {openCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('my-requests');
                setUrgencyFilter('all');
              }}
              className={`px-6 py-3 rounded-md font-semibold whitespace-nowrap transition-all ${
                activeTab === 'my-requests'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📝 My Requests
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'my-requests' ? 'bg-white/20' : 'bg-gray-100'
                }`}
              >
                {myRequestsCount}
              </span>
            </button>

            {user.roles.includes('tutor') && (
              <button
                onClick={() => {
                  setActiveTab('my-claims');
                  setUrgencyFilter('all');
                }}
                className={`px-6 py-3 rounded-md font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'my-claims'
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                ✅ My Claims
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === 'my-claims' ? 'bg-white/20' : 'bg-gray-100'
                  }`}
                >
                  {myClaimsCount}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Urgency Filters - Only show on "All Requests" tab */}
        {activeTab === 'all' && (
          <div className="mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">Filter by urgency:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setUrgencyFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    urgencyFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  All
                </button>

                <button
                  onClick={() => setUrgencyFilter('high')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    urgencyFilter === 'high'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border-2 border-red-300 hover:border-red-500 hover:bg-red-50'
                  }`}
                >
                  🔴 High Priority
                </button>

                <button
                  onClick={() => setUrgencyFilter('medium')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    urgencyFilter === 'medium'
                      ? 'bg-yellow-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border-2 border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50'
                  }`}
                >
                  🟡 Medium
                </button>

                <button
                  onClick={() => setUrgencyFilter('low')}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                    urgencyFilter === 'low'
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border-2 border-green-300 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  🟢 Low Priority
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary - Show filtered count */}
        {urgencyFilter !== 'all' && activeTab === 'all' && (
          <div className="mb-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-bold">Showing {filteredRequests.length}</span> {urgencyFilter} priority{' '}
                {filteredRequests.length === 1 ? 'request' : 'requests'}
                <button
                  onClick={() => setUrgencyFilter('all')}
                  className="ml-3 text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  Clear filter
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeTab === 'my-requests'
                ? 'No Requests Yet'
                : activeTab === 'my-claims'
                ? 'No Claims Yet'
                : 'No Open Requests'}
            </h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'my-requests'
                ? 'Post a help request to get started!'
                : activeTab === 'my-claims'
                ? 'Claim requests from the "All Requests" tab to help students!'
                : 'Be the first to post a help request!'}
            </p>
            {activeTab !== 'my-claims' && (
              <Button onClick={() => setShowCreateModal(true)}>
                Post Help Request
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const student = getUserById(request.studentId);
              const claimedByTutor = request.claimedBy ? getUserById(request.claimedBy) : null;
              const stats = tutorStats[request.studentId];
              const isVerified = stats?.totalSessionsGiven >= 3;
              const isMyRequest = request.studentId === user.userId;
              const isResolved = request.status === 'resolved';
              const isClaimed = request.claimedBy && !isResolved;
              const isClaimedByMe = request.claimedBy === user.userId;
              const postedTime = new Date(request.createdAt);
              const timeAgo = Math.floor((new Date() - postedTime) / (1000 * 60));

              return (
                <Card
                  key={request.requestId}
                  hover={!isMyRequest && !isResolved && !isClaimed}
                  className={`${isResolved ? 'bg-gray-50 border-gray-200' : ''} ${isClaimed && !isClaimedByMe ? 'bg-blue-50/30' : ''} transition-all`}
                >
                  <div className="flex gap-4">
                    {/* Left: Student Avatar */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div
                          className={`w-12 h-12 rounded-full overflow-hidden ${
                            request.urgency === 'high'
                              ? 'ring-2 ring-red-500'
                              : request.urgency === 'medium'
                              ? 'ring-2 ring-yellow-500'
                              : 'ring-2 ring-green-500'
                          }`}
                        >
                          <img
                            src={
                              student?.profilePicture ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                request.studentName || 'User'
                              )}&background=random`
                            }
                            alt={request.studentName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Status indicator badge */}
                        {isResolved && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                            ✓
                          </div>
                        )}
                        {isClaimed && !isResolved && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                            📌
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          {/* Student Name and Topic */}
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-gray-900">{request.studentName || 'Anonymous'}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600">{request.topic}</span>
                            
                            {/* Status Badges - more prominent */}
                            {isResolved && (
                              <Badge variant="success" className="ml-2">
                                ✅ Resolved
                              </Badge>
                            )}
                            {isClaimed && !isResolved && (
                              <Badge variant="info" className="ml-2">
                                {isClaimedByMe ? '✅ You Claimed This' : `📌 Claimed by ${claimedByTutor?.name || 'Tutor'}`}
                              </Badge>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-3 flex-wrap">
                            <Badge
                              variant={
                                request.urgency === 'high'
                                  ? 'danger'
                                  : request.urgency === 'low'
                                  ? 'success'
                                  : 'warning'
                              }
                            >
                              {request.urgency === 'high'
                                ? '🔴 High'
                                : request.urgency === 'medium'
                                ? '🟡 Medium'
                                : '🟢 Low'}
                            </Badge>
                            <span>•</span>
                            <span>
                              {timeAgo < 60
                                ? `${timeAgo}m ago`
                                : timeAgo < 1440
                                ? `${Math.floor(timeAgo / 60)}h ago`
                                : `${Math.floor(timeAgo / 1440)}d ago`}
                            </span>
                            {isMyRequest && (
                              <>
                                <span>•</span>
                                <span className="text-indigo-600 font-medium">Your Request</span>
                              </>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-gray-700 mb-4 leading-relaxed">{request.description}</p>

                          {/* Subject Tag */}
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <Badge variant="primary" size="large">
                              📚 {request.subject}
                            </Badge>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">
                                When claiming, tutor will select from their available time slots
                              </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                              {/* Show "I Can Help!" button only for unclaimed requests that aren't mine */}
                              {!isMyRequest && !isResolved && !isClaimed && (
                                <Button
                                  onClick={() => handleClaimRequest(request)}
                                  className="flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  I Can Help!
                                </Button>
                              )}

                              {isMyRequest && !isResolved && !isClaimed && (
                                <Button
                                  variant="danger"
                                  onClick={() => handleDeleteRequest(request.requestId)}
                                  className="text-sm"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Post a Help Request"
        size="lg"
      >
        <form onSubmit={handleCreateRequest} className="space-y-5">
          <Input
            label="Topic"
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleFormChange}
            placeholder="e.g., React useState Hook Not Updating"
            helperText="Brief summary of what you need help with"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows="5"
              placeholder="Describe what you need help with in detail. Be specific about what you're stuck on and what you've already tried..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleFormChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Select a subject</option>
              <option value="Web Development">Web Development</option>
              <option value="Python">Python</option>
              <option value="JavaScript">JavaScript</option>
              <option value="React">React</option>
              <option value="Node.js">Node.js</option>
              <option value="SQL">SQL</option>
              <option value="Data Analytics">Data Analytics</option>
              <option value="Data Structures">Data Structures</option>
              <option value="CSS">CSS</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'low', label: 'Low', icon: '🟢', desc: 'Anytime this week', color: 'green' },
                { value: 'medium', label: 'Medium', icon: '🟡', desc: 'Within a few days', color: 'yellow' },
                { value: 'high', label: 'High', icon: '🔴', desc: 'ASAP (24 hours)', color: 'red' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, urgency: option.value }))}
                  className={`px-4 py-3 rounded-lg font-medium transition-all border-2 text-left ${
                    formData.urgency === option.value
                      ? `border-${option.color}-500 bg-${option.color}-50 shadow-md`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{option.icon}</div>
                  <div className="font-bold text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 mb-2">💡 How It Works</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Post your help request with specific details</li>
              <li>Tutors will see your request and can claim it</li>
              <li>When claiming, the tutor will select a time from their available slots</li>
              <li>You'll receive a notification when a tutor claims your request</li>
              <li>No need to negotiate times - it's all handled automatically!</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" fullWidth>
              Post Help Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}