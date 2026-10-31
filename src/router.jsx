// src/router.jsx
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { lazy, Suspense } from "react";
import Layout from "./components/Layout";
import ErrorPage from "./components/ErrorPage";
// Import your extracted page components here
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const NotFound = lazy(() => import("./pages/NotFound"));

// 1. Auth Guard
function ProtectedRoute() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// Admin guard (private + role check) — wraps admin-only routes
function AdminRoute() {
  const { user } = useSelector((state) => state.auth);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// 2. Route Configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />, // Data Mode Advantage: Global Error Boundary
    children: [
      { index: true, element: <Home /> }, // Public Route
      { path: "login", element: <Login /> }, // Public Route
      {
        element: <ProtectedRoute />, // Wraps private routes
        children: [
          { path: "dashboard", element: <Dashboard /> },
          {
            element: <AdminRoute />,
            children: [{ path: "admin", element: <AdminPanel /> }],
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default function App() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
