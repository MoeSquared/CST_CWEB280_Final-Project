import { useState } from 'react';
import toast from 'react-hot-toast';
import {
    HiOutlineAcademicCap,
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineDocument,
    HiOutlineCheckCircle,
    HiOutlinePlusCircle,
    HiOutlineMinusCircle,
    HiOutlineTrash
} from 'react-icons/hi2';
import { useCourses, useMyEnrollments, useEnrollmentMutations, useCourseMutations } from '../hooks/useApi';
import LoadingSpinner from '../components/LoadingSpinner';

function Courses() {
    const { courses, setCourses, loading: coursesLoading, error: coursesError } = useCourses();
    const { enrolledCourseIds, setEnrolledCourseIds, loading: enrollmentsLoading } = useMyEnrollments();
    const { enrollInCourse, unenrollFromCourse, loading: mutationLoading } = useEnrollmentMutations();
    const { deleteCourse, loading: deleteLoading } = useCourseMutations();

    const isEnrolled = (courseId) => enrolledCourseIds.includes(courseId);

    const handleEnroll = async (course) => {
        const result = await enrollInCourse(course.id);
        if (result.success) {
            setEnrolledCourseIds(prev => [...prev, course.id]);
            toast.success(`Successfully enrolled in ${course.courseName || course.title}`);
        } else {
            toast.error(result.error || 'Failed to enroll');
        }
    };

    const handleUnenroll = async (course) => {
        if (!confirm(`Are you sure you want to leave ${course.courseName || course.title}?`)) {
            return;
        }

        const result = await unenrollFromCourse(course.id);
        if (result.success) {
            setEnrolledCourseIds(prev => prev.filter(id => id !== course.id));
            toast.success(`Successfully left ${course.courseName || course.title}`);
        } else {
            toast.error(result.error || 'Failed to leave course');
        }
    };

    const handleDeleteCourse = async (course) => {
        if (!confirm(`Are you sure you want to delete "${course.courseName || course.title}"? This will also delete all associated assignments and exams.`)) {
            return;
        }

        const result = await deleteCourse(course.id);
        if (result.success) {
            setCourses(prev => prev.filter(c => c.id !== course.id));
            setEnrolledCourseIds(prev => prev.filter(id => id !== course.id));
            toast.success(`Successfully deleted "${course.courseName || course.title}"`);
        } else {
            toast.error(result.error || 'Failed to delete course');
        }
    };

    const formatDays = (daysOfWeek) => {
        if (!daysOfWeek) return 'TBA';
        const dayMap = {
            'M': 'Mon',
            'Tu': 'Tue',
            'W': 'Wed',
            'Th': 'Thu',
            'F': 'Fri'
        };
        return daysOfWeek.split(',').map(d => dayMap[d.trim()] || d).join(', ');
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        // Handle both HH:MM:SS and HH:MM formats
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    };

    if (coursesLoading || enrollmentsLoading) {
        return <LoadingSpinner message="Loading courses..." fullScreen />;
    }

    // Separate enrolled and available courses
    const enrolledCourses = courses.filter(c => isEnrolled(c.id));
    const availableCourses = courses.filter(c => !isEnrolled(c.id));

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <HiOutlineAcademicCap className="h-8 w-8" />
                    Courses
                </h1>
                <p className="text-base-content/60 mt-1">
                    Browse available courses and manage your enrollments
                </p>
            </div>

            {coursesError && toast.error(coursesError)}

            {courses.length === 0 ? (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center text-center py-16">
                        <HiOutlineAcademicCap className="h-16 w-16 text-base-content/30 mb-4" />
                        <h2 className="card-title">No Courses Available</h2>
                        <p className="text-base-content/60">
                            There are no courses in the system yet.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* My Courses Section */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <HiOutlineCheckCircle className="h-6 w-6 text-success" />
                            My Courses
                            <span className="badge badge-success">{enrolledCourses.length}</span>
                        </h2>

                        {enrolledCourses.length === 0 ? (
                            <div className="card bg-base-200">
                                <div className="card-body text-center py-8">
                                    <p className="text-base-content/60">
                                        You haven't enrolled in any courses yet. Browse available courses below.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {enrolledCourses.map(course => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        isEnrolled={true}
                                        onAction={() => handleUnenroll(course)}
                                        onDelete={() => handleDeleteCourse(course)}
                                        loading={mutationLoading}
                                        deleteLoading={deleteLoading}
                                        formatDays={formatDays}
                                        formatTime={formatTime}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Available Courses Section */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <HiOutlinePlusCircle className="h-6 w-6 text-info" />
                            Available Courses
                            <span className="badge badge-info">{availableCourses.length}</span>
                        </h2>

                        {availableCourses.length === 0 ? (
                            <div className="card bg-base-200">
                                <div className="card-body text-center py-8">
                                    <p className="text-base-content/60">
                                        You're enrolled in all available courses!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {availableCourses.map(course => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        isEnrolled={false}
                                        onAction={() => handleEnroll(course)}
                                        onDelete={() => handleDeleteCourse(course)}
                                        loading={mutationLoading}
                                        deleteLoading={deleteLoading}
                                        formatDays={formatDays}
                                        formatTime={formatTime}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}

// Course Card Component
function CourseCard({ course, isEnrolled, onAction, onDelete, loading, deleteLoading, formatDays, formatTime }) {
    return (
        <div className={`card bg-base-100 shadow-md ${isEnrolled ? 'border-2 border-success' : ''}`}>
            <div className="card-body">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <h3 className="card-title text-lg">
                        {course.courseName || course.title}
                    </h3>
                    {isEnrolled && (
                        <span className="badge badge-success gap-1">
                            <HiOutlineCheckCircle className="h-3 w-3" />
                            Enrolled
                        </span>
                    )}
                </div>

                {/* Course Info */}
                <div className="space-y-2 mt-2">
                    {course.credits && (
                        <div className="flex items-center gap-2 text-sm text-base-content/70">
                            <HiOutlineAcademicCap className="h-4 w-4" />
                            <span>{course.credits} Credits</span>
                        </div>
                    )}

                    {course.daysOfWeek && (
                        <div className="flex items-center gap-2 text-sm text-base-content/70">
                            <HiOutlineCalendar className="h-4 w-4" />
                            <span>{formatDays(course.daysOfWeek)}</span>
                        </div>
                    )}

                    {course.startTime && course.endTime && (
                        <div className="flex items-center gap-2 text-sm text-base-content/70">
                            <HiOutlineClock className="h-4 w-4" />
                            <span>{formatTime(course.startTime)} - {formatTime(course.endTime)}</span>
                        </div>
                    )}

                    {course.startDate && course.endDate && (
                        <div className="text-xs text-base-content/50 mt-1">
                            {new Date(course.startDate).toLocaleDateString()} - {new Date(course.endDate).toLocaleDateString()}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="card-actions justify-between items-center mt-4">
                    <button
                        className="btn btn-error btn-outline btn-sm gap-1"
                        onClick={onDelete}
                        disabled={deleteLoading}
                    >
                        {deleteLoading ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <HiOutlineTrash className="h-4 w-4" />
                        )}
                        Delete
                    </button>

                    <div className="flex gap-2">
                        {course.hasFile && (
                            <a
                                href={`http://localhost:8080/api/view-course/${course.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost btn-sm gap-1"
                            >
                                <HiOutlineDocument className="h-4 w-4" />
                                Syllabus
                            </a>
                        )}

                        <button
                            className={`btn btn-sm ${isEnrolled ? 'btn-error btn-outline' : 'btn-success'}`}
                            onClick={onAction}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading loading-spinner loading-xs"></span>
                            ) : isEnrolled ? (
                                <>
                                    <HiOutlineMinusCircle className="h-4 w-4" />
                                    Leave
                                </>
                            ) : (
                                <>
                                    <HiOutlinePlusCircle className="h-4 w-4" />
                                    Join
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Courses;