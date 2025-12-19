import { useMemo } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineClipboardDocumentList, HiOutlineFaceSmile } from 'react-icons/hi2';
import { useCourseFiles, useAssignmentMutations, useExamMutations } from '../hooks/useApi';
import AssignmentCard from '../components/AssignmentCard';
import LoadingSpinner from '../components/LoadingSpinner';

function Upcoming({ courses, onItemDeleted }) {
    const { courseFiles, loading: filesLoading } = useCourseFiles();
    const { deleteAssignment, loading: assignmentLoading } = useAssignmentMutations();
    const { deleteExam, loading: examLoading } = useExamMutations();

    const deleting = assignmentLoading || examLoading;

    // Sort by date and filter future items
    const sortedItems = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return courses
            .filter(item => {
                const itemDate = new Date(item.start || item.date);
                itemDate.setHours(0, 0, 0, 0);
                // Include items from today onwards and past due items (up to 7 days ago)
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return itemDate >= weekAgo;
            })
            .sort((a, b) => {
                const dateA = new Date(a.start || a.date);
                const dateB = new Date(b.start || b.date);
                return dateA - dateB;
            });
    }, [courses]);

    // Group items by status
    const { overdue, today: dueToday, upcoming } = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        return sortedItems.reduce((acc, item) => {
            const itemDate = new Date(item.start || item.date);
            if (itemDate < now) {
                acc.overdue.push(item);
            } else if (itemDate <= todayEnd) {
                acc.today.push(item);
            } else {
                acc.upcoming.push(item);
            }
            return acc;
        }, { overdue: [], today: [], upcoming: [] });
    }, [sortedItems]);

    const handleDelete = async (item) => {
        let result;
        if (item.type === 'exam') {
            result = await deleteExam(item.originalId || item.id);
        } else {
            result = await deleteAssignment(item.originalId || item.id);
        }

        if (result.success) {
            toast.success(`Successfully deleted "${item.title || item.name}"`);
            if (onItemDeleted) onItemDeleted();
        } else {
            toast.error(result.error || 'Failed to delete');
        }
    };

    if (filesLoading) {
        return <LoadingSpinner message="Loading..." fullScreen />;
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <HiOutlineClipboardDocumentList className="h-8 w-8" />
                    Upcoming
                </h1>
                <p className="text-base-content/60 mt-1">
                    Your assignments and exams at a glance
                </p>
            </div>

            {sortedItems.length === 0 ? (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center text-center py-16">
                        <HiOutlineFaceSmile className="h-16 w-16 text-success mb-4" />
                        <h2 className="card-title">All caught up!</h2>
                        <p className="text-base-content/60">
                            You have no upcoming assignments or exams.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Overdue Section */}
                    {overdue.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <span className="badge badge-error">Past Due</span>
                                <span className="text-base-content/60 text-sm font-normal">
                                    ({overdue.length} item{overdue.length !== 1 ? 's' : ''})
                                </span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {overdue.map((item, index) => (
                                    <AssignmentCard
                                        key={`overdue-${item.id}-${index}`}
                                        item={item}
                                        courseFiles={courseFiles}
                                        onDelete={handleDelete}
                                        deleting={deleting}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Due Today Section */}
                    {dueToday.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <span className="badge badge-warning">Due Today</span>
                                <span className="text-base-content/60 text-sm font-normal">
                                    ({dueToday.length} item{dueToday.length !== 1 ? 's' : ''})
                                </span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dueToday.map((item, index) => (
                                    <AssignmentCard
                                        key={`today-${item.id}-${index}`}
                                        item={item}
                                        courseFiles={courseFiles}
                                        onDelete={handleDelete}
                                        deleting={deleting}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Upcoming Section */}
                    {upcoming.length > 0 && (
                        <section>
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <span className="badge badge-info">Upcoming</span>
                                <span className="text-base-content/60 text-sm font-normal">
                                    ({upcoming.length} item{upcoming.length !== 1 ? 's' : ''})
                                </span>
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {upcoming.map((item, index) => (
                                    <AssignmentCard
                                        key={`upcoming-${item.id}-${index}`}
                                        item={item}
                                        courseFiles={courseFiles}
                                        onDelete={handleDelete}
                                        deleting={deleting}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

export default Upcoming;