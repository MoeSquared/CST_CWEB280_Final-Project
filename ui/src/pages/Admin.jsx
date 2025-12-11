import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

const API_BASE_URL = 'http://localhost:8080/api';

export default function Admin({ currentUser }) {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [successMessage, setSuccessMessage] = useState("");

    // check if current user is admin
    useEffect(() => {
        if (!currentUser || currentUser.role !== 'admin') {
            navigate('/', { replace: true });
        }
    }, [currentUser, navigate]);

    // fetch all users
    useEffect(() => {
        fetchUsers();
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const fetchUsers = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_BASE_URL}/auth/users`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }


            else if (response.status === 403) {
                setError("Access denied. Admin privileges required.");
                navigate('/', { replace: true });
            }
            else {
                const errorData = await response.json();
                setError(errorData.detail || "Failed to fetch users");
            }
        }

        catch (err) {
            console.error('Error fetching users:', err);
            setError("Network error. Please try again.");
        }

        finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        setActionLoading(userId);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                setUsers(users.filter(u => u.id !== userId));
                setSuccessMessage("User deleted successfully");
                setDeleteConfirm(null);
            }

            else {
                const errorData = await response.json();
                setError(errorData.detail || "Failed to delete user");
            }
        }

        catch (err) {
            console.error('Error deleting user:', err);
            setError("Network error. Please try again.");
        }

        finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        setActionLoading(userId);
        setError("");
        setSuccessMessage("");

        try {
            const response = await fetch(`${API_BASE_URL}/auth/users/${userId}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUsers(users.map(u => u.id === userId ? updatedUser : u));
                setSuccessMessage(`User role updated to ${newRole}`);
            }

            else {
                const errorData = await response.json();
                setError(errorData.detail || "Failed to update user role");
            }
        }

        catch (err) {
            console.error('Error updating user:', err);
            setError("Network error. Please try again.");
        }

        finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <span className="me-2">&#128100;</span>
                    User Management
                </h2>
                <span className="badge bg-primary fs-6">
                    {users.length} Users
                </span>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {successMessage}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setSuccessMessage("")}
                        aria-label="Close"
                    ></button>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError("")}
                        aria-label="Close"
                    ></button>
                </div>
            )}

            {/* Users Table */}
            <div className="card border-0 shadow-sm">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Auth Type</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.name || <em className="text-muted">No name</em>}</td>
                                <td>
                                    {user.email}
                                    {currentUser?.id === user.id && (
                                        <span className="badge bg-info ms-2">You</span>
                                    )}
                                </td>
                                <td>
                                    <select
                                        className="form-select form-select-sm"
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                        disabled={actionLoading === user.id || currentUser?.id === user.id}
                                        style={{ width: '100px' }}
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td>
                                    {user.is_google_user ? (
                                        <span className="badge bg-warning text-dark">
                                                <span className="me-1">Google account</span>

                                            </span>
                                    ) : (
                                        <span className="badge bg-secondary">
                                                Email/Password
                                            </span>
                                    )}
                                </td>
                                <td>
                                    <small className="text-muted">
                                        {formatDate(user.created_at)}
                                    </small>
                                </td>
                                <td>
                                    {deleteConfirm === user.id ? (
                                        <div className="btn-group btn-group-sm">
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={actionLoading === user.id}
                                            >
                                                {actionLoading === user.id ? (
                                                    <span className="spinner-border spinner-border-sm" />
                                                ) : (
                                                    'Confirm'
                                                )}
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => setDeleteConfirm(null)}
                                                disabled={actionLoading === user.id}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => setDeleteConfirm(user.id)}
                                            disabled={currentUser?.id === user.id}
                                            title={currentUser?.id === user.id ? "You cannot delete yourself" : "Delete user"}
                                        >
                                            &#128465; Delete
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* No users*/}
            {users.length === 0 && (
                <div className="text-center py-5">
                    <h4 className="text-muted">No users found</h4>
                </div>
            )}

        </div>
    );
}