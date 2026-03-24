import React, { Suspense } from "react";
import PropTypes from "prop-types";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import LoadingSkeleton from "../components/shared/LoadingSkeleton";
import ErrorBoundary from "../components/shared/ErrorBoundary";
import ProtectedRoute from "./ProtectedRoute";
import { HOME_BY_ROLE, MODULE_ACCESS } from "../utils/roles";
import { useAuth } from "../context/AuthContext";

const Dashboard = React.lazy(() => import("../pages/Dashboard"));
const RoleDashboard = React.lazy(() => import("../pages/RoleDashboard"));
const Patients = React.lazy(() => import("../pages/Patients"));
const Doctors = React.lazy(() => import("../pages/Doctors"));
const Appointments = React.lazy(() => import("../pages/Appointments"));
const Billing = React.lazy(() => import("../pages/Billing"));
const Lab = React.lazy(() => import("../pages/Lab"));
const Pharmacy = React.lazy(() => import("../pages/Pharmacy"));
const Login = React.lazy(() => import("../pages/Login"));
const RoleBasedLogin = React.lazy(() => import("../pages/RoleBasedLogin"));
const Register = React.lazy(() => import("../pages/Register"));
const NotFound = React.lazy(() => import("../pages/NotFound"));
const PatientDetail = React.lazy(() => import("../pages/PatientDetail"));

function PageWrapper({ children }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSkeleton rows={6} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

PageWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};

function DefaultHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={HOME_BY_ROLE[user?.role] || "/staff"} replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route
          path="/login"
          element={
            <PageWrapper>
              <Login />
            </PageWrapper>
          }
        />
        <Route
          path="/register"
          element={
            <PageWrapper>
              <Register />
            </PageWrapper>
          }
        />
        <Route
          path="/role-based-login"
          element={
            <PageWrapper>
              <RoleBasedLogin />
            </PageWrapper>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DefaultHomeRedirect />} />
          <Route
            path="admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <PageWrapper>
                  <RoleDashboard />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="staff"
            element={
              <ProtectedRoute roles={["staff"]}>
                <PageWrapper>
                  <RoleDashboard />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="doctor"
            element={
              <ProtectedRoute roles={["doctor"]}>
                <PageWrapper>
                  <RoleDashboard />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route path="nurse" element={<ProtectedRoute roles={["nurse"]}><PageWrapper><RoleDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="receptionist" element={<ProtectedRoute roles={["receptionist"]}><PageWrapper><RoleDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="billing-team" element={<ProtectedRoute roles={["billing"]}><PageWrapper><RoleDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="lab-technician" element={<ProtectedRoute roles={["lab_technician"]}><PageWrapper><RoleDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="pharmacist" element={<ProtectedRoute roles={["pharmacist"]}><PageWrapper><RoleDashboard /></PageWrapper></ProtectedRoute>} />
          <Route path="patient" element={<ProtectedRoute roles={["patient"]}><PageWrapper><RoleDashboard /></PageWrapper></ProtectedRoute>} />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute roles={MODULE_ACCESS.dashboard}>
                <PageWrapper>
                  <Dashboard />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="patients"
            element={
              <ProtectedRoute roles={MODULE_ACCESS.patients}>
                <PageWrapper>
                  <Patients />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="patients/:id"
            element={
              <ProtectedRoute roles={MODULE_ACCESS.patients}>
                <PageWrapper>
                  <PatientDetail />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="doctors"
            element={
              <ProtectedRoute roles={MODULE_ACCESS.doctors}>
                <PageWrapper>
                  <Doctors />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="appointments"
            element={
              <ProtectedRoute roles={MODULE_ACCESS.appointments}>
                <PageWrapper>
                  <Appointments />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="billing"
            element={
              <ProtectedRoute roles={MODULE_ACCESS.billing}>
                <PageWrapper>
                  <Billing />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="lab"
            element={
              <ProtectedRoute roles={MODULE_ACCESS.lab}>
                <PageWrapper>
                  <Lab />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="pharmacy"
            element={
              <ProtectedRoute roles={MODULE_ACCESS.pharmacy}>
                <PageWrapper>
                  <Pharmacy />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/not-found" replace />} />
        </Route>
        <Route
          path="/not-found"
          element={
            <PageWrapper>
              <NotFound />
            </PageWrapper>
          }
        />
        <Route
          path="*"
          element={
            <PageWrapper>
              <NotFound />
            </PageWrapper>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
