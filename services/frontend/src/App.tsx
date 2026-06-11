import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { restoreSession } from './api/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession().then((restored) => {
      setAuthenticated(restored);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            authenticated ? <Navigate to="/" /> : <Login onLogin={() => setAuthenticated(true)} />
          }
        />
        <Route
          path="/*"
          element={
            authenticated ? (
              <Dashboard onLogout={() => setAuthenticated(false)} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
