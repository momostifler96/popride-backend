import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign, Bus, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useDriverAuth } from '../../contexts/DriverAuthContext';
import { formatPrice } from '../../utils/currency';

export default function DriverCreateIntercity() {
  const { user, session, loading } = useDriverAuth();

  const [villeDepart, setVilleDepart] = useState('');
  const [villeArrivee, setVilleArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [heureDepart, setHeureDepart] = useState('');
  const [placesDisponibles, setPlacesDisponibles] = useState(4);
  const [prixParPlace, setPrixParPlace] = useState('');
  const [description, setDescription] = useState('');

  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !session) {
      window.location.href = '/driver/login';
    }
  }, [session, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Profil chauffeur non trouvé');
      return;
    }

    if (!villeDepart || !villeArrivee || !dateDepart || !heureDepart || !prixParPlace) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (parseInt(prixParPlace) <= 0) {
      setError('Le prix doit être supérieur à 0');
      return;
    }

    if (placesDisponibles <= 0 || placesDisponibles > 10) {
      setError('Le nombre de places doit être entre 1 et 10');
      return;
    }

    const selectedDate = new Date(dateDepart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError('La date de départ doit être aujourd\'hui ou dans le futur');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('trajets_interurbains')
        .insert({
          chauffeur_id: user.id,
          ville_depart: villeDepart.trim(),
          ville_arrivee: villeArrivee.trim(),
          date_depart: dateDepart,
          heure_depart: heureDepart,
          places_disponibles: placesDisponibles,
          places_reservees: 0,
          prix_par_place: parseInt(prixParPlace),
          statut: 'draft',
          description: description.trim() || null,
        });

      if (insertError) {
        console.error('Error creating ride (non-critical):', insertError);
        setError('Erreur lors de la création du trajet');
        setCreating(false);
        return;
      }

      setSuccess(true);

      setTimeout(() => {
        window.location.href = '/driver/intercity/my-rides';
      }, 2000);
    } catch (err) {
      console.error('Error creating ride (non-critical):', err);
      setError('Erreur lors de la création du trajet');
      setCreating(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!session || !user) {
    return null;
  }

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

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
          <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </button>
              <h1 className="text-xl font-bold text-slate-900">Créer un trajet</h1>
              <div className="w-9"></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-6 overflow-y-auto pb-24">
          <div className="max-w-md mx-auto space-y-4">
            {/* Success Message */}
            {success && (
              <div className="bg-green-500 text-white rounded-2xl p-4 shadow-lg flex items-center space-x-3 animate-fade-in">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Brouillon créé avec succès!</p>
                  <p className="text-sm text-green-100">Vous pourrez le publier depuis "Mes trajets"</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500 text-white rounded-2xl p-4 shadow-lg flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Erreur</p>
                  <p className="text-sm text-red-100">{error}</p>
                </div>
              </div>
            )}

            {/* Vehicle Info Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Bus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Véhicule</p>
                  <p className="font-semibold text-slate-900">{user.vehicule_modele || 'Non spécifié'}</p>
                </div>
              </div>
              {user.categorie_vehicule && (
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {user.categorie_vehicule}
                </span>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Route Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-bold text-slate-900 mb-4">Itinéraire</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Ville de départ
                    </label>
                    <input
                      type="text"
                      value={villeDepart}
                      onChange={(e) => setVilleDepart(e.target.value)}
                      placeholder="Ex: Dakar"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      disabled={creating || success}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Ville d'arrivée
                    </label>
                    <input
                      type="text"
                      value={villeArrivee}
                      onChange={(e) => setVilleArrivee(e.target.value)}
                      placeholder="Ex: Saint-Louis"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      disabled={creating || success}
                    />
                  </div>
                </div>
              </div>

              {/* Date & Time Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-bold text-slate-900 mb-4">Date et heure</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date de départ
                    </label>
                    <input
                      type="date"
                      value={dateDepart}
                      onChange={(e) => setDateDepart(e.target.value)}
                      min={getTodayDate()}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      disabled={creating || success}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Heure de départ
                    </label>
                    <input
                      type="time"
                      value={heureDepart}
                      onChange={(e) => setHeureDepart(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      disabled={creating || success}
                    />
                  </div>
                </div>
              </div>

              {/* Seats & Price Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-bold text-slate-900 mb-4">Places et tarif</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Nombre de places disponibles
                    </label>
                    <input
                      type="number"
                      value={placesDisponibles}
                      onChange={(e) => setPlacesDisponibles(parseInt(e.target.value))}
                      min="1"
                      max="10"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      disabled={creating || success}
                    />
                    <p className="text-xs text-slate-600 mt-1">Maximum 10 places</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Prix par place (CFA)
                    </label>
                    <input
                      type="number"
                      value={prixParPlace}
                      onChange={(e) => setPrixParPlace(e.target.value)}
                      placeholder="Ex: 3000"
                      min="0"
                      step="1"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                      disabled={creating || success}
                    />
                  </div>

                  {prixParPlace && placesDisponibles && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-sm text-slate-600">Revenu potentiel total</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPrice(parseInt(prixParPlace || '0') * placesDisponibles)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="font-bold text-slate-900 mb-4">Description (optionnel)</h3>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ajoutez des informations supplémentaires: points de rencontre, arrêts, etc."
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  disabled={creating || success}
                  maxLength={500}
                />
                <p className="text-xs text-slate-600 mt-1">{description.length}/500 caractères</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={creating || success}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Création en cours...' : success ? 'Brouillon créé!' : 'Créer le brouillon'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
