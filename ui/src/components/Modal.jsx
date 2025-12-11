import { useState, useEffect } from 'react';
import {
    HiOutlineXMark,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineAcademicCap,
    HiOutlineDocumentText,
    HiOutlineClipboardDocumentCheck
} from 'react-icons/hi2';
import { useCourseMutations, useAssignmentMutations, useExamMutations, useCourses } from '../hooks/useApi';
import FormInput from './FormInput';
import AlertMessage from './AlertMessage';

function Modal({ event, isOpen, onClose, onEventDeleted, onEventUpdated }) {
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({});

    const { courses } = useCourses();
    const { updateCourse, deleteCourse, loading: courseLoading } = useCourseMutations();
    const { updateAssignment, deleteAssignment, loading: assignmentLoading } = useAssignmentMutations();
    const { updateExam, deleteExam, loading: examLoading } = useExamMutations();

    const loading = courseLoading || assignmentLoading || examLoading;

    useEffect(() => {
        if (event) {
            setFormData(getInitialFormData(event));
            setIsEditing(false);
            setError('');
            setSuccess('');
        }
    }, [event]);

    const getInitialFormData = (evt) => {
        const type = evt.type;

        if (type === 'course') {
            return {
                courseName: evt.title || evt.courseName,
                credits: evt.credits || 3,
                startDate: evt.startDate || '',
                endDate: evt.endDate || '',
                startTime: evt.startTime?.substring(0, 5) || '09:00',
                endTime: evt.endTime?.substring(0, 5) || '10:00',
                daysOfWeek: evt.daysOfWeek || ''
            };
        } else if (type === 'assignment') {
            const startDate = evt.start ? new Date(evt.start) : new Date();
            return {
                title: evt.title || evt.name,
                description: evt.description || '',
                courseId: evt.courseId || '',
                dueDate: startDate.toISOString().split('T')[0],
                dueTime: startDate.toTimeString().substring(0, 5),
                worth: evt.worth || ''
            };
        } else if (type === 'exam') {
            const examDate = evt.start ? new Date(evt.start) : new Date();
            return {
                title: evt.title,
                courseId: evt.courseId || '',
                dateOf: examDate.toISOString().split('T')[0],
                weight: evt.weight || ''
            };
        }
        return {};
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');

        const type = event.type;
        let result;

        try {
            if (type === 'course') {
                result = await updateCourse(event.originalId || event.id, {
                    courseName: formData.courseName,
                    credits: parseInt(formData.credits),
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    startTime: formData.startTime + ':00',
                    endTime: formData.endTime + ':00',
                    daysOfWeek: formData.daysOfWeek
                });
            } else if (type === 'assignment') {
                result = await updateAssignment(event.originalId || event.id, {
                    title: formData.title,
                    description: formData.description,
                    courseId: parseInt(formData.courseId),
                    dueDate: formData.dueDate,
                    dueTime: formData.dueTime + ':00',
                    worth: formData.worth ? parseFloat(formData.worth) : null
                });
            } else if (type === 'exam') {
                result = await updateExam(event.originalId || event.id, {
                    title: formData.title,
                    courseId: parseInt(formData.courseId),
                    dateOf: formData.dateOf,
                    weight: parseFloat(formData.weight)
                });
            }

            if (result?.success) {
                setSuccess('Updated successfully!');
                setIsEditing(false);
                if (onEventUpdated) onEventUpdated();
            } else {
                setError(result?.error || 'Failed to update');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        setError('');
        const type = event.type;
        let result;

        try {
            if (type === 'course') {
                result = await deleteCourse(event.originalId || event.id);
            } else if (type === 'assignment') {
                result = await deleteAssignment(event.originalId || event.id);
            } else if (type === 'exam') {
                result = await deleteExam(event.originalId || event.id);
            }

            if (result?.success) {
                if (onEventDeleted) onEventDeleted();
                onClose();
            } else {
                setError(result?.error || 'Failed to delete');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        }
    };

    const getIcon = () => {
        switch (event?.type) {
            case 'course': return <HiOutlineAcademicCap className="h-6 w-6 text-primary" />;
            case 'assignment': return <HiOutlineDocumentText className="h-6 w-6 text-error" />;
            case 'exam': return <HiOutlineClipboardDocumentCheck className="h-6 w-6 text-warning" />;
            default: return <HiOutlineCalendar className="h-6 w-6" />;
        }
    };

    const courseOptions = courses.map(c => ({
        value: c.id.toString(),
        label: c.courseName || c.title
    }));

    if (!event) return null;

    return (
        <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
            <div className="modal-box max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <h3 className="font-bold text-lg">
                            {isEditing ? 'Edit' : ''} {event.type?.charAt(0).toUpperCase() + event.type?.slice(1)}
                        </h3>
                    </div>
                    <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
                        <HiOutlineXMark className="h-5 w-5" />
                    </button>
                </div>

                {/* Alerts */}
                {error && <AlertMessage type="error" message={error} onDismiss={() => setError('')} />}
                {success && <AlertMessage type="success" message={success} onDismiss={() => setSuccess('')} />}

                {/* Content */}
                {isEditing ? (
                    <div className="space-y-4">
                        {event.type === 'course' && (
                            <>
                                <FormInput
                                    id="modalCourseName"
                                    name="courseName"
                                    label="Course Name"
                                    value={formData.courseName || ''}
                                    onChange={handleChange}
                                />
                                <FormInput
                                    id="modalCredits"
                                    name="credits"
                                    label="Credits"
                                    type="number"
                                    value={formData.credits || ''}
                                    onChange={handleChange}
                                    min="1"
                                    max="6"
                                />
                            </>
                        )}

                        {event.type === 'assignment' && (
                            <>
                                <FormInput
                                    id="modalAssignmentTitle"
                                    name="title"
                                    label="Title"
                                    value={formData.title || ''}
                                    onChange={handleChange}
                                />
                                <FormInput
                                    id="modalAssignmentDesc"
                                    name="description"
                                    label="Description"
                                    type="textarea"
                                    value={formData.description || ''}
                                    onChange={handleChange}
                                />
                                <FormInput
                                    id="modalAssignmentCourse"
                                    name="courseId"
                                    label="Course"
                                    type="select"
                                    value={formData.courseId || ''}
                                    onChange={handleChange}
                                    options={courseOptions}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput
                                        id="modalDueDate"
                                        name="dueDate"
                                        label="Due Date"
                                        type="date"
                                        value={formData.dueDate || ''}
                                        onChange={handleChange}
                                    />
                                    <FormInput
                                        id="modalDueTime"
                                        name="dueTime"
                                        label="Due Time"
                                        type="time"
                                        value={formData.dueTime || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <FormInput
                                    id="modalWorth"
                                    name="worth"
                                    label="Worth (%)"
                                    type="number"
                                    value={formData.worth || ''}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                />
                            </>
                        )}

                        {event.type === 'exam' && (
                            <>
                                <FormInput
                                    id="modalExamTitle"
                                    name="title"
                                    label="Title"
                                    value={formData.title || ''}
                                    onChange={handleChange}
                                />
                                <FormInput
                                    id="modalExamCourse"
                                    name="courseId"
                                    label="Course"
                                    type="select"
                                    value={formData.courseId || ''}
                                    onChange={handleChange}
                                    options={courseOptions}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput
                                        id="modalExamDate"
                                        name="dateOf"
                                        label="Date"
                                        type="date"
                                        value={formData.dateOf || ''}
                                        onChange={handleChange}
                                    />
                                    <FormInput
                                        id="modalExamWeight"
                                        name="weight"
                                        label="Weight (%)"
                                        type="number"
                                        value={formData.weight || ''}
                                        onChange={handleChange}
                                        min="0"
                                        max="100"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h4 className="text-xl font-semibold">{event.title}</h4>

                        {event.description && (
                            <p className="text-base-content/70">{event.description}</p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <span className={`badge ${
                                event.type === 'course' ? 'badge-primary' :
                                    event.type === 'assignment' ? 'badge-error' :
                                        'badge-warning'
                            }`}>
                                {event.type}
                            </span>
                            {event.code && <span className="badge badge-outline">{event.code}</span>}
                            {(event.weight || event.worth) && (
                                <span className="badge badge-info">
                                    Worth: {event.weight || event.worth}%
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-base-content/60">
                            <HiOutlineCalendar className="h-5 w-5" />
                            <span>
                                {new Date(event.start).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>

                        {event.type !== 'exam' && (
                            <div className="flex items-center gap-2 text-base-content/60">
                                <HiOutlineClock className="h-5 w-5" />
                                <span>
                                    {new Date(event.start).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                    {event.end && event.end !== event.start && (
                                        <> - {new Date(event.end).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}</>
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="modal-action">
                    {isEditing ? (
                        <>
                            <button
                                className="btn btn-ghost"
                                onClick={() => setIsEditing(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading && <span className="loading loading-spinner loading-sm"></span>}
                                Save Changes
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="btn btn-error btn-outline gap-2"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                <HiOutlineTrash className="h-4 w-4" />
                                Delete
                            </button>
                            <button
                                className="btn btn-primary gap-2"
                                onClick={() => setIsEditing(true)}
                            >
                                <HiOutlinePencil className="h-4 w-4" />
                                Edit
                            </button>
                        </>
                    )}
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose}>close</button>
            </form>
        </dialog>
    );
}

export default Modal;