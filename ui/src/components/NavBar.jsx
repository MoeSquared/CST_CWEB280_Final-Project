import { Link, useNavigate } from 'react-router';

function NavBar({ user, onLogout }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary bg-gradient ">
            <div className="container-fluid w-50">
                <Link className="navbar-brand fw-bold" to="/">
                    <span className="me-2">&#128218;</span>
                    Course Tracker
                </Link>


                <div className="collapse navbar-collapse" id="navbarNav">
                    {user && (
                        <>
                            {/* Main navigation links */}
                            <ul className="navbar-nav me-auto">
                                <li className="nav-item">
                                    <Link className="nav-link" to="/">
                                        &#127968; Home
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/upcoming">
                                        &#128203; Upcoming
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/calendar">
                                        &#128197; Calendar
                                    </Link>
                                </li>
                                {/* Admin link - only show for admins */}
                                {user.role === 'admin' && (
                                    <li className="nav-item">
                                        <Link className="nav-link" to="/admin">
                                            &#128100; Admin
                                        </Link>
                                    </li>
                                )}
                            </ul>

                            {/* Right side - Add button and user dropdown */}
                            <div className="d-flex align-items-center">
                                <Link to="/add" className="btn btn-success btn-sm me-3">
                                    <span className="me-1">&#10133;</span>
                                    Add Entry
                                </Link>

                                {/* User dropdown */}
                                <div className="dropdown">
                                    <button
                                        className="btn btn-light btn-sm dropdown-toggle d-flex align-items-center"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        <span className="me-1">&#128100;</span>
                                        <span className="d-none d-md-inline">
                                            {user.name || user.email}
                                        </span>
                                        {user.role === 'admin' && (
                                            <span className="badge bg-warning text-dark ms-2">
                                                Admin
                                            </span>
                                        )}
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                        <li>
                                            <span className="dropdown-item-text">
                                                <strong>{user.name || 'User'}</strong>
                                                <br />
                                                <small className="text-muted">{user.email}</small>
                                            </span>
                                        </li>
                                        <li><hr className="dropdown-divider" /></li>
                                        {user.role === 'admin' && (
                                            <>
                                                <li>
                                                    <Link className="dropdown-item" to="/admin">Manage Users</Link>
                                                </li>
                                                <li><hr className="dropdown-divider" /></li>
                                            </>
                                        )}
                                        <li>
                                            <button className="dropdown-item text-danger" onClick={handleLogout}>
                                                Sign Out
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default NavBar;