import { useState, useEffect } from 'react';
import { MapPin, User, Phone, Car, Clock, X, Home, Navigation, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { formatPrice } from '../../utils/currency';

interface CourseDetails {
  id: string;
  statut: string;
  statut_trajet: string | null;
  prix: number;
  eta_minutes: number | null;
  heure_depart_chauffeur: string | null;
  heure_arrivee_depart: string | null;
  created_at: string;
  ligne: { nom: string; numero: string };
  arret_depart: { nom: string };
  arret_arrivee: { nom: string };
  categorie: { nom: string };
  chauffeur?: {
    nom: string;
    telephone: string;
  };
}

export default function UrbanWaiting() {
  const { user } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [notificationShown, setNotificationShown] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
    const interval = setInterval(fetchCourseDetails, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (course?.eta_minutes && course.statut_trajet === 'en_route') {
      setCountdown(course.eta_minutes * 60);
    }
  }, [course?.eta_minutes, course?.statut_trajet]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (course?.statut_trajet === 'arrive_depart' && !notificationShown) {
      showArrivalNotification();
      setNotificationShown(true);
    }
  }, [course?.statut_trajet, notificationShown]);

  const showArrivalNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('POP RIDE - Chauffeur arrivé', {
        body: 'Votre chauffeur est arrivé à l\'arrêt de départ',
        icon: '/icon.png',
      });
    }
  };

  const fetchCourseDetails = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const courseId = params.get('course_id');

      if (!courseId) {
        setError('ID de course manquant');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('courses_urbaines')
        .select(`
          id,
          statut,
          statut_trajet,
          prix,
          eta_minutes,
          heure_depart_chauffeur,
          heure_arrivee_depart,
          created_at,
          ligne:lignes_urbaines(nom, numero),
          arret_depart:arrets_urbains!courses_urbaines_arret_depart_id_fkey(nom),
          arret_arrivee:arrets_urbains!courses_urbaines_arret_arrivee_id_fkey(nom),
          categorie:categories_vehicules(nom),
          chauffeur:chauffeurs(nom, telephone)
        `)
        .eq('id', courseId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('Course introuvable');

      setCourse({
        id: data.id,
        statut: data.statut,
        statut_trajet: data.statut_trajet,
        prix: Number(data.prix),
        eta_minutes: data.eta_minutes,
        heure_depart_chauffeur: data.heure_depart_chauffeur,
        heure_arrivee_depart: data.heure_arrivee_depart,
        created_at: data.created_at,
        ligne: Array.isArray(data.ligne) ? data.ligne[0] : data.ligne,
        arret_depart: Array.isArray(data.arret_depart) ? data.arret_depart[0] : data.arret_depart,
        arret_arrivee: Array.isArray(data.arret_arrivee) ? data.arret_arrivee[0] : data.arret_arrivee,
        categorie: Array.isArray(data.categorie) ? data.categorie[0] : data.categorie,
        chauffeur: data.chauffeur ? (Array.isArray(data.chauffeur) ? data.chauffeur[0] : data.chauffeur) : undefined,
      });

      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!course || course.statut === 'en_cours') return;

    setCancelling(true);

    try {
      const { error: updateError } = await supabase
        .from('courses_urbaines')
        .update({ statut: 'annulee' })
        .eq('id', course.id);

      if (updateError) throw updateError;

      window.history.pushState({}, '', '/client/home');
      window.location.href = '/client/home';
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'annulation');
      setCancelling(false);
    }
  };

  const handleBackHome = () => {
    window.history.pushState({}, '', '/client/home');
    window.location.href = '/client/home';
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWaitingTime = (): string => {
    if (!course?.created_at) return '0 min';
    const created = new Date(course.created_at);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / 60000);
    return `${diffMinutes} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error || 'Course introuvable'}</p>
          <button
            onClick={handleBackHome}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const isWaiting = course.statut === 'en_attente';
  const isInProgress = course.statut === 'en_cours';
  const isCompleted = course.statut === 'terminee';
  const isCancelled = course.statut === 'annulee';

  const isDriverEnRoute = course.statut_trajet === 'en_route';
  const isDriverArrived = course.statut_trajet === 'arrive_depart';
  const isInTrip = course.statut_trajet === 'en_trajet';
  const isDestinationReached = course.statut_trajet === 'arrive_destination';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {isWaiting && !course.chauffeur && 'Recherche de chauffeur...'}
                {isWaiting && course.chauffeur && isDriverEnRoute && 'Chauffeur en route'}
                {isWaiting && course.chauffeur && isDriverArrived && 'Chauffeur arrivé'}
                {isInProgress && isInTrip && 'En trajet'}
                {isInProgress && isDestinationReached && 'Destination atteinte'}
                {isCompleted && 'Course terminée'}
                {isCancelled && 'Course annulée'}
              </h1>
              <p className="text-sm text-slate-600">
                {isWaiting && !course.chauffeur && `Recherche depuis ${getWaitingTime()}`}
                {isWaiting && course.chauffeur && isDriverEnRoute && 'Arrivée imminente'}
                {isWaiting && course.chauffeur && isDriverArrived && 'Rendez-vous à l\'arrêt'}
                {isInProgress && 'Bon voyage avec POP RIDE'}
                {(isCompleted || isCancelled) && 'Merci d\'avoir utilisé POP RIDE'}
              </p>
            </div>
            {(isCompleted || isCancelled) && (
              <button
                onClick={handleBackHome}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Home className="w-6 h-6 text-slate-700" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 pb-32">
        <div className="max-w-md mx-auto space-y-4">
          {/* Countdown / Status Card */}
          {isWaiting && !course.chauffeur && (
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                    <Clock className="w-10 h-10 text-blue-600" />
                  </div>
                  <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Recherche en cours
              </h2>
              <p className="text-slate-600 mb-4">
                Un chauffeur va bientôt accepter votre course
              </p>
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-sm text-blue-900">
                  Temps d'attente estimé: 3-5 minutes
                </p>
              </div>
            </div>
          )}

          {/* Driver En Route with Countdown */}
          {course.chauffeur && isDriverEnRoute && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex flex-col items-center justify-center">
                      <Navigation className="w-8 h-8 text-white mb-1" />
                      {countdown !== null && (
                        <span className="text-lg font-bold text-white">
                          {formatCountdown(countdown)}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-green-500 rounded-full opacity-20 animate-pulse"></div>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Chauffeur en route
                </h2>
                {course.eta_minutes && (
                  <p className="text-slate-600">
                    Arrivée estimée dans {course.eta_minutes} minute{course.eta_minutes > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 mb-1">Votre chauffeur</p>
                    <h3 className="text-lg font-bold text-slate-900">{course.chauffeur.nom}</h3>
                  </div>
                </div>
                <a
                  href={`tel:${course.chauffeur.telephone}`}
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-xl transition-colors mt-4"
                >
                  <Phone className="w-5 h-5" />
                  <span>{course.chauffeur.telephone}</span>
                </a>
              </div>
            </div>
          )}

          {/* Driver Arrived */}
          {course.chauffeur && isDriverArrived && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  Chauffeur arrivé !
                </h2>
                <p className="text-slate-600 mb-2">
                  Votre chauffeur vous attend à l'arrêt
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-900 text-left">
                    Rendez-vous à l'arrêt <strong>{course.arret_depart.nom}</strong>
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 mb-1">Votre chauffeur</p>
                    <h3 className="text-lg font-bold text-slate-900">{course.chauffeur.nom}</h3>
                  </div>
                </div>
                <a
                  href={`tel:${course.chauffeur.telephone}`}
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-xl transition-colors mt-4"
                >
                  <Phone className="w-5 h-5" />
                  <span>{course.chauffeur.telephone}</span>
                </a>
              </div>
            </div>
          )}

          {/* In Trip */}
          {isInProgress && (isInTrip || isDestinationReached) && course.chauffeur && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {isInTrip && (
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                        <Car className="w-10 h-10 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    En trajet vers destination
                  </h2>
                  <p className="text-slate-600">
                    Profitez de votre voyage
                  </p>
                </div>
              )}

              {isDestinationReached && (
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Destination atteinte
                  </h2>
                  <p className="text-slate-600">
                    Vous êtes arrivé à destination
                  </p>
                </div>
              )}

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-500 mb-1">Votre chauffeur</p>
                    <h3 className="text-lg font-bold text-slate-900">{course.chauffeur.nom}</h3>
                  </div>
                </div>
                <a
                  href={`tel:${course.chauffeur.telephone}`}
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-green-50 hover:bg-green-100 text-green-700 font-semibold rounded-xl transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>{course.chauffeur.telephone}</span>
                </a>
              </div>
            </div>
          )}

          {/* Completed Message */}
          {isCompleted && (
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Course terminée !
              </h2>
              <p className="text-slate-600">
                Merci d'avoir voyagé avec POP RIDE
              </p>
            </div>
          )}

          {/* Cancelled Message */}
          {isCancelled && (
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Course annulée
              </h2>
              <p className="text-slate-600">
                Votre course a été annulée
              </p>
            </div>
          )}

          {/* Ride Details Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="font-bold text-slate-900 mb-4">Détails de la course</h3>

            {/* Route */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Départ</p>
                  <p className="font-semibold text-slate-900">{course.arret_depart.nom}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-3 flex justify-center">
                  <div className="w-0.5 h-6 bg-slate-300"></div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Arrivée</p>
                  <p className="font-semibold text-slate-900">{course.arret_arrivee.nom}</p>
                </div>
              </div>
            </div>

            {/* Other Details */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Ligne</span>
                <span className="font-semibold text-slate-900">
                  {course.ligne.numero} - {course.ligne.nom}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Catégorie</span>
                <span className="font-semibold text-slate-900">{course.categorie.nom}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Prix</span>
                <span className="font-semibold text-green-600">
                  {formatPrice(course.prix)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Button */}
      {isWaiting && !isDriverArrived && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center space-x-2 ${
                cancelling
                  ? 'bg-slate-400 cursor-not-allowed text-white'
                  : 'bg-red-50 hover:bg-red-100 text-red-600'
              }`}
            >
              {cancelling ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Annulation...</span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5" />
                  <span>Annuler la course</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {(isCompleted || isCancelled) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleBackHome}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Retour à l'accueil</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
