import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Zap, Rss, BriefcaseBusiness, ClipboardList, PlusCircle, CalendarDays } from 'lucide-react';
import NotificationBell from './NotificationBell';

function NavLink({ to, icon: Icon, label, id }) {
    const { pathname } = useLocation();
    const active = pathname === to || (to !== '/' && pathname.startsWith(to + '/')) || pathname === to;
    return (
        <Link
            id={id}
            to={to}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${active
                    ? 'text-primary bg-primary/10'
                    : 'text-text-secondary hover:text-text hover:bg-surface-hover'
                }`}
        >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
        </Link>
    );
}

export default function Navbar() {
    const { isAuthenticated, logout, role, canPostJob, canApplyJob } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const roleBadgeColor = {
        admin: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        alumni: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        student: 'bg-primary/10 text-primary border-primary/20',
    }[role] || 'bg-surface-elevated text-text-muted border-border';

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass navbar-blur border-b border-border">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
                {/* Logo */}
                <Link to="/feed" className="flex items-center gap-2 group flex-shrink-0">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center group-hover:shadow-glow transition-all duration-200">
                        <Zap className="w-4 h-4 text-black fill-current" />
                    </div>
                    <span className="font-bold text-base tracking-tight hidden sm:inline">
                        Grad<span className="text-primary">ly</span>
                    </span>
                </Link>

                {/* Nav links */}
                {isAuthenticated && (
                    <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide">
                        <NavLink to="/feed" id="nav-feed" icon={Rss} label="Feed" />
                        <NavLink to="/jobs" id="nav-jobs" icon={BriefcaseBusiness} label="Jobs" />
                        <NavLink to="/events" id="nav-events" icon={CalendarDays} label="Events" />
                        {canApplyJob && (
                            <NavLink to="/applications" id="nav-applications" icon={ClipboardList} label="Applied" />
                        )}
                        {canPostJob && (
                            <NavLink to="/jobs/create" id="nav-post-job" icon={PlusCircle} label="Post Job" />
                        )}
                    </nav>
                )}

                {/* Right: bell + role badge + logout */}
                {isAuthenticated && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <NotificationBell />

                        {role && (
                            <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadgeColor} capitalize`}>
                                {role}
                            </span>
                        )}

                        <button
                            id="logout-btn"
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-text-muted hover:text-error transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-500/5 text-sm font-medium"
                            title="Logout"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
