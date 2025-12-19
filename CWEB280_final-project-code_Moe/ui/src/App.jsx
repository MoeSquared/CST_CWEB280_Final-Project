import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useApi';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Calendar from './pages/Calendar';
import Upcoming from './pages/Upcoming';
import AddEntry from './pages/AddEntry';
import Admin from './pages/Admin';
import Courses from './pages/Courses';

import NavBar from './components/NavBar';
import LoadingSpinner from './components/LoadingSpinner';

const API_BASE_URL = 'http://localhost:8080/api';

function App() {
  const [events, setEvents] = useState([]);
  const [courseMap, setCourseMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Verify token on app load
  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    if (!token || !userEmail) {
      setAuthUser(null);
      setAuthLoading(false);
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
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Token verification error:', error);
    } finally {
      setAuthLoading(false);
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
    if (authLoading) {
      return <LoadingSpinner message="Checking authentication..." fullScreen />;
    }
    if (!authUser) {
      return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
    }
    return children;
  }

  // Admin route guard
  function RequireAdmin({ children }) {
    if (authLoading) {
      return <LoadingSpinner message="Checking authentication..." fullScreen />;
    }
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
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();

        // Map of course ids to course names
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
          if ((event.type === 'assignment' || event.type === 'exam') && event.courseId) {
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
            color: event.type === 'assignment' ? '#dc3545' :
                event.type === 'exam' ? '#f59e0b' : '#17a2b8',
            allDay: event.allDay,
            courseId: event.courseId,
            originalId: event.id,
            hasFile: event.has_file,
            filename: event.filename,
            description: event.description,
            worth: event.worth,
            weight: event.weight,
            credits: event.credits,
            daysOfWeek: event.daysOfWeek,
            startTime: event.startTime,
            endTime: event.endTime,
            startDate: event.startDate,
            endDate: event.endDate
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
    if (authUser) {
      fetchAllEvents();
    }
  }, [authUser, fetchAllEvents]);

  // Add course event handler
  const handleAddCourse = (courseEvent) => {
    if (courseEvent.id) {
      setCourseMap(prev => ({
        ...prev,
        [courseEvent.id]: courseEvent.title
      }));
    }
    fetchAllEvents();
  };

  // Add assignment event handler
  const handleAddAssignment = () => {
    fetchAllEvents();
  };

  // Handle event deletion
  const handleEventDeleted = () => {
    fetchAllEvents();
  };

  // Handle event update
  const handleEventUpdated = () => {
    fetchAllEvents();
  };

  // Filter upcoming assignments and exams
  const upcomingItems = events.filter(event => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (event.type === 'assignment' || event.type === 'exam') &&
        new Date(event.date) >= today;
  });

  return (
      <div className="min-h-screen flex flex-col bg-base-200" data-theme="corporate">
        {/* Toast notifications */}
        <Toaster position="top-center" toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }} />

        {/* Navigation bar - only show when logged in */}
        {authUser && <NavBar user={authUser} onLogout={handleLogout} />}

        {/* Main content */}
        <main className="flex-grow">
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
                    <Home user={authUser} courses={events} loading={loading} />
                  </RequireAuth>
                }
            />
            <Route
                path="/calendar"
                element={
                  <RequireAuth>
                    <Calendar
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
                    <Upcoming courses={upcomingItems} onItemDeleted={handleEventDeleted} />
                  </RequireAuth>
                }
            />
            <Route
                path="/courses"
                element={
                  <RequireAuth>
                    <Courses />
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
        </main>
      </div>
  );
}

export default App;