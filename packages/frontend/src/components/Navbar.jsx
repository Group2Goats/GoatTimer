import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { Link } from "react-router";
import styles from "./Navbar.module.css";
import { useState } from "react";

function Navbar() {
  // if user exits, route to dashboard
  // else route to signup
  const [route] = useState(() => {
    return localStorage.getItem("userId") ? "dashboard" : "signup";
  });

  return (
    <NavigationMenu.Root className={styles.NavRoot}>
      <NavigationMenu.List className={styles.NavList}>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.NavTrigger}>
            <NavigationMenu.Link className={styles.NavLink} href={route}>
              Focus
            </NavigationMenu.Link>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.NavContent}>
            <div className={styles.DropdownCard}>
              Distraction free study sessions.
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.NavTrigger}>
            <NavigationMenu.Link className={styles.NavLink} href={route}>
              Compete
            </NavigationMenu.Link>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.NavContent}>
            <div className={styles.DropdownCard}>
              Track goals and finish what you planned.
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.NavTrigger}>
            <NavigationMenu.Link className={styles.NavLink} href={route}>
              Win
            </NavigationMenu.Link>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.NavContent}>
            <div className={styles.DropdownCard}>
              Turn consistency into real progress.
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={styles.NavTrigger}>
            <NavigationMenu.Link className={styles.NavLink} href="about">
              About
            </NavigationMenu.Link>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={styles.NavContent}>
            <div className={styles.DropdownCard}>Learn More!</div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <div className={styles.ViewportPosition}>
        <NavigationMenu.Viewport className={styles.NavViewport} />
      </div>
    </NavigationMenu.Root>
  );
}

export default Navbar;
