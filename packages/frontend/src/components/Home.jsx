import React from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { Link } from "react-router";
import "./Home.css";

const HomePage = () => {
  return (
    <div className="home">
      <main className="hero">
        <h1 className="heroTitle">GoatTimer</h1>
        <p className="heroSubtitle">Study to become the G.O.A.T</p>
        <section className="mockupWrap">
          <div className="mockupShadow" />
          <div className="mockup">
            <div className="mockupCamera" />
            <div className="mockupScreen">
              <Link to="/signup">
                <button className="heroButton heroButtonPrimary">
                  Get Started
                </button>
              </Link>
              <button className="heroButton heroButtonSecondary">
                <Link
                  to="/login"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  I already have an account
                </Link>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
