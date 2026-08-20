/* ==========================================================================
   NFC INFANTIL - PUBLIC CHILD PROFILE APP LOGIC (FIREBASE FIRESTORE SDK V10 SSOT)
   ========================================================================== */

import { 
    db, 
    collection, 
    doc, 
    setDoc, 
    onSnapshot, 
    INITIAL_PROFILES_SEED 
} from './firebase-config.js';

// Neutral SVG Silhouette for profiles without a custom photo
const NEUTRAL_AVATAR_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%2364748b'%3E%3Ccircle cx='50' cy='35' r='22'/%3E%3Cpath d='M18 85c0-18 14-30 32-30s32 12 32 30Z'/%3E%3C/svg%3E";

class App {
    constructor() {
        const stored = localStorage.getItem('nfc_profiles_db');
        this.profiles = stored ? JSON.parse(stored) : [];
        this.currentProfile = null;
        this.nfcSession = null;
        this.init();
    }
    async init() {
        const targetSlug = this.getSlugFromUrl();
        this.setupNfcListener();
        this.setupSimulatedScanner();
        // 🚀 Carga Instantánea desde Caché Local (Elimina pantalla azul de espera al 100%)
        if (this.profiles && this.profiles.length > 0) {
            this.renderSingleProfile(targetSlug);
            document.documentElement.classList.add('ready');
        }
        // Firestore Realtime Single Source of Truth Listener
        onSnapshot(collection(db, "nfc_profiles"), async (snapshot) => {
            const loaded = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data) loaded.push(data);
            });
            if (loaded.length === 0) {
                // Initial Automatic Seed if Firestore collection is completely empty
                console.log("Firestore empty: Seeding initial real profiles...");
                for (const seedProf of INITIAL_PROFILES_SEED) {
                    try {
                        await setDoc(doc(db, "nfc_profiles", seedProf.id), seedProf);
                    } catch (e) {
                        console.error("Error seeding initial profile:", e);
                    }
                }
                return;
            }
            this.profiles = this.deduplicateProfiles(loaded);
            
            // Guardar en caché para la próxima vez que se recargue
            localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));
            
            this.renderSingleProfile(targetSlug);
            document.documentElement.classList.add('ready');
        }, (error) => {
            console.error("Firestore Realtime Listener Error:", error);
            document.documentElement.classList.add('ready');
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
        
        let gender = (p.gender === 'girl' || p.gender === 'boy' || p.gender === 'pet' || p.gender === 'senior') ? p.gender : 'boy';
        if (p.id === 'prof-006-jose' || (p.slug && String(p.slug).toLowerCase().includes('jose-ramirez'))) {
            gender = 'senior';
        }

        let slug = (p.slug && String(p.slug).trim() !== '' && String(p.slug).trim() !== 'undefined') 
            ? String(p.slug).trim() 
            : name.toLowerCase().replace(/[^a-z0-9]/g, '-');

        let locationMapsUrl = (p.locationMapsUrl !== undefined && p.locationMapsUrl !== null) ? String(p.locationMapsUrl).trim() : '';
        if (locationMapsUrl.includes('maps.google.com/?q=4.6853') || 
            locationMapsUrl.includes('maps.google.com/?q=6.2088') || 
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
            active: p.active !== undefined ? p.active : true,
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

    getSlugFromUrl() {
        let rawPath = window.location.pathname;
        try {
            rawPath = decodeURIComponent(rawPath);
        } catch (e) {}

        const path = rawPath.toLowerCase().replace(/\/$/, '') || '/';
        const urlParams = new URLSearchParams(window.location.search);

        let slug = '';
        if (urlParams.has('slug')) {
            slug = urlParams.get('slug');
        } else if (path !== '/' && path !== '/index.html') {
            slug = path.substring(1);
        }

        try {
            slug = decodeURIComponent(slug);
        } catch (e) {}

        return slug;
    }

    findProfileBySlug(rawSlug) {
        if (!this.profiles || this.profiles.length === 0) {
            return null;
        }

        let decoded = rawSlug || '';
        try {
            decoded = decodeURIComponent(decoded);
        } catch(e) {}

        const cleanSlug = decoded.toLowerCase().trim()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/^\/+|\/+$/g, '')
            .replace(/\.html$/, '')
            .replace(/[^a-z0-9]/g, '-');

        if (!cleanSlug) {
            return this.profiles[0];
        }

        // 1. Direct exact slug match
        let profile = this.profiles.find(p => {
            if (!p || !p.slug) return false;
            const s = p.slug.toLowerCase().trim()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, '-');
            return s === cleanSlug;
        });

        // 2. Match profile ID
        if (!profile) {
            profile = this.profiles.find(p => p && p.id && p.id.toLowerCase() === cleanSlug);
        }

        // 3. Match normalized child name
        if (!profile) {
            profile = this.profiles.find(p => {
                if (!p || !p.name) return false;
                const normName = p.name.toLowerCase().trim()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]/g, '-');
                return normName === cleanSlug || normName.includes(cleanSlug) || cleanSlug.includes(normName);
            });
        }

        // 4. Fallback: match slug substring
        if (!profile) {
            profile = this.profiles.find(p => {
                if (!p || !p.slug) return false;
                return p.slug.toLowerCase().includes(cleanSlug);
            });
        }

        return profile || null;
    }

    renderSingleProfile(rawSlug) {
        const viewProfile = document.getElementById('view-profile');
        const viewInactive = document.getElementById('view-inactive');
        const profile = this.findProfileBySlug(rawSlug);
        if (!profile || profile.active === false) {
            viewProfile?.classList.add('hidden');
            viewInactive?.classList.remove('hidden');
            const inactiveTitle = document.getElementById('inactive-title');
            const inactiveDesc = document.getElementById('inactive-desc');
            if (inactiveTitle) inactiveTitle.textContent = profile ? 'Perfil Inactivo' : 'Perfil No Encontrado';
            if (inactiveDesc) inactiveDesc.textContent = profile ? 'Este perfil ha sido deshabilitado temporalmente.' : 'No existe ningún perfil registrado con este enlace.';
            return;
        }
        this.currentProfile = profile;
        viewInactive?.classList.add('hidden');
        viewProfile?.classList.remove('hidden');
        // Apply Theme
        const isPet = profile.gender === 'pet';
        const isSenior = profile.gender === 'senior';
        const themeClass = isPet ? 'theme-pet' : (isSenior ? 'theme-senior' : (profile.gender === 'girl' ? 'theme-girl' : 'theme-boy'));
        
        document.documentElement.classList.remove('theme-boy', 'theme-girl', 'theme-pet', 'theme-senior');
        document.documentElement.classList.add(themeClass);
        // Header Title Badge
        const badgeTitle = document.getElementById('badge-category-title');
        const headerBadgeText = document.getElementById('header-badge-text');
        
        if (isPet) {
            if (badgeTitle) badgeTitle.textContent = 'Mascota Perdida / Identificación';
            if (headerBadgeText) headerBadgeText.textContent = 'Perfil de Seguridad Mascota';
        } else if (isSenior) {
            if (badgeTitle) badgeTitle.textContent = 'Adulto Mayor / Identificación';
            if (headerBadgeText) headerBadgeText.textContent = 'Perfil de Seguridad Adulto Mayor';
        } else {
            if (badgeTitle) badgeTitle.textContent = 'NFC - INFANTIL';
            if (headerBadgeText) headerBadgeText.textContent = 'Perfil Oficial de Seguridad';
        }
        // Avatar Image
        const avatarImg = document.getElementById('p-avatar');
        if (avatarImg) {
            avatarImg.src = (profile.photoUrl && profile.photoUrl.trim() !== '') ? profile.photoUrl : NEUTRAL_AVATAR_SVG;
            avatarImg.onerror = function() {
                this.onerror = null;
                this.src = NEUTRAL_AVATAR_SVG;
            };
        }
        // Name
        const nameEl = document.getElementById('p-hero-name');
        if (nameEl) nameEl.textContent = profile.name;
        // Category Badge Pill
        const genderText = document.getElementById('p-gender-text');
        if (genderText) {
            genderText.textContent = isPet ? 'Mascota Protegida' : (isSenior ? 'Adulto Mayor Protegido' : 'Perfil Verificado');
        }
        // Age
        const ageEl = document.getElementById('p-age-val');
        if (ageEl) {
            const ageVal = (profile.age !== undefined && profile.age !== null && profile.age !== '') ? `${profile.age} años` : 'N/A';
            ageEl.textContent = ageVal;
        }
        // Blood Type Card Visibility
        const bloodCard = document.getElementById('box-blood');
        const bloodEl = document.getElementById('p-blood-val');
        if (isPet) {
            bloodCard?.classList.add('hidden');
        } else {
            bloodCard?.classList.remove('hidden');
            if (bloodEl) bloodEl.textContent = profile.bloodType || 'N/A';
        }
        // School Card Visibility
        const schoolCard = document.getElementById('box-school');
        const schoolEl = document.getElementById('p-school');
        const gradeCard = document.getElementById('box-grade');
        const gradeEl = document.getElementById('p-grade');
        if (isPet || isSenior) {
            schoolCard?.classList.add('hidden');
            gradeCard?.classList.add('hidden');
        } else {
            if (profile.school && profile.school.trim() !== '') {
                schoolCard?.classList.remove('hidden');
                if (schoolEl) schoolEl.textContent = profile.school;
            } else {
                schoolCard?.classList.add('hidden');
            }
            if (profile.grade && profile.grade.trim() !== '') {
                gradeCard?.classList.remove('hidden');
                if (gradeEl) gradeEl.textContent = profile.grade;
            } else {
                gradeCard?.classList.add('hidden');
            }
        }
        // Medical Conditions
        const medicalCard = document.getElementById('box-medical');
        const medicalEl = document.getElementById('p-medical-notes');
        if (medicalCard) {
            if (profile.medicalConditions && profile.medicalConditions.trim() !== '') {
                medicalCard.classList.remove('hidden');
                if (medicalEl) medicalEl.textContent = profile.medicalConditions;
            } else {
                medicalCard.classList.add('hidden');
            }
        }
        
        // Medications
        const medsCard = document.getElementById('box-medications');
        const medsEl = document.getElementById('p-medications-notes');
        if (medsCard) {
            if (profile.importantMedications && profile.importantMedications.trim() !== '') {
                medsCard.classList.remove('hidden');
                if (medsEl) medsEl.textContent = profile.importantMedications;
            } else {
                medsCard.classList.add('hidden');
            }
        }
        // WhatsApp Main Action Button 1
        const btnWa1 = document.getElementById('btn-whatsapp-action');
        if (btnWa1) {
            if (profile.parentPhone && profile.parentPhone.trim() !== '') {
                btnWa1.classList.remove('hidden');
                let waText = profile.whatsappMessage || (isPet 
                    ? `Hola, encontré a la mascota ${profile.name} y me quiero comunicar con su dueño.`
                    : (isSenior ? `Hola, encontré el perfil de seguridad del adulto mayor ${profile.name} y me quiero comunicar con sus familiares.` : `Hola, encontré la información del perfil de ${profile.name}.`));
                waText = waText.replace('{nombre}', profile.name);
                const encodedWa = encodeURIComponent(waText);
                btnWa1.onclick = (e) => { e.preventDefault(); window.open(`https://wa.me/${profile.parentPhone}?text=${encodedWa}`, '_blank'); };
            } else {
                btnWa1.classList.add('hidden');
            }
        }
        
        // WhatsApp Action Button 2
        const btnWa2 = document.getElementById('btn-whatsapp-action2');
        if (btnWa2) {
            if (profile.parentPhone2 && profile.parentPhone2.trim() !== '') {
                btnWa2.classList.remove('hidden');
                let waText = profile.whatsappMessage || (isPet 
                    ? `Hola, encontré a la mascota ${profile.name} y me quiero comunicar con su dueño.`
                    : (isSenior ? `Hola, encontré el perfil de seguridad del adulto mayor ${profile.name} y me quiero comunicar con sus familiares.` : `Hola, encontré la información del perfil de ${profile.name}.`));
                waText = waText.replace('{nombre}', profile.name);
                const encodedWa = encodeURIComponent(waText);
                btnWa2.onclick = (e) => { e.preventDefault(); window.open(`https://wa.me/${profile.parentPhone2}?text=${encodedWa}`, '_blank'); };
            } else {
                btnWa2.classList.add('hidden');
            }
        }
        // Location / Home Maps Button
        const btnLocation = document.getElementById('btn-location-action');
        if (btnLocation) {
            if (profile.locationMapsUrl && profile.locationMapsUrl.trim() !== '') {
                btnLocation.classList.remove('hidden');
                btnLocation.onclick = (e) => { e.preventDefault(); window.open(profile.locationMapsUrl, '_blank'); };
            } else {
                btnLocation.classList.add('hidden');
            }
        }
    }

    setupNfcListener() {
        if ('NDEFReader' in window) {
            try {
                const ndef = new NDEFReader();
                ndef.scan().then(() => {
                    ndef.addEventListener("reading", ({ message, serialNumber }) => {
                        console.log(`NFC Tag detectado! Serial: ${serialNumber}`);
                        for (const record of message.records) {
                            if (record.recordType === "url" || record.recordType === "text") {
                                const textDecoder = new TextDecoder();
                                const decoded = textDecoder.decode(record.data);
                                console.log("Contenido NFC:", decoded);
                                const found = this.findProfileBySlug(decoded);
                                if (found) {
                                    this.renderSingleProfile(found.slug);
                                }
                            }
                        }
                    });
                }).catch(err => {
                    console.log("Web NFC no disponible o permiso denegado:", err);
                });
            } catch (e) {}
        }
    }

    setupSimulatedScanner() {
        const btnScan = document.getElementById('btn-scan-nfc');
        btnScan?.addEventListener('click', () => {
            const promptSlug = prompt("Simulación NFC: Ingresa el slug o nombre del perfil (ej. samuel, zeus, jose-ramirez):", "samuel");
            if (promptSlug) {
                this.renderSingleProfile(promptSlug);
            }
        });
    }
}

function startApp() {
    window.appInstance = new App();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
