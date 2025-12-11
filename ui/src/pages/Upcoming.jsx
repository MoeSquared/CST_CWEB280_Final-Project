import { useNavigate } from 'react-router';
import {useState, useEffect} from "react";

const API_BASE_URL = 'http://localhost:8080/api';
function Upcoming({ courses }) {
    const navigate = useNavigate();
    const [courseFiles, setCourseFiles] = useState({}); // Map of course Ids to file info
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingCourses = courses
        .filter(course => new Date(course.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Fetch course file information
    useEffect(() => {
        fetchCourseFiles();
    }, []);

    const fetchCourseFiles = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/course-files`);
            if (response.ok) {
                const fileData = await response.json();
                // Create a map of course ID to file info
                const fileMap = {};
                fileData.forEach(course => {
                    if (course.has_file) {
                        fileMap[course.id] = {
                            filename: course.filename,
                            file_path: course.file_path
                        };
                    }
                });
                setCourseFiles(fileMap);
            }
        } catch (error) {
            console.error('Error fetching course files:', error);
        }
    };

    const getDaysUntil = (date) => {
        const courseDate = new Date(date);
        const diffTime = courseDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getBadgeClass = (days) => {
        if (days === 0) return 'bg-danger';
        if (days === 1) return 'bg-warning';
        if (days <= 7) return 'bg-info';
        return 'bg-success';
    };

    // Navigate to Add page with assignment pre-selected
    const navigateToAddAssignment = () => {
        navigate('/add', { state: { selectedType: 'assignment' } });
    };

    const handleFileOpen = (fileType, id) => {
        const endpoint =
            fileType === "assignment" ? `${API_BASE_URL}/view-assignment/${id}` : `${API_BASE_URL}/view-course/${id}`;

        window.open(endpoint, "_blank");
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Upcoming Assignments & Deadlines</h2>
                <button
                    onClick={navigateToAddAssignment} className="btn btn-primary">Add New assignment</button>
            </div>

            {upcomingCourses.length > 0 ? (
                <div className="row g-3">
                    {upcomingCourses.map(course => {
                        const daysUntil = getDaysUntil(course.date);
                        const courseSyllabus = courseFiles[course.courseId];

                        return (
                            <div key={course.id} className="col-12">
                                <div className="card border-0 shadow-sm">
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-auto">
                                                <div
                                                    className="px-3 py-2 rounded text-white fw-bold"
                                                    style={{ backgroundColor: course.color }}
                                                >
                                                    {course.code}
                                                    {/* Show file icon for course syllabus if this is an assignment */}
                                                    {course.type === 'assignment' && courseSyllabus &&  (
                                                        <button
                                                            className="btn btn-sm btn-link text-white ms-2 p-0"
                                                            onClick={() => {
                                                                handleFileOpen('course', course.courseId, courseSyllabus.filename);
                                                            }}
                                                            title="view course syllabus"
                                                        >
                                                            &#128462; View syllabus
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="col">
                                                <div className="d-flex align-items-center">
                                                    <h5 className="mb-1 me-2">{course.name}</h5>
                                                    {/* Show file icon for assignment documents */}
                                                    {course.type === 'assignment' && course.hasFile && (
                                                        <button
                                                            className="btn btn-sm btn-link p-0"
                                                            onClick={() => {
                                                                handleFileOpen('assignment', course.originalId, course.filename);
                                                            }}
                                                            title="view assignment document"
                                                        >
                                                            &#128462; View assignment requirements
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-muted mb-0">
                                                    {new Date(course.date).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                <small className="text-muted">Type: {course.type}</small>
                                            </div>
                                            <div className="col-auto">
                        <span className={`badge ${getBadgeClass(daysUntil)} px-3 py-2`}>
                          {daysUntil === 0
                              ? 'Today'
                              : daysUntil === 1
                                  ? 'Tomorrow'
                                  : `In ${daysUntil} days`}
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="alert alert-info" role="alert">
                    <h4>You don't have any upcoming assignments or deadlines.</h4>
                    <hr />
                    <p className="mb-0">
                        <button className="btn btn-primary" onClick={navigateToAddAssignment}>Add your first assignment</button>
                    </p>
                </div>
            )}
        </div>
    );
}

export default Upcoming;