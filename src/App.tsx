import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Analytics from './pages/Analytics';
import Auth from './pages/Auth';
import NotFound from './pages/NotFound';
import PublicLeagues from './pages/PublicLeagues';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import LeagueHome from '@/pages/league/LeagueHome';
import LeagueHost from '@/pages/league/LeagueHost';
import LeagueTeamSelect from '@/pages/league/LeagueTeamSelect';
import LeagueCreate from '@/pages/league/LeagueCreate';
import LeagueJoin from '@/pages/league/LeagueJoin';
import LeagueJoinTeamSelect from '@/pages/league/LeagueJoinTeamSelect';
import LeagueDashboard from '@/pages/league/LeagueDashboard';
import { JoinLeaguePage } from '@/pages/league/JoinLeaguePage';

const AppShell = () => {
  const location = useLocation();
  const hideNavigation = location.pathname === '/auth';

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/public-leagues" element={<PublicLeagues />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/league" element={<ProtectedRoute><LeagueHome /></ProtectedRoute>} />
        <Route path="/league/host" element={<ProtectedRoute><LeagueHost /></ProtectedRoute>} />
        <Route path="/league/host/:leagueType" element={<ProtectedRoute><LeagueTeamSelect /></ProtectedRoute>} />
        <Route path="/league/create" element={<ProtectedRoute><LeagueCreate /></ProtectedRoute>} />
        <Route path="/league/join" element={<ProtectedRoute><LeagueJoin /></ProtectedRoute>} />
        <Route path="/league/join/code" element={<ProtectedRoute><JoinLeaguePage /></ProtectedRoute>} />
        <Route path="/league/join/team-select" element={<ProtectedRoute><LeagueJoinTeamSelect /></ProtectedRoute>} />
        <Route path="/league/dashboard/:id" element={<ProtectedRoute><LeagueDashboard /></ProtectedRoute>} />
        <Route path="/league/:id" element={<ProtectedRoute><LeagueDashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!hideNavigation && <Navigation />}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </Router>
  );
};

export default App;
