import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Users, ArrowRight, Bus, MessageCircle, Eye, User, Car, Award, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { formatPrice } from '../../utils/currency';
import RideChat from '../../components/RideChat';

interface FeeConfiguration {
  percentage_fee: number;
  fixed_fee: number;
}

interface Trip {
  id: string;
  ville_depart: string;
  ville_arrivee: string;
  date_depart: string;
  heure_depart: string;
  places_disponibles: number;
  places_reservees: number;
  prix_par_place: number;
  description: string | null;
  chauffeur_id: string;
  chauffeur: {
    nom: string;
    telephone: string;
    vehicule_modele: string;
    categorie_vehicule: string;
  };
}

export default function IntercityFeed() {
  const { user, loading: authLoading } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const [searchDeparture, setSearchDeparture] = useState('');
  const [searchArrival, setSearchArrival] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [feeConfig, setFeeConfig] = useState<FeeConfiguration>({ percentage_fee: 10, fixed_fee: 500 });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        window.location.href = '/client/login';
      } else {
        fetchFeeConfiguration();
        fetchClientId();
        fetchTrips();
      }
    }
  }, [authLoading, user]);

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

  const fetchClientId = async () => {
    try {
      const { data } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data) {
        setClientId(data.id);
      }
    } catch (err) {
      console.error('Error fetching client ID:', err);
    }
  };

  const fetchTrips = async (departure = '', arrival = '', date = '') => {
    try {
      setLoading(true);

      let query = supabase
        .from('trajets_interurbains')
        .select(`
          id,
          chauffeur_id,
          ville_depart,
          ville_arrivee,
          date_depart,
          heure_depart,
          places_disponibles,
          places_reservees,
          prix_par_place,
          description,
          chauffeur:chauffeurs(nom, telephone, vehicule_modele, categorie_vehicule)
        `)
        .eq('statut', 'published')
        .gte('date_depart', date || new Date().toISOString().split('T')[0]);

      if (departure) {
        query = query.ilike('ville_depart', `%${departure}%`);
      }

      if (arrival) {
        query = query.ilike('ville_arrivee', `%${arrival}%`);
      }

      query = query
        .order('date_depart', { ascending: true })
        .order('heure_depart', { ascending: true });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching trips (non-critical):', fetchError);
        setLoading(false);
        return;
      }

      const tripsData = data
        .map(trip => ({
          ...trip,
          chauffeur: Array.isArray(trip.chauffeur) ? trip.chauffeur[0] : trip.chauffeur,
        }))
        .filter(trip => (trip.places_disponibles - trip.places_reservees) > 0);

      setTrips(tripsData);
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching trips (non-critical):', err);
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setHasSearched(true);
    fetchTrips(searchDeparture, searchArrival, searchDate);
  };

  const handleClearSearch = () => {
    setSearchDeparture('');
    setSearchArrival('');
    setSearchDate('');
    setHasSearched(false);
    fetchTrips();
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

  const handleViewDetails = (tripId: string) => {
    window.location.href = `/client/intercity/trip-details?trip_id=${tripId}`;
  };

  const handleChatWithDriver = (trip: Trip) => {
    setSelectedTrip(trip);
    setChatOpen(true);
  };

  const handleBack = () => {
    window.location.href = '/client/home';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (timeString: string): string => {
    return timeString.slice(0, 5);
  };

  const getAvailableSeats = (trip: Trip): number => {
    return trip.places_disponibles - trip.places_reservees;
  };

  const getDriverInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  const getCategoryBadgeColor = (category: string): string => {
    if (!category) return 'bg-slate-100 text-slate-700';
    const cat = category.toLowerCase();
    if (cat.includes('eco')) return 'bg-green-100 text-green-700';
    if (cat.includes('confort+')) return 'bg-purple-100 text-purple-700';
    if (cat.includes('confort')) return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-700';
  };

  const getCategoryIcon = (category: string) => {
    if (!category) return <Car className="w-3 h-3" />;
    const cat = category.toLowerCase();
    if (cat.includes('confort+')) return <Award className="w-3 h-3" />;
    if (cat.includes('confort')) return <Car className="w-3 h-3" />;
    return <Car className="w-3 h-3" />;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex items-center space-x-2">
              <Bus className="w-6 h-6 text-emerald-600" />
              <h1 className="text-xl font-bold text-slate-900">Trajets Interurbains</h1>
            </div>
          </div>

          {/* Search Filters */}
          <div className="space-y-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-700">
                  {hasSearched ? 'Modifier la recherche' : 'Rechercher un trajet'}
                </span>
              </div>
              {(searchDeparture || searchArrival || searchDate) && (
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                  Filtres actifs
                </span>
              )}
            </button>

            {showFilters && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ville de départ
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={searchDeparture}
                      onChange={(e) => setSearchDeparture(e.target.value)}
                      placeholder="Ex: Dakar"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ville d'arrivée
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={searchArrival}
                      onChange={(e) => setSearchArrival(e.target.value)}
                      placeholder="Ex: Saint-Louis"
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date de départ
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => setSearchDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={handleSearch}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
                  >
                    Rechercher
                  </button>
                  {(searchDeparture || searchArrival || searchDate) && (
                    <button
                      onClick={handleClearSearch}
                      className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-2xl mx-auto px-4 py-4">
          {trips.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center mt-8">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bus className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {hasSearched ? 'Aucun résultat trouvé' : 'Aucun trajet disponible'}
              </h3>
              <p className="text-slate-600 mb-4">
                {hasSearched
                  ? 'Aucun trajet ne correspond à vos critères de recherche. Essayez de modifier vos filtres.'
                  : 'Il n\'y a pas de trajets publiés pour le moment. Revenez plus tard!'}
              </p>
              {hasSearched && (
                <button
                  onClick={handleClearSearch}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Réinitialiser la recherche
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => {
                const availableSeats = getAvailableSeats(trip);

                return (
                  <div
                    key={trip.id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Post Header - Driver Info */}
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                          <span className="text-white font-bold text-lg">
                            {getDriverInitial(trip.chauffeur?.nom || 'C')}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900">{trip.chauffeur?.nom || 'Chauffeur'}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(trip.chauffeur?.categorie_vehicule)}`}>
                              {getCategoryIcon(trip.chauffeur?.categorie_vehicule)}
                              <span>{trip.chauffeur?.categorie_vehicule || 'Standard'}</span>
                            </span>
                            {trip.chauffeur?.vehicule_modele && (
                              <span className="text-xs text-slate-500">
                                {trip.chauffeur.vehicule_modele}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Post Content - Trip Details */}
                    <div className="p-5">
                      {/* Route */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4">
                          <div className="flex-1">
                            <p className="text-xs text-slate-600 mb-1">Départ</p>
                            <p className="text-lg font-bold text-slate-900">{trip.ville_depart}</p>
                          </div>
                          <div className="px-3">
                            <ArrowRight className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="flex-1 text-right">
                            <p className="text-xs text-slate-600 mb-1">Arrivée</p>
                            <p className="text-lg font-bold text-slate-900">{trip.ville_arrivee}</p>
                          </div>
                        </div>
                      </div>

                      {/* Date, Time, Seats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center space-x-2 text-slate-700">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-medium">{formatDate(trip.date_depart)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-700">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-medium">{formatTime(trip.heure_depart)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-700">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">
                            {availableSeats} place{availableSeats !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Prix de base</span>
                            <span className="font-semibold text-slate-900">
                              {formatPrice(trip.prix_par_place)} CFA
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Frais fixe Pop Drive</span>
                            <span className="font-semibold text-slate-900">
                              {formatPrice(feeConfig.fixed_fee)} CFA
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">Frais variable ({feeConfig.percentage_fee}%)</span>
                            <span className="font-semibold text-slate-900">
                              {formatPrice(calculatePercentageFee(trip.prix_par_place))} CFA
                            </span>
                          </div>
                          <div className="pt-2 border-t border-emerald-200 flex justify-between items-center">
                            <span className="font-bold text-slate-900">Total par place</span>
                            <span className="text-2xl font-bold text-emerald-600">
                              {formatPrice(calculateTotalPrice(trip.prix_par_place))} CFA
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {trip.description && (
                        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-700">{trip.description}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <button
                          onClick={() => handleChatWithDriver(trip)}
                          className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Contacter</span>
                        </button>
                        <button
                          onClick={() => handleViewDetails(trip.id)}
                          className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold transition-colors shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Voir détails</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Chat Modal */}
      {chatOpen && selectedTrip && clientId && (
        <RideChat
          trajetId={selectedTrip.id}
          currentUserId={clientId}
          currentUserRole="client"
          tripTitle={`${selectedTrip.ville_depart} → ${selectedTrip.ville_arrivee}`}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
