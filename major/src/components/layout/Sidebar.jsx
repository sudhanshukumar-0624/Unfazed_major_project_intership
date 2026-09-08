import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, FileText, BarChart3,
  User, LogOut, ChevronLeft, ChevronRight, Stethoscope, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/clients',   icon: Users,           label: 'Clients' },
  { path: '/schedule',  icon: Calendar,        label: 'Schedule' },
  { path: '/notes',     icon: FileText,        label: 'Notes' },
  { path: '/analytics', icon: BarChart3,       label: 'Analytics' },
  { path: '/profile',   icon: User,            label: 'Profile' },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { therapist, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dpUrl = therapist?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(therapist?.name || 'Doctor')}&background=6366f1&color=fff&size=200`;

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Toggle button on edge */}
      <button
        className="collapse-tab"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Brand Header */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Stethoscope size={22} color="#fff" />
        </div>
        {!collapsed && <span className="logo-text">Unfazed</span>}
      </div>

      {/* Doctor Profile Info */}
      {!collapsed && (
        <div className="sidebar-user">
          <img src={dpUrl} alt={therapist?.name} className="user-avatar-img" />
          <div className="user-info">
            <p className="user-name">{therapist?.name || 'Dr. Priya Sharma'}</p>
            <span className="user-badge">
              <CheckCircle2 size={12} style={{ marginRight: 3 }} /> Verified Doctor
            </span>
          </div>
        </div>
      )}

      {/* Nav List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <IconComponent size={20} className="nav-icon" />
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <button className="sidebar-logout" onClick={handleLogout} title="Logout">
        <LogOut size={20} className="nav-icon" />
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  );
};

export default Sidebar;
