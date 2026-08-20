/* ==========================================================================
   NFC INFANTIL - PUBLIC PROFILE VIEWER LOGIC (FIREBASE FIRESTORE REAL-TIME SINGLE SOURCE OF TRUTH)
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
        let initialList = [];
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    initialList = parsed;
                }
            } catch (e) {}
        }
        this.profiles = this.deduplicateProfiles(initialList);
        this.currentProfile = null;
        this.nfcSession = null;
        this.init();
    }

    async init() {
        const targetSlug = this.getSlugFromUrl();
        this.setupNfcListener();
        this.setupSimulatedScanner();

        // 🚀 Instant local render so page is NEVER blank or empty
        this.renderSingleProfile(targetSlug);
        document.documentElement.classList.add('ready');

        // Firestore Realtime Single Source of Truth Listener
        onSnapshot(collection(db, "nfc_profiles"), async (snapshot) => {
            const loaded = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data) loaded.push(data);
            });

            this.profiles = this.deduplicateProfiles(loaded);

            localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));

            this.renderSingleProfile(targetSlug);
            document.documentElement.classList.add('ready');
        }, (error) => {
            console.error("Firestore Realtime Listener Error:", error);
            this.renderSingleProfile(targetSlug);
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
        const path = window.location.pathname.replace(/^\/|\/$/g, '');
        if (path && path !== 'index.html' && path !== 'admin' && path !== 'admin.html') {
            return path.toLowerCase();
        }
        const urlParams = new URLSearchParams(window.location.search);
        const slugParam = urlParams.get('slug') || urlParams.get('id');
        if (slugParam) return slugParam.toLowerCase();

        return '';
    }

    findProfileBySlug(slug) {
        if (!slug) {
            // Si entra a la página principal sin escanear pulsera, expulsarlo al Login
            window.location.href = '/admin.html';
            return null;
        }
        const cleanSlug = slug.toLowerCase().trim();

        let profile = this.profiles.find(p => p.slug === cleanSlug || p.id === cleanSlug);

        if (!profile) {
            profile = this.profiles.find(p => p.slug && p.slug.toLowerCase().includes(cleanSlug));
        }

        if (!profile) {
            profile = this.profiles.find(p => {
                if (!p || !p.name) return false;
                const normName = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');
                return normName === cleanSlug || normName.includes(cleanSlug) || cleanSlug.includes(normName);
            });
        }

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
        const isGirl = profile.gender === 'girl';
        const themeClass = isPet ? 'theme-pet' : (isSenior ? 'theme-senior' : (isGirl ? 'theme-girl' : 'theme-boy'));
        
        document.documentElement.classList.remove('theme-boy', 'theme-girl', 'theme-pet', 'theme-senior');
        document.documentElement.classList.add(themeClass);

        // Update Category-Specific Decorator Icons (Niñas: Pluma, Arcoíris, Varita Mágica, Brote, Torre)
        const decoTl = document.getElementById('p-deco-tl');
        const decoTr = document.getElementById('p-deco-tr');
        const decoBr = document.getElementById('p-deco-br');
        const sceneLeft = document.getElementById('scene-left');
        const sceneRight = document.getElementById('scene-right');

        if (isGirl) {
            if (decoTl) decoTl.innerHTML = '<i class="fa-solid fa-feather"></i>';
            if (decoTr) decoTr.innerHTML = '<i class="fa-solid fa-rainbow"></i>';
            if (decoBr) decoBr.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
            if (sceneLeft) sceneLeft.innerHTML = '<i class="fa-solid fa-seedling"></i>';
            if (sceneRight) sceneRight.innerHTML = '<i class="fa-solid fa-chess-rook"></i>';
        } else if (isPet) {
            if (decoTl) decoTl.innerHTML = '<i class="fa-solid fa-paw"></i>';
            if (decoTr) decoTr.innerHTML = '<i class="fa-solid fa-bone"></i>';
            if (decoBr) decoBr.innerHTML = '<i class="fa-solid fa-heart"></i>';
            if (sceneLeft) sceneLeft.innerHTML = '<i class="fa-solid fa-tree"></i>';
            if (sceneRight) sceneRight.innerHTML = '<i class="fa-solid fa-paw"></i>';
        } else if (isSenior) {
            if (decoTl) decoTl.innerHTML = '<i class="fa-solid fa-heart-pulse"></i>';
            if (decoTr) decoTr.innerHTML = '<i class="fa-solid fa-user-shield"></i>';
            if (decoBr) decoBr.innerHTML = '<i class="fa-solid fa-hand-holding-heart"></i>';
            if (sceneLeft) sceneLeft.innerHTML = '<i class="fa-solid fa-tree"></i>';
            if (sceneRight) sceneRight.innerHTML = '<i class="fa-solid fa-shield-heart"></i>';
        } else {
            // Default Boy Theme
            if (decoTl) decoTl.innerHTML = '<i class="fa-solid fa-rocket"></i>';
            if (decoTr) decoTr.innerHTML = '<i class="fa-solid fa-atom"></i>';
            if (decoBr) decoBr.innerHTML = '<i class="fa-solid fa-user-astronaut"></i>';
            if (sceneLeft) sceneLeft.innerHTML = '<i class="fa-solid fa-futbol"></i>';
            if (sceneRight) sceneRight.innerHTML = '<i class="fa-solid fa-shoe-prints"></i>';
        }

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
        const ageCard = document.getElementById('box-age');
        const ageEl = document.getElementById('p-age-val');
        if (profile.age !== undefined && profile.age !== null && String(profile.age).trim() !== '') {
            ageCard?.classList.remove('hidden');
            if (ageEl) ageEl.textContent = `${profile.age} años`;
        } else {
            ageCard?.classList.add('hidden'); // Ocultar si no hay edad
        }
        
        // Blood Type Card Visibility
        const bloodCard = document.getElementById('box-blood');
        const bloodEl = document.getElementById('p-blood-val');
        if (isPet || !profile.bloodType || profile.bloodType.trim() === '') {
            bloodCard?.classList.add('hidden'); // Ocultar si está vacío o es mascota
        } else {
            bloodCard?.classList.remove('hidden');
            if (bloodEl) bloodEl.textContent = profile.bloodType;
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
                }).catch(err => console.log("NFC scan info:", err));
            } catch (e) {
                console.log("NFC error:", e);
            }
        }
    }

    setupSimulatedScanner() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'n') {
                const slug = prompt("Simular lectura de Tag NFC (ingresa el slug):", "samuel");
                if (slug) {
                    this.renderSingleProfile(slug);
                }
            }
        });
    }
}

function startPublicApp() {
    window.app = new App();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPublicApp);
} else {
    startPublicApp();
}
