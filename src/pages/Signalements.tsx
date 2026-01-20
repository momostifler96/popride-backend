import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import {
  Loader,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  User,
  Phone,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';

interface Signalement {
  id: string;
  type_entite: string;
  entite_id: string;
  auteur_nom: string;
  auteur_telephone: string;
  motif: string;
  description: string | null;
  statut: string;
  created_at: string;
  updated_at: string;
  traite_par: string | null;
  note_traitement: string | null;
}

const STATUTS = [
  { value: 'all', label: 'Tous', color: '', icon: null },
  { value: 'nouveau', label: 'Nouveau', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
  { value: 'en_cours', label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Eye },
  { value: 'traite', label: 'Traité', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  { value: 'rejete', label: 'Rejeté', color: 'bg-red-100 text-red-800', icon: XCircle },
];

const TYPE_ENTITES = [
  { value: 'all', label: 'Tous les types' },
  { value: 'chauffeur', label: 'Chauffeur' },
  { value: 'trajet', label: 'Trajet' },
  { value: 'course', label: 'Course' },
];

export default function Signalements() {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchSignalements();
    const interval = setInterval(fetchSignalements, 10000);
    return () => clearInterval(interval);
  }, [filterStatut, filterType]);

  const fetchSignalements = async () => {
    try {
      setLoading(true);
      let query = supabase.from('signalements').select('*').order('created_at', { ascending: false });

      if (filterStatut !== 'all') {
        query = query.eq('statut', filterStatut);
      }

      if (filterType !== 'all') {
        query = query.eq('type_entite', filterType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setSignalements(data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des signalements');
    } finally {
      setLoading(false);
    }
  };

  const updateStatut = async (signalementId: string, newStatut: string) => {
    try {
      const { error: updateError } = await supabase
        .from('signalements')
        .update({
          statut: newStatut,
          updated_at: new Date().toISOString(),
        })
        .eq('id', signalementId);

      if (updateError) throw updateError;

      setSuccess('Statut mis à jour avec succès');
      setTimeout(() => setSuccess(''), 3000);
      fetchSignalements();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatutInfo = (statut: string) => {
    return STATUTS.find((s) => s.value === statut) || STATUTS[0];
  };

  const getTypeLabel = (type: string) => {
    return TYPE_ENTITES.find((t) => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div>
        <Header title="Signalements" description="Gestion des signalements et réclamations" />
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
      <Header title="Signalements" description="Gestion des signalements et réclamations" />

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
              {signalements.length} signalement{signalements.length !== 1 ? 's' : ''}
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
              <span className="text-sm font-medium text-slate-700 flex items-center mr-2">Type:</span>
              {TYPE_ENTITES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filterType === type.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {signalements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-slate-600 text-lg mb-2">Aucun signalement</p>
            <p className="text-slate-500 text-sm">Les signalements apparaîtront ici</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {signalements.map((signalement) => {
              const statutInfo = getStatutInfo(signalement.statut);
              const StatutIcon = statutInfo.icon;

              return (
                <div
                  key={signalement.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                            <h3 className="text-lg font-semibold text-slate-900">
                              {signalement.motif}
                            </h3>
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
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                signalement.type_entite === 'chauffeur'
                                  ? 'bg-blue-100 text-blue-800'
                                  : signalement.type_entite === 'trajet'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {getTypeLabel(signalement.type_entite)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Signalé par</p>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">
                              {signalement.auteur_nom}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-600">
                              {signalement.auteur_telephone}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Date</p>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-900">
                              {formatDate(signalement.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {signalement.description && (
                        <div>
                          <p className="text-xs text-slate-500 mb-2 flex items-center space-x-1">
                            <FileText className="w-3 h-3" />
                            <span>Description</span>
                          </p>
                          <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                            {signalement.description}
                          </div>
                        </div>
                      )}

                      {signalement.note_traitement && (
                        <div>
                          <p className="text-xs text-slate-500 mb-2 flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Note de traitement</span>
                          </p>
                          <div className="text-sm text-slate-600 bg-green-50 rounded-lg p-3 border border-green-200">
                            {signalement.note_traitement}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      {signalement.statut === 'nouveau' && (
                        <>
                          <button
                            onClick={() => updateStatut(signalement.id, 'en_cours')}
                            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                          >
                            En cours
                          </button>
                          <button
                            onClick={() => updateStatut(signalement.id, 'traite')}
                            className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                          >
                            Traité
                          </button>
                          <button
                            onClick={() => updateStatut(signalement.id, 'rejete')}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                          >
                            Rejeter
                          </button>
                        </>
                      )}

                      {signalement.statut === 'en_cours' && (
                        <>
                          <button
                            onClick={() => updateStatut(signalement.id, 'traite')}
                            className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                          >
                            Traité
                          </button>
                          <button
                            onClick={() => updateStatut(signalement.id, 'rejete')}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                          >
                            Rejeter
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
      </main>
    </div>
  );
}
