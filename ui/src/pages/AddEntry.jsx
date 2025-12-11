import { useState,useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';

const API_BASE_URL = 'http://localhost:8080/api';

function AddEntry({ onAddCourse, onAddAssignment }) {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.refresh) {
            window.location.reload();
        }
    }, [location.state?.refresh]);

    const preSelectedType = location.state?.selectedType || '';
    const [selectedType, setSelectedType] = useState(preSelectedType);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Form data states
    const [courseData, setCourseData] = useState({
        courseName: '',
        credits: '',
        startDate: '',
        endDate: '',
        daysOfWeek: '',
        startTime: '',
        endTime: ''
    });

    const [assignmentData, setAssignmentData] = useState({
        assignmentTitle: '',
        courseId: '',
        courseName: '',
        startDate: '',
        endDate: '',
        dueTime: ''
    });

    // Available courses for assignment dropdown
    const [availableCourses, setAvailableCourses] = useState([]);

    // File states
    const [courseFile, setCourseFile] = useState(null);
    const [assignmentFile, setAssignmentFile] = useState(null);


    // Fetch courses when assignment is selected
    useEffect(() => {
        if (selectedType === 'assignment') {
            fetchCourses();
        }
    }, [selectedType]);

    // Fetches all courses (split up into multiple events)
    const fetchCourses = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/courses`);
            if (response.ok) {
                const courses = await response.json();
                // Extract unique courses from events
                const uniqueCourses = {};
                courses.forEach(event => {
                    if (!uniqueCourses[event.id]) {
                        uniqueCourses[event.id] = {
                            id: event.id,
                            name: event.title
                        };
                    }
                });
                setAvailableCourses(Object.values(uniqueCourses));
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    // Handle checkbox selection
    const handleTypeSelection = (type) => {
        setSelectedType(type);
        setErrors({});
        // Clear file when switching types
        setCourseFile(null);
        setAssignmentFile(null);

        if (type === 'assignment') {
            fetchCourses();
        }
    };

    // Handle course form changes
    const handleCourseChange = (e) => {
        const { name, value, type, checked } = e.target;

        setCourseData((prevData) => {
            if (name === "daysOfWeek" && type === "checkbox") {

                // If daysOfWeek is populated, split it up into a list
                let days;
                if(prevData.daysOfWeek) {
                    days = prevData.daysOfWeek.split(",").filter(day => day.trim());
                }
                // Otherwise make days an empty list
                else {
                    days = [];
                }

                // If the box that was clicked is now checked, add the box's value to the array of days
                let updatedDays;
                if (checked) {
                    updatedDays = [...days, value]
                }
                // Otherwise, the box that was clicked is now unchecked. Remove the box's value from the array
                else {
                    updatedDays = days.filter(d => d !== value);
                }

                // return the previous data with daysOfWeek field updated to a string created by joining
                // the values of the array
                return { ...prevData, daysOfWeek: updatedDays.join(",") };
            }

            // return the previous data with appropriate key/value pairs
            return { ...prevData, [name]: value };
        });
    };

    // Handle assignment form changes
    const handleAssignmentChange = (e) => {
        const { name, value } = e.target;

        // When a course is selected, store the course name
        if (name === 'courseId') {
            const selectedCourse = availableCourses.find(c => c.id === parseInt(value));
            setAssignmentData(prev => ({
                ...prev,
                courseId: value,
                courseName: selectedCourse ? selectedCourse.name : ''
            }));
        }
        else if (name === 'dueDate') {
            // For assignments, start and end dates are the same
            setAssignmentData(prev => ({
                ...prev,
                startDate: value,
                endDate: value
            }));
        }
        else {
            setAssignmentData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Clear errors
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Handle file changes
    const handleCourseFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedType = '.pdf';
            const fileExt = '.' + file.name.split('.').pop().toLowerCase();

            if (allowedType !== fileExt ) {
                setErrors(prev => ({ ...prev, courseFile: 'Only PDF files allowed' }));
                e.target.value = '';
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, courseFile: 'File size must be less than 5MB' }));
                e.target.value = '';
                return;
            }

            setCourseFile(file);
            setErrors(prev => ({ ...prev, courseFile: '' }));
        }
    };

    const handleAssignmentFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedType = '.pdf'
            const fileExt = '.' + file.name.split('.').pop().toLowerCase();

            if (allowedType !== fileExt) {
                setErrors(prev => ({ ...prev, assignmentFile: 'Only PDF allowed' }));
                e.target.value = '';
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, assignmentFile: 'File size must be less than 5MB' }));
                e.target.value = '';
                return;
            }

            setAssignmentFile(file);
            setErrors(prev => ({ ...prev, assignmentFile: '' }));
        }
    };

    // Validate course data
    const validateCourse = () => {
        const newErrors = {};

        if (!courseData.courseName.trim()) {
            newErrors.courseName = 'Course name is required';
        }
        if (!courseData.credits) {
            newErrors.credits = 'Credits is required';
        }
        if (!courseData.startDate) {
            newErrors.startDate = 'Start date is required';
        }
        if (!courseData.endDate) {
            newErrors.endDate = 'End date is required';
        }
        if (courseData.startDate && courseData.endDate && courseData.startDate > courseData.endDate) {
            newErrors.endDate = 'End date must be after start date';
        }
        if (!courseData.daysOfWeek.trim()) {
            newErrors.daysOfWeek = 'Days of week is required';
        }
        if (!courseData.startTime) {
            newErrors.startTime = 'Start time is required';
        }
        if (!courseData.endTime) {
            newErrors.endTime = 'End time is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validate assignment data
    const validateAssignment = () => {
        const newErrors = {};

        if (!assignmentData.assignmentTitle.trim()) {
            newErrors.assignmentTitle = 'Assignment title is required';
        }
        if (!assignmentData.courseId) {
            newErrors.courseId = 'Please select a course';
        }
        if (!assignmentData.startDate) {
            newErrors.dueDate = 'Due date is required';
        }
        if (!assignmentData.dueTime) {
            newErrors.dueTime = 'Due time is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle course form submission
    const handleCourseSubmit = async (e) => {
        e.preventDefault();

        if (!validateCourse()) {
            return;
        }

        setLoading(true);

        try {
            // Format time to HH:MM:SS
            const formattedData = {
                ...courseData,
                startTime: courseData.startTime + ':00',
                endTime: courseData.endTime + ':00'
            };

            let response;

            // If there's a file, use FormData (multipart/form-data)
            if (courseFile) {
                const formData = new FormData();
                formData.append('course_form', JSON.stringify(formattedData));
                formData.append('file', courseFile);

                response = await fetch(`${API_BASE_URL}/accept-course`, {
                    method: 'POST',
                    body: formData
                });
            } else {
                // No file, use regular JSON
                response = await fetch(`${API_BASE_URL}/accept-course`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formattedData)
                });
            }

            if (response.ok) {
                const courseEvents = await response.json();

                // Add course events to the calendar
                if (onAddCourse && courseEvents && courseEvents.length > 0) {
                    courseEvents.forEach(event => {
                        onAddCourse({
                            ...event,
                            color: '#17a2b8'
                        });
                    });
                }

                navigate('/calendar');
            }
            else {
                const error = await response.json();
                setErrors({ submit: error.detail || 'Failed to save course' });
            }
        }
        catch (error) {
            console.error('Error submitting course:', error);
            setErrors({ submit: 'Network error. Please try again.' });
        }
        finally {
            setLoading(false);
        }
    };

    // Handle assignment form submission
    const handleAssignmentSubmit = async (e) => {
        e.preventDefault();

        if (!validateAssignment()) {
            return;
        }

        setLoading(true);

        try {
            // Format assignment data for API
            const formattedData = {
                assignmentTitle: assignmentData.assignmentTitle,
                courseId: parseInt(assignmentData.courseId),
                courseName: assignmentData.courseName,
                startDate: assignmentData.startDate,
                endDate: assignmentData.endDate,
                dueDate: assignmentData.startDate,
                dueTime: assignmentData.dueTime + ':00'
            };

            let response;

            // If there's a file, use FormData (multipart/form-data)
            if (assignmentFile) {
                const formData = new FormData();
                formData.append('assignment_form', JSON.stringify(formattedData));
                formData.append('file', assignmentFile);

                response = await fetch(`${API_BASE_URL}/accept-assignment`, {
                    method: 'POST',
                    body: formData
                });
            }
            else {
                // No file, use regular JSON
                response = await fetch(`${API_BASE_URL}/accept-assignment`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formattedData)
                });
            }

            if (response.ok) {
                const assignmentEvent = await response.json();

                // Add assignment to calendar and upcoming
                if (onAddAssignment && assignmentEvent) {
                    onAddAssignment({
                        ...assignmentEvent,
                        color: '#dc3545'
                    });
                }

                window.location.href = '/calendar'
            }
            else {
                const error = await response.json();
                setErrors({ submit: error.detail || 'Failed to save assignment' });
            }
        }
        catch (error) {
            console.error('Error submitting assignment:', error);
            setErrors({ submit: 'Network error. Please try again.' });
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-lg-6">
                    <h2 className="mb-4">Add Entry</h2>
                    <p className="text-muted mb-4">What would you like to add?</p>

                    {/* Error message */}
                    {errors.submit && (
                        <div className="alert alert-danger" role="alert">
                            {errors.submit}
                        </div>
                    )}

                    {/* Checkbox Selection */}
                    <div className="d-flex gap-4 mb-4">
                        {/*Class checkbox*/}
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="classCheckbox"
                                checked={selectedType === 'class'}
                                onChange={() => handleTypeSelection(selectedType === 'class' ? '' : 'class')}
                                disabled={loading}
                            />
                            <label className="form-check-label" htmlFor="classCheckbox">Class</label>
                        </div>
                        {/*Assignment checkbox*/}
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="assignmentCheckbox"
                                checked={selectedType === 'assignment'}
                                onChange={() => handleTypeSelection(selectedType === 'assignment' ? '' : 'assignment')}
                                disabled={loading}
                            />
                            <label className="form-check-label" htmlFor="assignmentCheckbox">Assignment</label>
                        </div>
                    </div>

                    {/* Class Details Form */}
                    {selectedType === 'class' && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white">
                                <h5 className="mb-0">Class Details</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleCourseSubmit} noValidate>
                                    <div className="mb-3">
                                        {/*Course name input*/}
                                        <label htmlFor="courseName" className="form-label">Course Name *</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.courseName ? 'is-invalid' : ''}`}
                                            id="courseName"
                                            name="courseName"
                                            value={courseData.courseName}
                                            onChange={handleCourseChange}
                                            required
                                            disabled={loading}
                                        />
                                        {errors.courseName && <div className="invalid-feedback">{errors.courseName}</div>}
                                    </div>

                                    <div className="mb-3">
                                        {/*Credit units input*/}
                                        <label htmlFor="credits" className="form-label">Credits *</label>
                                        <input
                                            type="number"
                                            className={`form-control ${errors.credits ? 'is-invalid' : ''}`}
                                            id="credits"
                                            name="credits"
                                            value={courseData.credits}
                                            onChange={handleCourseChange}
                                            min="1"
                                            max="6"
                                            step="1"
                                            required
                                            disabled={loading}
                                        />
                                        {errors.credits && <div className="invalid-feedback">{errors.credits}</div>}
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            {/*Start date mini cal selector thing*/}
                                            <label htmlFor="startDate" className="form-label">Start Date *</label>
                                            <input
                                                type="date"
                                                className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                                                id="startDate"
                                                name="startDate"
                                                value={courseData.startDate}
                                                onChange={handleCourseChange}
                                                required
                                                disabled={loading}
                                            />
                                            {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                                        </div>

                                        <div className="col-md-6 mb-3">
                                            {/*End date mini cal selector thing*/}
                                            <label htmlFor="endDate" className="form-label">End Date *</label>
                                            <input
                                                type="date"
                                                className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                                                id="endDate"
                                                name="endDate"
                                                value={courseData.endDate}
                                                onChange={handleCourseChange}
                                                required
                                                disabled={loading}
                                            />
                                            {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        {/*Days of the week checkboxes*/}
                                        <label className="form-label">Days of Week *</label>

                                        {/*Monday*/}
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="day-M"
                                                name="daysOfWeek"
                                                value="M"
                                                checked={courseData.daysOfWeek.includes("M")}
                                                onChange={handleCourseChange}
                                                disabled={loading}
                                            />
                                            <label className="form-check-label" htmlFor="day-M">M</label>
                                        </div>
                                        {/*Tuesday*/}
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="day-Tu"
                                                name="daysOfWeek"
                                                value="Tu"
                                                checked={courseData.daysOfWeek.includes("Tu")}
                                                onChange={handleCourseChange}
                                                disabled={loading}
                                            />
                                            <label className="form-check-label" htmlFor="day-Tu">Tu</label>
                                        </div>
                                        {/*Wednesday*/}
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="day-W"
                                                name="daysOfWeek"
                                                value="W"
                                                checked={courseData.daysOfWeek.includes("W")}
                                                onChange={handleCourseChange}
                                                disabled={loading}
                                            />
                                            <label className="form-check-label" htmlFor="day-W">W</label>
                                        </div>
                                        {/*Thursday*/}
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="day-Th"
                                                name="daysOfWeek"
                                                value="Th"
                                                checked={courseData.daysOfWeek.includes("Th")}
                                                onChange={handleCourseChange}
                                                disabled={loading}
                                            />
                                            <label className="form-check-label" htmlFor="day-Th">Th</label>
                                        </div>
                                        {/*Friday*/}
                                        <div className="form-check form-check-inline">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="day-F"
                                                name="daysOfWeek"
                                                value="F"
                                                checked={courseData.daysOfWeek.includes("F")}
                                                onChange={handleCourseChange}
                                                disabled={loading}
                                            />
                                            <label className="form-check-label" htmlFor="day-F">F</label>
                                        </div>

                                        {errors.daysOfWeek &&
                                            <div className="invalid-feedback">{errors.daysOfWeek}</div>}
                                    </div>

                                    <div className="row">
                                        {/*Start time scroller*/}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="startTime" className="form-label">Start Time *</label>
                                            <input
                                                type="time"
                                                className={`form-control ${errors.startTime ? 'is-invalid' : ''}`}
                                                id="startTime"
                                                name="startTime"
                                                value={courseData.startTime}
                                                onChange={handleCourseChange}
                                                required
                                                disabled={loading}
                                            />
                                            {errors.startTime && <div className="invalid-feedback">{errors.startTime}</div>}
                                        </div>
                                        {/*Endtime scroller*/}
                                        <div className="col-md-6 mb-3">
                                            <label htmlFor="endTime" className="form-label">End Time *</label>
                                            <input
                                                type="time"
                                                className={`form-control ${errors.endTime ? 'is-invalid' : ''}`}
                                                id="endTime"
                                                name="endTime"
                                                value={courseData.endTime}
                                                onChange={handleCourseChange}
                                                required
                                                disabled={loading}
                                            />
                                            {errors.endTime && <div className="invalid-feedback">{errors.endTime}</div>}
                                        </div>
                                    </div>

                                    {/* File Upload for Course */}
                                    <div className="mb-3">
                                        <label htmlFor="courseFile" className="form-label">Syllabus (Optional)</label>
                                        <input
                                            type="file"
                                            className={`form-control ${errors.courseFile ? 'is-invalid' : ''}`}
                                            id="courseFile"
                                            onChange={handleCourseFileChange}
                                            accept=".pdf,.docx"
                                            disabled={loading}
                                        />
                                        {errors.courseFile && <div className="invalid-feedback">{errors.courseFile}</div>}
                                        <small className="form-text text-muted">
                                            Accepted formats: PDF, DOCX (Max 5MB)
                                        </small>
                                        {courseFile && (
                                            <div className="mt-2">
                                                <small className="text-success">
                                                    {courseFile.name} ({(courseFile.size / 1024 / 1024).toFixed(2)} MB)
                                                </small>
                                            </div>
                                        )}
                                    </div>

                                    {/*Submit button*/}
                                    <button type="submit" className="btn btn-dark w-100" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Class'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Assignment Details Form */}
                    {selectedType === 'assignment' && (
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white">
                                <h5 className="mb-0">Assignment Details</h5>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleAssignmentSubmit} noValidate>
                                    <div className="mb-3">
                                        {/*Assignment title*/}
                                        <label htmlFor="assignmentTitle" className="form-label">Assignment Title *</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.assignmentTitle ? 'is-invalid' : ''}`}
                                            id="assignmentTitle"
                                            name="assignmentTitle"
                                            value={assignmentData.assignmentTitle}
                                            onChange={handleAssignmentChange}
                                            required
                                            disabled={loading}
                                        />
                                        {errors.assignmentTitle && <div className="invalid-feedback">{errors.assignmentTitle}</div>}
                                    </div>

                                    <div className="mb-3">
                                        {/*Course id (what course the assignment is for)*/}
                                        <label htmlFor="courseId" className="form-label">Class *</label>
                                        <select
                                            className={`form-select ${errors.courseId ? 'is-invalid' : ''}`}
                                            id="courseId"
                                            name="courseId"
                                            value={assignmentData.courseId}
                                            onChange={handleAssignmentChange}
                                            required
                                            disabled={loading}
                                        >
                                            <option value="">Select a class</option>
                                            {availableCourses.map(course => (
                                                <option key={course.id} value={course.id}>
                                                    {course.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.courseId && <div className="invalid-feedback">{errors.courseId}</div>}
                                    </div>

                                    {/*Due Date*/}
                                    <div className="mb-3">
                                        <label htmlFor="dueDate" className="form-label">Due Date *</label>
                                        <input
                                            type="date"
                                            className={`form-control ${errors.dueDate ? 'is-invalid' : ''}`}
                                            id="dueDate"
                                            name="dueDate"
                                            value={assignmentData.startDate}
                                            onChange={handleAssignmentChange}
                                            required
                                            disabled={loading}
                                        />
                                        {errors.dueDate && <div className="invalid-feedback">{errors.dueDate}</div>}
                                    </div>

                                    {/*Due Time*/}
                                    <div className="mb-3">
                                        <label htmlFor="dueTime" className="form-label">Due Time *</label>
                                        <input
                                            type="time"
                                            className={`form-control ${errors.dueTime ? 'is-invalid' : ''}`}
                                            id="dueTime"
                                            name="dueTime"
                                            value={assignmentData.dueTime}
                                            onChange={handleAssignmentChange}
                                            required
                                            disabled={loading}
                                        />
                                        {errors.dueTime && <div className="invalid-feedback">{errors.dueTime}</div>}
                                    </div>


                                    {/* File Upload for Assignment */}
                                    <div className="mb-3">
                                        <label htmlFor="assignmentFile" className="form-label">Assignment Document (Optional)</label>
                                        <input
                                            type="file"
                                            className={`form-control ${errors.assignmentFile ? 'is-invalid' : ''}`}
                                            id="assignmentFile"
                                            onChange={handleAssignmentFileChange}
                                            accept=".pdf,.docx"
                                            disabled={loading}
                                        />
                                        {errors.assignmentFile && <div className="invalid-feedback">{errors.assignmentFile}</div>}
                                        <small className="form-text text-muted">
                                            Accepted formats: PDF, DOCX (Max 5MB)
                                        </small>
                                        {assignmentFile && (
                                            <div className="mt-2">
                                                <small className="text-success">
                                                    📎 {assignmentFile.name} ({(assignmentFile.size / 1024 / 1024).toFixed(2)} MB)
                                                </small>
                                            </div>
                                        )}
                                    </div>



                                    {/*Submit button*/}
                                    <button type="submit" className="btn btn-dark w-100" disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Assignment'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AddEntry;