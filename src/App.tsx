import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ExpenseProvider } from './context/ExpenseContext';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
const Dashboard = lazy(() => import('./components/Dashboard'));
const ExpensesRecorder = lazy(() => import('./components/ExpensesRecorder'));
const Settings = lazy(() => import('./components/Settings'));
import './App.css';

function App() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <ExpenseProvider>
      <BrowserRouter>
        <div className="app-container">
          <nav className="nav-container">
            <div className="nav-content">
              <div className="nav-links">
                <Link to="/">📊 Dashboard</Link>
                <Link to="/record">💰 Record Expenses</Link>
                <Link to="/settings">⚙️ Settings</Link>
              </div>
              <button onClick={signOut} className="sign-out-btn">
                🚪 Sign Out
              </button>
            </div>
          </nav>
          <div className="main-content">
            <Suspense fallback={
              <div className="loading-container">
                <div className="loading-spinner"></div>
                Loading…
              </div>
            }>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/record" element={<ExpensesRecorder />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </BrowserRouter>
    </ExpenseProvider>
  );
}

export default App;
