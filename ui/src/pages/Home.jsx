import {Link } from 'react-router';

function Home({ courses }) {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

    // Calculate stats
    const upcomingCount = courses.filter(c => new Date(c.date) >= new Date()).length;
    const thisWeekCount = courses.filter(c => {
        const courseDate = new Date(c.date);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return courseDate >= new Date() && courseDate <= weekFromNow;
    }).length;

    return (
        <div className="container py-4">
            <div className="text-center mb-5">
                <h1 className="display-4 fw-bold">Hello!</h1>
                <p className="lead text-muted">Today's date is {today}</p>
            </div>

            <div className="row g-4 mb-5">
                <div className="col-md-4">
                    <Link to="/upcoming" className="text-decoration-none">
                        <div className="card h-100 border-0 shadow-sm hover-lift">
                            <div className="card-body text-center p-4">
                                <div className="display-1 mb-3">&#128203;</div>
                                <h3 className="card-title">Upcoming</h3>
                                <p className="card-text text-muted">View your upcoming assignments and deadlines</p>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="col-md-4">
                    <Link to="/calendar" className="text-decoration-none">
                        <div className="card h-100 border-0 shadow-sm hover-lift">
                            <div className="card-body text-center p-4">
                                <div className="display-1 mb-3">&#128197;</div>
                                <h3 className="card-title">Calendar</h3>
                                <p className="card-text text-muted">See all your course events in calendar view</p>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="col-md-4">
                    <Link to="/add" className="text-decoration-none">
                        <div className="card h-100 border-0 shadow-sm hover-lift">
                            <div className="card-body text-center p-4">
                                <div className="display-1 mb-3">&#10133;</div>
                                <h3 className="card-title">Add Entry</h3>
                                <p className="card-text text-muted">Add new assignments, exams, or course events</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Home;