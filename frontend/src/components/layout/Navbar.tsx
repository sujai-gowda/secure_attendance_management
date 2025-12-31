import { Link, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, Menu, LogOut, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { TEACHERS } from "@/constants/attendance";

const navItems = [
  { path: "/", label: "Home" },
  { path: "/attendance", label: "Take Attendance", requireTeacher: true },
  { path: "/classrooms", label: "Classrooms", requireTeacher: true },
  { path: "/records", label: "View Records" },
  { path: "/students", label: "Student Search" },
  { path: "/analytics", label: "Analytics", requireTeacher: true },
  { path: "/integrity", label: "Check Integrity" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, isTeacher } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDisplayName = () => {
    if (!user?.username) return user?.username || "";
    const teacher = TEACHERS.find((t) => t.username === user.username);
    return teacher?.name || user.username;
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Blockendance</span>
          </Link>

          <div className="hidden md:flex md:items-center md:space-x-6">
            {navItems.map((item) => {
              if (item.requireTeacher && !isTeacher) return null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === item.path
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="text-muted-foreground">
                    {getDisplayName()}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navItems.map((item) => {
              if (item.requireTeacher && !isTeacher) return null;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAuthenticated && user ? (
              <>
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{getDisplayName()}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start"
                asChild
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link to="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
