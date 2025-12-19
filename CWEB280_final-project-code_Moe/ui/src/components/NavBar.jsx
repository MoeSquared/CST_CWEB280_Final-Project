import { Link, useNavigate } from 'react-router';
import {
    HiOutlineHome,
    HiOutlineCalendar,
    HiOutlineClipboardDocumentList,
    HiOutlinePlus,
    HiOutlineArrowRightOnRectangle,
    HiOutlineCog6Tooth,
    HiOutlineAcademicCap, HiOutlineUser
} from 'react-icons/hi2';
import ThemePicker from './ThemePicker';
import {RiAdminLine} from "react-icons/ri";
import {CgProfile} from "react-icons/cg";
import {FaRegUserCircle} from "react-icons/fa";

function NavBar({ user, onLogout }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }
        navigate('/login');
    };

    return (
        <div className="navbar bg-primary text-primary-content shadow-lg" data-cy="navbar">
            <div className="navbar-start">
                <ul className="menu menu-horizontal px-1 gap-1">
                    <li>
                        <Link to="/" className="gap-2" data-cy="nav-home">
                            <HiOutlineHome className="h-5 w-5" />
                            Home
                        </Link>
                    </li>
                    <li>
                        <Link to="/upcoming" className="gap-2" data-cy="nav-upcoming">
                            <HiOutlineClipboardDocumentList className="h-5 w-5" />
                            Upcoming
                        </Link>
                    </li>
                    <li>
                        <Link to="/calendar" className="gap-2" data-cy="nav-calendar">
                            <HiOutlineCalendar className="h-5 w-5" />
                            Calendar
                        </Link>
                    </li>
                    <li>
                        <Link to="/courses" className="gap-2" data-cy="nav-courses">
                            <HiOutlineAcademicCap className="h-5 w-5" />
                            Courses
                        </Link>
                    </li>
                    {user?.role === 'admin' && (
                        <li>
                            <Link to="/admin" className="gap-2" data-cy="nav-admin">
                                <HiOutlineCog6Tooth className="h-5 w-5" />
                                Admin
                            </Link>
                        </li>
                    )}
                </ul>
            </div>

            <div className="navbar-end gap-2">
                <Link to="/add" className="btn btn-success btn-sm gap-2" data-cy="nav-add-entry">
                    <HiOutlinePlus className="h-5 w-5" />
                    Add Entry
                </Link>

                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder" data-cy="user-menu">
                        <div>
                            <FaRegUserCircle  className="h-7 w-7" />
                        </div>
                    </div>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 bg-base-100 text-base-content rounded-box w-64">
                        <li className="menu-title px-4 py-2">
                            <div className="flex flex-col">
                                <span className="font-bold" data-cy="user-name">{user?.firstName} {user?.lastName}</span>
                                {user?.role === 'admin' && (
                                    <span className="badge badge-warning badge-sm mt-1" data-cy="admin-badge">Admin</span>
                                )}
                            </div>
                        </li>
                        <div className="divider my-0"></div>
                        {user?.role === 'admin' && (
                            <li>
                                <Link to="/admin" data-cy="menu-admin">
                                    <HiOutlineCog6Tooth className="h-5 w-5" />
                                    Manage Users
                                </Link>
                            </li>
                        )}
                        <li>
                            <button onClick={handleLogout} className="text-error" data-cy="logout-btn">
                                <HiOutlineArrowRightOnRectangle className="h-5 w-5" />
                                Sign Out
                            </button>
                        </li>
                    </ul>
                </div>

                <ThemePicker />
            </div>
        </div>
    );
}

export default NavBar;