import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import styles from "./Navbar.module.css";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isCurrent = true;

    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });

        if (isCurrent) {
          setIsLoggedIn(res.ok);
        }
      } catch {
        if (isCurrent) {
          setIsLoggedIn(false);
        }
      }
    }

    checkSession();

    return () => {
      isCurrent = false;
    };
  }, [location.pathname]);

  return (
    <NavigationMenu.Root className={styles.NavRoot}>
      <NavigationMenu.List className={styles.NavList}>
        {isLoggedIn ? (
          <>
            <NavigationMenu.Item>
              <NavigationMenu.Link className={styles.NavLink} href="/dashboard">
                Dashboard
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Link className={styles.NavLink} href="/profile">
                Profile
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </>
        ) : (
          <>
            <NavigationMenu.Item>
              <NavigationMenu.Link className={styles.NavLink} href="/signup">
                Sign Up
              </NavigationMenu.Link>
            </NavigationMenu.Item>

            <NavigationMenu.Item>
              <NavigationMenu.Link className={styles.NavLink} href="/login">
                Sign In
              </NavigationMenu.Link>
            </NavigationMenu.Item>
          </>
        )}

        <NavigationMenu.Item>
          <NavigationMenu.Link className={styles.NavLink} href="/about">
            About
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <div className={styles.ViewportPosition}>
        <NavigationMenu.Viewport className={styles.NavViewport} />
      </div>
    </NavigationMenu.Root>
  );
}

export default Navbar;
