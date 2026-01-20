import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, CheckCircle2, AlertCircle, Info, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  created_at: string;
  metadata: any;
}

export default function DriverNotifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const [chauffeurId, setChauffeurId] = useState<string | null>(null);

  useEffect(() => {
    initializeDriver();
  }, []);

  const initializeDriver = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Auth error:', userError);
        window.location.href = '/driver/login';
        return;
      }

      const { data: chauffeurs, error: chauffeurError } = await supabase
        .from('chauffeurs')
        .select('*')
        .eq('user_id', user.id);

      if (chauffeurError) {
        console.error('Error fetching driver data (non-critical):', chauffeurError);
        setLoading(false);
        return;
      }

      const chauffeur = chauffeurs?.[0];
      if (chauffeur) {
        setChauffeurId(chauffeur.id);
        await fetchNotifications(chauffeur.id);
      } else {
        console.warn('No driver record found for user_id:', user.id);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error initializing driver (non-critical):', err);
      setLoading(false);
    }
  };

  const fetchNotifications = async (driverId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('chauffeur_id', driverId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching notifications (non-critical):', fetchError);
        setError('Erreur lors du chargement des notifications');
        setLoading(false);
        return;
      }

      if (data) {
        setNotifications(data);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching notifications (non-critical):', err);
      setError('Erreur lors du chargement des notifications');
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ lu: true })
        .eq('id', notificationId);

      if (updateError) {
        console.error('Error marking notification as read:', updateError);
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, lu: true } : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!chauffeurId) return;

    try {
      const unreadIds = notifications.filter(n => !n.lu).map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error: updateError } = await supabase
        .from('notifications')
        .update({ lu: true })
        .in('id', unreadIds);

      if (updateError) {
        console.error('Error marking all as read:', updateError);
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, lu: true }))
      );
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleBack = () => {
    window.location.href = '/driver/home';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ride_update':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  const getNotificationBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-slate-50';

    switch (type) {
      case 'ride_update':
        return 'bg-blue-50';
      case 'message':
        return 'bg-green-50';
      case 'alert':
        return 'bg-red-50';
      case 'success':
        return 'bg-emerald-50';
      default:
        return 'bg-white';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'À l\'instant' : `Il y a ${diffInMinutes} min`;
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.lu).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
                <p className="text-xs text-slate-600">
                  {unreadCount > 0 ? `${unreadCount} non lue${unreadCount !== 1 ? 's' : ''}` : 'Toutes lues'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Tout lire
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-8">
        <div className="max-w-md mx-auto space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">
              {error}
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Aucune notification</h3>
              <p className="text-slate-600">
                Vous n'avez pas encore de notifications
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => !notification.lu && markAsRead(notification.id)}
                className={`w-full ${getNotificationBgColor(notification.type, notification.lu)} rounded-xl shadow-md p-4 transition-all hover:shadow-lg text-left ${
                  !notification.lu ? 'border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 ${notification.lu ? 'bg-slate-200' : 'bg-white'} rounded-full flex items-center justify-center flex-shrink-0`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`font-bold text-slate-900 ${!notification.lu ? 'text-blue-900' : ''}`}>
                        {notification.titre}
                      </h3>
                      {!notification.lu && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1.5"></div>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mb-2 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {formatDate(notification.created_at)}
                      </span>
                      {notification.type === 'ride_update' && notification.metadata?.course_id && (
                        <span className="text-xs text-blue-600 font-medium">
                          Course #{notification.metadata.course_id.slice(0, 8)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
