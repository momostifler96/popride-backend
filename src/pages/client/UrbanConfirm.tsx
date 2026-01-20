import { useState, useEffect } from 'react';
import { MapPin, Bus, DollarSign, Clock, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { formatPrice } from '../../utils/currency';

interface RideDetails {
  ligne: { id: string; nom: string; numero: string };
  departStop: { id: string; nom: string };
  arrivalStop: { id: string; nom: string };
  category: { id: string; nom: string };
  price: number;
}

export default function UrbanConfirm() {
  const { user } = useClientAuth();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [rideDetails, setRideDetails] = useState<RideDetails | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRideDetails();
  }, []);

  const fetchRideDetails = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ligneId = params.get('ligne_id');
      const departId = params.get('depart_id');
      const arrivalId = params.get('arrival_id');
      const categoryId = params.get('category_id');

      if (!ligneId || !departId || !arrivalId || !categoryId) {
        setError('Paramètres manquants');
        setLoading(false);
        return;
      }

      const [ligneRes, departRes, arrivalRes, categoryRes, tarifRes] = await Promise.all([
        supabase.from('lignes_urbaines').select('id, nom, numero').eq('id', ligneId).maybeSingle(),
        supabase.from('arrets_urbains').select('id, nom').eq('id', departId).maybeSingle(),
        supabase.from('arrets_urbains').select('id, nom').eq('id', arrivalId).maybeSingle(),
        supabase.from('categories_vehicules').select('id, nom').eq('id', categoryId).maybeSingle(),
        supabase
          .from('tarifs_urbains')
          .select('prix_eco, prix_confort, prix_confort_plus')
          .eq('ligne_id', ligneId)
          .eq('arret_depart_id', departId)
          .eq('arret_arrivee_id', arrivalId)
          .maybeSingle(),
      ]);

      if (ligneRes.error || departRes.error || arrivalRes.error || categoryRes.error) {
        throw new Error('Erreur lors du chargement des données');
      }

      if (!ligneRes.data || !departRes.data || !arrivalRes.data || !categoryRes.data) {
        throw new Error('Données introuvables');
      }

      let price = 0;
      if (tarifRes.data) {
        const categoryName = categoryRes.data.nom.toLowerCase();
        if (categoryName.includes('eco')) {
          price = Number(tarifRes.data.prix_eco);
        } else if (categoryName.includes('confort+') || categoryName.includes('confort plus')) {
          price = Number(tarifRes.data.prix_confort_plus);
        } else if (categoryName.includes('confort')) {
          price = Number(tarifRes.data.prix_confort);
        }
      }

      setRideDetails({
        ligne: ligneRes.data,
        departStop: departRes.data,
        arrivalStop: arrivalRes.data,
        category: categoryRes.data,
        price,
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!rideDetails || !user) return;

    setConfirming(true);
    setError('');

    try {
      const params = new URLSearchParams(window.location.search);
      const ligneId = params.get('ligne_id');
      const departId = params.get('depart_id');
      const arrivalId = params.get('arrival_id');
      const categoryId = params.get('category_id');

      const { data: newCourse, error: insertError } = await supabase
        .from('courses_urbaines')
        .insert({
          ligne_id: ligneId,
          arret_depart_id: departId,
          arret_arrivee_id: arrivalId,
          categorie_id: categoryId,
          client_id: user.id,
          client_nom: user.user_metadata?.name ?? user.email ?? 'Client',
          client_telephone: user.phone ?? user.user_metadata?.phone ?? '',
          prix: rideDetails.price,
          statut: 'en_attente',
          date_course: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      window.history.pushState({}, '', `/client/urban/waiting?course_id=${newCourse.id}`);
      window.location.href = `/client/urban/waiting?course_id=${newCourse.id}`;
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la course');
      setConfirming(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (error && !rideDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!rideDetails) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Confirmer la course</h1>
              <p className="text-sm text-slate-600">Vérifiez les détails</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 pb-32">
        <div className="max-w-md mx-auto space-y-4">
          {/* Route Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Bus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Ligne {rideDetails.ligne.numero}
                </h2>
                <p className="text-sm text-slate-600">{rideDetails.ligne.nom}</p>
              </div>
            </div>

            {/* Route Details */}
            <div className="space-y-4">
              {/* Departure */}
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Départ</p>
                  <p className="font-semibold text-slate-900">{rideDetails.departStop.nom}</p>
                </div>
              </div>

              {/* Connection Line */}
              <div className="flex items-center space-x-3">
                <div className="w-4 flex justify-center">
                  <div className="w-0.5 h-8 bg-slate-300"></div>
                </div>
              </div>

              {/* Arrival */}
              <div className="flex items-start space-x-3">
                <div className="mt-1">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Arrivée</p>
                  <p className="font-semibold text-slate-900">{rideDetails.arrivalStop.nom}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4">
            {/* Category */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Bus className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Catégorie</p>
                  <p className="font-semibold text-slate-900">{rideDetails.category.nom}</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Prix fixe</p>
                  <p className="font-semibold text-slate-900">
                    {formatPrice(rideDetails.price)}
                  </p>
                </div>
              </div>
            </div>

            {/* Wait Time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Temps d'attente estimé</p>
                  <p className="font-semibold text-slate-900">3-5 minutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-900">
              Un chauffeur disponible sera assigné à votre course dès votre confirmation.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-2 ${
              confirming
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 hover:shadow-xl transform hover:-translate-y-0.5'
            } text-white`}
          >
            {confirming ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Confirmation en cours...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Confirmer la course</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
