import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import {
  Loader,
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  Mail,
  Car,
  MapPin,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  X,
  Calendar,
  Euro,
  TrendingUp,
} from 'lucide-react';

interface CategorieVehicule {
  nom: string;
  prix_km: number;
}

interface Chauffeur {
  id: string;
  nom: string;
  telephone: string;
  email: string;
  type_vehicule: string;
  categorie: string;
  climatisation: boolean;
  valide: boolean;
  statut: string;
  mode: string;
  created_at: string;
  categorie_id: string | null;
  categories_vehicules?: CategorieVehicule;
}

interface CourseUrbaine {
  id: string;
  date_course: string;
  montant: number;
  statut: string;
  clients?: { nom: string; telephone: string };
}

interface TrajetInterurbain {
  id: string;
  ville_depart: string;
  ville_arrivee: string;
  date_depart: string;
  prix_par_place: number;
  places_reservees: number;
  statut: string;
}

interface HistoriqueData {
  courses: CourseUrbaine[];
  trajets: TrajetInterurbain[];
  stats: {
    total_courses: number;
    total_trajets: number;
    revenus_estimes: number;
  };
}

const STATUTS = [
  { value: 'all', label: 'Tous', color: '', icon: null },
  { value: 'actif', label: 'Actif', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  { value: 'suspendu', label: 'Suspendu', color: 'bg-orange-100 text-orange-800', icon: Ban },
  { value: 'inactif', label: 'Inactif', color: 'bg-slate-100 text-slate-800', icon: XCircle },
];

const MODES = [
  { value: 'all', label: 'Tous les modes' },
  { value: 'urbain', label: 'Urbain', color: 'bg-blue-100 text-blue-800' },
  { value: 'interurbain', label: 'Interurbain', color: 'bg-purple-100 text-purple-800' },
  { value: 'mixte', label: 'Mixte', color: 'bg-teal-100 text-teal-800' },
];

export default function Chauffeurs() {
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [selectedChauffeur, setSelectedChauffeur] = useState<Chauffeur | null>(null);
  const [showHistorique, setShowHistorique] = useState(false);
  const [historiqueData, setHistoriqueData] = useState<HistoriqueData | null>(null);
  const [loadingHistorique, setLoadingHistorique] = useState(false);

  useEffect(() => {
    fetchChauffeurs();
    const interval = setInterval(fetchChauffeurs, 10000);
    return () => clearInterval(interval);
  }, [filterStatut, filterMode]);

  const fetchChauffeurs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('chauffeurs')
        .select(`
          *,
          categories_vehicules(nom, prix_km)
        `)
        .order('created_at', { ascending: false });

      if (filterStatut !== 'all') {
        query = query.eq('statut', filterStatut);
      }

      if (filterMode !== 'all') {
        query = query.eq('mode', filterMode);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setChauffeurs(data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des chauffeurs');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorique = async (chauffeur: Chauffeur) => {
    try {
      setLoadingHistorique(true);
      setSelectedChauffeur(chauffeur);
      setShowHistorique(true);

      const [coursesResult, trajetsResult] = await Promise.all([
        supabase
          .from('courses_urbaines')
          .select(`
            id,
            date_course,
            montant,
            statut,
            clients(nom, telephone)
          `)
          .eq('chauffeur_id', chauffeur.id)
          .order('date_course', { ascending: false })
          .limit(50),
        supabase
          .from('trajets_interurbains')
          .select('id, ville_depart, ville_arrivee, date_depart, prix_par_place, places_reservees, statut')
          .eq('chauffeur_id', chauffeur.id)
          .order('date_depart', { ascending: false })
          .limit(50),
      ]);

      const courses = coursesResult.data || [];
      const trajets = trajetsResult.data || [];

      const revenus_courses = courses
        .filter((c) => c.statut === 'termine')
        .reduce((sum, c) => sum + (c.montant || 0), 0);

      const revenus_trajets = trajets
        .filter((t) => t.statut === 'termine')
        .reduce((sum, t) => sum + t.prix_par_place * t.places_reservees, 0);

      setHistoriqueData({
        courses,
        trajets,
        stats: {
          total_courses: courses.length,
          total_trajets: trajets.length,
          revenus_estimes: revenus_courses + revenus_trajets,
        },
      });
    } catch (err) {
      console.error('Erreur:', err);
      setError("Erreur lors du chargement de l'historique");
    } finally {
      setLoadingHistorique(false);
    }
  };

  const toggleStatut = async (chauffeurId: string, currentStatut: string) => {
    const newStatut = currentStatut === 'suspendu' ? 'actif' : 'suspendu';
    try {
      const { error: updateError } = await supabase
        .from('chauffeurs')
        .update({ statut: newStatut })
        .eq('id', chauffeurId);

      if (updateError) throw updateError;

      setSuccess(
        newStatut === 'suspendu'
          ? 'Chauffeur suspendu avec succès'
          : 'Chauffeur réactivé avec succès'
      );
      setTimeout(() => setSuccess(''), 3000);
      fetchChauffeurs();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatutInfo = (statut: string) => {
    return STATUTS.find((s) => s.value === statut) || STATUTS[0];
  };

  const getModeInfo = (mode: string) => {
    return MODES.find((m) => m.value === mode) || MODES[1];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div>
        <Header title="Chauffeurs" description="Gestion des chauffeurs" />
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
      <Header title="Chauffeurs" description="Gestion des chauffeurs" />

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

        <div className="mb-6 flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <p className="text-slate-600">
              {chauffeurs.length} chauffeur{chauffeurs.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-slate-700 flex items-center mr-2">
                Statut:
              </span>
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

            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-slate-700 flex items-center mr-2">
                Mode:
              </span>
              {MODES.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setFilterMode(mode.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filterMode === mode.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {chauffeurs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600 text-lg mb-2">Aucun chauffeur trouvé</p>
            <p className="text-slate-500 text-sm">Les chauffeurs enregistrés apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {chauffeurs.map((chauffeur) => {
              const statutInfo = getStatutInfo(chauffeur.statut);
              const modeInfo = getModeInfo(chauffeur.mode);
              const StatutIcon = statutInfo.icon;

              return (
                <div
                  key={chauffeur.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <User className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-slate-900">{chauffeur.nom}</h3>
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
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${modeInfo.color}`}>
                              {modeInfo.label}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-slate-600">
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{chauffeur.telephone}</span>
                            </div>
                            {chauffeur.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="w-4 h-4" />
                                <span>{chauffeur.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Catégorie véhicule</p>
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">
                              {chauffeur.categories_vehicules?.nom || chauffeur.categorie || '-'}
                            </span>
                          </div>
                          {chauffeur.categories_vehicules?.prix_km && (
                            <p className="text-xs text-slate-600 mt-1">
                              {chauffeur.categories_vehicules.prix_km.toFixed(2)} €/km
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Type de véhicule</p>
                          <span className="text-sm text-slate-900">{chauffeur.type_vehicule}</span>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Options</p>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                chauffeur.climatisation
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {chauffeur.climatisation ? 'Climatisé' : 'Non climatisé'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Inscrit le</p>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-xs text-slate-600">
                              {formatDate(chauffeur.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <button
                        onClick={() => fetchHistorique(chauffeur)}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-2"
                      >
                        <History className="w-4 h-4" />
                        <span>Historique</span>
                      </button>

                      {chauffeur.statut !== 'inactif' && (
                        <button
                          onClick={() => toggleStatut(chauffeur.id, chauffeur.statut)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-2 ${
                            chauffeur.statut === 'suspendu'
                              ? 'bg-green-50 hover:bg-green-100 text-green-600'
                              : 'bg-orange-50 hover:bg-orange-100 text-orange-600'
                          }`}
                        >
                          <Ban className="w-4 h-4" />
                          <span>
                            {chauffeur.statut === 'suspendu' ? 'Réactiver' : 'Suspendre'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showHistorique && selectedChauffeur && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                  <History className="w-5 h-5 text-blue-600" />
                  <span>Historique de {selectedChauffeur.nom}</span>
                </h3>
                <button
                  onClick={() => {
                    setShowHistorique(false);
                    setSelectedChauffeur(null);
                    setHistoriqueData(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loadingHistorique ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : historiqueData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <p className="text-sm font-medium text-blue-900">Courses urbaines</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {historiqueData.stats.total_courses}
                        </p>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <Car className="w-5 h-5 text-purple-600" />
                          <p className="text-sm font-medium text-purple-900">Trajets interurbains</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-900">
                          {historiqueData.stats.total_trajets}
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <p className="text-sm font-medium text-green-900">Revenus estimés</p>
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                          {historiqueData.stats.revenus_estimes.toFixed(2)} €
                        </p>
                      </div>
                    </div>

                    {historiqueData.courses.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>Courses urbaines récentes</span>
                        </h4>
                        <div className="space-y-2">
                          {historiqueData.courses.slice(0, 10).map((course) => (
                            <div
                              key={course.id}
                              className="bg-slate-50 rounded-lg p-3 flex justify-between items-center"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span className="text-sm text-slate-900">
                                    {formatDate(course.date_course)}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      course.statut === 'termine'
                                        ? 'bg-green-100 text-green-800'
                                        : course.statut === 'annulee'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {course.statut}
                                  </span>
                                </div>
                                {course.clients && (
                                  <p className="text-xs text-slate-600">
                                    Client: {course.clients.nom}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <Euro className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-semibold text-slate-900">
                                  {course.montant.toFixed(2)} €
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {historiqueData.trajets.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center space-x-2">
                          <Car className="w-4 h-4 text-purple-600" />
                          <span>Trajets interurbains récents</span>
                        </h4>
                        <div className="space-y-2">
                          {historiqueData.trajets.slice(0, 10).map((trajet) => (
                            <div
                              key={trajet.id}
                              className="bg-slate-50 rounded-lg p-3 flex justify-between items-center"
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span className="text-sm font-medium text-slate-900">
                                    {trajet.ville_depart} → {trajet.ville_arrivee}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      trajet.statut === 'termine'
                                        ? 'bg-green-100 text-green-800'
                                        : trajet.statut === 'annule'
                                        ? 'bg-red-100 text-red-800'
                                        : trajet.statut === 'suspendu'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {trajet.statut}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600">
                                  {formatDate(trajet.date_depart)} • {trajet.places_reservees}{' '}
                                  place{trajet.places_reservees !== 1 ? 's' : ''} réservée
                                  {trajet.places_reservees !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Euro className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-semibold text-slate-900">
                                  {(trajet.prix_par_place * trajet.places_reservees).toFixed(2)} €
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {historiqueData.courses.length === 0 && historiqueData.trajets.length === 0 && (
                      <div className="text-center py-12">
                        <CheckCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600 text-lg mb-2">Aucun historique</p>
                        <p className="text-slate-500 text-sm">
                          Ce chauffeur n'a pas encore effectué de courses ou trajets
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
