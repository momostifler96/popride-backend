import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClientAuthProvider, useClientAuth } from './contexts/ClientAuthContext';
import { DriverAuthProvider, useDriverAuth } from './contexts/DriverAuthContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardHome from './pages/DashboardHome';
import LignesUrbaines from './pages/LignesUrbaines';
import Arrets from './pages/Arrets';
import Chauffeurs from './pages/Chauffeurs';
import CategoriesVehicules from './pages/CategoriesVehicules';
import Tarifs from './pages/Tarifs';
import Courses from './pages/Courses';
import CovoiturageInterurbain from './pages/CovoiturageInterurbain';
import Clients from './pages/Clients';
import Signalements from './pages/Signalements';
import ClientLogin from './pages/client/ClientLogin';
import ClientRegister from './pages/client/ClientRegister';
import ClientHome from './pages/client/ClientHome';
import UrbanSearch from './pages/client/UrbanSearch';
import UrbanConfirm from './pages/client/UrbanConfirm';
import UrbanWaiting from './pages/client/UrbanWaiting';
import IntercitySearch from './pages/client/IntercitySearch';
import IntercityFeed from './pages/client/IntercityFeed';
import IntercityTripDetails from './pages/client/IntercityTripDetails';
import Trips from './pages/client/Trips';
import Profile from './pages/client/Profile';
import DriverLogin from './pages/driver/DriverLogin';
import DriverHome from './pages/driver/DriverHome';
import DriverUrbanRequests from './pages/driver/DriverUrbanRequests';
import DriverUrbanActive from './pages/driver/DriverUrbanActive';
import DriverHistory from './pages/driver/DriverHistory';
import DriverNotifications from './pages/driver/DriverNotifications';
import DriverCreateIntercity from './pages/driver/DriverCreateIntercity';
import DriverMyIntercityRides from './pages/driver/DriverMyIntercityRides';
import DriverPublishedRides from './pages/driver/DriverPublishedRides';
import { Loader } from 'lucide-react';

type Page =
  | 'dashboard'
  | 'lignes'
  | 'arrets'
  | 'chauffeurs'
  | 'categories'
  | 'tarifs'
  | 'courses'
  | 'interurbain'
  | 'clients'
  | 'signalements';

type LignesView = 'list' | 'create' | 'detail' | 'arrets';
type ClientAuthView = 'login' | 'register';

function AdminApp() {
  const { adminUser } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [lignesView, setLignesView] = useState<LignesView>('list');
  const [selectedLigneId, setSelectedLigneId] = useState<string | undefined>();

  if (!adminUser) {
    return <Login onLoginSuccess={() => setCurrentPage('dashboard')} />;
  }

  const handleLogout = () => {
    window.location.reload();
  };

  const handleLignesNavigate = (view: LignesView, ligneId?: string) => {
    setLignesView(view);
    setSelectedLigneId(ligneId);
  };

  const handleMainNavigate = (page: string) => {
    setCurrentPage(page as Page);
    if (page === 'lignes') {
      setLignesView('list');
      setSelectedLigneId(undefined);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'lignes':
        return (
          <LignesUrbaines
            view={lignesView}
            ligneId={selectedLigneId}
            onNavigate={handleLignesNavigate}
          />
        );
      case 'arrets':
        return <Arrets />;
      case 'chauffeurs':
        return <Chauffeurs />;
      case 'categories':
        return <CategoriesVehicules />;
      case 'tarifs':
        return <Tarifs />;
      case 'courses':
        return <Courses />;
      case 'interurbain':
        return <CovoiturageInterurbain />;
      case 'clients':
        return <Clients />;
      case 'signalements':
        return <Signalements />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleMainNavigate}
        onLogout={handleLogout}
      />
      <div className="flex-1 ml-64">
        <Topbar />
        <main className="pt-16 bg-slate-50 min-h-screen">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

function ClientApp() {
  const { user, loading } = useClientAuth();
  const [authView, setAuthView] = useState<ClientAuthView>('login');
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (currentPath === '/client/register') {
      setAuthView('register');
    } else {
      setAuthView('login');
    }
  }, [currentPath]);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
        <Loader className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (authView === 'register') {
      return (
        <ClientRegister
          onSuccess={() => navigateTo('/client/home')}
          onSwitchToLogin={() => navigateTo('/client/login')}
        />
      );
    }
    return (
      <ClientLogin
        onSuccess={() => navigateTo('/client/home')}
        onSwitchToRegister={() => navigateTo('/client/register')}
      />
    );
  }

  if (currentPath.startsWith('/client/intercity/trip-details')) {
    return <IntercityTripDetails />;
  }

  switch (currentPath) {
    case '/client/urban/search':
      return <UrbanSearch />;
    case '/client/urban/confirm':
      return <UrbanConfirm />;
    case '/client/urban/waiting':
      return <UrbanWaiting />;
    case '/client/intercity/search':
      return <IntercitySearch />;
    case '/client/intercity/feed':
      return <IntercityFeed />;
    case '/client/trips':
      return <Trips />;
    case '/client/profile':
      return <Profile />;
    case '/client/home':
    default:
      return <ClientHome />;
  }
}

function DriverApp() {
  const { user, loading } = useDriverAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Loader className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <DriverLogin />;
  }

  switch (currentPath) {
    case '/driver/urban/requests':
      return <DriverUrbanRequests />;
    case '/driver/urban/active':
      return <DriverUrbanActive />;
    case '/driver/intercity/create':
      return <DriverCreateIntercity />;
    case '/driver/intercity/published':
      return <DriverPublishedRides />;
    case '/driver/intercity/my-rides':
      return <DriverMyIntercityRides />;
    case '/driver/history':
      return <DriverHistory />;
    case '/driver/notifications':
      return <DriverNotifications />;
    case '/driver/home':
    default:
      return <DriverHome />;
  }
}

function AppRouter() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentPath.startsWith('/client')) {
    return (
      <ClientAuthProvider>
        <ClientApp />
      </ClientAuthProvider>
    );
  }

  if (currentPath.startsWith('/driver')) {
    return (
      <DriverAuthProvider>
        <DriverApp />
      </DriverAuthProvider>
    );
  }

  return (
    <AuthProvider>
      <AdminApp />
    </AuthProvider>
  );
}

function App() {
  return <AppRouter />;
}

export default App;
