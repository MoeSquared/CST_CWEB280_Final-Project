import { useState } from 'react';
import {
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineShieldCheck,
    HiOutlineUser
} from 'react-icons/hi2';

function UserTable({ users, currentUserId, onUpdateUser, onDeleteUser, loading }) {
    const [editingUser, setEditingUser] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const handleRoleChange = async (user, newRole) => {
        const result = await onUpdateUser(user.id, { role: newRole });
        if (result.success) {
            setEditingUser(null);
        }
    };

    const handleDelete = async (userId) => {
        const result = await onDeleteUser(userId);
        if (result.success) {
            setDeleteConfirm(null);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="overflow-x-auto">
            <table className="table table-zebra">
                <thead>
                <tr>
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
                    <tr key={user.id} className={user.id === currentUserId ? 'bg-base-200' : ''}>
                        {/* Name */}
                        <td>
                            <div className="flex items-center gap-3">
                                <div className="avatar placeholder">
                                    <div className={`${user.role === 'admin' ? 'bg-warning text-warning-content' : 'bg-neutral text-neutral-content'} rounded-full w-10`}>
                                        {user.role === 'admin' ? (
                                            <HiOutlineShieldCheck className="h-6 w-6" />
                                        ) : (
                                            <HiOutlineUser className="h-6 w-6" />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-bold">
                                        {user.firstName} {user.lastName}
                                        {user.id === currentUserId && (
                                            <span className="badge badge-info badge-sm ml-2">You</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </td>

                        {/* Email */}
                        <td>
                            <span className="text-sm opacity-70">{user.email}</span>
                        </td>

                        {/* Role */}
                        <td>
                            {editingUser === user.id ? (
                                <select
                                    className="select select-bordered select-sm"
                                    value={user.role}
                                    onChange={(e) => handleRoleChange(user, e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            ) : (
                                <span className={`badge ${user.role === 'admin' ? 'badge-warning' : 'badge-ghost'}`}>
                                        {user.role}
                                    </span>
                            )}
                        </td>

                        {/* Auth Type */}
                        <td>
                                <span className={`badge ${user.is_google_user ? 'badge-error' : 'badge-primary'} badge-sm`}>
                                    {user.is_google_user ? 'Google' : 'Email'}
                                </span>
                        </td>

                        {/* Created */}
                        <td>
                            <span className="text-sm opacity-70">{formatDate(user.created_at)}</span>
                        </td>

                        {/* Actions */}
                        <td>
                            {user.id === currentUserId ? (
                                <span className="text-sm opacity-50">—</span>
                            ) : deleteConfirm === user.id ? (
                                <div className="join">
                                    <button
                                        className="btn btn-error btn-sm join-item"
                                        onClick={() => handleDelete(user.id)}
                                        disabled={loading}
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm join-item"
                                        onClick={() => setDeleteConfirm(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="join">
                                    <button
                                        className="btn btn-ghost btn-sm join-item"
                                        onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                                        title="Edit role"
                                    >
                                        <HiOutlinePencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        className="btn btn-ghost btn-sm join-item text-error"
                                        onClick={() => setDeleteConfirm(user.id)}
                                        title="Delete user"
                                    >
                                        <HiOutlineTrash className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {users.length === 0 && (
                <div className="text-center py-8 text-base-content/50">
                    No users found
                </div>
            )}
        </div>
    );
}

export default UserTable;
