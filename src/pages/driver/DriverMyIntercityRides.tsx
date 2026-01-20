import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign, Plus, User, Phone, AlertCircle, Send, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDriverAuth } from '../../contexts/DriverAuthContext';
import { formatPrice } from '../../utils/currency';
import RideChat from '../../components/RideChat';

interface Ride {
  id: string;
  ville_depart: string;
  ville_arrivee: string;
  date_depart: string;
  heure_depart: string;
  places_disponibles: number;
  places_reservees: number;
  prix_par_place: number;
  statut: string;
  description: string | null;
  created_at: string;
}

interface Reservation {
  id: string;
  trajet_id: string;
  nombre_places: number;
  prix_total: number;
  statut: string;
  client: {
    nom: string;
    telephone: string | null;
    email: string;
  };
}

export default function DriverMyIntercityRides() {
  const { user, session, loading: authLoading } = useDriverAuth();

  const [rides, setRides] = useState<Ride[]>([]);
  const [reservationsByRide, setReservationsByRide] = useState<Record<string, Reservation[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [publishingRideId, setPublishingRideId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  useEffect(() => {
    if (!authLoading && !session) {
      window.location.href = '/driver/login';
    }
  }, [session, authLoading]);

  useEffect(() => {
    if (user) {
      fetchRides();
    }
  }, [user]);

  const fetchRides = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: ridesData, error: ridesError } = await supabase
        .from('trajets_interurbains')
        .select('*')
        .eq('chauffeur_id', user.id)
        .order('date_depart', { ascending: false })
        .order('heure_depart', { ascending: false });

      if (ridesError) {
        console.error('Error fetching rides (non-critical):', ridesError);
        setError('Erreur lors du chargement des trajets');
        setLoading(false);
        return;
      }

      setRides(ridesData || []);

      if (ridesData && ridesData.length > 0) {
        await fetchReservationsForRides(ridesData.map(r => r.id));
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching rides (non-critical):', err);
      setError('Erreur lors du chargement des trajets');
      setLoading(false);
    }
  };

  const fetchReservationsForRides = async (rideIds: string[]) => {
    try {
      const { data: reservationsData, error: reservationsError } = await supabase
        .from('reservations_interurbaines')
        .select(`
          id,
          trajet_id,
          nombre_places,
          prix_total,
          statut,
          client_id,
          clients (
            nom,
            telephone,
            email
          )
        `)
        .in('trajet_id', rideIds)
        .order('created_at', { ascending: false });

      if (reservationsError) {
        console.error('Error fetching reservations (non-critical):', reservationsError);
        return;
      }

      const reservationsByRideMap: Record<string, Reservation[]> = {};

      reservationsData?.forEach((res: any) => {
        const reservation: Reservation = {
          id: res.id,
          trajet_id: res.trajet_id,
          nombre_places: res.nombre_places,
          prix_total: res.prix_total,
          statut: res.statut,
          client: {
            nom: res.clients?.nom || 'Client inconnu',
            telephone: res.clients?.telephone || null,
            email: res.clients?.email || '',
          },
        };

        if (!reservationsByRideMap[res.trajet_id]) {
          reservationsByRideMap[res.trajet_id] = [];
        }

        reservationsByRideMap[res.trajet_id].push(reservation);
      });

      setReservationsByRide(reservationsByRideMap);
    } catch (err) {
      console.error('Error fetching reservations (non-critical):', err);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handlePublish = async (rideId: string) => {
    setPublishingRideId(rideId);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('trajets_interurbains')
        .update({ statut: 'published' })
        .eq('id', rideId)
        .eq('chauffeur_id', user?.id);

      if (updateError) {
        console.error('Error publishing ride (non-critical):', updateError);
        setError('Erreur lors de la publication du trajet');
        setPublishingRideId(null);
        return;
      }

      setRides(rides.map(ride =>
        ride.id === rideId ? { ...ride, statut: 'published' } : ride
      ));
      setPublishingRideId(null);
    } catch (err) {
      console.error('Error publishing ride (non-critical):', err);
      setError('Erreur lors de la publication du trajet');
      setPublishingRideId(null);
    }
  };

  const handleOpenChat = (ride: Ride) => {
    setSelectedRide(ride);
    setChatOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'draft':
        return 'bg-amber-100 text-amber-700';
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'actif':
        return 'bg-green-100 text-green-700';
      case 'suspendu':
        return 'bg-yellow-100 text-yellow-700';
      case 'termine':
        return 'bg-blue-100 text-blue-700';
      case 'annule':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'draft':
        return 'Brouillon';
      case 'published':
        return 'Publié';
      case 'actif':
        return 'Actif';
      case 'suspendu':
        return 'Suspendu';
      case 'termine':
        return 'Terminé';
      case 'annule':
        return 'Annulé';
      default:
        return statut;
    }
  };

  const getReservationStatutColor = (statut: string) => {
    switch (statut) {
      case 'confirmee':
        return 'bg-green-100 text-green-700';
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-700';
      case 'annulee':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getReservationStatutLabel = (statut: string) => {
    switch (statut) {
      case 'confirmee':
        return 'Confirmée';
      case 'en_attente':
        return 'En attente';
      case 'annulee':
        return 'Annulée';
      default:
        return statut;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!session || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <h1 className="text-xl font-bold text-slate-900">Mes trajets interurbains</h1>
              <button
                onClick={() => window.location.href = '/driver/intercity/create'}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                title="Créer un trajet"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-6 overflow-y-auto pb-24">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500 text-white rounded-2xl p-4 shadow-lg flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Empty State */}
            {rides.length === 0 && !error && (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun trajet</h3>
                <p className="text-slate-600 mb-6">
                  Vous n'avez pas encore créé de trajet interurbain.
                </p>
                <button
                  onClick={() => window.location.href = '/driver/intercity/create'}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Créer mon premier trajet
                </button>
              </div>
            )}

            {/* Rides List */}
            {rides.map((ride) => {
              const reservations = reservationsByRide[ride.id] || [];
              const availableSeats = ride.places_disponibles - ride.places_reservees;
              const totalRevenue = reservations
                .filter(r => r.statut !== 'annulee')
                .reduce((sum, r) => sum + parseFloat(r.prix_total.toString()), 0);

              return (
                <div key={ride.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  {/* Ride Header */}
                  <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-5 h-5" />
                          <span className="font-bold text-lg">{ride.ville_depart}</span>
                          <span>→</span>
                          <span className="font-bold text-lg">{ride.ville_arrivee}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-green-100">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(ride.date_depart)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(ride.heure_depart)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatutColor(ride.statut)}`}>
                          {getStatutLabel(ride.statut)}
                        </span>
                        {ride.statut === 'draft' && (
                          <button
                            onClick={() => handlePublish(ride.id)}
                            disabled={publishingRideId === ride.id}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-white text-green-600 rounded-lg text-xs font-semibold hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Send className="w-3 h-3" />
                            <span>{publishingRideId === ride.id ? 'Publication...' : 'Publier'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {ride.description && (
                      <p className="text-sm text-green-100 mt-2">{ride.description}</p>
                    )}
                  </div>

                  {/* Ride Stats */}
                  <div className="grid grid-cols-3 gap-4 p-4 border-b border-slate-200">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Users className="w-4 h-4 text-slate-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {ride.places_reservees}/{ride.places_disponibles}
                      </p>
                      <p className="text-xs text-slate-600">Places réservées</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <DollarSign className="w-4 h-4 text-slate-600" />
                      </div>
                      <p className="text-2xl font-bold text-slate-900">
                        {formatPrice(ride.prix_par_place)}
                      </p>
                      <p className="text-xs text-slate-600">Prix par place</p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center justify-center mb-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(totalRevenue)}
                      </p>
                      <p className="text-xs text-slate-600">Revenus</p>
                    </div>
                  </div>

                  {/* Chat Button */}
                  {(ride.statut === 'published' || ride.statut === 'actif') && (
                    <div className="px-6 pt-4 pb-2 border-b border-slate-200">
                      <button
                        onClick={() => handleOpenChat(ride)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>Ouvrir le chat du trajet</span>
                      </button>
                    </div>
                  )}

                  {/* Reservations */}
                  <div className="p-6">
                    <h4 className="font-bold text-slate-900 mb-3 flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Réservations ({reservations.length})
                    </h4>

                    {reservations.length === 0 ? (
                      <div className="text-center py-6 bg-slate-50 rounded-xl">
                        <p className="text-slate-600">Aucune réservation pour ce trajet</p>
                        {availableSeats > 0 && (
                          <p className="text-sm text-slate-500 mt-1">
                            {availableSeats} place{availableSeats > 1 ? 's' : ''} disponible{availableSeats > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {reservations.map((reservation) => (
                          <div
                            key={reservation.id}
                            className="border border-slate-200 rounded-xl p-4 hover:border-green-300 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="font-semibold text-slate-900 flex items-center">
                                  <User className="w-4 h-4 mr-2 text-slate-600" />
                                  {reservation.client.nom}
                                </p>
                                {reservation.client.telephone && (
                                  <p className="text-sm text-slate-600 flex items-center mt-1">
                                    <Phone className="w-4 h-4 mr-2" />
                                    {reservation.client.telephone}
                                  </p>
                                )}
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReservationStatutColor(reservation.statut)}`}>
                                {getReservationStatutLabel(reservation.statut)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                              <div className="flex items-center space-x-4 text-sm text-slate-600">
                                <div className="flex items-center space-x-1">
                                  <Users className="w-4 h-4" />
                                  <span>{reservation.nombre_places} place{reservation.nombre_places > 1 ? 's' : ''}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  {formatPrice(reservation.prix_total)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Chat Modal */}
      {chatOpen && selectedRide && user && (
        <RideChat
          trajetId={selectedRide.id}
          currentUserId={user.id}
          currentUserRole="chauffeur"
          tripTitle={`${selectedRide.ville_depart} → ${selectedRide.ville_arrivee}`}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
