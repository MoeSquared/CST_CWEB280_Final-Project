import { useState, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Modal from '../components/Modal';

const localizer = momentLocalizer(moment);

function Calendar({ courses, onEventDeleted, onEventUpdated }) {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('month');

    // Handle navigation (Today, Back, Next)
    const handleNavigate = useCallback((newDate) => {
        setCurrentDate(newDate);
    }, []);

    // Handle view change (Month, Week, Day, Agenda)
    const handleViewChange = useCallback((newView) => {
        setCurrentView(newView);
    }, []);

    // Process events for the calendar
    const calendarEvents = useMemo(() => {
        return courses.map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end || event.start),
            title: event.title || event.name
        }));
    }, [courses]);


    const eventStyleGetter = useCallback((event) => {
        let backgroundColor = '#3b82f6'; // primary blue

        switch (event.type) {
            case 'course':
                backgroundColor = '#6366f1'; // indigo
                break;
            case 'assignment':
                backgroundColor = '#ef4444'; // red
                break;
            case 'exam':
                backgroundColor = '#f59e0b'; // amber
                break;
            default:
                backgroundColor = '#3b82f6';
        }

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                border: 'none',
                color: 'white',
                padding: '2px 4px'
            }
        };
    }, []);

    // Handle event click
    const handleSelectEvent = useCallback((event) => {
        setSelectedEvent(event);
        setModalOpen(true);
    }, []);

    // Close modal
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedEvent(null);
    };

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Calendar</h1>
                <p className="text-base-content/60">
                    View and manage your courses, assignments, and exams
                </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-indigo-500"></span>
                    <span className="text-sm">Courses</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-red-500"></span>
                    <span className="text-sm">Assignments</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-amber-500"></span>
                    <span className="text-sm">Exams</span>
                </div>
            </div>

            {/* Calendar */}
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body p-4">
                    <BigCalendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 600 }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent}
                        views={['month', 'week', 'day', 'agenda']}
                        view={currentView}
                        date={currentDate}
                        onNavigate={handleNavigate}
                        onView={handleViewChange}
                        popup
                        selectable={false}
                    />
                </div>
            </div>

            {/* Event Modal */}
            <Modal
                event={selectedEvent}
                isOpen={modalOpen}
                onClose={handleCloseModal}
                onEventDeleted={onEventDeleted}
                onEventUpdated={onEventUpdated}
            />
        </div>
    );
}

export default Calendar;