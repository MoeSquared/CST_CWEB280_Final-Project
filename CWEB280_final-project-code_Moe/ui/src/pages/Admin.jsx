import toast from 'react-hot-toast';
import { HiOutlineCog6Tooth, HiOutlineUsers } from 'react-icons/hi2';
import { useUsers, useUserMutations } from '../hooks/useApi';
import UserTable from '../components/UserTable';
import LoadingSpinner from '../components/LoadingSpinner';

function Admin({ currentUser }) {
    const { users, setUsers, loading, error, refetch } = useUsers();
    const { updateUser, deleteUser, loading: mutationLoading } = useUserMutations();

    // Show error toast if there's an error
    if (error) {
        toast.error(error);
    }

    const handleUpdateUser = async (userId, userData) => {
        const result = await updateUser(userId, userData);
        if (result.success) {
            // Update local state
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, ...result.data } : u
            ));
            toast.success('User updated successfully');
        } else {
            toast.error(result.error || 'Failed to update user');
        }
        return result;
    };

    const handleDeleteUser = async (userId) => {
        const result = await deleteUser(userId);
        if (result.success) {
            // Remove from local state
            setUsers(prev => prev.filter(u => u.id !== userId));
            toast.success('User deleted successfully');
        } else {
            toast.error(result.error || 'Failed to delete user');
        }
        return result;
    };

    if (loading) {
        return <LoadingSpinner message="Loading users..." fullScreen />;
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <HiOutlineCog6Tooth className="h-8 w-8" />
                    Admin Dashboard
                </h1>
                <p className="text-base-content/60 mt-1">
                    Manage users and system settings
                </p>
            </div>

            {/* Users Card */}
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="card-title">
                            <HiOutlineUsers className="h-6 w-6" />
                            User Management
                        </h2>
                        <div className="badge badge-primary badge-lg">
                            {users.length} user{users.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    <UserTable
                        users={users}
                        currentUserId={currentUser?.id}
                        onUpdateUser={handleUpdateUser}
                        onDeleteUser={handleDeleteUser}
                        loading={mutationLoading}
                    />
                </div>
            </div>
        </div>
    );
}

export default Admin;