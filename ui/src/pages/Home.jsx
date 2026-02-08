import { Link } from 'react-router';
import {
    HiOutlineClipboardDocumentList,
    HiOutlineCalendar,
    HiOutlinePlusCircle
} from 'react-icons/hi2';

function Home({ user }) {
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

    return (
        <div className="container mx-auto p-6">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold">Hello, {user?.firstName || "there!"}!</h1>
                <p className="text-base-content/60 mt-2">Today's date is {today}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Link to="/upcoming" data-cy="home-upcoming">
                    <div className="card bg-base-100 shadow-md h-full hover:shadow-lg transition-shadow">
                        <div className="card-body items-center text-center">
                            <HiOutlineClipboardDocumentList className="h-16 w-16 text-primary mb-4" />
                            <h3 className="card-title">Upcoming</h3>
                            <p className="text-base-content/60">View your upcoming assignments and deadlines</p>
                        </div>
                    </div>
                </Link>

                <Link to="/calendar" data-cy="home-calendar">
                    <div className="card bg-base-100 shadow-md h-full hover:shadow-lg transition-shadow">
                        <div className="card-body items-center text-center">
                            <HiOutlineCalendar className="h-16 w-16 text-primary mb-4" />
                            <h3 className="card-title">Calendar</h3>
                            <p className="text-base-content/60">See all your course events in calendar view</p>
                        </div>
                    </div>
                </Link>

                <Link to="/add" data-cy="home-add-entry">
                    <div className="card bg-base-100 shadow-md h-full hover:shadow-lg transition-shadow">
                        <div className="card-body items-center text-center">
                            <HiOutlinePlusCircle className="h-16 w-16 text-primary mb-4" />
                            <h3 className="card-title">Add Entry</h3>
                            <p className="text-base-content/60">Add new assignments, exams, or course events</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}

export default Home;