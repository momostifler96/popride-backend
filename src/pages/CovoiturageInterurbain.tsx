import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { formatPrice } from '../utils/currency';
import {
  Loader,
  AlertCircle,
  CheckCircle,
  MapPin,
  Calendar,
  Clock,
  Users,
  Euro,
  AlertTriangle,
  Trash2,
  Ban,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  ArrowRight,
  Settings,
} from 'lucide-react';

interface FeeConfiguration {
  percentage_fee: number;
  fixed_fee: number;
}

interface Chauffeur {
  nom: string;
  telephone: string;
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
  created_at: string;
  chauffeur?: Chauffeur;
}

interface Signalement {
  id: string;
  auteur_nom: string;
  auteur_telephone: string;
  motif: string;
  description: string | null;
  statut: string;
  created_at: string;
}

const STATUTS = [
  { value: 'all', label: 'Tous', color: '', icon: null },
  { value: 'actif', label: 'Actif', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  { value: 'suspendu', label: 'Suspendu', color: 'bg-orange-100 text-orange-800', icon: Ban },
  { value: 'termine', label: 'Terminé', color: 'bg-slate-100 text-slate-800', icon: CheckCircle },
  { value: 'annule', label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
];

export default function CovoiturageInterurbain() {
  const [trajets, setTrajets] = useState<TrajetInterurbain[]>([]);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [selectedTrajet, setSelectedTrajet] = useState<string | null>(null);
  const [showSignalements, setShowSignalements] = useState(false);
  const [feeConfig, setFeeConfig] = useState<FeeConfiguration>({ percentage_fee: 10, fixed_fee: 500 });

  useEffect(() => {
    fetchFeeConfiguration();
    fetchTrajets();
    const interval = setInterval(fetchTrajets, 10000);
    return () => clearInterval(interval);
  }, [filterStatut]);

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

  const fetchTrajets = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('trajets_interurbains')
        .select(`
          *,
          chauffeur:chauffeurs(nom, telephone)
        `)
        .order('date_depart', { ascending: true })
        .order('heure_depart', { ascending: true });

      if (filterStatut !== 'all') {
        query = query.eq('statut', filterStatut);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setTrajets(data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des trajets');
    } finally {
      setLoading(false);
    }
  };

  const fetchSignalements = async (trajetId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('signalements')
        .select('*')
        .eq('type_entite', 'trajet')
        .eq('entite_id', trajetId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setSignalements(data || []);
      setSelectedTrajet(trajetId);
      setShowSignalements(true);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des signalements');
    }
  };

  const suspendreTrajet = async (trajetId: string, currentStatut: string) => {
    const newStatut = currentStatut === 'suspendu' ? 'actif' : 'suspendu';
    try {
      const { error: updateError } = await supabase
        .from('trajets_interurbains')
        .update({
          statut: newStatut,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trajetId);

      if (updateError) throw updateError;

      setSuccess(
        newStatut === 'suspendu'
          ? 'Trajet suspendu avec succès'
          : 'Trajet réactivé avec succès'
      );
      setTimeout(() => setSuccess(''), 3000);
      fetchTrajets();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suspension du trajet');
    }
  };

  const supprimerTrajet = async (trajetId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce trajet ? Cette action est irréversible.')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('trajets_interurbains')
        .delete()
        .eq('id', trajetId);

      if (deleteError) throw deleteError;

      setSuccess('Trajet supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
      fetchTrajets();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression du trajet');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const getStatutInfo = (statut: string) => {
    return STATUTS.find((s) => s.value === statut) || STATUTS[0];
  };

  const calculatePercentageFee = (basePrice: number): number => {
    return Math.round(basePrice * feeConfig.percentage_fee / 100);
  };

  const calculateTotalPrice = (basePrice: number): number => {
    return basePrice + feeConfig.fixed_fee + calculatePercentageFee(basePrice);
  };

  if (loading) {
    return (
      <div>
        <Header
          title="Trajets interurbains"
          description="Supervision des trajets entre villes"
        />
        <main className="p-8">
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Trajets interurbains"
        description="Supervision des trajets entre villes"
      />

      <main className="p-8">
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Fee Configuration Banner */}
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start space-x-3">
            <Settings className="w-6 h-6 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Configuration des frais Pop Drive</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Frais fixe</p>
                  <p className="text-lg font-bold text-slate-900">{formatPrice(feeConfig.fixed_fee)} CFA</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Frais variable</p>
                  <p className="text-lg font-bold text-slate-900">{feeConfig.percentage_fee}%</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-slate-600 mb-1">Exemple (10 000 CFA)</p>
                  <p className="text-lg font-bold text-emerald-600">{formatPrice(calculateTotalPrice(10000))} CFA</p>
                  <p className="text-xs text-slate-500">Total client</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-slate-600">
                {trajets.length} trajet{trajets.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUTS.map((statut) => (
                <button
                  key={statut.value}
                  onClick={() => setFilterStatut(statut.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filterStatut === statut.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {statut.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {trajets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600 text-lg mb-2">Aucun trajet trouvé</p>
            <p className="text-slate-500 text-sm">
              Les trajets proposés par les chauffeurs apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {trajets.map((trajet) => {
              const statutInfo = getStatutInfo(trajet.statut);
              const StatutIcon = statutInfo.icon;
              const placesRestantes = trajet.places_disponibles - trajet.places_reservees;

              return (
                <div
                  key={trajet.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-5 h-5 text-blue-600" />
                              <h3 className="text-lg font-semibold text-slate-900">
                                {trajet.ville_depart}
                              </h3>
                              <ArrowRight className="w-5 h-5 text-slate-400" />
                              <h3 className="text-lg font-semibold text-slate-900">
                                {trajet.ville_arrivee}
                              </h3>
                            </div>
                            {StatutIcon && (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${statutInfo.color}`}
                              >
                                <div className="flex items-center space-x-1">
                                  <StatutIcon className="w-3 h-3" />
                                  <span>{statutInfo.label}</span>
                                </div>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(trajet.date_depart)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatTime(trajet.heure_depart)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Chauffeur</p>
                          <p className="text-sm font-medium text-slate-900">
                            {trajet.chauffeur?.nom}
                          </p>
                          <p className="text-xs text-slate-600">
                            {trajet.chauffeur?.telephone}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Places</p>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">
                              {placesRestantes} / {trajet.places_disponibles}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            {trajet.places_reservees} réservée{trajet.places_reservees !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Prix chauffeur</p>
                          <div className="flex items-center space-x-2">
                            <Euro className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-semibold text-slate-900">
                              {formatPrice(trajet.prix_par_place)} CFA
                            </span>
                          </div>
                          <p className="text-xs text-emerald-600 font-medium mt-1">
                            Client: {formatPrice(calculateTotalPrice(trajet.prix_par_place))} CFA
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Publié le</p>
                          <p className="text-xs text-slate-600">
                            {new Date(trajet.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      {trajet.description && (
                        <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                          {trajet.description}
                        </div>
                      )}
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => fetchSignalements(trajet.id)}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Signalements</span>
                      </button>

                      {trajet.statut !== 'termine' && trajet.statut !== 'annule' && (
                        <>
                          <button
                            onClick={() => suspendreTrajet(trajet.id, trajet.statut)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-2 ${
                              trajet.statut === 'suspendu'
                                ? 'bg-green-50 hover:bg-green-100 text-green-600'
                                : 'bg-orange-50 hover:bg-orange-100 text-orange-600'
                            }`}
                          >
                            <Ban className="w-4 h-4" />
                            <span>
                              {trajet.statut === 'suspendu' ? 'Réactiver' : 'Suspendre'}
                            </span>
                          </button>

                          <button
                            onClick={() => supprimerTrajet(trajet.id)}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Supprimer</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showSignalements && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span>Signalements du trajet</span>
                </h3>
                <button
                  onClick={() => {
                    setShowSignalements(false);
                    setSelectedTrajet(null);
                    setSignalements([]);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {signalements.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-slate-600 text-lg mb-2">Aucun signalement</p>
                    <p className="text-slate-500 text-sm">
                      Ce trajet n'a reçu aucun signalement
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {signalements.map((signalement) => (
                      <div
                        key={signalement.id}
                        className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {signalement.auteur_nom}
                            </p>
                            <p className="text-sm text-slate-600">
                              {signalement.auteur_telephone}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              signalement.statut === 'nouveau'
                                ? 'bg-yellow-100 text-yellow-800'
                                : signalement.statut === 'en_cours'
                                ? 'bg-blue-100 text-blue-800'
                                : signalement.statut === 'traite'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {signalement.statut === 'nouveau' && 'Nouveau'}
                            {signalement.statut === 'en_cours' && 'En cours'}
                            {signalement.statut === 'traite' && 'Traité'}
                            {signalement.statut === 'rejete' && 'Rejeté'}
                          </span>
                        </div>

                        <div className="mb-2">
                          <p className="text-sm font-medium text-slate-700 mb-1">Motif :</p>
                          <p className="text-sm text-slate-900">{signalement.motif}</p>
                        </div>

                        {signalement.description && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-slate-700 mb-1">
                              Description :
                            </p>
                            <p className="text-sm text-slate-600">{signalement.description}</p>
                          </div>
                        )}

                        <p className="text-xs text-slate-500 mt-3">
                          Signalé le {new Date(signalement.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
