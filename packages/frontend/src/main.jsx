import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import App from "./App.jsx";
import Signup from "./components/Signup.jsx";
import Login from "./components/Login.jsx";
import Committed from "./components/Committed.jsx";
import Navbar from "./components/Navbar.jsx";
import About from "./components/About.jsx";

const root = document.getElementById("root");

ReactDOM.createRoot(root).render(
  <>
    <Navbar />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/committed" element={<Committed />} />
        <Route path="/dashboard" element={<h1>Dashboard — coming soon</h1>} />
        <Route path="about" element={<About />} />
      </Routes>
    </BrowserRouter>
    ,
  </>,
);
