import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

// Public Landing & Directory
import DoctorsDirectory from '../pages/client/DoctorsDirectory';
import BookingPage from '../pages/client/BookingPage';
import ClientPortal from '../pages/client/ClientPortal';
import Payment from '../pages/client/Payment';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Therapist pages
import Dashboard from '../pages/therapist/Dashboard';
import Clients from '../pages/therapist/Clients';
import Schedule from '../pages/therapist/Schedule';
import Notes from '../pages/therapist/Notes';
import Analytics from '../pages/therapist/Analytics';
import Profile from '../pages/therapist/Profile';

// Layout
import DashboardLayout from '../components/layout/DashboardLayout';

const AppRoutes = () => {
  return (
    <Routes>
      {/* 🌐 Single unified home page for both clients and doctors */}
      <Route path="/" element={<DoctorsDirectory />} />
      <Route path="/client" element={<DoctorsDirectory />} />
      <Route path="/home" element={<DoctorsDirectory />} />
      <Route path="/directory" element={<DoctorsDirectory />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/payment" element={<Payment />} />

      {/* Protected Doctor Portal routes */}
      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Public doctor branded booking page & portal */}
      <Route path="/:slug" element={<BookingPage />} />
      <Route path="/:slug/portal" element={<ClientPortal />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
