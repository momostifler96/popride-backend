import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { formatPrice } from '../utils/currency';
import {
  Plus,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Phone,
  User,
  MapPin,
  Euro,
  Car,
  ArrowRight,
} from 'lucide-react';

interface Ligne {
  id: string;
  nom: string;
  numero: string;
}

interface Arret {
  id: string;
  nom: string;
  ordre: number;
}

interface Chauffeur {
  id: string;
  nom: string;
  telephone: string;
}

interface Categorie {
  id: string;
  nom: string;
}

interface Course {
  id: string;
  ligne_id: string;
  arret_depart_id: string;
  arret_arrivee_id: string;
  chauffeur_id: string | null;
  categorie_id: string;
  client_nom: string;
  client_telephone: string;
  prix: number;
  statut: string;
  date_course: string;
  heure_depart: string | null;
  heure_prise_en_charge: string | null;
  heure_arrivee: string | null;
  notes: string | null;
  created_at: string;
  ligne?: { nom: string; numero: string };
  arret_depart?: { nom: string };
  arret_arrivee?: { nom: string };
  chauffeur?: { nom: string; telephone: string } | null;
  categorie?: { nom: string };
}

const STATUTS = [
  { value: 'en_attente', label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { value: 'en_cours', label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Play },
  { value: 'terminee', label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  { value: 'annulee', label: 'Annulée', color: 'bg-red-100 text-red-800', icon: XCircle },
];

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [arrets, setArrets] = useState<Arret[]>([]);
  const [chauffeurs, setChauffeurs] = useState<Chauffeur[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');

  const [formData, setFormData] = useState({
    ligne_id: '',
    arret_depart_id: '',
    arret_arrivee_id: '',
    chauffeur_id: '',
    categorie_id: '',
    client_nom: '',
    client_telephone: '',
    prix: '',
    date_course: new Date().toISOString().split('T')[0],
    heure_depart: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchCourses, 5000);
    return () => clearInterval(interval);
  }, [filterStatut]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [lignesRes, chauffeursRes, categoriesRes] = await Promise.all([
        supabase
          .from('lignes_urbaines')
          .select('id, nom, numero')
          .eq('statut', 'active')
          .order('numero', { ascending: true }),
        supabase.from('chauffeurs').select('id, nom, telephone').eq('valide', true),
        supabase.from('categories_vehicules').select('id, nom').eq('statut', 'active'),
      ]);

      if (lignesRes.error) throw lignesRes.error;
      if (chauffeursRes.error) throw chauffeursRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setLignes(lignesRes.data || []);
      setChauffeurs(chauffeursRes.data || []);
      setCategories(categoriesRes.data || []);

      await fetchCourses();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      let query = supabase
        .from('courses_urbaines')
        .select(`
          *,
          ligne:lignes_urbaines(nom, numero),
          arret_depart:arrets_urbains!courses_urbaines_arret_depart_id_fkey(nom),
          arret_arrivee:arrets_urbains!courses_urbaines_arret_arrivee_id_fkey(nom),
          chauffeur:chauffeurs(nom, telephone),
          categorie:categories_vehicules(nom)
        `)
        .order('created_at', { ascending: false });

      if (filterStatut !== 'all') {
        query = query.eq('statut', filterStatut);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setCourses(data || []);
    } catch (err) {
      console.error('Erreur:', err);
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

  const calculatePrix = async () => {
    if (!formData.ligne_id || !formData.arret_depart_id || !formData.arret_arrivee_id || !formData.categorie_id) {
      return;
    }

    try {
      const { data: tarif, error } = await supabase
        .from('tarifs_urbains')
        .select('prix_eco, prix_confort, prix_confort_plus')
        .eq('ligne_id', formData.ligne_id)
        .eq('arret_depart_id', formData.arret_depart_id)
        .eq('arret_arrivee_id', formData.arret_arrivee_id)
        .maybeSingle();

      if (error) throw error;

      if (tarif) {
        const categorie = categories.find((c) => c.id === formData.categorie_id);
        let prix = 0;

        if (categorie?.nom === 'ECO') {
          prix = tarif.prix_eco;
        } else if (categorie?.nom === 'CONFORT') {
          prix = tarif.prix_confort;
        } else if (categorie?.nom === 'CONFORT+') {
          prix = tarif.prix_confort_plus;
        }

        setFormData({ ...formData, prix: prix.toString() });
      }
    } catch (err) {
      console.error('Erreur calcul prix:', err);
    }
  };

  const handleLigneChange = (ligneId: string) => {
    setFormData({
      ...formData,
      ligne_id: ligneId,
      arret_depart_id: '',
      arret_arrivee_id: '',
      prix: '',
    });
    if (ligneId) {
      fetchArrets(ligneId);
    } else {
      setArrets([]);
    }
  };

  useEffect(() => {
    if (
      formData.ligne_id &&
      formData.arret_depart_id &&
      formData.arret_arrivee_id &&
      formData.categorie_id
    ) {
      calculatePrix();
    }
  }, [formData.ligne_id, formData.arret_depart_id, formData.arret_arrivee_id, formData.categorie_id]);

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

    const prix = parseInt(formData.prix);
    if (isNaN(prix) || prix < 0) {
      setError('Le prix doit être un nombre positif');
      return;
    }

    try {
      setSaving(true);

      const courseData = {
        ligne_id: formData.ligne_id,
        arret_depart_id: formData.arret_depart_id,
        arret_arrivee_id: formData.arret_arrivee_id,
        chauffeur_id: formData.chauffeur_id || null,
        categorie_id: formData.categorie_id,
        client_nom: formData.client_nom,
        client_telephone: formData.client_telephone,
        prix: prix,
        date_course: formData.date_course,
        heure_depart: formData.heure_depart || null,
        notes: formData.notes || null,
        statut: 'en_attente',
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from('courses_urbaines').insert(courseData);

      if (insertError) throw insertError;

      setSuccess('Course créée avec succès');
      setTimeout(() => setSuccess(''), 3000);
      resetForm();
      fetchCourses();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const updateStatut = async (courseId: string, newStatut: string) => {
    try {
      const updateData: any = {
        statut: newStatut,
        updated_at: new Date().toISOString(),
      };

      if (newStatut === 'en_cours' && !courses.find((c) => c.id === courseId)?.heure_prise_en_charge) {
        updateData.heure_prise_en_charge = new Date().toISOString();
      }

      if (newStatut === 'terminee' && !courses.find((c) => c.id === courseId)?.heure_arrivee) {
        updateData.heure_arrivee = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('courses_urbaines')
        .update(updateData)
        .eq('id', courseId);

      if (updateError) throw updateError;

      setSuccess('Statut mis à jour');
      setTimeout(() => setSuccess(''), 2000);
      fetchCourses();
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const resetForm = () => {
    setFormData({
      ligne_id: '',
      arret_depart_id: '',
      arret_arrivee_id: '',
      chauffeur_id: '',
      categorie_id: '',
      client_nom: '',
      client_telephone: '',
      prix: '',
      date_course: new Date().toISOString().split('T')[0],
      heure_depart: '',
      notes: '',
    });
    setArrets([]);
    setShowForm(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '-';
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return timeStr.substring(0, 5);
  };

  if (loading) {
    return (
      <div>
        <Header title="Courses urbaines" description="Supervision en temps réel" />
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
      <Header title="Courses urbaines" description="Supervision en temps réel" />

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

        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <p className="text-slate-600">{courses.length} course{courses.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex space-x-2">
              {[{ value: 'all', label: 'Toutes' }, ...STATUTS].map((statut) => (
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
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Nouvelle course</span>
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Nouvelle course</h3>
              <button
                onClick={resetForm}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.client_nom}
                    onChange={(e) => setFormData({ ...formData, client_nom: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Nom du client"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.client_telephone}
                    onChange={(e) => setFormData({ ...formData, client_telephone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="+225 XX XX XX XX XX"
                  />
                </div>
              </div>

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
                    <option value="">Sélectionner</option>
                    {lignes.map((ligne) => (
                      <option key={ligne.id} value={ligne.id}>
                        Ligne {ligne.numero} - {ligne.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Départ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.arret_depart_id}
                    onChange={(e) => setFormData({ ...formData, arret_depart_id: e.target.value })}
                    required
                    disabled={!formData.ligne_id}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-slate-100"
                  >
                    <option value="">Sélectionner</option>
                    {arrets.map((arret) => (
                      <option key={arret.id} value={arret.id}>
                        {arret.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Arrivée <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.arret_arrivee_id}
                    onChange={(e) => setFormData({ ...formData, arret_arrivee_id: e.target.value })}
                    required
                    disabled={!formData.ligne_id}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-slate-100"
                  >
                    <option value="">Sélectionner</option>
                    {arrets.map((arret) => (
                      <option key={arret.id} value={arret.id}>
                        {arret.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Catégorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.categorie_id}
                    onChange={(e) => setFormData({ ...formData, categorie_id: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Sélectionner</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Chauffeur
                  </label>
                  <select
                    value={formData.chauffeur_id}
                    onChange={(e) => setFormData({ ...formData, chauffeur_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Non assigné</option>
                    {chauffeurs.map((chauffeur) => (
                      <option key={chauffeur.id} value={chauffeur.id}>
                        {chauffeur.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date_course}
                    onChange={(e) => setFormData({ ...formData, date_course: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Heure</label>
                  <input
                    type="time"
                    value={formData.heure_depart}
                    onChange={(e) => setFormData({ ...formData, heure_depart: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Prix (CFA) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.prix}
                    onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Prix calculé automatiquement"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Notes optionnelles"
                  />
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
                  <span>Créer la course</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <p className="text-slate-600 text-lg mb-2">Aucune course enregistrée</p>
            <p className="text-slate-500 text-sm">Les courses apparaîtront ici en temps réel</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => {
              const statutInfo = STATUTS.find((s) => s.value === course.statut) || STATUTS[0];
              const StatutIcon = statutInfo.icon;

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              Ligne {course.ligne?.numero} - {course.ligne?.nom}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statutInfo.color}`}>
                              <div className="flex items-center space-x-1">
                                <StatutIcon className="w-3 h-3" />
                                <span>{statutInfo.label}</span>
                              </div>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4" />
                            <span>{course.arret_depart?.nom}</span>
                            <ArrowRight className="w-4 h-4" />
                            <span>{course.arret_arrivee?.nom}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Client</p>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">{course.client_nom}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="text-xs text-slate-600">{course.client_telephone}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Chauffeur</p>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">
                              {course.chauffeur?.nom || 'Non assigné'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Catégorie</p>
                          <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">{course.categorie?.nom}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500 mb-1">Prix</p>
                          <div className="flex items-center space-x-2">
                            <Euro className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-semibold text-slate-900">
                              {formatPrice(course.prix)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-xs text-slate-500">
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(course.date_course)}
                        </div>
                        {course.heure_depart && (
                          <div>
                            <span className="font-medium">Départ prévu:</span> {formatTime(course.heure_depart)}
                          </div>
                        )}
                        {course.heure_prise_en_charge && (
                          <div>
                            <span className="font-medium">Prise en charge:</span>{' '}
                            {formatTime(course.heure_prise_en_charge)}
                          </div>
                        )}
                        {course.heure_arrivee && (
                          <div>
                            <span className="font-medium">Arrivée:</span> {formatTime(course.heure_arrivee)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      {course.statut === 'en_attente' && (
                        <button
                          onClick={() => updateStatut(course.id, 'en_cours')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          Démarrer
                        </button>
                      )}
                      {course.statut === 'en_cours' && (
                        <button
                          onClick={() => updateStatut(course.id, 'terminee')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          Terminer
                        </button>
                      )}
                      {(course.statut === 'en_attente' || course.statut === 'en_cours') && (
                        <button
                          onClick={() => updateStatut(course.id, 'annulee')}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          Annuler
                        </button>
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
