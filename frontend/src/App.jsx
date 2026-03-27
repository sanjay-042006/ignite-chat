import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './context/useAuthStore';
import { useSocketStore } from './context/useSocketStore';
import { useStoryStore } from './context/useStoryStore';
import { Loader } from 'lucide-react';

import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import GroupPage from './pages/GroupPage';
import StrangerPage from './pages/StrangerPage';
import InterestPage from './pages/InterestPage';
import PracticePage from './pages/PracticePage';
import StoryLibraryPage from './pages/StoryLibraryPage';
import StoryDetailPage from './pages/StoryDetailPage';
import LovePage from './pages/LovePage';

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { connectSocket, disconnectSocket } = useSocketStore();
  const { setupGlobalListeners } = useStoryStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser) {
      connectSocket();
      setupGlobalListeners();
    } else {
      disconnectSocket();
    }
  }, [authUser, connectSocket, disconnectSocket, setupGlobalListeners]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/signup" element={!authUser ? <SignupPage /> : <Navigate to="/" />} />

      {/* Protected Routes inside Layout */}
      <Route element={<Layout />}>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/groups" element={authUser ? <GroupPage /> : <Navigate to="/login" />} />
        <Route path="/love" element={authUser ? <LovePage /> : <Navigate to="/login" />} />
        <Route path="/stranger" element={authUser ? <StrangerPage /> : <Navigate to="/login" />} />
        <Route path="/interest" element={authUser ? <InterestPage /> : <Navigate to="/login" />} />
        <Route path="/practice" element={authUser ? <PracticePage /> : <Navigate to="/login" />} />
        <Route path="/library" element={authUser ? <StoryLibraryPage /> : <Navigate to="/login" />} />
        <Route path="/stories/:id" element={authUser ? <StoryDetailPage /> : <Navigate to="/login" />} />
      </Route>
    </Routes>
  );
}

export default App;
