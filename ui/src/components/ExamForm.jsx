import { useState } from 'react';
import { HiOutlineClipboardDocumentCheck } from 'react-icons/hi2';
import FormInput from './FormInput';
import AlertMessage from './AlertMessage';

function ExamForm({ courses, onSubmit, loading }) {
    const [formData, setFormData] = useState({
        title: '',
        courseId: '',
        dateOf: '',
        weight: ''
    });
    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState({});

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

    const validateForm = () => {
        const errors = {};

        if (!formData.title.trim()) {
            errors.title = 'Exam title is required';
        }

        if (!formData.courseId) {
            errors.courseId = 'Please select a course';
        }

        if (!formData.dateOf) {
            errors.dateOf = 'Exam date is required';
        }

        if (!formData.weight) {
            errors.weight = 'Weight is required';
        } else {
            const weight = parseFloat(formData.weight);
            if (isNaN(weight) || weight < 0 || weight > 100) {
                errors.weight = 'Weight must be between 0 and 100';
            }
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

        const examData = {
            title: formData.title.trim(),
            courseId: parseInt(formData.courseId),
            dateOf: formData.dateOf,
            weight: parseFloat(formData.weight)
        };

        const result = await onSubmit(examData);

        if (result.success) {
            setFormData({
                title: '',
                courseId: '',
                dateOf: '',
                weight: ''
            });
        } else {
            setError(result.error);
        }
    };

    const courseOptions = courses.map(course => ({
        value: course.id.toString(),
        label: course.courseName || course.title
    }));

    return (
        <form onSubmit={handleSubmit} data-cy="exam-form" noValidate>
            {error && (
                <AlertMessage
                    type="danger"
                    message={error}
                    onDismiss={() => setError('')}
                />
            )}

            <FormInput
                id="examTitle"
                name="title"
                label="Exam Title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Midterm Exam"
                required
                error={validationErrors.title}
            />

            <FormInput
                id="examCourse"
                name="courseId"
                label="Course"
                type="select"
                value={formData.courseId}
                onChange={handleChange}
                required
                error={validationErrors.courseId}
                options={courseOptions}
                placeholder="Select a course"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                    id="examDate"
                    name="dateOf"
                    label="Exam Date"
                    type="date"
                    value={formData.dateOf}
                    onChange={handleChange}
                    required
                    error={validationErrors.dateOf}
                />
                <FormInput
                    id="examWeight"
                    name="weight"
                    label="Weight (% of grade)"
                    type="number"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g., 25"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    error={validationErrors.weight}
                />
            </div>

            <button
                type="submit"
                className="btn btn-warning w-full gap-2"
                disabled={loading}
                data-cy="exam-submit"
            >
                {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                ) : (
                    <HiOutlineClipboardDocumentCheck className="h-5 w-5" />
                )}
                Add Exam
            </button>
        </form>
    );
}

export default ExamForm;