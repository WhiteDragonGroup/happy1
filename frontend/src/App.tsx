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
import CreateSchedule from './pages/CreateSchedule';
import KakaoCallback from './pages/KakaoCallback';
import Profile from './pages/Profile';
import Inquiries from './pages/Inquiries';
import ManagerRequest from './pages/ManagerRequest';
import ManageSchedules from './pages/ManageSchedules';
import AdminUsers from './pages/AdminUsers';
import AdminSchedules from './pages/AdminSchedules';
import AdminRequests from './pages/AdminRequests';
import AdminDeleted from './pages/AdminDeleted';
import TeamDetail from './pages/TeamDetail';
import DaySchedules from './pages/DaySchedules';

import './index.css';

function AppRoutes() {
  const location = useLocation();
  const hideNav = location.pathname === '/login';

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/my-schedule" element={<MySchedule />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/profile" element={<Profile />} />
          <Route path="/mypage/inquiries" element={<Inquiries />} />
          <Route path="/mypage/manager-request" element={<ManagerRequest />} />
          <Route path="/mypage/create-schedule" element={<CreateSchedule />} />
          <Route path="/mypage/manage-schedules" element={<ManageSchedules />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/schedules" element={<AdminSchedules />} />
          <Route path="/admin/requests" element={<AdminRequests />} />
          <Route path="/admin/deleted" element={<AdminDeleted />} />
          <Route path="/schedule/:id" element={<ScheduleDetail />} />
          <Route path="/team/:id" element={<TeamDetail />} />
          <Route path="/day/:date" element={<DaySchedules />} />
          <Route path="/login" element={<Login />} />
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
