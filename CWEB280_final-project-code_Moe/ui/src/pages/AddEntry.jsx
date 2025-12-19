import { useState } from 'react';
import toast from 'react-hot-toast';
import {
    HiOutlineAcademicCap,
    HiOutlineDocumentText,
    HiOutlineClipboardDocumentCheck,
    HiOutlinePlus
} from 'react-icons/hi2';
import { useCourses, useCourseMutations, useAssignmentMutations, useExamMutations } from '../hooks/useApi';
import CourseForm from '../components/CourseForm';
import AssignmentForm from '../components/AssignmentForm';
import ExamForm from '../components/ExamForm';
import LoadingSpinner from '../components/LoadingSpinner';

function AddEntry({ onAddCourse, onAddAssignment }) {
    const [selectedType, setSelectedType] = useState(null);

    const { courses, loading: coursesLoading, refetch: refetchCourses } = useCourses();
    const { createCourse, loading: courseLoading } = useCourseMutations();
    const { createAssignment, loading: assignmentLoading } = useAssignmentMutations();
    const { createExam, loading: examLoading } = useExamMutations();

    const handleCourseSubmit = async (courseData, file) => {
        const result = await createCourse(courseData, file);
        if (result.success) {
            toast.success('Course added successfully!');
            refetchCourses();
            if (onAddCourse) onAddCourse(result.data);
        } else {
            toast.error(result.error || 'Failed to add course');
        }
        return result;
    };

    const handleAssignmentSubmit = async (assignmentData, file) => {
        const result = await createAssignment(assignmentData, file);
        if (result.success) {
            toast.success('Assignment added successfully!');
            if (onAddAssignment) onAddAssignment(result.data);
        } else {
            toast.error(result.error || 'Failed to add assignment');
        }
        return result;
    };

    const handleExamSubmit = async (examData) => {
        const result = await createExam(examData);
        if (result.success) {
            toast.success('Exam added successfully!');
            if (onAddAssignment) onAddAssignment(result.data);
        } else {
            toast.error(result.error || 'Failed to add exam');
        }
        return result;
    };

    const entryTypes = [
        {
            id: 'course',
            label: 'Course',
            Icon: HiOutlineAcademicCap,
            color: 'primary',
            description: 'Add a new course to your schedule'
        },
        {
            id: 'assignment',
            label: 'Assignment',
            Icon: HiOutlineDocumentText,
            color: 'error',
            description: 'Track an assignment due date'
        },
        {
            id: 'exam',
            label: 'Exam',
            Icon: HiOutlineClipboardDocumentCheck,
            color: 'warning',
            description: 'Schedule an upcoming exam'
        }
    ];

    if (coursesLoading) {
        return <LoadingSpinner message="Loading..." fullScreen />;
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <HiOutlinePlus className="h-8 w-8" />
                    Add Entry
                </h1>
                <p className="text-base-content/60 mt-1">
                    Add a new course, assignment, or exam to your tracker
                </p>
            </div>

            {/* Type Selection */}
            <div className="card bg-base-100 shadow-xl mb-6">
                <div className="card-body">
                    <h2 className="card-title mb-4">What would you like to add?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {entryTypes.map(type => {
                            const Icon = type.Icon;
                            const isSelected = selectedType === type.id;
                            return (
                                <label
                                    key={type.id}
                                    className="cursor-pointer"
                                    data-cy={`entry-type-${type.id}`}
                                >
                                    <input
                                        type="checkbox"
                                        id={`${type.id}Checkbox`}
                                        checked={isSelected}
                                        onChange={() => setSelectedType(isSelected ? null : type.id)}
                                        className="hidden"
                                        data-cy={`checkbox-${type.id}`}
                                    />
                                    <div className={`
                                        card border-2 transition-all hover:shadow-lg
                                        ${isSelected
                                        ? `border-${type.color} bg-${type.color}/10`
                                        : 'border-base-300 hover:border-base-content/30'
                                    }
                                    `}>
                                        <div className="card-body items-center text-center p-6">
                                            <Icon className={`h-10 w-10 ${isSelected ? `text-${type.color}` : 'text-base-content/50'}`} />
                                            <h3 className="font-bold mt-2">{type.label}</h3>
                                            <p className="text-sm text-base-content/60">
                                                {type.description}
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Form Section */}
            {selectedType ? (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title mb-4">
                            {selectedType === 'course' && (
                                <>
                                    <HiOutlineAcademicCap className="h-6 w-6 text-primary" />
                                    Add New Course
                                </>
                            )}
                            {selectedType === 'assignment' && (
                                <>
                                    <HiOutlineDocumentText className="h-6 w-6 text-error" />
                                    Add New Assignment
                                </>
                            )}
                            {selectedType === 'exam' && (
                                <>
                                    <HiOutlineClipboardDocumentCheck className="h-6 w-6 text-warning" />
                                    Add New Exam
                                </>
                            )}
                        </h2>

                        {selectedType === 'course' && (
                            <CourseForm
                                onSubmit={handleCourseSubmit}
                                loading={courseLoading}
                            />
                        )}

                        {selectedType === 'assignment' && (
                            <AssignmentForm
                                courses={courses}
                                onSubmit={handleAssignmentSubmit}
                                loading={assignmentLoading}
                            />
                        )}

                        {selectedType === 'exam' && (
                            <ExamForm
                                courses={courses}
                                onSubmit={handleExamSubmit}
                                loading={examLoading}
                            />
                        )}
                    </div>
                </div>
            ) : (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body items-center text-center py-16">
                        <h2 className="card-title">Select an entry type</h2>
                        <p className="text-base-content/60">
                            Choose what you'd like to add from the options above
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AddEntry;