import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Users, Car, MessageCircle, Star, Phone, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { formatPrice } from '../../utils/currency';

interface FeeConfiguration {
  percentage_fee: number;
  fixed_fee: number;
}

interface TrajetInterurbain {
  id: string;
  chauffeur_id: string;
  ville_depart: string;
  ville_arrivee: string;
  date_depart: string;
  heure_depart: string;
  places_disponibles: number;
  places_reservees: number;
  prix_par_place: number;
  statut: string;
  description: string | null;
  chauffeur?: {
    nom: string;
    telephone: string;
    vehicule_modele: string;
    categorie_vehicule: string;
  };
}

interface Message {
  id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  created_at: string;
  lu: boolean;
}

export default function IntercityTripDetails() {
  const { user } = useClientAuth();
  const [trip, setTrip] = useState<TrajetInterurbain | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [booking, setBooking] = useState(false);
  const [nombrePlaces, setNombrePlaces] = useState(1);
  const [hasBooked, setHasBooked] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [feeConfig, setFeeConfig] = useState<FeeConfiguration>({ percentage_fee: 10, fixed_fee: 500 });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tripId = params.get('trip_id');
    if (tripId) {
      fetchFeeConfiguration();
      fetchTripDetails(tripId);
      checkBookingStatus(tripId);
    }
  }, []);

  const fetchFeeConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('frais_configuration')
        .select('percentage_fee, fixed_fee')
        .eq('type_service', 'interurbain')
        .eq('actif', true)
        .maybeSingle();

      if (data && !error) {
        setFeeConfig(data);
      }
    } catch (err) {
      console.error('Error fetching fee configuration:', err);
    }
  };

  useEffect(() => {
    if (trip) {
      const interval = setInterval(() => {
        updateCountdown();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [trip]);

  useEffect(() => {
    if (showChat && trip) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [showChat, trip]);

  const updateCountdown = () => {
    if (!trip) return;

    const now = new Date();
    const departureDateTime = new Date(`${trip.date_depart}T${trip.heure_depart}`);
    const diff = departureDateTime.getTime() - now.getTime();

    if (diff < 0) {
      setCountdown('Départ effectué');
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      setCountdown(`${days}j ${hours}h ${minutes}m`);
    } else if (hours > 0) {
      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    } else {
      setCountdown(`${minutes}m ${seconds}s`);
    }
  };

  const fetchTripDetails = async (tripId: string) => {
    try {
      const { data, error } = await supabase
        .from('trajets_interurbains')
        .select(`
          *,
          chauffeur:chauffeurs (
            nom,
            telephone,
            vehicule_modele,
            categorie_vehicule
          )
        `)
        .eq('id', tripId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching trip (non-critical):', error);
        setLoading(false);
        return;
      }

      if (data) {
        if (data.statut === 'deleted') {
          console.log('Trip has been deleted');
          window.location.href = '/client/intercity/feed';
          return;
        }

        const tripData = {
          ...data,
          chauffeur: Array.isArray(data.chauffeur) ? data.chauffeur[0] : data.chauffeur,
        };
        setTrip(tripData as TrajetInterurbain);
      }
    } catch (error) {
      console.error('Error fetching trip (non-critical):', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBookingStatus = async (tripId: string) => {
    if (!user) return;

    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientError) {
        console.error('Error fetching client (non-critical):', clientError);
        return;
      }

      if (!clientData) return;

      const { data, error } = await supabase
        .from('reservations_interurbaines')
        .select('id')
        .eq('trajet_id', tripId)
        .eq('client_id', clientData.id)
        .in('statut', ['en_attente', 'confirmee'])
        .maybeSingle();

      if (error) {
        console.error('Error checking booking (non-critical):', error);
        return;
      }

      setHasBooked(!!data);
    } catch (error) {
      console.error('Error checking booking (non-critical):', error);
    }
  };

  const fetchMessages = async () => {
    if (!trip || !user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('trajet_id', trip.id)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      const unreadMessages = data?.filter(
        (msg) => msg.receiver_id === user.id && !msg.lu
      );

      if (unreadMessages && unreadMessages.length > 0) {
        for (const msg of unreadMessages) {
          await supabase
            .from('messages')
            .update({ lu: true })
            .eq('id', msg.id);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !trip || !user || sendingMessage) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          trajet_id: trip.id,
          sender_id: user.id,
          sender_type: 'client',
          receiver_id: trip.chauffeur_id,
          receiver_type: 'chauffeur',
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleBookTrip = async () => {
    if (!trip || !user || booking || hasBooked) return;

    const placesRestantes = trip.places_disponibles - trip.places_reservees;
    if (nombrePlaces > placesRestantes) {
      alert('Pas assez de places disponibles');
      return;
    }

    setBooking(true);
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (clientError) {
        console.error('Error fetching client (non-critical):', clientError);
        alert('Erreur: Profil client non trouvé');
        setBooking(false);
        return;
      }

      if (!clientData) {
        alert('Erreur: Profil client non trouvé');
        setBooking(false);
        return;
      }

      const prixTotal = calculateTotalPrice(trip.prix_par_place) * nombrePlaces;

      const { error: reservationError } = await supabase
        .from('reservations_interurbaines')
        .insert({
          trajet_id: trip.id,
          client_id: clientData.id,
          nombre_places: nombrePlaces,
          prix_total: prixTotal,
          statut: 'confirmee',
        });

      if (reservationError) {
        console.error('Error creating reservation (non-critical):', reservationError);
        alert('Erreur lors de la réservation');
        setBooking(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('trajets_interurbains')
        .update({
          places_reservees: trip.places_reservees + nombrePlaces,
        })
        .eq('id', trip.id);

      if (updateError) {
        console.error('Error updating trip seats (non-critical):', updateError);
      }

      setHasBooked(true);
      setBookingSuccess(true);

      await fetchTripDetails(trip.id);

      setTimeout(() => setBookingSuccess(false), 3000);
    } catch (error) {
      console.error('Error booking trip (non-critical):', error);
      alert('Erreur lors de la réservation');
    } finally {
      setBooking(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  const getPlacesRestantes = () => {
    if (!trip) return 0;
    return trip.places_disponibles - trip.places_reservees;
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const calculatePercentageFee = (basePrice: number): number => {
    return Math.round(basePrice * feeConfig.percentage_fee / 100);
  };

  const calculateTotalServiceFee = (basePrice: number): number => {
    return feeConfig.fixed_fee + calculatePercentageFee(basePrice);
  };

  const calculateTotalPrice = (basePrice: number): number => {
    return basePrice + calculateTotalServiceFee(basePrice);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Trajet non trouvé</h2>
          <p className="text-slate-600 mb-6">Ce trajet n'existe pas ou a été supprimé.</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const placesRestantes = getPlacesRestantes();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white shadow-sm px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Détails du trajet</h1>
          <div className="w-9"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 p-6 pb-32 overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4">
          {/* Success Message */}
          {bookingSuccess && (
            <div className="bg-green-500 text-white rounded-2xl p-4 shadow-lg flex items-center space-x-3 animate-fade-in">
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">Réservation confirmée!</p>
                <p className="text-sm text-green-100">Votre place est réservée</p>
              </div>
            </div>
          )}

          {/* Countdown Card */}
          <div className="bg-white rounded-2xl p-5 shadow-xl text-center">
            <p className="text-sm text-slate-600 mb-1">Départ dans</p>
            <p className="text-3xl font-bold text-emerald-600">{countdown}</p>
          </div>

          {/* Driver Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">
                  {trip.chauffeur?.nom?.charAt(0) || 'C'}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">{trip.chauffeur?.nom || 'Chauffeur'}</h2>
                <div className="flex items-center space-x-1 mt-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <Star className="w-4 h-4 text-slate-300 fill-current" />
                  <span className="text-sm text-slate-600 ml-1">(4.0)</span>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Car className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-slate-900">{trip.chauffeur?.vehicule_modele || 'Véhicule standard'}</span>
              </div>
              {trip.chauffeur?.categorie_vehicule && (
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {trip.chauffeur.categorie_vehicule}
                </span>
              )}
            </div>
          </div>

          {/* Trip Route */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="font-semibold text-slate-900 mb-4">Itinéraire</h3>
            <div className="flex items-start space-x-3">
              <div className="flex flex-col items-center mt-1">
                <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                <div className="w-0.5 h-16 bg-slate-300"></div>
                <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
              </div>
              <div className="flex-1 space-y-12">
                <div>
                  <p className="font-semibold text-slate-900 text-lg">{trip.ville_depart}</p>
                  <div className="flex items-center space-x-2 text-sm text-slate-600 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(trip.date_depart)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-slate-600 mt-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(trip.heure_depart)}</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-lg">{trip.ville_arrivee}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h3 className="font-semibold text-slate-900 mb-4">Tarification</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Prix de base</span>
                <span className="font-semibold text-slate-900">{formatPrice(trip.prix_par_place)} CFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Frais fixe Pop Drive</span>
                <span className="font-semibold text-slate-900">{formatPrice(feeConfig.fixed_fee)} CFA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Frais variable ({feeConfig.percentage_fee}%)</span>
                <span className="font-semibold text-slate-900">{formatPrice(calculatePercentageFee(trip.prix_par_place))} CFA</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total par place</span>
                <span className="text-2xl font-bold text-emerald-600">{formatPrice(calculateTotalPrice(trip.prix_par_place))} CFA</span>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Places disponibles</span>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-slate-600" />
                <p className={`text-2xl font-bold ${placesRestantes <= 2 ? 'text-orange-600' : 'text-slate-900'}`}>
                  {placesRestantes}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-20">
        <div className="max-w-md mx-auto px-6 py-4">
          {!hasBooked ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-slate-700">Places:</label>
                <select
                  value={nombrePlaces}
                  onChange={(e) => setNombrePlaces(Number(e.target.value))}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={booking}
                >
                  {Array.from({ length: Math.min(placesRestantes, 4) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n} place{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Total</p>
                  <p className="font-bold text-emerald-600">{formatPrice(calculateTotalPrice(trip.prix_par_place) * nombrePlaces)} CFA</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowChat(true)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Contacter</span>
                </button>
                <button
                  onClick={handleBookTrip}
                  disabled={booking || placesRestantes === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {booking ? 'Réservation...' : 'Réserver'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-green-900">Vous avez réservé ce trajet</p>
              </div>
              <button
                onClick={() => setShowChat(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Contacter le chauffeur</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-end">
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl shadow-2xl flex flex-col max-h-[80vh]">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {trip.chauffeur?.nom?.charAt(0) || 'C'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{trip.chauffeur?.nom}</h3>
                  <p className="text-xs text-slate-600">Chauffeur</p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">Aucun message</p>
                  <p className="text-sm text-slate-500">Commencez la conversation</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-900'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-emerald-100' : 'text-slate-500'}`}>
                          {formatMessageTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="px-6 py-4 border-t border-slate-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Votre message..."
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={sendingMessage}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
