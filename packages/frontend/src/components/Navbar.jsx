import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { Link } from "react-router";

function Navbar() {
  return (
    <NavigationMenu.Root className="NavRoot">
      <NavigationMenu.List className="NavList">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className="NavTrigger">
            Focus
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="NavContent">
            <div className="DropdownCard">Distraction free study sessions.</div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className="NavTrigger">
            Compete
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="NavContent">
            <div className="DropdownCard">
              Track goals and finish what you planned.
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className="NavTrigger">
            Win
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className="NavContent">
            <div className="DropdownCard">
              Turn consistency into real progress.
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link className="NavLink" href="about">
            About
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      <div className="ViewportPosition">
        <NavigationMenu.Viewport className="NavViewport" />
      </div>
    </NavigationMenu.Root>
  );
}

export default Navbar;
