import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import CreerLigneUrbaine from './CreerLigneUrbaine';
import GererArretsLigne from './GererArretsLigne';
import { Plus, Loader, MapPin, Circle } from 'lucide-react';

interface LigneUrbaine {
  id: string;
  nom: string;
  numero: string;
  description?: string;
  statut: 'brouillon' | 'active' | 'inactive';
  couleur?: string;
  prix?: number;
  created_at?: string;
  arrets_count?: number;
}

interface LignesUrbainesProps {
  view?: 'list' | 'create' | 'detail' | 'arrets';
  ligneId?: string;
  onNavigate?: (view: 'list' | 'create' | 'detail' | 'arrets', ligneId?: string) => void;
}

export default function LignesUrbaines({ view = 'list', ligneId, onNavigate }: LignesUrbainesProps) {
  const [lignes, setLignes] = useState<LigneUrbaine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (view === 'list') {
      fetchLignes();
    }
  }, [view]);

  const fetchLignes = async () => {
    try {
      setLoading(true);
      const { data: lignesData, error } = await supabase
        .from('lignes_urbaines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const lignesWithCounts = await Promise.all(
        (lignesData || []).map(async (ligne) => {
          const { count } = await supabase
            .from('arrets_urbains')
            .select('id', { count: 'exact', head: true })
            .eq('ligne_id', ligne.id);

          return {
            ...ligne,
            arrets_count: count || 0,
          };
        })
      );

      setLignes(lignesWithCounts);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onNavigate) {
      onNavigate('list');
      fetchLignes();
    }
  };

  const getStatutStyle = (statut: string) => {
    switch (statut) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-slate-100 text-slate-800';
      case 'brouillon':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'brouillon':
        return 'Brouillon';
      default:
        return statut;
    }
  };

  if (view === 'create') {
    return <CreerLigneUrbaine onBack={handleBack} />;
  }

  if (view === 'detail' && ligneId) {
    return (
      <CreerLigneUrbaine
        ligneId={ligneId}
        onBack={handleBack}
        onGererArrets={(id) => onNavigate?.('arrets', id)}
      />
    );
  }

  if (view === 'arrets' && ligneId) {
    return <GererArretsLigne ligneId={ligneId} onBack={handleBack} />;
  }

  return (
    <div>
      <Header
        title="Lignes urbaines"
        description="Gestion des lignes de transport urbain"
      />

      <main className="p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <p className="text-slate-600">
              {lignes.length} ligne{lignes.length !== 1 ? 's' : ''} enregistrée{lignes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => onNavigate?.('create')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Créer une ligne</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : lignes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-900 text-lg font-medium mb-2">Aucune ligne enregistrée</p>
            <p className="text-slate-500 text-sm mb-6">Commencez par créer une nouvelle ligne urbaine</p>
            <button
              onClick={() => onNavigate?.('create')}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Créer une ligne</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Ligne
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Arrêts
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Prix
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lignes.map((ligne) => (
                  <tr
                    key={ligne.id}
                    onClick={() => onNavigate?.('detail', ligne.id)}
                    className="hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: ligne.couleur || '#3B82F6' }}
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {ligne.numero || 'N/A'}
                            </span>
                            <Circle className="w-1 h-1 fill-slate-400 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">
                              {ligne.nom}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                      {ligne.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-900">
                          {ligne.arrets_count || 0}
                        </span>
                        <span className="text-sm text-slate-500">
                          arrêt{(ligne.arrets_count || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatutStyle(
                          ligne.statut
                        )}`}
                      >
                        {getStatutLabel(ligne.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {ligne.prix ? `${ligne.prix.toFixed(2)} €` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
