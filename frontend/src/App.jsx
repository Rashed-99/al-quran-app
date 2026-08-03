import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Companion from './pages/Companion';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#121212' }}>
    <div className="w-8 h-8 border-4 border-slate-700 border-t-violet-500 rounded-full animate-spin"></div>
  </div>
);

// Wraps every protected route. Unauthenticated visitors are redirected to
// /login declaratively (via <Navigate>, which react-router handles as a
// normal client-side route change) rather than the old imperative
// window.location.href approach - this preserves SPA navigation and lets
// us send the user back to where they were trying to go after login.
const RequireAuth = ({ children }) => {
  const { isLoadingAuth, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

// Wraps /login and /register so an already-authenticated visitor is
// bounced straight into the app instead of seeing the auth forms again.
const RedirectIfAuthenticated = ({ children }) => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return children;
};

const ProtectedApp = () => (
  <RequireAuth>
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/Companion" element={
        <LayoutWrapper currentPageName="Companion">
          <Companion />
        </LayoutWrapper>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  </RequireAuth>
);

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
    <Route path="/register" element={<RedirectIfAuthenticated><Register /></RedirectIfAuthenticated>} />
    {/* Forgot/reset password stay accessible either way - a signed-in
        user might still want to change their password via this flow,
        and there's no harm in allowing it. */}
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/*" element={<ProtectedApp />} />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AppRoutes />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
