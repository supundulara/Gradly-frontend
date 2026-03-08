import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Zap, Rss } from 'lucide-react';

export default function Navbar() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass navbar-blur border-b border-border">
            <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
                {/* Logo */}
                <Link to="/feed" className="flex items-center gap-2 group">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center group-hover:shadow-glow transition-all duration-200">
                        <Zap className="w-4 h-4 text-black fill-current" />
                    </div>
                    <span className="font-bold text-base tracking-tight">
                        Grad<span className="text-primary">ly</span>
                    </span>
                </Link>

                {/* Nav links */}
                {isAuthenticated && (
                    <nav className="flex items-center gap-2">
                        <Link
                            to="/feed"
                            className="flex items-center gap-1.5 text-text-secondary hover:text-text transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-hover text-sm font-medium"
                        >
                            <Rss className="w-3.5 h-3.5" />
                            Feed
                        </Link>

                        <button
                            id="logout-btn"
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 text-text-muted hover:text-error transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/5 text-sm font-medium"
                            title="Logout"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Logout
                        </button>
                    </nav>
                )}
            </div>
        </header>
    );
}
