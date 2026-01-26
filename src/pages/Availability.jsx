import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import Modal from '../components/common/Modal';

export default function Availability() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('grid');
  const [slots, setSlots] = useState([]);
  const [pendingSlots, setPendingSlots] = useState([]); 
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [slotFormat, setSlotFormat] = useState('Online');
  const [slotLocation, setSlotLocation] = useState('');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    if (!user?.userId) return;
    loadSlots();
  }, [user?.userId]);

  const loadSlots = async () => {
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Availability request timed out')), 8000)
      );

      const response = await Promise.race([
        api.availability.getByTutor(user.userId),
        timeout
      ]);

      setSlots(response.data || []);
    } catch (error) {
      console.error('Error loading slots:', error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const getNextDate = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const targetDay = days.indexOf(dayName);
    const currentDay = today.getDay();

    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil);
    return targetDate.toISOString().split('T')[0];
  };

  const isSlotConfirmed = (day, time) => {
    const date = getNextDate(day);
    return slots.some(slot =>
      slot.date === date &&
      slot.startTime === time
    );
  };

  const isSlotPending = (day, time) => {
    const date = getNextDate(day);
    return pendingSlots.some(slot =>
      slot.date === date &&
      slot.startTime === time
    );
  };

  const toggleSlot = (day, time) => {
    const date = getNextDate(day);

    // Check if it's a confirmed slot
    const confirmedSlot = slots.find(s => s.date === date && s.startTime === time);
    if (confirmedSlot) {
      // Remove from confirmed slots
      setSlots(slots.filter(s => s.slotId !== confirmedSlot.slotId));
      return;
    }

    // Check if it's a pending slot
    const pendingSlot = pendingSlots.find(s => s.date === date && s.startTime === time);
    if (pendingSlot) {
      // Remove from pending
      setPendingSlots(pendingSlots.filter(s => !(s.date === date && s.startTime === time)));
    } else {
      // Add to pending
      const [hour] = time.split(':');
      const endTime = `${(parseInt(hour) + 1).toString().padStart(2, '0')}:00`;

      setPendingSlots([...pendingSlots, {
        tutorId: user.userId,
        date: date,
        dayOfWeek: day,
        startTime: time,
        endTime: endTime
      }]);
    }
  };

  const handleApplyFormat = () => {
    if (pendingSlots.length === 0) {
      alert('Please select at least one time slot first!');
      return;
    }

    setSlotFormat('Online');
    setSlotLocation('');
    setShowFormatModal(true);
  };

  const handleConfirmFormat = () => {
    if (slotFormat === 'In-person' && !slotLocation.trim()) {
      alert('Please enter a location for in-person sessions');
      return;
    }

    // Move pending slots to confirmed slots with format
    const newSlots = pendingSlots.map(slot => ({
      ...slot,
      slotId: `temp_${Date.now()}_${Math.random()}`,
      format: slotFormat,
      location: slotFormat === 'In-person' ? slotLocation : '',
      isRecurring: false,
      isBlocked: false,
      isTemp: true
    }));

    setSlots([...slots, ...newSlots]);
    setPendingSlots([]);
    setShowFormatModal(false);
  };

  const handleSave = async () => {
    const pendingCount = pendingSlots.length;

    if (pendingCount > 0) {
      alert('Please apply format to all pending slots before saving!');
      return;
    }

    if (slots.length === 0) {
      alert('No slots to save. Please select some time slots first.');
      return;
    }

    setSaving(true);
    try {
      console.log('🔄 Starting save process...');
      console.log('📊 Slots to save:', slots.length);

      // Step 1: Get existing slots
      const existingRes = await api.availability.getByTutor(user.userId);
      const existingSlots = existingRes.data || [];
      console.log('📋 Existing slots:', existingSlots.length);

      // Step 2: Delete existing slots
      if (existingSlots.length > 0) {
        console.log('🗑️ Deleting old slots...');
        for (const slot of existingSlots) {
          try {
            await api.availability.delete(slot.slotId);
          } catch (err) {
            console.warn('Failed to delete slot:', slot.slotId, err);
          }
        }
      }

      // Step 3: Create new slots
      console.log('💾 Creating new slots...');
      const savedSlots = [];
      for (const slot of slots) {
        const { isTemp, slotId, ...slotData } = slot;
        try {
          const response = await api.availability.create(slotData);
          savedSlots.push(response.data);
        } catch (err) {
          console.error('Failed to create slot:', err);
          throw new Error('Failed to create slot');
        }
      }

      console.log('✅ Save complete!');
      setSlots(savedSlots);
      alert(`✅ Success! ${savedSlots.length} time slots saved.`);
    } catch (error) {
      console.error('💥 Save error:', error);
      alert('Failed to save: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    if (window.confirm('Clear all selected slots?')) {
      setSlots([]);
      setPendingSlots([]);
    }
  };

  const clearPending = () => {
    setPendingSlots([]);
  };

  if (!user?.roles?.includes('tutor')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tutor Only</h2>
          <p className="text-gray-600">This page is only available for tutors.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-6 text-gray-800">
          Loading availability...
        </div>
      </div>
    );
  }

  const confirmedCount = slots.length;
  const pendingCount = pendingSlots.length;
  const onlineCount = slots.filter(s => s.format === 'Online').length;
  const inPersonCount = slots.filter(s => s.format === 'In-person').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Availability</h1>
          <p className="text-gray-600">Select slots, then choose format (Online/In-person)</p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setView('grid')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'grid'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                view === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              List View
            </button>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={clearAll} disabled={saving}>
              Clear All
            </Button>
            <Button onClick={handleSave} disabled={saving || pendingCount > 0}>
              {saving ? 'Saving...' : `Save (${confirmedCount} slots)`}
            </Button>
          </div>
        </div>

        {/* Pending Slots Bar */}
        {pendingCount > 0 && (
          <Card className="mb-6 bg-yellow-50 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <h3 className="font-bold text-yellow-900">
                    {pendingCount} slot{pendingCount !== 1 ? 's' : ''} selected
                  </h3>
                  <p className="text-sm text-yellow-800">
                    Click "Apply Format" to choose Online or In-person for these slots
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={clearPending}>
                  Clear Selection
                </Button>
                <Button onClick={handleApplyFormat}>
                  Apply Format
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="mb-6 bg-blue-50 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-bold text-blue-900 mb-1">How it works</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Step 1:</strong> Click time slots to select them (they turn blue/pending)</li>
                <li>• <strong>Step 2:</strong> Click "Apply Format" to choose Online or In-person</li>
                <li>• <strong>Step 3:</strong> Confirmed slots turn green. Click "Save" when done</li>
                <li>• Green = confirmed, Blue = pending, Gray = not selected</li>
              </ul>
            </div>
          </div>
        </Card>

        {view === 'grid' && (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {daysOfWeek.map((day) => {
              const date = getNextDate(day);
              const dateObj = new Date(date);

              return (
                <Card key={day} padding="small">
                  <div className="text-center mb-3">
                    <h3 className="font-bold text-gray-900">{day}</h3>
                    <p className="text-xs text-gray-600">
                      {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {hours.map((time) => {
                      const confirmed = isSlotConfirmed(day, time);
                      const pending = isSlotPending(day, time);
                      const slot = slots.find(s => s.date === date && s.startTime === time);

                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleSlot(day, time)}
                          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition ${
                            confirmed
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : pending
                              ? 'bg-blue-400 text-white hover:bg-blue-500'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div>{time}</div>
                          {confirmed && slot && (
                            <div className="text-xs opacity-90 mt-0.5">
                              {slot.format === 'Online' ? '💻' : '🏫'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {view === 'list' && (
          <Card>
            {confirmedCount === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Confirmed Slots</h3>
                <p className="text-gray-600">Switch to Grid View to select your available time slots</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-bold text-gray-900 mb-4">Confirmed Slots ({confirmedCount})</h3>

                {daysOfWeek.map((day) => {
                  const daySlots = slots.filter(s => s.dayOfWeek === day);
                  if (daySlots.length === 0) return null;

                  return (
                    <div key={day} className="border-l-4 border-indigo-500 pl-4 py-2">
                      <h4 className="font-semibold text-gray-900 mb-2">{day}</h4>
                      <div className="space-y-2">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.slotId}
                            className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                slot.format === 'Online'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {slot.format === 'Online' ? '💻 Online' : '🏫 In-person'}
                              </span>
                              {slot.location && (
                                <span className="text-sm text-gray-600">📍 {slot.location}</span>
                              )}
                            </div>
                            <button
                              onClick={() => toggleSlot(day, slot.startTime)}
                              className="text-red-600 hover:text-red-800 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card className="text-center">
            <div className="text-3xl font-bold text-indigo-600">{confirmedCount}</div>
            <div className="text-sm text-gray-600">Total Slots</div>
          </Card>

          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600">{onlineCount}</div>
            <div className="text-sm text-gray-600">💻 Online</div>
          </Card>

          <Card className="text-center">
            <div className="text-3xl font-bold text-green-600">{inPersonCount}</div>
            <div className="text-sm text-gray-600">🏫 In-person</div>
          </Card>

          <Card className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-gray-600">⏳ Pending</div>
          </Card>
        </div>
      </div>

      {/* Format Selection Modal */}
      <Modal
        isOpen={showFormatModal}
        onClose={() => setShowFormatModal(false)}
        title={`Apply Format to ${pendingCount} Slot${pendingCount !== 1 ? 's' : ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Format <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSlotFormat('Online')}
                className={`p-4 rounded-lg border-2 transition ${
                  slotFormat === 'Online'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">💻</div>
                <div className="font-semibold">Online</div>
                <div className="text-xs text-gray-600 mt-1">Video call</div>
              </button>
              <button
                type="button"
                onClick={() => setSlotFormat('In-person')}
                className={`p-4 rounded-lg border-2 transition ${
                  slotFormat === 'In-person'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">🏫</div>
                <div className="font-semibold">In-person</div>
                <div className="text-xs text-gray-600 mt-1">Face to face</div>
              </button>
            </div>
          </div>

          {slotFormat === 'In-person' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={slotLocation}
                onChange={(e) => setSlotLocation(e.target.value)}
                placeholder="e.g., Library Level 3, Student Lounge, Cafeteria"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">This will apply to all {pendingCount} selected slots</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowFormatModal(false)}
            >
              Cancel
            </Button>
            <Button fullWidth onClick={handleConfirmFormat}>
              Confirm Format
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
