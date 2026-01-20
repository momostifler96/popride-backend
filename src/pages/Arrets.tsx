import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { Plus, Loader } from 'lucide-react';

interface ArretUrbain {
  id: string;
  nom?: string;
  adresse?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
}

export default function Arrets() {
  const [arrets, setArrets] = useState<ArretUrbain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArrets();
  }, []);

  const fetchArrets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('arrets_urbains')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArrets(data || []);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header
        title="Arrêts urbains"
        description="Gestion des arrêts de transport urbain"
      />

      <main className="p-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <p className="text-slate-600">
              {arrets.length} arrêt{arrets.length !== 1 ? 's' : ''} enregistré{arrets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Ajouter un arrêt</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : arrets.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600 text-lg mb-2">Aucun arrêt enregistré</p>
            <p className="text-slate-500 text-sm">Commencez par ajouter un nouvel arrêt urbain</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Adresse
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Latitude
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Longitude
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {arrets.map((arret) => (
                  <tr key={arret.id} className="hover:bg-slate-50 transition-colors duration-150">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {arret.nom || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {arret.adresse || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {arret.latitude || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {arret.longitude || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button className="text-blue-600 hover:text-blue-700 font-medium">
                        Éditer
                      </button>
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
