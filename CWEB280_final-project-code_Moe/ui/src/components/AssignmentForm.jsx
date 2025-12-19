import { useState } from 'react';
import { HiOutlineDocumentText } from 'react-icons/hi2';
import FormInput from './FormInput';
import AlertMessage from './AlertMessage';

function AssignmentForm({ courses, onSubmit, loading }) {
    const [formData, setFormData] = useState({
        assignmentTitle: '',
        description: '',
        courseId: '',
        dueDate: '',
        dueTime: '23:59',
        worth: ''
    });
    const [file, setFile] = useState(null);
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

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.assignmentTitle.trim()) {
            errors.assignmentTitle = 'Assignment title is required';
        }

        if (!formData.courseId) {
            errors.courseId = 'Please select a course';
        }

        if (!formData.dueDate) {
            errors.dueDate = 'Due date is required';
        }

        if (!formData.dueTime) {
            errors.dueTime = 'Due time is required';
        }

        if (formData.worth && (parseFloat(formData.worth) < 0 || parseFloat(formData.worth) > 100)) {
            errors.worth = 'Worth must be between 0 and 100';
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

        const assignmentData = {
            title: formData.assignmentTitle.trim(),
            description: formData.description.trim() || null,
            courseId: parseInt(formData.courseId),
            dueDate: formData.dueDate,
            dueTime: formData.dueTime + ':00',
            worth: formData.worth ? parseFloat(formData.worth) : null
        };

        const result = await onSubmit(assignmentData, file);

        if (result.success) {
            setFormData({
                assignmentTitle: '',
                description: '',
                courseId: '',
                dueDate: '',
                dueTime: '23:59',
                worth: ''
            });
            setFile(null);
        } else {
            setError(result.error);
        }
    };

    const courseOptions = courses.map(course => ({
        value: course.id.toString(),
        label: course.courseName || course.title
    }));

    return (
        <form onSubmit={handleSubmit} data-cy="assignment-form" noValidate>
            {error && (
                <AlertMessage
                    type="danger"
                    message={error}
                    onDismiss={() => setError('')}
                />
            )}

            <FormInput
                id="assignmentTitle"
                name="assignmentTitle"
                label="Assignment Title"
                type="text"
                value={formData.assignmentTitle}
                onChange={handleChange}
                placeholder="Enter assignment title"
                required
                error={validationErrors.assignmentTitle}
            />

            <FormInput
                id="assignmentDescription"
                name="description"
                label="Description (Optional)"
                type="textarea"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter assignment description"
                rows={3}
            />

            <FormInput
                id="assignmentCourse"
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
                    id="assignmentDueDate"
                    name="dueDate"
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                    error={validationErrors.dueDate}
                />
                <FormInput
                    id="assignmentDueTime"
                    name="dueTime"
                    label="Due Time"
                    type="time"
                    value={formData.dueTime}
                    onChange={handleChange}
                    required
                    error={validationErrors.dueTime}
                />
            </div>

            <FormInput
                id="assignmentWorth"
                name="worth"
                label="Worth (% of grade, optional)"
                type="number"
                value={formData.worth}
                onChange={handleChange}
                placeholder="e.g., 15"
                min="0"
                max="100"
                step="0.1"
                error={validationErrors.worth}
            />

            <FormInput
                id="assignmentFile"
                name="file"
                label="Attachment (Optional)"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
                helpText="Accepted formats: PDF, DOC, DOCX, TXT"
            />

            <button
                type="submit"
                className="btn btn-error w-full gap-2"
                disabled={loading}
                data-cy="assignment-submit"
            >
                {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                ) : (
                    <HiOutlineDocumentText className="h-5 w-5" />
                )}
                Add Assignment
            </button>
        </form>
    );
}

export default AssignmentForm;