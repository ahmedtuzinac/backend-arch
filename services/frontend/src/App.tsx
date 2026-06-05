import { useState } from 'react';
import { getAccessToken } from './api/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  const [authenticated, setAuthenticated] = useState(!!getAccessToken());

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  return <Dashboard onLogout={() => setAuthenticated(false)} />;
}

export default App;
