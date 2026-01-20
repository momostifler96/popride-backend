import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Users, MessageCircle, User, Phone, Mail, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDriverAuth } from '../../contexts/DriverAuthContext';
import { formatPrice } from '../../utils/currency';
import RideChat from '../../components/RideChat';
import ConfirmModal from '../../components/ConfirmModal';

interface Ride {
  id: string;
  ville_depart: string;
  ville_arrivee: string;
  date_depart: string;
  heure_depart: string;
  places_disponibles: number;
  places_reservees: number;
  prix_par_place: number;
  description: string | null;
}

interface Reservation {
  id: string;
  trajet_id: string;
  nombre_places: number;
  prix_total: number;
  statut: string;
  created_at: string;
  client: {
    id: string;
    nom: string;
    telephone: string | null;
    email: string;
  };
}

export default function DriverPublishedRides() {
  const { user, session, loading: authLoading } = useDriverAuth();

  const [rides, setRides] = useState<Ride[]>([]);
  const [reservationsByRide, setReservationsByRide] = useState<Record<string, Reservation[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [rideToDelete, setRideToDelete] = useState<Ride | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!authLoading && !session) {
      window.location.href = '/driver/login';
    }
  }, [session, authLoading]);

  useEffect(() => {
    if (user) {
      fetchPublishedRides();
    }
  }, [user]);

  const fetchPublishedRides = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: ridesData, error: ridesError } = await supabase
        .from('trajets_interurbains')
        .select('*')
        .eq('chauffeur_id', user.id)
        .eq('statut', 'published')
        .order('date_depart', { ascending: true })
        .order('heure_depart', { ascending: true });

      if (ridesError) {
        console.error('Error fetching rides:', ridesError);
        setError('Erreur lors du chargement des trajets');
        setRides([]);
      } else {
        setRides(ridesData || []);

        if (ridesData && ridesData.length > 0) {
          await fetchReservationsForRides(ridesData.map(r => r.id));
        }
      }
    } catch (err) {
      console.error('Error fetching rides:', err);
      setError('Erreur lors du chargement des trajets');
      setRides([]);
    } finally {
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
          created_at,
          client:clients(id, nom, telephone, email)
        `)
        .in('trajet_id', rideIds)
        .order('created_at', { ascending: false });

      if (reservationsError) {
        console.error('Error fetching reservations:', reservationsError);
        return;
      }

      const reservationsByRideMap: Record<string, Reservation[]> = {};

      if (reservationsData) {
        for (const reservation of reservationsData) {
          const rideId = reservation.trajet_id;
          if (!reservationsByRideMap[rideId]) {
            reservationsByRideMap[rideId] = [];
          }

          const clientData = Array.isArray(reservation.client)
            ? reservation.client[0]
            : reservation.client;

          reservationsByRideMap[rideId].push({
            id: reservation.id,
            trajet_id: reservation.trajet_id,
            nombre_places: reservation.nombre_places,
            prix_total: reservation.prix_total,
            statut: reservation.statut,
            created_at: reservation.created_at,
            client: clientData || { id: '', nom: 'Client inconnu', telephone: null, email: '' }
          });
        }
      }

      setReservationsByRide(reservationsByRideMap);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  const handleBack = () => {
    window.location.href = '/driver/home';
  };

  const handleOpenChat = (ride: Ride) => {
    setSelectedRide(ride);
    setChatOpen(true);
  };

  const toggleRideExpansion = (rideId: string) => {
    setExpandedRideId(expandedRideId === rideId ? null : rideId);
  };

  const handleDeleteClick = (ride: Ride) => {
    setRideToDelete(ride);
    setDeleteError('');
    setConfirmDeleteOpen(true);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteOpen(false);
    setRideToDelete(null);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!rideToDelete || !user) return;

    setDeleteLoading(true);
    setDeleteError('');

    try {
      const reservations = reservationsByRide[rideToDelete.id] || [];
      const activeReservations = reservations.filter(
        r => r.statut === 'confirmee' || r.statut === 'en_attente'
      );

      if (activeReservations.length > 0) {
        setDeleteError('Impossible de supprimer ce trajet car il contient des réservations actives.');
        setDeleteLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('trajets_interurbains')
        .update({ statut: 'deleted' })
        .eq('id', rideToDelete.id)
        .eq('chauffeur_id', user.id);

      if (updateError) {
        console.error('Error deleting ride:', updateError);
        setDeleteError('Erreur lors de la suppression du trajet');
        setDeleteLoading(false);
        return;
      }

      setRides(rides.filter(r => r.id !== rideToDelete.id));
      setConfirmDeleteOpen(false);
      setRideToDelete(null);
      setDeleteLoading(false);
    } catch (err) {
      console.error('Error deleting ride:', err);
      setDeleteError('Erreur lors de la suppression du trajet');
      setDeleteLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!session || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 relative overflow-hidden">
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
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <h1 className="text-xl font-bold text-slate-900">Trajets publiés</h1>
              <div className="w-9" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-6 overflow-y-auto pb-24">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/90 backdrop-blur-sm text-white rounded-2xl p-4 shadow-lg flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Empty State */}
            {rides.length === 0 && !error && (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun trajet publié</h3>
                <p className="text-slate-600 mb-6">
                  Vous n'avez pas de trajet publié pour le moment.
                </p>
                <button
                  onClick={() => window.location.href = '/driver/intercity/my-rides'}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Voir tous mes trajets
                </button>
              </div>
            )}

            {/* Rides List */}
            {rides.map((ride) => {
              const reservations = reservationsByRide[ride.id] || [];
              const availableSeats = ride.places_disponibles - ride.places_reservees;
              const isExpanded = expandedRideId === ride.id;

              return (
                <div key={ride.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                  {/* Ride Header */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-5 h-5" />
                          <span className="font-bold text-lg">{ride.ville_depart}</span>
                          <span>→</span>
                          <span className="font-bold text-lg">{ride.ville_arrivee}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-emerald-100">
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
                      <div className="flex flex-col items-end space-y-1">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Publié
                        </span>
                      </div>
                    </div>

                    {ride.description && (
                      <p className="text-sm text-emerald-100 mt-2">{ride.description}</p>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 border-b border-slate-200">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">
                        {formatPrice(ride.prix_par_place)}
                      </p>
                      <p className="text-xs text-slate-600">Prix CFA</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">
                        {ride.places_reservees}/{ride.places_disponibles}
                      </p>
                      <p className="text-xs text-slate-600">Réservations</p>
                    </div>

                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">
                        {availableSeats}
                      </p>
                      <p className="text-xs text-slate-600">Places dispo.</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 bg-white border-b border-slate-200">
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleOpenChat(ride)}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-semibold transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>Chat</span>
                      </button>
                      <button
                        onClick={() => toggleRideExpansion(ride.id)}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                      >
                        <Users className="w-5 h-5" />
                        <span>Clients ({reservations.length})</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(ride)}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>

                  {/* Clients List (Expandable) */}
                  {isExpanded && (
                    <div className="p-6 bg-white">
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Liste des clients intéressés / réservés
                      </h4>

                      {reservations.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 rounded-xl">
                          <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Users className="w-6 h-6 text-slate-400" />
                          </div>
                          <p className="text-slate-600 font-medium">Aucune réservation</p>
                          <p className="text-sm text-slate-500 mt-1">
                            Les clients intéressés apparaîtront ici
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {reservations.map((reservation) => (
                            <div
                              key={reservation.id}
                              className="border border-slate-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-md transition-all"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center">
                                      <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900">{reservation.client.nom}</p>
                                      <p className="text-xs text-slate-500">
                                        Réservé le {new Date(reservation.created_at).toLocaleDateString('fr-FR')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getReservationStatutColor(reservation.statut)}`}>
                                  {getReservationStatutLabel(reservation.statut)}
                                </span>
                              </div>

                              <div className="space-y-2 bg-slate-50 rounded-lg p-3">
                                {reservation.client.telephone && (
                                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                                    <Phone className="w-4 h-4 text-slate-500" />
                                    <span>{reservation.client.telephone}</span>
                                  </div>
                                )}
                                {reservation.client.email && (
                                  <div className="flex items-center space-x-2 text-sm text-slate-700">
                                    <Mail className="w-4 h-4 text-slate-500" />
                                    <span className="truncate">{reservation.client.email}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                  <div className="flex items-center space-x-1 text-sm text-slate-700">
                                    <Users className="w-4 h-4 text-slate-500" />
                                    <span>{reservation.nombre_places} place{reservation.nombre_places > 1 ? 's' : ''}</span>
                                  </div>
                                  <p className="font-bold text-emerald-600">
                                    {formatPrice(reservation.prix_total)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Supprimer ce trajet ?"
        message={
          deleteError ||
          `Êtes-vous sûr de vouloir supprimer le trajet ${rideToDelete?.ville_depart} → ${rideToDelete?.ville_arrivee} ? Cette action est irréversible.`
        }
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDestructive={true}
        loading={deleteLoading}
      />

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
