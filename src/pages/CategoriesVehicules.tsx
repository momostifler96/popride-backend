import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { Car, Save, X, Loader, AlertCircle, CheckCircle } from 'lucide-react';

interface CategorieVehicule {
  id: string;
  nom: string;
  capacite: number;
  description?: string;
  prix_base?: number;
  statut: 'active' | 'inactive';
  created_at?: string;
}

export default function CategoriesVehicules() {
  const [categories, setCategories] = useState<CategorieVehicule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    capacite: '',
    description: '',
    prix_base: '',
    statut: 'active' as 'active' | 'inactive',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories_vehicules')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (categorie: CategorieVehicule) => {
    setEditingId(categorie.id);
    setEditForm({
      capacite: categorie.capacite.toString(),
      description: categorie.description || '',
      prix_base: categorie.prix_base?.toString() || '',
      statut: categorie.statut,
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({
      capacite: '',
      description: '',
      prix_base: '',
      statut: 'active',
    });
  };

  const handleEditSave = async (categorieId: string) => {
    const capacite = parseInt(editForm.capacite);
    const prixBase = editForm.prix_base ? parseFloat(editForm.prix_base) : null;

    if (isNaN(capacite) || capacite < 1) {
      setError('La capacité doit être un nombre positif');
      return;
    }

    if (editForm.prix_base && (isNaN(prixBase!) || prixBase! < 0)) {
      setError('Le prix doit être un nombre positif');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const updateData: any = {
        capacite,
        description: editForm.description,
        statut: editForm.statut,
        updated_at: new Date().toISOString(),
      };

      if (prixBase !== null) {
        updateData.prix_base = prixBase;
      }

      const { error: updateError } = await supabase
        .from('categories_vehicules')
        .update(updateData)
        .eq('id', categorieId);

      if (updateError) throw updateError;

      setSuccess('Catégorie modifiée avec succès');
      setTimeout(() => setSuccess(''), 3000);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la modification');
    } finally {
      setSaving(false);
    }
  };

  const getCategorieIcon = (nom: string) => {
    switch (nom) {
      case 'ECO':
        return '🚗';
      case 'CONFORT':
        return '🚙';
      case 'CONFORT+':
        return '🚐';
      default:
        return '🚗';
    }
  };

  const getCategorieColor = (nom: string) => {
    switch (nom) {
      case 'ECO':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'CONFORT':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CONFORT+':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div>
        <Header
          title="Catégories de véhicules"
          description="Gestion des catégories de véhicules"
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
        title="Catégories de véhicules"
        description="Gérer les catégories de véhicules et leurs caractéristiques"
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

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Information importante</p>
            <p>Les catégories de véhicules sont fixes et ne peuvent pas être supprimées. Vous pouvez uniquement modifier leurs caractéristiques et leur statut.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((categorie) => (
            <div
              key={categorie.id}
              className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 ${
                editingId === categorie.id
                  ? 'border-blue-300 shadow-md'
                  : 'border-slate-200'
              }`}
            >
              <div className="p-6">
                {editingId === categorie.id ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{getCategorieIcon(categorie.nom)}</div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {categorie.nom}
                        </h3>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Capacité (passagers)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.capacite}
                        onChange={(e) =>
                          setEditForm({ ...editForm, capacite: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({ ...editForm, description: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Prix de base (par km)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editForm.prix_base}
                        onChange={(e) =>
                          setEditForm({ ...editForm, prix_base: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Statut
                      </label>
                      <div className="flex space-x-3">
                        <button
                          onClick={() =>
                            setEditForm({ ...editForm, statut: 'active' })
                          }
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                            editForm.statut === 'active'
                              ? 'bg-green-50 border-green-500 text-green-700'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          Active
                        </button>
                        <button
                          onClick={() =>
                            setEditForm({ ...editForm, statut: 'inactive' })
                          }
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                            editForm.statut === 'inactive'
                              ? 'bg-slate-50 border-slate-500 text-slate-700'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          Inactive
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <button
                        onClick={handleEditCancel}
                        className="flex items-center space-x-1 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-sm font-medium">Annuler</span>
                      </button>
                      <button
                        onClick={() => handleEditSave(categorie.id)}
                        disabled={saving}
                        className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span className="text-sm font-medium">Enregistrer</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-3xl">{getCategorieIcon(categorie.nom)}</div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {categorie.nom}
                        </h3>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          categorie.statut === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {categorie.statut === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between py-3 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Capacité</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {categorie.capacite} passagers
                        </span>
                      </div>

                      {categorie.prix_base && (
                        <div className="flex items-center justify-between py-3 border-b border-slate-100">
                          <span className="text-sm text-slate-600">Prix de base</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {categorie.prix_base.toFixed(2)} € / km
                          </span>
                        </div>
                      )}

                      {categorie.description && (
                        <div className="pt-2">
                          <p className="text-sm text-slate-600 leading-relaxed">
                            {categorie.description}
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleEditStart(categorie)}
                      className="w-full px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      Modifier
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Aucune catégorie disponible</p>
            <p className="text-sm text-slate-500 mt-1">
              Les catégories seront créées automatiquement
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
