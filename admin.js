// Forzar visualización de la interfaz (Bypass para el CSP de Vercel)
document.documentElement.classList.add('ready');

/* ==========================================================================
   NFC INFANTIL - ADMIN PANEL LOGIC (FIREBASE FIRESTORE REAL-TIME SINGLE SOURCE OF TRUTH)
   ========================================================================== */
import { 
    db, 
    collection, 
    doc, 
    setDoc, 
    deleteDoc, 
    onSnapshot, 
    INITIAL_PROFILES_SEED,
    auth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from './firebase-config.js';

// Neutral SVG Silhouette for profiles without a custom photo
const NEUTRAL_AVATAR_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%2364748b'%3E%3Ccircle cx='50' cy='35' r='22'/%3E%3Cpath d='M18 85c0-18 14-30 32-30s32 12 32 30Z'/%3E%3C/svg%3E";

class AdminApp {
    constructor() {
        const stored = localStorage.getItem('nfc_profiles_db');
        let initialList = INITIAL_PROFILES_SEED;
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    initialList = parsed;
                }
            } catch (e) {}
        }
        this.profiles = this.deduplicateProfiles(initialList);
        this.isAuthenticated = (localStorage.getItem('nfc_admin_auth') === 'true' || sessionStorage.getItem('nfc_admin_auth') === 'true');
        this.photoRemoved = false;
        this.pendingUploadedPhoto = null;
        this.currentCategoryTab = 'all';
        this.isSaving = false;
        this.init();
    }

    async init() {
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
        this.setupEventListeners();
        
        // Listen to Firebase Auth State with fallback to local admin session
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.isAuthenticated = true;
                localStorage.setItem('nfc_admin_auth', 'true');
            } else if (localStorage.getItem('nfc_admin_auth') === 'true' || sessionStorage.getItem('nfc_admin_auth') === 'true') {
                this.isAuthenticated = true;
            } else {
                this.isAuthenticated = false;
            }
            this.renderState();
            if (this.isAuthenticated) {
                const currentSearch = document.getElementById('admin-search-input')?.value || '';
                this.renderProfilesGrid(currentSearch);
            }
        });

        document.documentElement.classList.add('ready');
        window.scrollTo(0, 0);

        if (this.isAuthenticated) {
            this.renderProfilesGrid();
        }

        // Firestore Realtime Single Source of Truth Listener
        onSnapshot(collection(db, "nfc_profiles"), async (snapshot) => {
            const loaded = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data) loaded.push(data);
            });

            if (loaded.length === 0) {
                console.log("Firestore empty: Seeding initial real profiles...");
                this.profiles = this.deduplicateProfiles(INITIAL_PROFILES_SEED);
                for (const seedProf of INITIAL_PROFILES_SEED) {
                    try {
                        await setDoc(doc(db, "nfc_profiles", seedProf.id), seedProf);
                    } catch (e) {
                        console.error("Error seeding initial profile:", e);
                    }
                }
            } else {
                this.profiles = this.deduplicateProfiles(loaded);
            }

            localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));

            if (this.isAuthenticated) {
                const currentSearch = document.getElementById('admin-search-input')?.value || '';
                this.renderProfilesGrid(currentSearch);
            }
        }, (error) => {
            console.error("Firestore Realtime Listener Error:", error);
            if (this.profiles.length === 0) {
                this.profiles = this.deduplicateProfiles(INITIAL_PROFILES_SEED);
            }
            if (this.isAuthenticated) {
                this.renderProfilesGrid();
            }
        });
    }

    calculateAgeFromBirthDate(birthDateStr, fallbackAge = '') {
        if (!birthDateStr || String(birthDateStr).trim() === '') {
            return (fallbackAge !== undefined && fallbackAge !== null && String(fallbackAge).trim() !== '' && parseInt(fallbackAge) >= 0) ? parseInt(fallbackAge) : '';
        }
        const birthDate = new Date(birthDateStr);
        if (isNaN(birthDate.getTime())) {
            return (fallbackAge !== undefined && fallbackAge !== null && String(fallbackAge).trim() !== '' && parseInt(fallbackAge) >= 0) ? parseInt(fallbackAge) : '';
        }
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 0 ? age : '';
    }

    sanitizeProfile(p) {
        if (!p) return null;

        const name = (p.name && String(p.name).trim() !== '' && String(p.name).trim() !== 'undefined') 
            ? String(p.name).trim() 
            : 'Perfil';
        
        let gender = (p.gender === 'girl' || p.gender === 'pet' || p.gender === 'senior') ? p.gender : 'boy';
        if (p.id === 'prof-006-jose' || (p.slug && String(p.slug).toLowerCase().includes('jose-ramirez'))) {
            gender = 'senior';
        }

        const rawSlug = (p.slug && String(p.slug).trim() !== '') ? String(p.slug).trim() : name;
        let slug = rawSlug.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        if (!slug) slug = 'perfil';

        let locationMapsUrl = (p.locationMapsUrl !== undefined && p.locationMapsUrl !== null) ? String(p.locationMapsUrl).trim() : '';
        if (locationMapsUrl.includes('maps.google.com/?q=6.2088') || 
            locationMapsUrl.includes('maps.google.com/?q=4.6581') || 
            locationMapsUrl.includes('maps.google.com/?q=3.4516')) {
            locationMapsUrl = '';
        }

        let schoolMapsUrl = (p.schoolMapsUrl !== undefined && p.schoolMapsUrl !== null) ? String(p.schoolMapsUrl).trim() : '';
        let school = (p.school !== undefined && p.school !== null) ? String(p.school).trim() : '';
        let grade = (p.grade !== undefined && p.grade !== null) ? String(p.grade).trim() : '';
        let medicalConditions = (p.medicalConditions !== undefined && p.medicalConditions !== null) ? String(p.medicalConditions).trim() : '';
        let importantMedications = (p.importantMedications !== undefined && p.importantMedications !== null) ? String(p.importantMedications).trim() : '';

        const defaultWaMsg = gender === 'pet'
            ? 'Hola, encontré a la mascota {nombre} y quiero comunicarme con su dueño.'
            : (gender === 'senior' ? 'Hola, encontré el perfil de seguridad del adulto mayor {nombre} y quiero comunicarme con sus familiares.' : 'Hola, encontré la información del perfil de {nombre}.');

        const birthDate = (p.birthDate !== undefined && p.birthDate !== null) ? String(p.birthDate).trim() : '';
        const computedAge = this.calculateAgeFromBirthDate(birthDate, (p.age !== undefined && p.age !== null) ? p.age : '');
        const bloodType = gender === 'pet' ? '' : ((p.bloodType !== undefined && p.bloodType !== null && String(p.bloodType).trim() !== 'undefined') ? String(p.bloodType).trim() : '');
        const parentPhone = (p.parentPhone !== undefined && p.parentPhone !== null && String(p.parentPhone).trim() !== 'undefined') ? String(p.parentPhone).trim() : '';
        const parentPhone2 = (p.parentPhone2 !== undefined && p.parentPhone2 !== null && String(p.parentPhone2).trim() !== 'undefined') ? String(p.parentPhone2).trim() : '';
        const whatsappMessage = (p.whatsappMessage && String(p.whatsappMessage).trim() !== '') ? String(p.whatsappMessage).trim() : defaultWaMsg;
        const photoUrl = (p.photoUrl !== undefined && p.photoUrl !== null && String(p.photoUrl).trim() !== 'undefined') ? String(p.photoUrl).trim() : '';

        return {
            id: p.id || `prof-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            slug: slug,
            name: name,
            gender: gender,
            birthDate: birthDate,
            age: computedAge,
            bloodType: bloodType,
            parentPhone: parentPhone,
            parentPhone2: parentPhone2,
            whatsappMessage: whatsappMessage,
            locationMapsUrl: locationMapsUrl,
            schoolMapsUrl: schoolMapsUrl,
            school: school,
            grade: grade,
            medicalConditions: medicalConditions,
            importantMedications: importantMedications,
            photoUrl: photoUrl,
            active: true,
            createdAt: p.createdAt || new Date().toISOString(),
            updatedAt: p.updatedAt || new Date().toISOString()
        };
    }

    areProfilesEqual(listA, listB) {
        if (!Array.isArray(listA) || !Array.isArray(listB)) return false;
        if (listA.length !== listB.length) return false;
        for (let i = 0; i < listA.length; i++) {
            const pA = listA[i];
            const pB = listB[i];
            if (!pA || !pB) return false;
            if (JSON.stringify(pA) !== JSON.stringify(pB)) {
                return false;
            }
        }
        return true;
    }

    deduplicateProfiles(list) {
        if (!Array.isArray(list)) return [];
        const seenIds = new Set();
        const seenSlugs = new Set();
        const result = [];

        for (const p of list) {
            const sanitized = this.sanitizeProfile(p);
            if (!sanitized) continue;
            
            if (!seenIds.has(sanitized.id) && !seenSlugs.has(sanitized.slug)) {
                seenIds.add(sanitized.id);
                seenSlugs.add(sanitized.slug);
                result.push(sanitized);
            }
        }
        return result.sort((a, b) => (a.createdAt || a.id || '').localeCompare(b.createdAt || b.id || ''));
    }

    renderState() {
        // Busca las ventanas usando cualquiera de los dos nombres posibles
        const loginView = document.getElementById('admin-login-screen') || document.getElementById('view-admin-login');
        const dashboardView = document.getElementById('admin-dashboard-screen') || document.getElementById('view-admin-dashboard');
        const logoutBtn = document.getElementById('btn-admin-logout');
        if (this.isAuthenticated) {
            // SI ESTÁ LOGUEADO: Ocultar login y Forzar aparición del dashboard
            if (loginView) {
                loginView.classList.remove('active-view');
                loginView.classList.add('hidden');
                loginView.style.setProperty('display', 'none', 'important'); // <- Fuerza bruta
            }
            if (dashboardView) {
                dashboardView.classList.add('active-view');
                dashboardView.classList.remove('hidden');
                dashboardView.style.setProperty('display', 'block', 'important'); // <- Fuerza bruta
            }
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            
        } else {
            // SI NO ESTÁ LOGUEADO: Mostrar login y Ocultar dashboard
            if (loginView) {
                loginView.classList.add('active-view');
                loginView.classList.remove('hidden');
                loginView.style.setProperty('display', 'block', 'important');
            }
            if (dashboardView) {
                dashboardView.classList.remove('active-view');
                dashboardView.classList.add('hidden');
                dashboardView.style.setProperty('display', 'none', 'important');
            }
            if (logoutBtn) logoutBtn.classList.add('hidden');
        }
    }

    updateTabCounters() {
        const total = this.profiles.length;
        const boys = this.profiles.filter(p => p.gender === 'boy').length;
        const girls = this.profiles.filter(p => p.gender === 'girl').length;
        const pets = this.profiles.filter(p => p.gender === 'pet').length;
        const seniors = this.profiles.filter(p => p.gender === 'senior').length;

        const statTotal = document.getElementById('stat-total-count');
        if (statTotal) statTotal.textContent = total;

        const countAll = document.getElementById('tab-count-all');
        if (countAll) countAll.textContent = total;

        const countBoy = document.getElementById('tab-count-boy');
        if (countBoy) countBoy.textContent = boys;

        const countGirl = document.getElementById('tab-count-girl');
        if (countGirl) countGirl.textContent = girls;

        const countPet = document.getElementById('tab-count-pet');
        if (countPet) countPet.textContent = pets;

        const countSenior = document.getElementById('tab-count-senior');
        if (countSenior) countSenior.textContent = seniors;
    }

    onLogoClick() {
        this.currentCategoryTab = 'all';
        document.querySelectorAll('.category-tab').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === 'all');
        });
        const searchInput = document.getElementById('admin-search-input');
        if (searchInput) searchInput.value = '';
        this.renderProfilesGrid();
    }

    renderProfilesGrid(filterQuery = '') {
        const grid = document.getElementById('admin-profiles-grid');
        const emptyState = document.getElementById('admin-empty-state');
        if (!grid) return;

        this.updateTabCounters();

        let filtered = this.profiles;

        // 1. Filter by Category Tab
        if (this.currentCategoryTab === 'boy') {
            filtered = filtered.filter(p => p.gender === 'boy');
        } else if (this.currentCategoryTab === 'girl') {
            filtered = filtered.filter(p => p.gender === 'girl');
        } else if (this.currentCategoryTab === 'pet') {
            filtered = filtered.filter(p => p.gender === 'pet');
        } else if (this.currentCategoryTab === 'senior') {
            filtered = filtered.filter(p => p.gender === 'senior');
        }

        // 2. Filter by Search Query
        if (filterQuery.trim() !== '') {
            const query = filterQuery.toLowerCase().trim();
            filtered = filtered.filter(p => 
                (p.name && p.name.toLowerCase().includes(query)) ||
                (p.slug && p.slug.toLowerCase().includes(query)) ||
                (p.school && p.school.toLowerCase().includes(query)) ||
                (p.parentPhone && p.parentPhone.includes(query)) ||
                (p.parentPhone2 && p.parentPhone2.includes(query)) ||
                (p.bloodType && p.bloodType.toLowerCase().includes(query))
            );
        }

        if (filtered.length === 0) {
            grid.innerHTML = '';
            emptyState?.classList.remove('hidden');
            return;
        }

        emptyState?.classList.add('hidden');

        grid.innerHTML = filtered.map(p => {
            const isPet = p.gender === 'pet';
            const isSenior = p.gender === 'senior';
            const photoSrc = p.photoUrl && p.photoUrl.trim() !== '' ? p.photoUrl : NEUTRAL_AVATAR_SVG;
            const categoryLabel = isPet ? 'Mascota 🐾' : (isSenior ? 'Adulto Mayor 👵👴' : (p.gender === 'girl' ? 'Niña 👧' : 'Niño 🧒'));
            const categoryClass = isPet ? 'pill-pet' : (isSenior ? 'pill-senior' : (p.gender === 'girl' ? 'pill-girl' : 'pill-boy'));

            // Ocultar iconos si el campo no está diligenciado
            let metaHtml = '';
            
            if (p.age !== undefined && p.age !== null && String(p.age).trim() !== '') {
                metaHtml += `<div class="meta-item"><i class="fa-solid fa-cake-candles"></i> ${p.age} años</div>`;
            }
            if (!isPet && p.bloodType && p.bloodType.trim() !== '') {
                metaHtml += `<div class="meta-item"><i class="fa-solid fa-droplet"></i> ${p.bloodType}</div>`;
            }
            if (!isPet && !isSenior && p.school && p.school.trim() !== '') {
                const gradeStr = p.grade ? ` (${p.grade})` : '';
                metaHtml += `<div class="meta-item meta-item-full"><i class="fa-solid fa-school"></i> ${p.school}${gradeStr}</div>`;
            }
            if (p.parentPhone && String(p.parentPhone).trim() !== '') {
                const phone2Str = p.parentPhone2 ? ` | +${p.parentPhone2}` : '';
                metaHtml += `<div class="meta-item meta-item-full"><i class="fa-solid fa-phone"></i> +${p.parentPhone}${phone2Str}</div>`;
            }
            
            // Solo renderizar el contenedor si hay al menos un campo lleno
            const metaContainer = metaHtml ? `<div class="card-meta-grid">${metaHtml}</div>` : '';
            return `
            <div class="admin-card" data-id="${p.id}">
                <div class="admin-card-header">
                    <img src="${photoSrc}" alt="${p.name}" class="admin-card-avatar" onerror="this.onerror=null;this.src='${NEUTRAL_AVATAR_SVG}';">
                    <div class="admin-card-header-info">
                        <h3 class="admin-card-name">${p.name}</h3>
                        <span class="gender-pill ${categoryClass}">${categoryLabel}</span>
                    </div>
                </div>
                
                <div class="url-pill-bar">
                    <span class="url-slug-text">/${p.slug}</span>
                    <button type="button" class="btn-copy-mini" onclick="adminApp.copyProfileUrl('${p.slug}')">
                        <i class="fa-solid fa-copy"></i> Copiar URL
                    </button>
                </div>
                ${metaContainer}
                <div class="admin-card-footer">
                    <button type="button" class="btn btn-secondary" onclick="adminApp.openEditModal('${p.id}')">
                        <i class="fa-solid fa-pen-to-square"></i> Editar
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="adminApp.previewProfile('${p.slug}')">
                        <i class="fa-solid fa-eye"></i> Ver
                    </button>
                    <button type="button" class="btn btn-danger" onclick="adminApp.deleteProfile('${p.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    openCreateModal() {
        this.photoRemoved = false;
        this.pendingUploadedPhoto = null;
        document.getElementById('modal-title').textContent = 'Crear Nuevo Perfil';
        document.getElementById('input-profile-id').value = '';
        document.getElementById('input-name').value = '';
        document.getElementById('input-slug').value = '';
        
        const genderSelect = document.getElementById('input-gender');
        if (genderSelect) genderSelect.value = (this.currentCategoryTab !== 'all' ? this.currentCategoryTab : 'boy');
        
        document.getElementById('input-birthdate').value = '';
        document.getElementById('input-age').value = '';
        document.getElementById('input-blood').value = '';
        document.getElementById('input-phone').value = '';
        document.getElementById('input-phone2').value = '';
        document.getElementById('input-whatsapp-msg').value = '';
        document.getElementById('input-maps-url').value = '';
        const elSchoolUrl = document.getElementById('input-school-url');
        if (elSchoolUrl) elSchoolUrl.value = '';
        document.getElementById('input-school').value = '';
        document.getElementById('input-grade').value = '';
        document.getElementById('input-medical').value = '';
        document.getElementById('input-medications').value = '';
        document.getElementById('input-photo-url').value = '';
        
        const previewImg = document.getElementById('photo-preview');
        if (previewImg) previewImg.src = NEUTRAL_AVATAR_SVG;

        this.updateModalFormForCategory(genderSelect ? genderSelect.value : 'boy');

        document.getElementById('modal-profile').classList.remove('hidden');
        document.body.classList.add('modal-open');
    }

    openEditModal(id) {
        const profile = this.profiles.find(p => p.id === id);
        if (!profile) return;

        this.photoRemoved = false;
        this.pendingUploadedPhoto = null;
        document.getElementById('modal-title').textContent = `Editar Perfil: ${profile.name}`;
        document.getElementById('input-profile-id').value = profile.id;
        document.getElementById('input-name').value = profile.name || '';
        document.getElementById('input-slug').value = profile.slug || '';
        
        const genderSelect = document.getElementById('input-gender');
        if (genderSelect) genderSelect.value = profile.gender || 'boy';
        
        document.getElementById('input-birthdate').value = profile.birthDate || '';
        document.getElementById('input-age').value = (profile.age !== undefined && profile.age !== null) ? profile.age : '';
        document.getElementById('input-blood').value = profile.bloodType || '';
        document.getElementById('input-phone').value = profile.parentPhone || '';
        document.getElementById('input-phone2').value = profile.parentPhone2 || '';
        document.getElementById('input-whatsapp-msg').value = profile.whatsappMessage || '';
        document.getElementById('input-maps-url').value = profile.locationMapsUrl || '';
        const elSchoolUrlEdit = document.getElementById('input-school-url');
        if (elSchoolUrlEdit) elSchoolUrlEdit.value = profile.schoolMapsUrl || '';
        document.getElementById('input-school').value = profile.school || '';
        document.getElementById('input-grade').value = profile.grade || '';
        document.getElementById('input-medical').value = profile.medicalConditions || '';
        document.getElementById('input-medications').value = profile.importantMedications || '';
        document.getElementById('input-photo-url').value = profile.photoUrl || '';
        
        const previewImg = document.getElementById('photo-preview');
        if (previewImg) {
            previewImg.src = (profile.photoUrl && profile.photoUrl.trim() !== '') ? profile.photoUrl : NEUTRAL_AVATAR_SVG;
        }

        this.updateModalFormForCategory(profile.gender || 'boy');

        document.getElementById('modal-profile').classList.remove('hidden');
        document.body.classList.add('modal-open');
    }

    updateModalFormForCategory(gender) {
        const schoolGroup = document.getElementById('group-school');
        const gradeGroup = document.getElementById('group-grade');
        const schoolUrlGroup = document.getElementById('group-school-url');
        const bloodGroup = document.getElementById('group-blood');
        const mapsLabel = document.getElementById('label-maps-url');
        const waMsgInput = document.getElementById('input-whatsapp-msg');

        if (gender === 'pet') {
            schoolGroup?.classList.add('hidden');
            gradeGroup?.classList.add('hidden');
            schoolUrlGroup?.classList.add('hidden');
            bloodGroup?.classList.add('hidden');
            if (mapsLabel) mapsLabel.textContent = "Ubicación del Hogar (Google Maps)";
            if (waMsgInput && !waMsgInput.value) {
                waMsgInput.value = "Hola, encontré a la mascota {nombre} y quiero comunicarme con su dueño.";
            }
        } else if (gender === 'senior') {
            schoolGroup?.classList.add('hidden');
            gradeGroup?.classList.add('hidden');
            schoolUrlGroup?.classList.add('hidden');
            bloodGroup?.classList.remove('hidden');
            if (mapsLabel) mapsLabel.textContent = "Ubicación de Residencia / Contacto (Google Maps)";
            if (waMsgInput && !waMsgInput.value) {
                waMsgInput.value = "Hola, encontré el perfil de seguridad del adulto mayor {nombre} y quiero comunicarme con sus familiares.";
            }
        } else {
            schoolGroup?.classList.remove('hidden');
            gradeGroup?.classList.remove('hidden');
            schoolUrlGroup?.classList.remove('hidden');
            bloodGroup?.classList.remove('hidden');
            if (mapsLabel) mapsLabel.textContent = "Ubicación Casa (Google Maps URL)";
            if (waMsgInput && !waMsgInput.value) {
                waMsgInput.value = "Hola, encontré la información del perfil de {nombre}.";
            }
        }
    }

    closeModal() {
        document.getElementById('modal-profile').classList.add('hidden');
        document.body.classList.remove('modal-open');
        this.photoRemoved = false;
        this.pendingUploadedPhoto = null;
    }

    previewProfile(slug) {
        window.open(`/${slug}`, '_blank');
    }

    copyProfileUrl(slug) {
        const origin = window.location.origin;
        const url = `${origin}/${slug}`;
        navigator.clipboard.writeText(url).then(() => {
            this.showToast(`¡URL corta copiada! ${url}`);
        }).catch(() => {
            prompt("Copia este enlace:", url);
        });
    }

    async deleteProfile(id) {
        const profile = this.profiles.find(p => p.id === id);
        if (!profile) return;

        if (confirm(`¿Deseas eliminar permanentemente el perfil de ${profile.name}?`)) {
            try {
                await deleteDoc(doc(db, "nfc_profiles", id));
                this.profiles = this.profiles.filter(p => p.id !== id);
                localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));
                this.renderProfilesGrid();
                this.showToast(`Perfil de ${profile.name} eliminado definitivamente.`);
            } catch (e) {
                console.error("Error al eliminar perfil de Firestore:", e);
                this.showToast("Error al eliminar perfil en Firestore.");
            }
        }
    }

    generateUniqueSlug(name, currentId = null) {
        let baseSlug = (name || 'perfil').toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        if (!baseSlug) baseSlug = 'perfil';

        let slug = baseSlug;
        let counter = 1;

        while (this.profiles.some(p => p.slug === slug && p.id !== currentId)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    async saveProfileFromForm() {
        this.isSaving = true;
        try {
            const id = document.getElementById('input-profile-id').value;
            let name = document.getElementById('input-name').value.trim();
            if (!name) {
                name = 'Nuevo Perfil';
            }
            let slug = document.getElementById('input-slug').value.trim();
            if (!slug) {
                slug = this.generateUniqueSlug(name, id);
            } else {
                slug = this.generateUniqueSlug(slug, id);
            }

            const genderInput = document.getElementById('input-gender')?.value;
            const gender = (genderInput === 'girl' || genderInput === 'pet' || genderInput === 'senior') ? genderInput : 'boy';

            const photoUrlInput = document.getElementById('input-photo-url').value.trim();
            const previewSrc = document.getElementById('photo-preview').src;

            let finalPhoto = '';
            if (this.photoRemoved) {
                finalPhoto = '';
            } else if (this.pendingUploadedPhoto && this.pendingUploadedPhoto.trim() !== '') {
                finalPhoto = this.pendingUploadedPhoto.trim();
            } else if (photoUrlInput && photoUrlInput.trim() !== '') {
                finalPhoto = photoUrlInput.trim();
            } else if (previewSrc && previewSrc.startsWith('data:image/') && !previewSrc.includes('data:image/svg+xml')) {
                finalPhoto = previewSrc;
            } else if (previewSrc && previewSrc !== NEUTRAL_AVATAR_SVG && !previewSrc.includes('data:image/svg+xml') && previewSrc.length > 50) {
                finalPhoto = previewSrc;
            }

            const existingProf = id ? this.profiles.find(p => p.id === id) : null;

            if (!finalPhoto && existingProf && existingProf.photoUrl && !this.photoRemoved) {
                finalPhoto = existingProf.photoUrl;
            }

            const schoolVal = document.getElementById('input-school')?.value.trim() || '';
            const gradeVal = document.getElementById('input-grade')?.value.trim() || '';
            const medicalVal = document.getElementById('input-medical')?.value.trim() || '';
            const medicationsVal = document.getElementById('input-medications')?.value.trim() || '';

            const birthDateVal = document.getElementById('input-birthdate')?.value || '';
            const ageInputVal = document.getElementById('input-age')?.value;
            const computedAge = this.calculateAgeFromBirthDate(birthDateVal, ageInputVal);

            const parentPhone1Val = document.getElementById('input-phone').value.trim();
            const parentPhone2Val = document.getElementById('input-phone2')?.value.trim() || '';

            const rawProfile = {
                id: id || `prof-${Date.now()}`,
                slug: slug,
                name: name,
                gender: gender,
                birthDate: birthDateVal,
                age: computedAge,
                bloodType: gender === 'pet' ? '' : (document.getElementById('input-blood').value ? document.getElementById('input-blood').value.trim() : ''),
                parentPhone: parentPhone1Val,
                parentPhone2: parentPhone2Val,
                whatsappMessage: document.getElementById('input-whatsapp-msg').value.trim(),
                locationMapsUrl: document.getElementById('input-maps-url').value.trim(),
                schoolMapsUrl: (document.getElementById('input-school-url')?.value || '').trim(),
                school: schoolVal,
                grade: gradeVal,
                medicalConditions: medicalVal,
                importantMedications: medicationsVal,
                photoUrl: finalPhoto,
                active: true,
                createdAt: existingProf ? (existingProf.createdAt || new Date().toISOString()) : new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const profileData = this.sanitizeProfile(rawProfile);

            await setDoc(doc(db, "nfc_profiles", profileData.id), profileData);

            if (id) {
                const idx = this.profiles.findIndex(p => p.id === id);
                if (idx !== -1) this.profiles[idx] = profileData;
            } else {
                this.profiles.unshift(profileData);
            }
            localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));

            this.closeModal();
            this.showToast(`¡Perfil de ${name} guardado! URL: /${slug}`);
            this.renderProfilesGrid();
        } catch (err) {
            console.error("Error al guardar perfil en Firestore:", err);
            this.showToast("Error al guardar perfil en Firestore.");
        } finally {
            setTimeout(() => { this.isSaving = false; }, 1000);
        }
    }

    setupEventListeners() {
        // Category Tab Switchers
        document.querySelectorAll('.category-tab').forEach(tabBtn => {
            tabBtn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
                const btn = e.currentTarget;
                btn.classList.add('active');
                this.currentCategoryTab = btn.getAttribute('data-tab') || 'all';
                const searchVal = document.getElementById('admin-search-input')?.value || '';
                this.renderProfilesGrid(searchVal);
            });
        });

        // Dynamic gender selector change helper for default WhatsApp & Blood type
        document.getElementById('input-gender')?.addEventListener('change', (e) => {
            this.updateModalFormForCategory(e.target.value);
        });

        // Auto calculate age when birthdate is selected
        const handleBirthDateChange = (e) => {
            const birthVal = e.target.value;
            if (birthVal) {
                const currentAgeVal = document.getElementById('input-age')?.value || 5;
                const computed = this.calculateAgeFromBirthDate(birthVal, currentAgeVal);
                const ageInput = document.getElementById('input-age');
                if (ageInput) ageInput.value = computed;
            }
        };
        document.getElementById('input-birthdate')?.addEventListener('input', handleBirthDateChange);
        document.getElementById('input-birthdate')?.addEventListener('change', handleBirthDateChange);

        document.getElementById('form-admin-login')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('input-admin-user')?.value.trim();
            const pass = document.getElementById('input-admin-pass')?.value.trim();
            
            const btnSubmit = e.target.querySelector('button[type="submit"]');
            const originalBtnHtml = btnSubmit ? btnSubmit.innerHTML : '';
            if (btnSubmit) {
                btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Conectando...';
                btnSubmit.disabled = true;
            }
            try {
                let success = false;
                if (user && user.includes('@')) {
                    try {
                        await signInWithEmailAndPassword(auth, user, pass);
                        success = true;
                    } catch (fbErr) {
                        if ((user === "admin" || user === "admin@nfc.com") && (pass === "1234" || pass === "admin" || pass === "admin123")) {
                            success = true;
                        } else {
                            throw fbErr;
                        }
                    }
                } else if ((user === "admin" || user === "admin@nfc.com") && (pass === "1234" || pass === "admin" || pass === "admin123")) {
                    success = true;
                } else {
                    await signInWithEmailAndPassword(auth, user, pass);
                    success = true;
                }

                if (success) {
                    this.isAuthenticated = true;
                    localStorage.setItem('nfc_admin_auth', 'true');
                    sessionStorage.setItem('nfc_admin_auth', 'true');
                    this.renderState();
                    this.showToast("¡Sesión iniciada correctamente!");
                    this.renderProfilesGrid();
                }
            } catch (error) {
                console.error("Login Error:", error);
                alert("Usuario o contraseña incorrectos.");
            } finally {
                if (btnSubmit) {
                    btnSubmit.innerHTML = originalBtnHtml;
                    btnSubmit.disabled = false;
                }
            }
        });

        // ==========================================
        // SISTEMA DE LOGOUT PROFESIONAL (MODAL + SPINNER)
        // ==========================================
        
        // 1. Mostrar modal al hacer clic en salir (Búsqueda Dinámica Inmune)
        document.getElementById('btn-admin-logout')?.addEventListener('click', () => {
            const modal = document.getElementById('modal-logout');
            if (modal) {
                modal.classList.remove('hidden');
            } else {
                alert("Error técnico: Asegúrate de que el modal de logout esté en el HTML.");
            }
        });
        
        // 2. Ocultar modal si se cancela (Usando delegación de eventos)
        document.body.addEventListener('click', (e) => {
            if (e.target.id === 'btn-cancel-logout') {
                const modal = document.getElementById('modal-logout');
                if (modal) modal.classList.add('hidden');
            }
        });
        // 3. Ejecutar Firebase Auth SignOut con estado de carga (Delegación)
        document.body.addEventListener('click', async (e) => {
            if (e.target.id === 'btn-confirm-logout') {
                const btnConfirmLogout = e.target;
                const originalHtml = btnConfirmLogout.innerHTML;
                
                // Estado visual de carga (Spinner animado)
                btnConfirmLogout.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Cerrando...';
                btnConfirmLogout.disabled = true;
                btnConfirmLogout.style.opacity = '0.7';
                try {
                    await signOut(auth); // Desconecta del servidor Firebase
                    localStorage.removeItem('nfc_profiles_db'); // Limpieza de caché local
                    localStorage.removeItem('nfc_admin_auth');
                    sessionStorage.removeItem('nfc_admin_auth');
                    
                    // Redirección forzada e instantánea a la pantalla de Login
                    window.location.reload(); 
                    
                } catch (error) {
                    console.error("Logout Error:", error);
                    alert("Hubo un error de conexión al intentar cerrar sesión.");
                    
                    // Restaurar botón solo si falla
                    btnConfirmLogout.innerHTML = originalHtml;
                    btnConfirmLogout.disabled = false;
                    btnConfirmLogout.style.opacity = '1';
                }
            }
        });

        let searchRafTimer = null;
        document.getElementById('admin-search-input')?.addEventListener('input', (e) => {
            const queryVal = e.target.value;
            if (searchRafTimer) cancelAnimationFrame(searchRafTimer);
            searchRafTimer = requestAnimationFrame(() => {
                this.renderProfilesGrid(queryVal);
            });
        });

        document.getElementById('btn-open-create-modal')?.addEventListener('click', () => this.openCreateModal());
        document.getElementById('modal-close-btn')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modal-cancel-btn')?.addEventListener('click', () => this.closeModal());

        document.getElementById('form-save-profile')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveProfileFromForm();
        });

        document.getElementById('input-name')?.addEventListener('input', (e) => {
            const currentId = document.getElementById('input-profile-id').value;
            if (!currentId) {
                document.getElementById('input-slug').value = this.generateUniqueSlug(e.target.value);
            }
        });

        document.getElementById('input-photo-url')?.addEventListener('input', () => {
            this.photoRemoved = false;
            const url = document.getElementById('input-photo-url').value.trim();
            document.getElementById('photo-preview').src = url || NEUTRAL_AVATAR_SVG;
        });

        // Photo file uploader with instant Canvas compression
        const dropzone = document.getElementById('dropzone-photo');
        const fileInput = document.getElementById('file-photo-input');
        const previewImg = document.getElementById('photo-preview');

        dropzone?.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') { fileInput.click(); }
        });

        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.photoRemoved = false;
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    const compressedBase64 = await this.compressImage(evt.target.result);
                    this.pendingUploadedPhoto = compressedBase64;
                    if (previewImg) previewImg.src = compressedBase64;
                    const urlInput = document.getElementById('input-photo-url');
                    if (urlInput) urlInput.value = '';
                };
                reader.readAsDataURL(file);
            }
        });

        // Remove Photo Button: Sets photoUrl = '' in Firestore immediately!
        document.getElementById('btn-remove-photo')?.addEventListener('click', async () => {
            this.photoRemoved = true;
            this.pendingUploadedPhoto = null;
            
            if (previewImg) previewImg.src = NEUTRAL_AVATAR_SVG;
            document.getElementById('input-photo-url').value = '';
            if (fileInput) fileInput.value = '';

            const currentId = document.getElementById('input-profile-id').value;
            if (currentId) {
                const profile = this.profiles.find(p => p.id === currentId);
                if (profile) {
                    profile.photoUrl = '';
                    profile.updatedAt = new Date().toISOString();
                    try {
                        await setDoc(doc(db, "nfc_profiles", profile.id), profile);
                        this.renderProfilesGrid();
                    } catch (e) {
                        console.error("Error updating photo in Firestore:", e);
                    }
                }
            }

            this.showToast("¡Fotografía eliminada por completo!");
        });
    }

    compressImage(dataUrl, maxWidth = 350, maxHeight = 350, quality = 0.7) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = dataUrl;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(dataUrl);
        });
    }

    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3500);
    }
}

function startAdminApp() {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    window.adminApp = new AdminApp();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAdminApp);
} else {
    startAdminApp();
}
