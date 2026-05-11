import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";

function RequireAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let isCurrent = true;

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });

        if (isCurrent) {
          setIsAuthenticated(res.ok);
        }
      } catch {
        if (isCurrent) {
          setIsAuthenticated(false);
        }
      }
    }

    checkSession();

    return () => {
      isCurrent = false;
    };
  }, [location.pathname]);

  if (isAuthenticated === null) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default RequireAuth;
