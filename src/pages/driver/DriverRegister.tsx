import { useState, FormEvent, ChangeEvent } from 'react';
import { UserPlus, Mail, Lock, User, Phone, Calendar, MapPin, CreditCard, Car, Camera, Upload, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Bus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  nom: string;
  telephone: string;
  dateNaissance: string;
  ville: string;
  numeroIdentite: string;
  profilePhoto: File | null;
  typeTrajet: string;
  categorieVehicule: string;
  vehiculeMarque: string;
  vehiculeModele: string;
  vehiculeAnnee: string;
  vehiculeCouleur: string;
  plaqueImmatriculation: string;
  nombrePlaces: string;
  vehiclePhoto: File | null;
}

export default function DriverRegister() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('');
  const [vehiclePhotoPreview, setVehiclePhotoPreview] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    nom: '',
    telephone: '',
    dateNaissance: '',
    ville: '',
    numeroIdentite: '',
    profilePhoto: null,
    typeTrajet: 'urbain',
    categorieVehicule: 'eco',
    vehiculeMarque: '',
    vehiculeModele: '',
    vehiculeAnnee: '',
    vehiculeCouleur: '',
    plaqueImmatriculation: '',
    nombrePlaces: '4',
    vehiclePhoto: null,
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleProfilePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5242880) {
        setError('La photo ne doit pas dépasser 5 MB');
        return;
      }
      setFormData(prev => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleVehiclePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5242880) {
        setError('La photo ne doit pas dépasser 5 MB');
        return;
      }
      setFormData(prev => ({ ...prev, vehiclePhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehiclePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const validateStep1 = (): boolean => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.nom || !formData.telephone || !formData.dateNaissance ||
        !formData.ville || !formData.numeroIdentite || !formData.profilePhoto) {
      setError('Veuillez remplir tous les champs et ajouter votre photo');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.vehiculeMarque || !formData.vehiculeModele || !formData.vehiculeAnnee ||
        !formData.vehiculeCouleur || !formData.plaqueImmatriculation || !formData.vehiclePhoto) {
      setError('Veuillez remplir tous les champs et ajouter la photo du véhicule');
      return false;
    }
    const year = parseInt(formData.vehiculeAnnee);
    if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) {
      setError('Année du véhicule invalide');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePreviousStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const uploadPhoto = async (file: File, bucket: string, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading photo:', err);
      return null;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        setError('Erreur lors de la création du compte');
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Erreur lors de la création du compte');
        setLoading(false);
        return;
      }

      const userId = authData.user.id;

      const profilePhotoUrl = await uploadPhoto(formData.profilePhoto!, 'driver-profile-photos', userId);
      if (!profilePhotoUrl) {
        setError('Erreur lors du téléchargement de la photo de profil');
        setLoading(false);
        return;
      }

      const vehiclePhotoUrl = await uploadPhoto(formData.vehiclePhoto!, 'vehicle-photos', userId);
      if (!vehiclePhotoUrl) {
        setError('Erreur lors du téléchargement de la photo du véhicule');
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('chauffeurs')
        .insert({
          user_id: userId,
          email: formData.email,
          nom: formData.nom,
          telephone: formData.telephone,
          date_naissance: formData.dateNaissance,
          ville: formData.ville,
          numero_identite: formData.numeroIdentite,
          photo_profil_url: profilePhotoUrl,
          type_covoiturage: formData.typeTrajet,
          categorie_vehicule: formData.categorieVehicule,
          vehicule_marque: formData.vehiculeMarque,
          vehicule_modele: formData.vehiculeModele,
          vehicule_annee: parseInt(formData.vehiculeAnnee),
          vehicule_couleur: formData.vehiculeCouleur,
          plaque_immatriculation: formData.plaqueImmatriculation,
          nombre_places: parseInt(formData.nombrePlaces),
          photo_vehicule_url: vehiclePhotoUrl,
          statut: 'en_attente',
          mode: formData.typeTrajet,
          est_en_ligne: false,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        setError('Erreur lors de l\'enregistrement du profil');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      setTimeout(() => {
        window.location.href = '/driver/login';
      }, 3000);
    } catch (err) {
      console.error('Registration error:', err);
      setError('Une erreur est survenue lors de l\'inscription');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Inscription réussie!</h2>
          <p className="text-slate-600 mb-2">Compte chauffeur soumis.</p>
          <p className="text-slate-600 font-semibold">En attente de validation.</p>
          <p className="text-sm text-slate-500 mt-4">Vous serez redirigé vers la page de connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-2xl mb-4">
            <Bus className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Devenir Chauffeur</h1>
          <p className="text-blue-200">Rejoignez POP RIDE</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            <div className={`flex-1 h-2 rounded-full mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            <div className={`flex-1 h-2 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Créer un compte</h2>
                  <p className="text-slate-600 mb-6">Étape 1: Informations de connexion</p>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="votre@email.com"
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-xl transform hover:-translate-y-0.5 text-white"
                >
                  <span>Suivant</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Informations personnelles</h2>
                  <p className="text-slate-600 mb-6">Étape 2: Votre profil</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Photo de profil <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    {profilePhotoPreview ? (
                      <img
                        src={profilePhotoPreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                        <Camera className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-colors text-center flex items-center justify-center space-x-2">
                        <Upload className="w-5 h-5" />
                        <span>Choisir une photo</span>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Format: JPG, PNG ou WebP. Taille max: 5 MB</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-slate-700 mb-2">
                      Nom complet
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        id="nom"
                        name="nom"
                        type="text"
                        value={formData.nom}
                        onChange={handleInputChange}
                        placeholder="Jean Dupont"
                        className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="telephone" className="block text-sm font-medium text-slate-700 mb-2">
                      Téléphone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        id="telephone"
                        name="telephone"
                        type="tel"
                        value={formData.telephone}
                        onChange={handleInputChange}
                        placeholder="+221 77 123 45 67"
                        className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="dateNaissance" className="block text-sm font-medium text-slate-700 mb-2">
                      Date de naissance
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        id="dateNaissance"
                        name="dateNaissance"
                        type="date"
                        value={formData.dateNaissance}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="ville" className="block text-sm font-medium text-slate-700 mb-2">
                      Ville / Adresse
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        id="ville"
                        name="ville"
                        type="text"
                        value={formData.ville}
                        onChange={handleInputChange}
                        placeholder="Dakar"
                        className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="numeroIdentite" className="block text-sm font-medium text-slate-700 mb-2">
                    Numéro de carte d'identité
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="numeroIdentite"
                      name="numeroIdentite"
                      type="text"
                      value={formData.numeroIdentite}
                      onChange={handleInputChange}
                      placeholder="1234567890123"
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="typeTrajet" className="block text-sm font-medium text-slate-700 mb-2">
                    Type de service
                  </label>
                  <select
                    id="typeTrajet"
                    name="typeTrajet"
                    value={formData.typeTrajet}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="urbain">Urbain</option>
                    <option value="interurbain">Interurbain</option>
                    <option value="les_deux">Les deux</option>
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex-1 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-2 bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-xl transform hover:-translate-y-0.5 text-white"
                  >
                    <span>Suivant</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Informations du véhicule</h2>
                  <p className="text-slate-600 mb-6">Étape 3: Votre véhicule</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Photo du véhicule <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-4">
                    {vehiclePhotoPreview ? (
                      <img
                        src={vehiclePhotoPreview}
                        alt="Preview"
                        className="w-32 h-24 rounded-xl object-cover border-4 border-blue-100"
                      />
                    ) : (
                      <div className="w-32 h-24 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                        <Car className="w-8 h-8 text-slate-400" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer">
                      <div className="px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-colors text-center flex items-center justify-center space-x-2">
                        <Upload className="w-5 h-5" />
                        <span>Choisir une photo</span>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleVehiclePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Format: JPG, PNG ou WebP. Taille max: 5 MB</p>
                </div>

                <div>
                  <label htmlFor="categorieVehicule" className="block text-sm font-medium text-slate-700 mb-2">
                    Catégorie du véhicule
                  </label>
                  <select
                    id="categorieVehicule"
                    name="categorieVehicule"
                    value={formData.categorieVehicule}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="eco">Éco</option>
                    <option value="confort">Confort</option>
                    <option value="confort_plus">Confort Plus</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vehiculeMarque" className="block text-sm font-medium text-slate-700 mb-2">
                      Marque
                    </label>
                    <input
                      id="vehiculeMarque"
                      name="vehiculeMarque"
                      type="text"
                      value={formData.vehiculeMarque}
                      onChange={handleInputChange}
                      placeholder="Toyota"
                      className="w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="vehiculeModele" className="block text-sm font-medium text-slate-700 mb-2">
                      Modèle
                    </label>
                    <input
                      id="vehiculeModele"
                      name="vehiculeModele"
                      type="text"
                      value={formData.vehiculeModele}
                      onChange={handleInputChange}
                      placeholder="Corolla"
                      className="w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vehiculeAnnee" className="block text-sm font-medium text-slate-700 mb-2">
                      Année
                    </label>
                    <input
                      id="vehiculeAnnee"
                      name="vehiculeAnnee"
                      type="number"
                      value={formData.vehiculeAnnee}
                      onChange={handleInputChange}
                      placeholder="2020"
                      min="1990"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="vehiculeCouleur" className="block text-sm font-medium text-slate-700 mb-2">
                      Couleur
                    </label>
                    <input
                      id="vehiculeCouleur"
                      name="vehiculeCouleur"
                      type="text"
                      value={formData.vehiculeCouleur}
                      onChange={handleInputChange}
                      placeholder="Blanc"
                      className="w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="plaqueImmatriculation" className="block text-sm font-medium text-slate-700 mb-2">
                      Plaque d'immatriculation
                    </label>
                    <input
                      id="plaqueImmatriculation"
                      name="plaqueImmatriculation"
                      type="text"
                      value={formData.plaqueImmatriculation}
                      onChange={handleInputChange}
                      placeholder="DK-1234-AB"
                      className="w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="nombrePlaces" className="block text-sm font-medium text-slate-700 mb-2">
                      Nombre de places disponibles
                    </label>
                    <input
                      id="nombrePlaces"
                      name="nombrePlaces"
                      type="number"
                      value={formData.nombrePlaces}
                      onChange={handleInputChange}
                      min="1"
                      max="8"
                      className="w-full px-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    disabled={loading}
                    className="flex-1 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-2 bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Retour</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-2 ${
                      loading
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-xl transform hover:-translate-y-0.5'
                    } text-white`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>Inscription...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>S'inscrire</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-blue-200">
            Vous avez déjà un compte?{' '}
            <a href="/driver/login" className="font-semibold text-white hover:underline">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
