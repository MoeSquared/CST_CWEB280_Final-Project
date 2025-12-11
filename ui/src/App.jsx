import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';
import CalendarView from './pages/Calendar.jsx';
import Upcoming from './pages/Upcoming.jsx';
import AddEntry from './pages/AddEntry.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Admin from './pages/Admin.jsx';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const API_BASE_URL = 'http://localhost:8080/api';


function App() {
  const [events, setEvents] = useState([]);
  const [courseMap, setCourseMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Authentication state
  const [authUser, setAuthUser] = useState(null);

  // Verify token on app load
  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    if (!token || !userEmail) {
      setAuthUser(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAuthUser(data.userInfo);
      }

      else {
        // Token is invalid or expired
        handleLogout();
      }
    }

    catch (error) {
      console.error('Token verification error:', error);
      // Keep the user logged in if it's just a network error
    }
  };

  // Handle login
  const handleLogin = (userInfo) => {
    setAuthUser(userInfo);
    localStorage.setItem('userEmail', userInfo.email);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setAuthUser(null);
  };

  // Route guard component
  function RequireAuth({ children }) {

    if (!authUser) {
      return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
    }
    return children;
  }

  // Admin route guard
  function RequireAdmin({ children }) {
    if (!authUser) {
      return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
    }
    if (authUser.role !== 'admin') {
      return <Navigate to="/" replace />;
    }

    return children;
  }

  // Fetch all events
  const fetchAllEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/all`);
      if (response.ok) {
        const data = await response.json();

        // map of courrse id's to course names
        const courseNameMap = {};
        data.forEach(event => {
          if (event.type === 'course' && !courseNameMap[event.id]) {
            courseNameMap[event.id] = event.title;
          }
        });
        setCourseMap(courseNameMap);


        // Transform the backend events to match frontend structure
        const transformedEvents = data.map(event => {
          let code = event.title;
          if (event.type === 'assignment' && event.courseId) {
            code = courseNameMap[event.courseId] || `Course ${event.courseId}`;
          } else if (event.type === 'course') {
            code = event.title.split(' ')[0];
          }

          return {
            id: `${event.type}-${event.id}`,
            title: event.title,
            start: new Date(event.start),
            end: new Date(event.end),
            date: new Date(event.start),
            code: code,
            name: event.title,
            type: event.type,
            color: event.type === 'assignment' ? '#dc3545' : '#17a2b8',
            allDay: event.allDay,
            courseId: event.courseId,
            originalId: event.id,
            hasFile: event.has_file,
            filename: event.filename
          };
        });

        setEvents(transformedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEvents();
  }, [fetchAllEvents]);

  // Add course event handler
  const handleAddCourse = (courseEvent) => {
    if (courseEvent.id) {
      setCourseMap(prev => ({
        ...prev,
        [courseEvent.id]: courseEvent.title
      }));
    }

    const newEvent = {
      id: `course-${courseEvent.id}`,
      title: courseEvent.title,
      start: new Date(courseEvent.start),
      end: new Date(courseEvent.end),
      date: new Date(courseEvent.start),
      code: courseEvent.title.split(' ')[0],
      name: courseEvent.title,
      type: 'course',
      color: courseEvent.color || '#17a2b8',
      allDay: courseEvent.allDay || false,
      originalId: courseEvent.id
    };

    setEvents(prevEvents => [...prevEvents, newEvent]);
  };

  // Add assignment event handler
  const handleAddAssignment = (assignmentEvent) => {
    const courseName = courseMap[assignmentEvent.courseId] || `Course ${assignmentEvent.courseId}`;

    const newEvent = {
      id: `assignment-${assignmentEvent.id}`,
      title: assignmentEvent.title,
      start: new Date(assignmentEvent.start),
      end: new Date(assignmentEvent.end),
      date: new Date(assignmentEvent.start),
      code: courseName,
      name: assignmentEvent.title,
      type: 'assignment',
      color: assignmentEvent.color || '#dc3545',
      allDay: assignmentEvent.allDay || false,
      courseId: assignmentEvent.courseId,
      originalId: assignmentEvent.id,
      hasFile: assignmentEvent.has_file,
      filename: assignmentEvent.filename
    };

    setEvents(prevEvents => [...prevEvents, newEvent]);
  };

  // Handle event deletion - refreshes after
  const handleEventDeleted = () => {
    fetchAllEvents();
  };

  // Handle event update - refreshes after
  const handleEventUpdated = () => {
    fetchAllEvents();
  };

  // Filter upcoming assignments
  const upcomingAssignments = events.filter(event => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return event.type === 'assignment' && new Date(event.date) >= today;
  });

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
    );
  }

  return (
        <div className="min-h-screen bg-gray-50">
          <NavBar user={authUser} onLogout={handleLogout}/>

          <main className="flex-1">
            <div className="w-full px-4">
              <Routes>
                {/* Public routes */}
                <Route
                    path="/login"
                    element={
                      authUser ?
                          <Navigate to="/" replace /> :
                          <Login onLogin={handleLogin} />
                    }
                />
                <Route
                    path="/register"
                    element={
                      authUser ?
                          <Navigate to="/" replace /> :
                          <Register onRegister={handleLogin} />
                    }
                />

                {/* Protected routes */}
                <Route
                    path="/"
                    element={
                      <RequireAuth>
                        <Home user={authUser} courses={events} />
                      </RequireAuth>
                    }
                />
                <Route
                    path="/calendar"
                    element={
                      <RequireAuth>
                        <CalendarView
                            courses={events}
                            onEventDeleted={handleEventDeleted}
                            onEventUpdated={handleEventUpdated}
                        />
                      </RequireAuth>
                    }
                />
                <Route
                    path="/upcoming"
                    element={
                      <RequireAuth>
                        <Upcoming courses={upcomingAssignments} />
                      </RequireAuth>
                    }
                />
                <Route
                    path="/add"
                    element={
                      <RequireAuth>
                        <AddEntry
                            onAddCourse={handleAddCourse}
                            onAddAssignment={handleAddAssignment}
                        />
                      </RequireAuth>
                    }
                />

                {/* Admin routes */}
                <Route
                    path="/admin"
                    element={
                      <RequireAdmin>
                        <Admin currentUser={authUser} />
                      </RequireAdmin>
                    }
                />

                {/* redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
  );
}

export default App;