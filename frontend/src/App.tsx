import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import CameraPage from "./pages/Camera";
import Processing from "./pages/Processing";
import Result from "./pages/Result";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Everything below requires a logged-in user. */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/camera" element={<ProtectedRoute><CameraPage /></ProtectedRoute>} />
      <Route path="/processing" element={<ProtectedRoute><Processing /></ProtectedRoute>} />
      <Route path="/result/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
