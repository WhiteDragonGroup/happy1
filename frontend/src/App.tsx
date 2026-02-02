import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider } from './context/AppContext';
import BottomNav from './components/BottomNav';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import MySchedule from './pages/MySchedule';
import MyPage from './pages/MyPage';
import ScheduleDetail from './pages/ScheduleDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateSchedule from './pages/CreateSchedule';
import KakaoCallback from './pages/KakaoCallback';

import './index.css';

function AppRoutes() {
  const location = useLocation();
  const hideNav = ['/login', '/register'].includes(location.pathname);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/my-schedule" element={<MySchedule />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/create-schedule" element={<CreateSchedule />} />
          <Route path="/schedule/:id" element={<ScheduleDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth/kakao/callback" element={<KakaoCallback />} />
        </Routes>
      </AnimatePresence>
      {!hideNav && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
