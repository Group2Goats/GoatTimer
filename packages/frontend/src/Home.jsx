import React from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import "./Home.css";

const HomePage = () => {
  return (
    <div>
      {/*  
      */}
      <NavigationMenu.Root className="NavRoot">
        
        {}
        <NavigationMenu.List className="NavList">
          
          {}
          <NavigationMenu.Item>
            {}
            <NavigationMenu.Trigger className="NavTrigger">
              Test Menu 1
            </NavigationMenu.Trigger>
            
            {}
            <NavigationMenu.Content className="NavContent">
              <div className="TestDropdownContent">Test Dropdown Text A</div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>

          <NavigationMenu.Item>
            <NavigationMenu.Trigger className="NavTrigger">
              Test Menu 2
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className="NavContent">
              <div className="TestDropdownContent">Test Dropdown Text B</div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>

          {}
          <NavigationMenu.Item>
            <NavigationMenu.Link className="NavLink" href="#">
              Test Link
            </NavigationMenu.Link>
          </NavigationMenu.Item>

        </NavigationMenu.List>

        {}
        <div className="ViewportPosition">
          {}
          <NavigationMenu.Viewport className="NavViewport" />
        </div>
      </NavigationMenu.Root>

      {}
      <main style={{ minHeight: "100vh" }}></main>
    </div>
  );
};

export default HomePage;