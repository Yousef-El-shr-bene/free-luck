import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      {/* <nav className="top-nav">
        <Link to="/">الرئيسية</Link>
        <Link to="/dashboard">لوحة الإدارة</Link>
      </nav> */}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
