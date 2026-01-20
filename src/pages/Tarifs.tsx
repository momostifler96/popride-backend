import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { Plus, Loader, AlertCircle, CheckCircle, Edit2, Trash2, X, Save } from 'lucide-react';
import { formatPrice } from '../utils/currency';

interface Ligne {
  id: string;
  nom: string;
  numero: string;
  statut: string;
}

interface Arret {
  id: string;
  nom: string;
  ordre: number;
}

interface Tarif {
  id: string;
  ligne_id: string;
  arret_depart_id: string;
  arret_arrivee_id: string;
  prix_eco: number;
  prix_confort: number;
  prix_confort_plus: number;
  ligne?: { nom: string; numero: string };
  arret_depart?: { nom: string };
  arret_arrivee?: { nom: string };
}

export default function Tarifs() {
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [arrets, setArrets] = useState<Arret[]>([]);
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    ligne_id: '',
    arret_depart_id: '',
    arret_arrivee_id: '',
    prix_eco: '',
    prix_confort: '',
    prix_confort_plus: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lignesRes, tarifsRes] = await Promise.all([
        supabase
          .from('lignes_urbaines')
          .select('id, nom, numero, statut')
          .eq('statut', 'active')
          .order('numero', { ascending: true }),
        supabase
          .from('tarifs_urbains')
          .select(`
            *,
            ligne:lignes_urbaines(nom, numero),
            arret_depart:arrets_urbains!tarifs_urbains_arret_depart_id_fkey(nom),
            arret_arrivee:arrets_urbains!tarifs_urbains_arret_arrivee_id_fkey(nom)
          `)
          .order('created_at', { ascending: false }),
      ]);

      if (lignesRes.error) throw lignesRes.error;
      if (tarifsRes.error) throw tarifsRes.error;

      setLignes(lignesRes.data || []);
      setTarifs(tarifsRes.data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchArrets = async (ligneId: string) => {
    try {
      const { data, error } = await supabase
        .from('arrets_urbains')
        .select('id, nom, ordre')
        .eq('ligne_id', ligneId)
        .order('ordre', { ascending: true });

      if (error) throw error;
      setArrets(data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des arrêts');
    }
  };

  const handleLigneChange = (ligneId: string) => {
    setFormData({
      ...formData,
      ligne_id: ligneId,
      arret_depart_id: '',
      arret_arrivee_id: '',
    });
    if (ligneId) {
      fetchArrets(ligneId);
    } else {
      setArrets([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.ligne_id || !formData.arret_depart_id || !formData.arret_arrivee_id) {
      setError('Veuillez sélectionner une ligne et des arrêts');
      return;
    }

    if (formData.arret_depart_id === formData.arret_arrivee_id) {
      setError('Les arrêts de départ et d\'arrivée doivent être différents');
      return;
    }

    const prixEco = parseInt(formData.prix_eco, 10);
    const prixConfort = parseInt(formData.prix_confort, 10);
    const prixConfortPlus = parseInt(formData.prix_confort_plus, 10);

    if (isNaN(prixEco) || prixEco < 0 || isNaN(prixConfort) || prixConfort < 0 || isNaN(prixConfortPlus) || prixConfortPlus < 0) {
      setError('Les prix doivent être des nombres entiers positifs');
      return;
    }

    try {
      setSaving(true);

      const tarifData = {
        ligne_id: formData.ligne_id,
        arret_depart_id: formData.arret_depart_id,
        arret_arrivee_id: formData.arret_arrivee_id,
        prix_eco: prixEco,
        prix_confort: prixConfort,
        prix_confort_plus: prixConfortPlus,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from('tarifs_urbains')
          .update(tarifData)
          .eq('id', editingId);

        if (updateError) throw updateError;
        setSuccess('Tarif modifié avec succès');
      } else {
        const { error: insertError } = await supabase
          .from('tarifs_urbains')
          .insert(tarifData);

        if (insertError) {
          if (insertError.code === '23505') {
            setError('Un tarif existe déjà pour ce trajet');
          } else {
            throw insertError;
          }
          return;
        }
        setSuccess('Tarif ajouté avec succès');
      }

      setTimeout(() => setSuccess(''), 3000);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tarif: Tarif) => {
    setEditingId(tarif.id);
    setFormData({
      ligne_id: tarif.ligne_id,
      arret_depart_id: tarif.arret_depart_id,
      arret_arrivee_id: tarif.arret_arrivee_id,
      prix_eco: tarif.prix_eco.toString(),
      prix_confort: tarif.prix_confort.toString(),
      prix_confort_plus: tarif.prix_confort_plus.toString(),
    });
    fetchArrets(tarif.ligne_id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tarif ?')) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('tarifs_urbains')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setSuccess('Tarif supprimé avec succès');
      setTimeout(() => setSuccess(''), 3000);
      fetchData();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setFormData({
      ligne_id: '',
      arret_depart_id: '',
      arret_arrivee_id: '',
      prix_eco: '',
      prix_confort: '',
      prix_confort_plus: '',
    });
    setArrets([]);
    setShowForm(false);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div>
        <Header
          title="Tarifs urbains"
          description="Gestion des tarifs de transport urbain"
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
        title="Tarifs urbains"
        description="Définir les prix fixes par trajet et catégorie de véhicule"
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

        <div className="mb-6 flex justify-between items-center">
          <div>
            <p className="text-slate-600">{tarifs.length} tarif{tarifs.length !== 1 ? 's' : ''} enregistré{tarifs.length !== 1 ? 's' : ''}</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Ajouter un tarif</span>
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Modifier le tarif' : 'Nouveau tarif'}
              </h3>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Ligne <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.ligne_id}
                    onChange={(e) => handleLigneChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Sélectionner une ligne</option>
                    {lignes.map((ligne) => (
                      <option key={ligne.id} value={ligne.id}>
                        Ligne {ligne.numero} - {ligne.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Arrêt de départ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.arret_depart_id}
                    onChange={(e) =>
                      setFormData({ ...formData, arret_depart_id: e.target.value })
                    }
                    required
                    disabled={!formData.ligne_id}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-slate-100"
                  >
                    <option value="">Sélectionner un arrêt</option>
                    {arrets.map((arret) => (
                      <option key={arret.id} value={arret.id}>
                        {arret.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Arrêt d'arrivée <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.arret_arrivee_id}
                    onChange={(e) =>
                      setFormData({ ...formData, arret_arrivee_id: e.target.value })
                    }
                    required
                    disabled={!formData.ligne_id}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-slate-100"
                  >
                    <option value="">Sélectionner un arrêt</option>
                    {arrets.map((arret) => (
                      <option key={arret.id} value={arret.id}>
                        {arret.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h4 className="text-sm font-semibold text-slate-700 mb-4">Prix par catégorie (CFA)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Prix ECO <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.prix_eco}
                      onChange={(e) =>
                        setFormData({ ...formData, prix_eco: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Prix CONFORT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.prix_confort}
                      onChange={(e) =>
                        setFormData({ ...formData, prix_confort: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Prix CONFORT+ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.prix_confort_plus}
                      onChange={(e) =>
                        setFormData({ ...formData, prix_confort_plus: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingId ? 'Modifier' : 'Enregistrer'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {tarifs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600 text-lg mb-2">Aucun tarif enregistré</p>
            <p className="text-slate-500 text-sm">Commencez par ajouter un nouveau tarif pour une ligne</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Ligne</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Départ</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Arrivée</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">ECO</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">CONFORT</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">CONFORT+</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tarifs.map((tarif) => (
                    <tr key={tarif.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-slate-900">
                          Ligne {tarif.ligne?.numero}
                        </span>
                        <p className="text-xs text-slate-500">{tarif.ligne?.nom}</p>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {tarif.arret_depart?.nom}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {tarif.arret_arrivee?.nom}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-900">
                        {formatPrice(tarif.prix_eco)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-900">
                        {formatPrice(tarif.prix_confort)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-900">
                        {formatPrice(tarif.prix_confort_plus)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(tarif)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tarif.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
