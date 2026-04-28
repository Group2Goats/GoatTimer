import React from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import "./Home.css";

const HomePage = () => {
  return (
    <div className="home">
      <NavigationMenu.Root className="NavRoot">
        <NavigationMenu.List className="NavList">
          <NavigationMenu.Item>
            <NavigationMenu.Trigger className="NavTrigger">
              Focus
            </NavigationMenu.Trigger>
            <NavigationMenu.Content className="NavContent">
              <div className="DropdownCard">
                Distraction free study sessions.
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>

          <NavigationMenu.Item>
            <NavigationMenu.Trigger className="NavTrigger">
              Complete
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
            <NavigationMenu.Link className="NavLink" href="#about">
              About
            </NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>

        <div className="ViewportPosition">
          <NavigationMenu.Viewport className="NavViewport" />
        </div>
      </NavigationMenu.Root>

      <main className="hero">
        <h1 className="heroTitle">GoatTimer</h1>

        <section className="mockupWrap">
          <div className="mockupShadow" />
          <div className="mockup">
            <div className="mockupCamera" />
            <div className="mockupScreen">
              <button className="heroButton heroButtonPrimary">
                Get Started
              </button>
              <button className="heroButton heroButtonSecondary">
                I already have an account
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
