import { useState } from 'react';
import { HiOutlineAcademicCap } from 'react-icons/hi2';
import FormInput from './FormInput';
import AlertMessage from './AlertMessage';

function CourseForm({ onSubmit, loading }) {
    const [formData, setFormData] = useState({
        courseName: '',
        credits: '3',
        startDate: '',
        endDate: '',
        startTime: '09:00',
        endTime: '10:30',
        daysOfWeek: []
    });
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

    const days = [
        { id: 'M', label: 'Mon' },
        { id: 'Tu', label: 'Tue' },
        { id: 'W', label: 'Wed' },
        { id: 'Th', label: 'Thu' },
        { id: 'F', label: 'Fri' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleDayToggle = (dayId) => {
        setFormData(prev => {
            const newDays = prev.daysOfWeek.includes(dayId)
                ? prev.daysOfWeek.filter(d => d !== dayId)
                : [...prev.daysOfWeek, dayId];
            return { ...prev, daysOfWeek: newDays };
        });

        if (validationErrors.daysOfWeek) {
            setValidationErrors(prev => ({
                ...prev,
                daysOfWeek: ''
            }));
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.courseName.trim()) {
            errors.courseName = 'Course name is required';
        }

        const credits = parseInt(formData.credits);
        if (isNaN(credits) || credits < 1 || credits > 6) {
            errors.credits = 'Credits must be between 1 and 6';
        }

        if (!formData.startDate) {
            errors.startDate = 'Start date is required';
        }

        if (!formData.endDate) {
            errors.endDate = 'End date is required';
        }

        if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
            errors.endDate = 'End date must be after start date';
        }

        if (formData.daysOfWeek.length === 0) {
            errors.daysOfWeek = 'Please select at least one day';
        }

        if (!formData.startTime) {
            errors.startTime = 'Start time is required';
        }

        if (!formData.endTime) {
            errors.endTime = 'End time is required';
        }

        if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
            errors.endTime = 'End time must be after start time';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        // Sort days in correct order
        const dayOrder = ['M', 'Tu', 'W', 'Th', 'F'];
        const sortedDays = formData.daysOfWeek.sort((a, b) =>
            dayOrder.indexOf(a) - dayOrder.indexOf(b)
        );

        const courseData = {
            courseName: formData.courseName.trim(),
            credits: parseInt(formData.credits),
            startDate: formData.startDate,
            endDate: formData.endDate,
            daysOfWeek: sortedDays.join(','),
            startTime: formData.startTime + ':00',
            endTime: formData.endTime + ':00'
        };

        const result = await onSubmit(courseData, file);

        if (result.success) {
            setFormData({
                courseName: '',
                credits: '3',
                startDate: '',
                endDate: '',
                startTime: '09:00',
                endTime: '10:30',
                daysOfWeek: []
            });
            setFile(null);
        } else {
            setError(result.error);
        }
    };

    return (
        <form onSubmit={handleSubmit} data-cy="course-form" noValidate>
            {error && (
                <AlertMessage
                    type="danger"
                    message={error}
                    onDismiss={() => setError('')}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    id="courseName"
                    name="courseName"
                    label="Course Name/Code"
                    type="text"
                    value={formData.courseName}
                    onChange={handleChange}
                    placeholder="e.g., CWEB280"
                    required
                    error={validationErrors.courseName}
                />
                <FormInput
                    id="credits"
                    name="credits"
                    label="Credits"
                    type="number"
                    value={formData.credits}
                    onChange={handleChange}
                    min="1"
                    max="6"
                    required
                    error={validationErrors.credits}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    id="startDate"
                    name="startDate"
                    label="Start Date"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    error={validationErrors.startDate}
                />
                <FormInput
                    id="endDate"
                    name="endDate"
                    label="End Date"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    error={validationErrors.endDate}
                />
            </div>

            {/* Days of Week */}
            <div className="form-control mb-4" data-cy="days-of-week-container">
                <label className="label">
                    <span className="label-text">
                        Days of Week
                        <span className="text-error ml-1">*</span>
                    </span>
                </label>
                <div className="flex flex-wrap gap-2">
                    {days.map(day => (
                        <label key={day.id} className="cursor-pointer" data-cy={`day-${day.id}`}>
                            <input
                                type="checkbox"
                                id={`day-${day.id}`}
                                checked={formData.daysOfWeek.includes(day.id)}
                                onChange={() => handleDayToggle(day.id)}
                                className="checkbox checkbox-primary hidden"
                            />
                            <span
                                className={`btn btn-sm ${
                                    formData.daysOfWeek.includes(day.id)
                                        ? 'btn-primary'
                                        : 'btn-outline'
                                }`}
                            >
                                {day.label}
                            </span>
                        </label>
                    ))}
                </div>
                {validationErrors.daysOfWeek && (
                    <label className="label">
                        <span className="label-text-alt text-error" data-cy="error-daysOfWeek">{validationErrors.daysOfWeek}</span>
                    </label>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    id="startTime"
                    name="startTime"
                    label="Start Time"
                    type="time"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    error={validationErrors.startTime}
                />
                <FormInput
                    id="endTime"
                    name="endTime"
                    label="End Time"
                    type="time"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    error={validationErrors.endTime}
                />
            </div>

            <FormInput
                id="syllabusFile"
                name="file"
                label="Syllabus (Optional)"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                helpText="Upload your course syllabus (PDF, DOC, DOCX)"
            />

            <button
                type="submit"
                className="btn btn-primary w-full gap-2"
                disabled={loading}
                data-cy="course-submit"
            >
                {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                ) : (
                    <HiOutlineAcademicCap className="h-5 w-5" />
                )}
                Add Course
            </button>
        </form>
    );
}

export default CourseForm;