import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Helper function to get auth headers
 */
const getAuthHeaders = (includeContentType = true) => {
    const token = localStorage.getItem('token');
    const headers = {};

    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

/**
 * Generic fetch function with error handling
 */
const apiFetch = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...getAuthHeaders(!options.body || !(options.body instanceof FormData)),
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || data.error || 'An error occurred');
    }

    return data;
};



/**
 * Hook to fetch all courses
 */
export function useCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/courses');
            setCourses(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    return { courses, setCourses, loading, error, refetch: fetchCourses };
}


/**
 * Hook for course mutations (create, update, delete)
 */
export function useCourseMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const createCourse = async (courseData, file = null) => {
        setLoading(true);
        setError(null);
        try {
            let body;
            let headers = getAuthHeaders(false);

            if (file) {
                const formData = new FormData();
                formData.append('course_form', JSON.stringify(courseData));
                formData.append('file', file);
                body = formData;
            } else {
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify(courseData);
            }

            const response = await fetch(`${API_BASE_URL}/accept-course`, {
                method: 'POST',
                headers,
                body,
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Failed to create course');

            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateCourse = async (courseId, courseData, file = null) => {
        setLoading(true);
        setError(null);
        try {
            let headers = getAuthHeaders(false);

            // Always use FormData for course updates
            const formData = new FormData();
            formData.append('course_form', JSON.stringify(courseData));
            if (file) {
                formData.append('file', file);
            }

            const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
                method: 'PATCH',
                headers,
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Failed to update course');

            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const deleteCourse = async (courseId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch(`/courses/${courseId}`, { method: 'DELETE' });
            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    return { createCourse, updateCourse, deleteCourse, loading, error };
}


/**
 * Hook for assignment mutations (create, update, delete)
 */
export function useAssignmentMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const createAssignment = async (assignmentData, file = null) => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('assignment_form', JSON.stringify(assignmentData));
            if (file) {
                formData.append('file', file);
            }

            const response = await fetch(`${API_BASE_URL}/accept-assignment`, {
                method: 'POST',
                headers: getAuthHeaders(false),
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Failed to create assignment');

            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateAssignment = async (assignmentId, assignmentData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch(`/assignments/${assignmentId}`, {
                method: 'PATCH',
                body: JSON.stringify(assignmentData),
            });
            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const deleteAssignment = async (assignmentId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch(`/assignments/${assignmentId}`, { method: 'DELETE' });
            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    return { createAssignment, updateAssignment, deleteAssignment, loading, error };
}


/**
 * Hook for exam mutations (create, update, delete)
 */
export function useExamMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const createExam = async (examData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/exams', {
                method: 'POST',
                body: JSON.stringify(examData),
            });
            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const updateExam = async (examId, examData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch(`/exams/${examId}`, {
                method: 'PATCH',
                body: JSON.stringify(examData),
            });
            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const deleteExam = async (examId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch(`/exams/${examId}`, { method: 'DELETE' });
            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    return { createExam, updateExam, deleteExam, loading, error };
}


/**
 * Hook to fetch all users (admin only)
 */
export function useUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/auth/users');
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { users, setUsers, loading, error, refetch: fetchUsers };
}

/**
 * Hook for user mutations (update, delete)
 */
export function useUserMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updateUser = async (userId, userData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch(`/auth/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify(userData),
            });
            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (userId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch(`/auth/users/${userId}`, { method: 'DELETE' });
            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    return { updateUser, deleteUser, loading, error };
}


/**
 * Hook for authentication actions
 */
export function useAuth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (email, password, rememberMe = false) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, remember_me: rememberMe }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Login failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', data.userInfo.email);

            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const register = async (firstName, lastName, email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, email, password }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || 'Registration failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', data.userInfo.email);

            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const verifyToken = async () => {
        const token = localStorage.getItem('token');
        if (!token) return { success: false, data: null };

        try {
            const data = await apiFetch('/auth/verify');
            return { success: true, data: data.userInfo };
        } catch (err) {
            localStorage.removeItem('token');
            localStorage.removeItem('userEmail');
            return { success: false, data: null };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
    };

    return { login, register, verifyToken, logout, loading, error };
}


/**
 * Hook to fetch course files info
 */
export function useCourseFiles() {
    const [courseFiles, setCourseFiles] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCourseFiles = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/course-files');
            const fileMap = {};
            data.forEach(course => {
                if (course.has_file) {
                    fileMap[course.id] = {
                        filename: course.filename,
                        file_path: course.file_path
                    };
                }
            });
            setCourseFiles(fileMap);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCourseFiles();
    }, [fetchCourseFiles]);

    return { courseFiles, loading, error, refetch: fetchCourseFiles };
}


/**
 * Hook to fetch user's enrolled course IDs
 */
export function useMyEnrollments() {
    const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEnrollments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/my-enrollments');
            setEnrolledCourseIds(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    return { enrolledCourseIds, setEnrolledCourseIds, loading, error, refetch: fetchEnrollments };
}


/**
 * Hook for enrollment mutations (enroll/unenroll)
 */
export function useEnrollmentMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const enrollInCourse = async (courseId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch(`/enroll/${courseId}`, { method: 'POST' });
            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const unenrollFromCourse = async (courseId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch(`/enroll/${courseId}`, { method: 'DELETE' });
            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    return { enrollInCourse, unenrollFromCourse, loading, error };
}