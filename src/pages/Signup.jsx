import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Card from '../components/common/Card';

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const { signup } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    educationLevel: '',
    course: '',
    year: '',
    gpa: '',
    subject1: '',
    subject2: '',
    subject3: '',
    bio: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.institution.trim()) {
      newErrors.institution = 'Institution is required';
    }

    if (!formData.educationLevel) {
      newErrors.educationLevel = 'Education level is required';
    }

    if (!formData.course.trim()) {
      newErrors.course = 'Course/Program is required';
    }

    if (!formData.year) {
      newErrors.year = 'Year of study is required';
    }

    return newErrors;
  };

  const handleNext = () => {
    let newErrors = {};

    if (step === 1) {
      newErrors = validateStep1();
    } else if (step === 2) {
      newErrors = validateStep2();
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    // Collect subjects from the 3 input fields
    const subjects = [
      formData.subject1.trim(),
      formData.subject2.trim(),
      formData.subject3.trim()
    ].filter(s => s.length > 0); // Remove empty subjects

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      institution: formData.institution,
      educationLevel: formData.educationLevel,
      course: formData.course,
      year: parseInt(formData.year),
      gpa: formData.gpa ? parseFloat(formData.gpa) : null,
      roles: ['student', 'tutor'], 
      subjects: subjects,
      bio: formData.bio || `${formData.educationLevel} student at ${formData.institution}`,
    };

    const result = await signup(userData);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setErrors({ general: result.error });
    }

    setLoading(false);
  };

  // Dynamic year options based on education level
  const getYearOptions = () => {
    switch (formData.educationLevel) {
      case 'Primary':
        return ['1', '2', '3', '4', '5', '6'];
      case 'Secondary':
        return ['1', '2', '3', '4', '5'];
      case 'JC':
        return ['1', '2'];
      case 'Polytechnic':
      case 'ITE':
        return ['1', '2', '3'];
      case 'University':
        return ['1', '2', '3', '4', '5', '6'];
      default:
        return ['1', '2', '3', '4'];
    }
  };

  // Dynamic course placeholder based on education level
  const getCoursePlaceholder = () => {
    switch (formData.educationLevel) {
      case 'Primary':
        return 'e.g., Primary School Education';
      case 'Secondary':
        return 'e.g., Express, Normal Academic';
      case 'JC':
        return 'e.g., Science, Arts, Commerce';
      case 'Polytechnic':
        return 'e.g., Diploma in IT';
      case 'ITE':
        return 'e.g., Higher NITEC in Engineering';
      case 'University':
        return 'e.g., Computer Science';
      default:
        return 'e.g., Diploma in IT';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/peerstation.png"
              alt="PeerStation Logo"
              className="h-16 w-16 object-contain rounded-2xl shadow-sm"
            />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
          <p className="text-gray-600">Join PeerStation and start learning with peers</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s, index) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  {index > 0 && (
                    <div className={`flex-1 h-1 transition-all ${
                      step > s - 1 ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                    step >= s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {s}
                  </div>
                  {index < 2 && (
                    <div className={`flex-1 h-1 transition-all ${
                      step > s ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
                <div className={`text-xs font-medium mt-2 text-center ${
                  step === s ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  {s === 1 ? 'Basic Info' : s === 2 ? 'Education' : 'Subjects & Bio'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-center pb-2">
                  <h3 className="text-lg font-bold text-gray-900">Step 1 of 3: Basic Information</h3>
                  <p className="text-sm text-gray-600">Tell us about yourself</p>
                </div>

                <Input
                  label="Full Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Sarah Tan Wei Ling"
                  error={errors.name}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="sarah.tan@student.tp.edu.sg"
                  error={errors.email}
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  error={errors.password}
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  error={errors.confirmPassword}
                  required
                />

                <Button type="button" onClick={handleNext} fullWidth>
                  Continue to Step 2 →
                </Button>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-center pb-2">
                  <h3 className="text-lg font-bold text-gray-900">Step 2 of 3: Education Information</h3>
                  <p className="text-sm text-gray-600">This helps us match you with the right peers</p>
                </div>

                <Input
                  label="Institution"
                  type="text"
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  placeholder="Temasek Polytechnic"
                  error={errors.institution}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="educationLevel"
                    value={formData.educationLevel}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.educationLevel ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select education level</option>
                    <option value="Primary">Primary School</option>
                    <option value="Secondary">Secondary School</option>
                    <option value="JC">Junior College</option>
                    <option value="Polytechnic">Polytechnic</option>
                    <option value="ITE">ITE</option>
                    <option value="University">University</option>
                  </select>
                  {errors.educationLevel && (
                    <p className="mt-1 text-sm text-red-600">{errors.educationLevel}</p>
                  )}
                </div>

                <Input
                  label="Course/Program"
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  placeholder={getCoursePlaceholder()}
                  error={errors.course}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year of Study <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.year ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                    disabled={!formData.educationLevel}
                  >
                    <option value="">Select year</option>
                    {getYearOptions().map(year => (
                      <option key={year} value={year}>Year {year}</option>
                    ))}
                  </select>
                  {errors.year && (
                    <p className="mt-1 text-sm text-red-600">{errors.year}</p>
                  )}
                  {!formData.educationLevel && (
                    <p className="mt-1 text-sm text-gray-500">Please select education level first</p>
                  )}
                </div>

                <Input
                  label="GPA (Optional)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  name="gpa"
                  value={formData.gpa}
                  onChange={handleChange}
                  placeholder="e.g., 3.75"
                  helperText="Enter your GPA on a 4.0 or 5.0 scale"
                />

                <div className="flex gap-3">
                  <Button type="button" onClick={handleBack} variant="secondary" fullWidth>
                    ← Back
                  </Button>
                  <Button type="button" onClick={handleNext} fullWidth>
                    Continue to Step 3 →
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-center pb-2">
                  <h3 className="text-lg font-bold text-gray-900">Step 3 of 3: Subjects & Bio</h3>
                  <p className="text-sm text-gray-600">What can you help others with?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subjects you can help with (Maximum 3, Optional)
                  </label>
                  <div className="space-y-3">
                    <Input
                      label="Subject 1"
                      type="text"
                      name="subject1"
                      value={formData.subject1}
                      onChange={handleChange}
                      placeholder="e.g., Web Development"
                    />
                    <Input
                      label="Subject 2 (Optional)"
                      type="text"
                      name="subject2"
                      value={formData.subject2}
                      onChange={handleChange}
                      placeholder="e.g., Python Programming"
                    />
                    <Input
                      label="Subject 3 (Optional)"
                      type="text"
                      name="subject3"
                      value={formData.subject3}
                      onChange={handleChange}
                      placeholder="e.g., Data Analytics"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 You can add or edit subjects later in your profile
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio (Optional)
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Tell us about yourself, your interests, and what you're passionate about..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  ></textarea>
                </div>

                {errors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {errors.general}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" onClick={handleBack} variant="secondary" fullWidth>
                    ← Back
                  </Button>
                  <Button type="submit" fullWidth disabled={loading}>
                    {loading ? 'Creating...' : 'Create Account'}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Login
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
