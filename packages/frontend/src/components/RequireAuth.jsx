import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";

const AZURE_URL =
  "https://goattimer-hgh5bxcub9hrdgha.centralus-01.azurewebsites.net";

function RequireAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let isCurrent = true;

    async function checkSession() {
      try {
        const res = await fetch(`${AZURE_URL}/api/auth/me`, {
          credentials: "include",
        });

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
