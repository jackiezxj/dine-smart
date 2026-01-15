import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserHome from './pages/UserHome';
import AdminHome from './pages/AdminHome';
import UserHistory from './pages/UserHistory';
import AdminChoices from './pages/AdminChoices';

// Simple Auth Guard
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const isDemo = localStorage.getItem('demo_user');
  // In real app, check Supabase session
  if (!isDemo) {
    // return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/app" 
          element={
            <RequireAuth>
              <UserHome />
            </RequireAuth>
          } 
        />
        <Route
          path="/history"
          element={
            <RequireAuth>
              <UserHistory />
            </RequireAuth>
          }
        />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/choices" element={<AdminChoices />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
