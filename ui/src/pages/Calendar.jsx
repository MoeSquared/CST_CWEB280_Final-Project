import { useState, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import { useNavigate } from 'react-router';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);
const API_BASE_URL = 'http://localhost:8080/api';

export default function CalendarView({ courses, onEventDeleted, onEventUpdated }) {
    const navigate = useNavigate();

    // Calendar state
    const [view, setView] = useState(Views.MONTH);
    const [date, setDate] = useState(new Date());

    // Modal state
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({});

    // Action states
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    // Add class button
    const navigateToAddClass = () => {
        navigate('/add', { state: { selectedType: 'class' } });
    };

    // Convert courses to calendar events format
    const events = useMemo(() => {
        const transformedEvents = courses.map(course => ({
            id: course.id,
            title: course.title,
            start: course.start,
            end: course.end,
            resource: course,
            allDay: false
        }));

        return transformedEvents;
    }, [courses]);

    // Opens modal when a calendar event is clicked
    const handleSelectEvent = useCallback((event) => {
        setSelectedEvent(event.resource);
        setShowEventModal(true);
        setDeleteConfirm(false);
        setError("");
        setSuccess("");
    }, []);

    // Close event modal
    const closeEventModal = () => {
        setShowEventModal(false);
        setSelectedEvent(null);
        setDeleteConfirm(false);
        setError("");
        setSuccess("");
    };

    // Open edit modal
    const openEditModal = () => {
        if (!selectedEvent) return;

        // Prepare edit form data based on event type
        if (selectedEvent.type === 'course') {
            setEditFormData({
                courseName: selectedEvent.name,
                // Note: We can't edit all course fields from a single event
                // because course events are expanded from a single course record
            });
        } else if (selectedEvent.type === 'assignment') {
            setEditFormData({
                assignmentTitle: selectedEvent.name,
                dueDate: selectedEvent.date ? new Date(selectedEvent.date).toISOString().split('T')[0] : '',
                dueTime: selectedEvent.start ?
                    selectedEvent.start.toTimeString().slice(0, 8) : '23:59:00'
            });
        }

        setShowEventModal(false);
        setShowEditModal(true);
        setError("");
    };

    // Close edit modal
    const closeEditModal = () => {
        setShowEditModal(false);
        setEditFormData({});
        setError("");
    };

    // Handle edit form changes
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle edit form submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const eventType = selectedEvent.type;
            const eventId = selectedEvent.originalId;

            let endpoint, body;

            if (eventType === 'assignment')
            {
                endpoint = `${API_BASE_URL}/assignments/${eventId}`;
                body = {
                    assignmentTitle: editFormData.assignmentTitle,
                    dueDate: editFormData.dueDate,
                    dueTime: editFormData.dueTime || '23:59:00'
                };
            }
            else if (eventType === 'course')
            {
                endpoint = `${API_BASE_URL}/courses/${eventId}`;
                body = {
                    courseName: editFormData.courseName
                };
            }

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(body)
            });

            if (response.ok) {
                setSuccess("Updated successfully!");
                closeEditModal();

                // Notify parent to refresh events
                if (onEventUpdated) {
                    onEventUpdated();
                }
            } else {
                const data = await response.json();
                setError(data.detail || "Failed to update");
            }
        } catch (err) {
            console.error('Error updating event:', err);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!deleteConfirm) {
            setDeleteConfirm(true);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const eventType = selectedEvent.type;
            const eventId = selectedEvent.originalId;

            const endpoint = eventType === 'assignment'
                ? `${API_BASE_URL}/assignments/${eventId}`
                : `${API_BASE_URL}/courses/${eventId}`;

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                setSuccess("Deleted successfully!");
                closeEventModal();

                // Notify parent to refresh events
                if (onEventDeleted) {
                    onEventDeleted();
                }
            } else {
                const data = await response.json();
                setError(data.detail || "Failed to delete");
            }
        } catch (err) {
            console.error('Error deleting event:', err);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
            setDeleteConfirm(false);
        }
    };

    // Handles calendar navigation
    const handleNavigate = useCallback((newDate) => {
        setDate(newDate);
    }, []);

    // Custom event style
    const eventStyleGetter = (event) => {
        const backgroundColor = event.resource.color || '#17a2b8';
        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.9,
                color: 'white',
                border: '0px',
                display: 'block'
            }
        };
    };

    // Custom components for the calendar
    const components = {
        event: ({ event }) => (
            <div className="rbc-event-content" title={event.title}>
                <strong>{event.resource.code}</strong>
            </div>
        )
    };

    return (
        <div className="container py-4">
            {/* Header & Add Class button */}
            <div className="d-flex justify-content-between align-items-center col-auto">
                <h2>Calendar</h2>
                <button onClick={navigateToAddClass} className="btn btn-success">Add Class</button>
            </div>

            {/* Success message */}
            {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">{success}
                    <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
                </div>
            )}

            <div className="card border-0 shadow-sm">
                <div className="card-body p-3">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 600 }}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={eventStyleGetter}
                        view={view}
                        onView={setView}
                        date={date}
                        onNavigate={handleNavigate}
                        components={components}
                        popup
                        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                    />
                </div>
            </div>

            {/* Event Detail Modal */}
            {showEventModal && selectedEvent && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header" style={{ backgroundColor: selectedEvent.color }}>
                                <h5 className="modal-title text-white">
                                    {selectedEvent.code}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={closeEventModal}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {/* Error message */}
                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}

                                {/* Event name and details */}
                                <h4>{selectedEvent.name}</h4>
                                <p className="mb-2">
                                    <strong>Type:</strong>{' '}
                                    <span className={`badge ${selectedEvent.type === 'assignment' ? 'bg-danger' : 'bg-info'}`}>
                                        {selectedEvent.type}
                                    </span>
                                </p>

                                {/* Event Date */}
                                <p className="mb-2">
                                    <strong>Date:</strong>{' '}
                                    {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>

                                {/* Event Time */}
                                <p className="mb-2">
                                    <strong>Time:</strong>{' '}
                                    {selectedEvent.start.toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    })}
                                    {selectedEvent.type === 'course' && (
                                        <>
                                            {' - '}
                                            {selectedEvent.end.toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </>
                                    )}
                                </p>

                                {/* Delete Confirmation */}
                                {deleteConfirm && (
                                    <div className="alert alert-warning mt-3">
                                        <strong>Are you sure?</strong>
                                        {
                                            selectedEvent.type === 'course' ? (
                                            <p>This will delete the entire course and all its scheduled sessions.</p>) :
                                            (<p>This will permanently delete this assignment.</p>)
                                        }
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                {/* Edit Button */}
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={openEditModal}
                                    disabled={loading}
                                >
                                    Edit
                                </button>

                                {/* Delete Button */}
                                <button
                                    type="button"
                                    className={`btn ${deleteConfirm ? 'btn-danger' : 'btn-outline-danger'}`}
                                    onClick={handleDelete}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="spinner-border spinner-border-sm" />) : deleteConfirm ?
                                        'Confirm Delete' : 'Delete'}
                                </button>

                                {/* Close/Cancel Button */}
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeEventModal}
                                    disabled={loading}
                                >
                                    {deleteConfirm ? 'Cancel' : 'Close'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedEvent && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    Edit {selectedEvent.type === 'assignment' ? 'Assignment' : 'Course'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={closeEditModal}
                                ></button>
                            </div>
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-body">
                                    {/* Error message */}
                                    {error && (
                                        <div className="alert alert-danger" role="alert">
                                            {error}
                                        </div>
                                    )}

                                    {selectedEvent.type === 'assignment' ? (
                                        <>
                                            {/* Assignment Title */}
                                            <div className="mb-3">
                                                <label className="form-label">Assignment Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="assignmentTitle"
                                                    value={editFormData.assignmentTitle || ''}
                                                    onChange={handleEditChange}
                                                    required
                                                />
                                            </div>

                                            {/* Due Date */}
                                            <div className="mb-3">
                                                <label className="form-label">Due Date</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    name="dueDate"
                                                    value={editFormData.dueDate || ''}
                                                    onChange={handleEditChange}
                                                    required
                                                />
                                            </div>

                                            {/* Due Time */}
                                            <div className="mb-3">
                                                <label className="form-label">Due Time</label>
                                                <input
                                                    type="time"
                                                    className="form-control"
                                                    name="dueTime"
                                                    value={editFormData.dueTime?.slice(0, 5) || ''}
                                                    onChange={(e) => handleEditChange({
                                                        target: {
                                                            name: 'dueTime',
                                                            value: e.target.value + ':00'
                                                        }
                                                    })}
                                                    required
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Course Name */}
                                            <div className="mb-3">
                                                <label className="form-label">Course Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="courseName"
                                                    value={editFormData.courseName || ''}
                                                    onChange={handleEditChange}
                                                    required
                                                />
                                            </div>
                                            <p className="text-muted small">
                                                Note: To edit other course details (dates, times, days),
                                                please delete and recreate the course.
                                            </p>
                                        </>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeEditModal}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}