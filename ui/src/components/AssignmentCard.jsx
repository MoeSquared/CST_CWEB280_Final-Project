import {
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineDocumentText,
    HiOutlinePaperClip,
    HiOutlineAcademicCap,
    HiOutlineDocument,
    HiOutlineTrash
} from 'react-icons/hi2';

function AssignmentCard({ item, courseFiles, onDelete, deleting }) {
    const isExam = item.type === 'exam';

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Format time
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate days until due
    const getDaysUntil = (dateString) => {
        if (!dateString) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(dateString);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysUntil = getDaysUntil(item.start || item.date);

    // Get urgency styling
    const getUrgencyBadge = () => {
        if (daysUntil === null) return null;
        if (daysUntil < 0) {
            const daysOverdue = Math.abs(daysUntil);
            return <span className="badge badge-ghost">{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue</span>;
        }
        if (daysUntil === 0) return <span className="badge badge-error">Due today!</span>;
        if (daysUntil === 1) return <span className="badge badge-warning">1 day left</span>;
        if (daysUntil <= 3) return <span className="badge badge-warning">{daysUntil} days left</span>;
        if (daysUntil <= 7) return <span className="badge badge-info">{daysUntil} days left</span>;
        // Always show days left for all future items
        return <span className="badge badge-success">{daysUntil} days left</span>;
    };

    const getCardClass = () => {
        if (daysUntil === null) return '';
        if (daysUntil < 0) return 'opacity-60';
        if (daysUntil === 0) return 'border-error border-2';
        if (daysUntil <= 3) return 'border-warning border-2';
        return '';
    };

    // Check if course has a file
    const courseHasFile = courseFiles && courseFiles[item.courseId];

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${item.title || item.name}"?`)) {
            onDelete(item);
        }
    };

    return (
        <div className={`card bg-base-100 shadow-md ${getCardClass()}`}>
            <div className="card-body">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        {isExam ? (
                            <HiOutlineAcademicCap className="h-6 w-6 text-warning" />
                        ) : (
                            <HiOutlineDocumentText className="h-6 w-6 text-error" />
                        )}
                        <h2 className="card-title text-lg">
                            {item.title || item.name}
                        </h2>
                    </div>
                    {getUrgencyBadge()}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`badge ${isExam ? 'badge-warning' : 'badge-error'}`}>
                        {isExam ? 'Exam' : 'Assignment'}
                    </span>
                    <span className="badge badge-primary">{item.code}</span>
                    {(item.weight || item.worth) && (
                        <span className="badge badge-info">
                            Worth: {item.weight || item.worth}%
                        </span>
                    )}
                </div>

                {/* Description */}
                {item.description && (
                    <p className="text-sm text-base-content/70 mt-2">
                        {item.description}
                    </p>
                )}

                {/* Due date/time */}
                <div className="flex items-center gap-4 mt-3 text-sm text-base-content/60">
                    <div className="flex items-center gap-1">
                        <HiOutlineCalendar className="h-4 w-4" />
                        {formatDate(item.start || item.date)}
                    </div>
                    {!isExam && item.start && (
                        <div className="flex items-center gap-1">
                            <HiOutlineClock className="h-4 w-4" />
                            {formatTime(item.start)}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="card-actions justify-between mt-4">
                    <button
                        className="btn btn-error btn-outline btn-sm gap-1"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                            <HiOutlineTrash className="h-4 w-4" />
                        )}
                        Delete
                    </button>
                    <div className="flex gap-2">
                        {item.hasFile && (
                            <a
                                href={`http://localhost:8080/api/view-assignment/${item.originalId || item.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline btn-primary btn-sm gap-1"
                            >
                                <HiOutlinePaperClip className="h-4 w-4" />
                                View File
                            </a>
                        )}
                        {courseHasFile && (
                            <a
                                href={`http://localhost:8080/api/view-course/${item.courseId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline btn-sm gap-1"
                            >
                                <HiOutlineDocument className="h-4 w-4" />
                                Syllabus
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AssignmentCard;