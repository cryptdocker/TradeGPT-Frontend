import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthLandingPage } from "@/pages/AuthLandingPage";
import { TradeGPTDashboard } from "@/pages/TradeGPTDashboard";
import { SettingsPage } from "@/pages/SettingsPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-th-bg">
        <p className="text-sm text-th-text-muted">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-th-bg">
        <p className="text-sm text-th-text-muted">Loading…</p>
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/chat" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<GuestOnly><AuthLandingPage /></GuestOnly>} />
            <Route path="/chat/:conversationId?" element={<RequireAuth><TradeGPTDashboard /></RequireAuth>} />
            <Route path="/settings/:section?" element={<RequireAuth><SettingsPage /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
