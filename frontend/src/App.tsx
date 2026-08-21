import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { Layout } from "./components/Layout/Layout";
import { Login } from "./pages/Login/Login";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Transactions } from "./pages/Transactions/Transactions";
import { TransactionForm } from "./pages/Transactions/TransactionForm";
import { Pending } from "./pages/Pending/Pending";
import { PendingForm } from "./pages/Pending/PendingForm";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/"
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              }
            />
            <Route
              path="/transactions"
              element={
                <Layout>
                  <Transactions />
                </Layout>
              }
            />
            <Route
              path="/transactions/new"
              element={
                <Layout>
                  <TransactionForm />
                </Layout>
              }
            />
            <Route
              path="/transactions/:id/edit"
              element={
                <Layout>
                  <TransactionForm />
                </Layout>
              }
            />
            <Route
              path="/pending"
              element={
                <Layout>
                  <Pending />
                </Layout>
              }
            />
            <Route
              path="/pending/new"
              element={
                <Layout>
                  <PendingForm />
                </Layout>
              }
            />
            <Route
              path="/pending/:id/edit"
              element={
                <Layout>
                  <PendingForm />
                </Layout>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
