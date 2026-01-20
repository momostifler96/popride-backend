import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Users, Clock, Car, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../utils/currency';

interface TrajetInterurbain {
  id: string;
  chauffeur_id: string;
  ville_depart: string;
  ville_arrivee: string;
  date_depart: string;
  heure_depart: string;
  places: number;
  places_reservees: number;
  prix_par_place: number;
  statut: string;
  chauffeurs?: {
    nom: string;
    telephone: string;
    type_vehicule: string;
    climatisation: boolean;
  };
}

export default function IntercitySearch() {
  const [villeDepart, setVilleDepart] = useState('');
  const [villeArrivee, setVilleArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [nombrePassagers, setNombrePassagers] = useState(1);
  const [trips, setTrips] = useState<TrajetInterurbain[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleBack = () => {
    window.location.href = '/client/home';
  };

  const handleSearch = async () => {
    if (!villeDepart || !villeArrivee || !dateDepart) {
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      let query = supabase
        .from('trajets_interurbains')
        .select(`
          *,
          chauffeurs (
            nom,
            telephone,
            type_vehicule,
            climatisation
          )
        `)
        .in('statut', ['published', 'actif'])
        .gte('date_depart', dateDepart)
        .gte('places', nombrePassagers);

      if (villeDepart) {
        query = query.ilike('ville_depart', `%${villeDepart}%`);
      }

      if (villeArrivee) {
        query = query.ilike('ville_arrivee', `%${villeArrivee}%`);
      }

      const { data, error } = await query.order('date_depart', { ascending: true });

      if (error) throw error;

      setTrips((data as TrajetInterurbain[]) || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTripClick = (tripId: string) => {
    window.location.href = `/client/intercity/trip-details?id=${tripId}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.slice(0, 5);
  };

  const getPlacesRestantes = (trip: TrajetInterurbain) => {
    return trip.places - trip.places_reservees;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 relative overflow-hidden">
      {/* Background Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white shadow-sm px-4 py-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Covoiturage Interurbain</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 p-6 pb-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Search Form */}
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Planifiez votre voyage</h2>
                <p className="text-sm text-slate-600">Partagez les frais avec d'autres</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ville de départ
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Yaoundé"
                    value={villeDepart}
                    onChange={(e) => setVilleDepart(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                    placeholder="Ex: Douala"
                    value={villeArrivee}
                    onChange={(e) => setVilleArrivee(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                    value={dateDepart}
                    onChange={(e) => setDateDepart(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nombre de passagers
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select
                    value={nombrePassagers}
                    onChange={(e) => setNombrePassagers(Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
                  >
                    <option value={1}>1 passager</option>
                    <option value={2}>2 passagers</option>
                    <option value={3}>3 passagers</option>
                    <option value={4}>4 passagers</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={!villeDepart || !villeArrivee || !dateDepart || loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? 'Recherche...' : 'Rechercher un covoiturage'}
              </button>
            </div>
          </div>

          {/* Results */}
          {hasSearched && (
            <div>
              <h3 className="text-white font-semibold text-lg mb-4 px-1">
                {trips.length > 0 ? `${trips.length} trajet${trips.length > 1 ? 's' : ''} disponible${trips.length > 1 ? 's' : ''}` : 'Aucun trajet disponible'}
              </h3>

              <div className="space-y-4">
                {trips.map((trip) => {
                  const placesRestantes = getPlacesRestantes(trip);

                  return (
                    <button
                      key={trip.id}
                      onClick={() => handleTripClick(trip.id)}
                      className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-left"
                    >
                      {/* Trip Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-md">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{trip.chauffeurs?.nom || 'Chauffeur'}</p>
                            <div className="flex items-center space-x-2 text-xs text-slate-600">
                              <Car className="w-3 h-3" />
                              <span>{trip.chauffeurs?.type_vehicule || 'Véhicule'}</span>
                              {trip.chauffeurs?.climatisation && (
                                <span className="text-blue-600">• Clim</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-600">{formatPrice(trip.prix_par_place)}</p>
                          <p className="text-xs text-slate-600">par place</p>
                        </div>
                      </div>

                      {/* Trip Route */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col items-center">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <div className="w-0.5 h-8 bg-slate-300"></div>
                            <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                          </div>
                          <div className="flex-1 space-y-6">
                            <div>
                              <p className="font-semibold text-slate-900">{trip.ville_depart}</p>
                              <div className="flex items-center space-x-2 text-sm text-slate-600">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatDate(trip.date_depart)}</span>
                                <Clock className="w-3.5 h-3.5 ml-1" />
                                <span>{formatTime(trip.heure_depart)}</span>
                              </div>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{trip.ville_arrivee}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Trip Info */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Users className="w-4 h-4" />
                          <span className={placesRestantes <= 2 ? 'text-orange-600 font-medium' : ''}>
                            {placesRestantes} place{placesRestantes > 1 ? 's' : ''} restante{placesRestantes > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {trips.length === 0 && !loading && (
                <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucun trajet trouvé</h3>
                  <p className="text-slate-600 text-sm">
                    Essayez de modifier vos critères de recherche ou vérifiez plus tard.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
