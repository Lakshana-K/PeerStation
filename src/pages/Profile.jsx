import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    institution: user?.institution || '',
    course: user?.course || '',
    year: user?.year || '',
    gpa: user?.gpa || '',
    bio: user?.bio || '',
    tutorSubjects: user?.subjects?.join(', ') || '',
    availability: user?.availability || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    // Create image element to resize
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      // Create canvas to resize image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set max dimensions
      const MAX_WIDTH = 400;
      const MAX_HEIGHT = 400;

      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = (width * MAX_HEIGHT) / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 (compressed)
      const base64String = canvas.toDataURL('image/jpeg', 0.8); // 0.8 = 80% quality

      setPreviewImage(base64String);
      setImageFile(base64String);
    };

    reader.readAsDataURL(file);
  };

  const handleSaveImage = async () => {
    if (!imageFile) return;

    setUploadingImage(true);

    try {
      console.log('🔄 Saving image to backend...');
      
      // Update the user in the backend
      const backendResponse = await api.users.update(user.userId, {
        profilePicture: imageFile
      });
      
      console.log('✅ Backend response:', backendResponse);

      // Update the local auth context
      await updateUser({
        profilePicture: imageFile
      });

      setUploadingImage(false);
      setPreviewImage(null);
      setImageFile(null);

      // Check if backend update was successful (status 200)
      if (backendResponse.status === 200) {
        alert('✅ Profile picture updated successfully!');
        // Reload page to show new image everywhere
        window.location.reload();
      } else {
        alert('Error updating profile picture in backend');
      }
    } catch (error) {
      setUploadingImage(false);
      console.error('❌ Error saving image:', error);
      alert('Error updating profile picture: ' + error.message);
    }
  };

  const handleCancelImage = () => {
    setPreviewImage(null);
    setImageFile(null);
    // Reset the file input
    document.getElementById('profile-picture-upload').value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate subjects - max 3
    const subjects = formData.tutorSubjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (subjects.length > 3) {
      alert('Maximum 3 subjects allowed. Please remove some subjects.');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔄 Updating profile...');
      
      // Update backend first
      const backendResponse = await api.users.update(user.userId, {
        name: formData.name,
        institution: formData.institution,
        course: formData.course,
        year: parseInt(formData.year),
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        bio: formData.bio,
        subjects: subjects,
        availability: formData.availability
      });

      console.log('✅ Backend response:', backendResponse);

      // Update local auth context
      await updateUser({
        name: formData.name,
        institution: formData.institution,
        course: formData.course,
        year: parseInt(formData.year),
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        bio: formData.bio,
        subjects: subjects,
        availability: formData.availability
      });

      setLoading(false);
      
      // Check if backend update was successful
      if (backendResponse.status === 200) {
        alert('✅ Profile updated successfully!');
        // Reload to show changes everywhere
        window.location.reload();
      } else {
        alert('Error updating profile');
      }
    } catch (error) {
      setLoading(false);
      console.error('❌ Error updating profile:', error);
      alert('Error updating profile: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">My Profile</h1>
        <p className="text-gray-600 text-lg mb-8">Manage your peer learning profile</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <img
                    src={previewImage || user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                  <label 
                    htmlFor="profile-picture-upload"
                    className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                    title="Upload new profile picture"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </label>
                  <input
                    id="profile-picture-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </div>

                {/* Image Upload Actions */}
                {previewImage && (
                  <div className="mb-4 space-y-2">
                    <Button
                      onClick={handleSaveImage}
                      disabled={uploadingImage}
                      fullWidth
                      size="sm"
                    >
                      {uploadingImage ? '⏳ Saving...' : '✓ Save New Picture'}
                    </Button>
                    <Button
                      onClick={handleCancelImage}
                      disabled={uploadingImage}
                      variant="secondary"
                      fullWidth
                      size="sm"
                    >
                      ✕ Cancel
                    </Button>
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-900 mb-1">{user?.name}</h2>
                <p className="text-gray-600 mb-4">{user?.email}</p>
                
                {/* Education Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-600 mb-1">Education</div>
                  <div className="font-semibold text-gray-900">
                    {user?.educationLevel} • Year {user?.year}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {user?.institution}
                  </div>
                  {user?.gpa && (
                    <div className="text-sm text-gray-600 mt-1">
                      GPA: {user.gpa}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-2">Member Since</div>
                  <div className="font-semibold text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-white shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold mb-6 text-gray-900">Basic Information</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
                <Input
                  label="Institution"
                  value={formData.institution}
                  onChange={(e) => setFormData({...formData, institution: e.target.value})}
                  placeholder="e.g., Singapore Polytechnic"
                />
                <Input
                  label="Course/Program"
                  value={formData.course}
                  onChange={(e) => setFormData({...formData, course: e.target.value})}
                  placeholder="e.g., Diploma in Information Technology"
                />
                <Input
                  label="Year of Study"
                  type="number"
                  min="1"
                  max="6"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                />
                <Input
                  label="GPA (Optional)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={formData.gpa}
                  onChange={(e) => setFormData({...formData, gpa: e.target.value})}
                  placeholder="e.g., 3.75"
                  helperText="Enter your GPA on a 4.0 or 5.0 scale"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">About Me</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="4"
                    placeholder="Tell others about yourself, your interests, and your learning journey..."
                  ></textarea>
                </div>

                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? 'Saving...' : 'Save Basic Information'}
                </Button>
              </form>
            </Card>

            {/* Subjects I Can Help With */}
            <Card className="bg-white shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">📚</span>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Subjects I Can Help With</h3>
                  <p className="text-gray-600 text-sm">Let others know what you can teach</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="My Subjects (Max 3)"
                  value={formData.tutorSubjects}
                  onChange={(e) => setFormData({...formData, tutorSubjects: e.target.value})}
                  placeholder="e.g., Web Dev, Python, React"
                  helperText="Maximum 3 subjects. Separate with commas."
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Teaching Approach & Availability</label>
                  <textarea
                    value={formData.availability}
                    onChange={(e) => setFormData({...formData, availability: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="4"
                    placeholder="Describe your teaching style, preferred times, and what makes you a great peer tutor..."
                  ></textarea>
                </div>
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? 'Saving...' : 'Save Subject Information'}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}