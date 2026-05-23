// src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Brain, LogOut, ChevronDown, BarChart3, Trophy, User, Home } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const NAV_LINKS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setDropOpen(false);
    await logout();
    navigate("/login");
  };

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <nav style={{ background: "var(--nav-bg)" }}
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 gap-6 shadow-md">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 flex-shrink-0 mr-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "var(--accent)" }}>
          <Brain className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-sm tracking-wide">
          Placement<span style={{ color: "#60a5fa" }}>Pro</span>
        </span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{
              color: isActive(to) ? "#fff" : "var(--nav-text)",
              background: isActive(to) ? "rgba(255,255,255,0.1)" : "transparent",
            }}
            onMouseEnter={(e) => { if (!isActive(to)) e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={(e) => { if (!isActive(to)) e.currentTarget.style.background = "transparent"; }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Start Interview CTA */}
      {user && (
        <Link
          to="/select-domain"
          className="px-4 py-1.5 text-sm font-semibold rounded-md transition-all"
          style={{ background: "var(--accent)", color: "#fff" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--accent-dark)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "var(--accent)"}
        >
          + New Interview
        </Link>
      )}

      {/* User dropdown */}
      {user ? (
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropOpen(!dropOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-all"
            style={{ color: "var(--nav-text)" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
            onMouseLeave={(e) => { if (!dropOpen) e.currentTarget.style.background = "transparent"; }}
          >
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "U")}&background=2563eb&color=fff&size=32`}
              alt="avatar"
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm font-medium text-white hidden md:block">
              {user.displayName?.split(" ")[0] || "Account"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 hidden md:block" style={{ color: "var(--nav-text)" }} />
          </button>

          {dropOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl border z-50"
              style={{ background: "#fff", borderColor: "var(--border)" }}>
              {/* User info */}
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {user.displayName}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                  {user.email}
                </p>
              </div>
              {/* Menu items */}
              <div className="p-1.5">
                <Link
                  to="/profile"
                  onClick={() => setDropOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <User className="w-4 h-4" /> My Profile
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setDropOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <BarChart3 className="w-4 h-4" /> Dashboard
                </Link>
              </div>
              <div className="p-1.5 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left"
                  style={{ color: "var(--danger)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--danger-light)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link
          to="/login"
          className="px-4 py-1.5 text-sm font-semibold rounded-md border transition-all"
          style={{ color: "#fff", borderColor: "rgba(255,255,255,0.25)" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          Sign In
        </Link>
      )}
    </nav>
  );
}
