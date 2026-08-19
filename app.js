/* ==========================================================================
   NFC INFANTIL - PUBLIC PROFILE APP LOGIC (FIREBASE FIRESTORE REAL-TIME SINGLE SOURCE OF TRUTH)
   ========================================================================== */

import { 
    db, 
    collection, 
    onSnapshot, 
    INITIAL_PROFILES_SEED 
} from './firebase-config.js';

// Neutral SVG Silhouette for profiles without a custom photo
const NEUTRAL_AVATAR_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%2364748b'%3E%3Ccircle cx='50' cy='35' r='22'/%3E%3Cpath d='M18 85c0-18 14-30 32-30s32 12 32 30Z'/%3E%3C/svg%3E";

class ProfileApp {
    constructor() {
        this.profiles = [];
        this.init();
    }

    async init() {
        const targetSlug = this.getSlugFromUrl();

        // Listen to Firestore collection 'nfc_profiles' in real-time
        onSnapshot(collection(db, "nfc_profiles"), (snapshot) => {
            const loaded = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data) loaded.push(data);
            });

            if (loaded.length === 0) {
                this.profiles = INITIAL_PROFILES_SEED.map(p => this.sanitizeProfile(p));
            } else {
                this.profiles = this.deduplicateProfiles(loaded);
            }

            this.renderSingleProfile(targetSlug);
            document.documentElement.classList.add('ready');
        }, (error) => {
            console.error("Firestore Public App Realtime Listener Error:", error);
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

        let slug = (p.slug && String(p.slug).trim() !== '' && String(p.slug).trim() !== 'undefined') 
            ? String(p.slug).trim() 
            : 'perfil';

        let locationMapsUrl = (p.locationMapsUrl !== undefined && p.locationMapsUrl !== null) ? String(p.locationMapsUrl).trim() : '';

        let schoolMapsUrl = (p.schoolMapsUrl !== undefined && p.schoolMapsUrl !== null) ? String(p.schoolMapsUrl).trim() : '';
        let school = (p.school !== undefined && p.school !== null) ? String(p.school).trim() : '';
        let grade = (p.grade !== undefined && p.grade !== null) ? String(p.grade).trim() : '';
        let medicalConditions = (p.medicalConditions !== undefined && p.medicalConditions !== null) ? String(p.medicalConditions).trim() : '';
        let importantMedications = (p.importantMedications !== undefined && p.importantMedications !== null) ? String(p.importantMedications).trim() : '';

        const birthDate = (p.birthDate !== undefined && p.birthDate !== null) ? String(p.birthDate).trim() : '';
        const computedAge = this.calculateAgeFromBirthDate(birthDate, (p.age !== undefined && p.age !== null) ? p.age : '');
        const bloodType = gender === 'pet' ? '' : ((p.bloodType !== undefined && p.bloodType !== null && String(p.bloodType).trim() !== 'undefined') ? String(p.bloodType).trim() : '');
        const parentPhone = (p.parentPhone !== undefined && p.parentPhone !== null && String(p.parentPhone).trim() !== 'undefined') ? String(p.parentPhone).trim() : '';
        const parentPhone2 = (p.parentPhone2 !== undefined && p.parentPhone2 !== null && String(p.parentPhone2).trim() !== 'undefined' && String(p.parentPhone2).trim() !== 'null') ? String(p.parentPhone2).trim() : '';
        const whatsappMessage = (p.whatsappMessage && String(p.whatsappMessage).trim() !== '') ? String(p.whatsappMessage).trim() : 'Hola, encontré el perfil de {nombre}.';
        const photoUrl = (p.photoUrl !== undefined && p.photoUrl !== null && String(p.photoUrl).trim() !== 'undefined') ? String(p.photoUrl).trim() : '';

        return {
            id: p.id || `prof-${Date.now()}`,
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
        return result;
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
                const pSlug = p.slug.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
                return pSlug && (pSlug.includes(cleanSlug) || cleanSlug.includes(pSlug));
            });
        }

        // 5. If specific slug was requested and not found, return null (404 Not Found)
        if (!profile && cleanSlug && cleanSlug !== 'index' && cleanSlug !== 'home') {
            return null;
        }

        if (!profile) {
            profile = this.profiles[0];
        }

        return profile;
    }

    renderSingleProfile(rawSlug) {
        const profile = this.findProfileBySlug(rawSlug);

        const profileView = document.getElementById('view-profile');
        const inactiveView = document.getElementById('view-inactive');

        if (!profile) {
            this.showInactive("Perfil No Encontrado", `No existe ningún perfil registrado.`);
            return;
        }

        // GUARANTEE PROFILE VIEW IS VISIBLE
        if (profileView) {
            profileView.classList.remove('hidden');
            profileView.classList.add('active-view');
        }
        if (inactiveView) {
            inactiveView.classList.remove('active-view');
            inactiveView.classList.add('hidden');
        }

        // Apply Theme based on gender ('boy', 'girl', 'pet', 'senior')
        const urlParams = new URLSearchParams(window.location.search);
        const explicitGender = urlParams.get('gender');

        let themeClass = 'theme-boy';
        if (explicitGender === 'pet' || profile.gender === 'pet') {
            themeClass = 'theme-pet';
            profile.gender = 'pet';
        } else if (explicitGender === 'girl' || profile.gender === 'girl') {
            themeClass = 'theme-girl';
            profile.gender = 'girl';
        } else if (explicitGender === 'senior' || profile.gender === 'senior') {
            themeClass = 'theme-senior';
            profile.gender = 'senior';
        }

        document.body.className = themeClass;
        document.documentElement.classList.remove('theme-boy', 'theme-girl', 'theme-pet', 'theme-senior');
        document.documentElement.classList.add(themeClass, 'ready');
        this.renderFloatingDecorators(profile.gender);

        const isSenior = profile.gender === 'senior';
        const isGirl = profile.gender === 'girl';
        const isPet = profile.gender === 'pet';

        // Render Page Title
        document.title = isPet 
            ? `Perfil de ${profile.name} | Identificación de Mascota`
            : (isSenior ? `Perfil de ${profile.name} | Perfil de Seguridad Adulto Mayor` : `Perfil de ${profile.name} | NFC - COL`);

        const heroNameEl = document.getElementById('p-hero-name');
        if (heroNameEl) heroNameEl.textContent = profile.name;

        const subtitleEl = document.getElementById('p-badge-subtitle');
        if (subtitleEl) {
            subtitleEl.textContent = isPet 
                ? 'Identificación de Mascota' 
                : (isSenior ? 'Perfil de Seguridad' : 'Identificación Infantil');
        }

        const tagTextEl = document.getElementById('p-header-tag-text');
        if (tagTextEl) {
            tagTextEl.textContent = isPet 
                ? 'Mascota Registrada' 
                : (isSenior ? 'Adulto Mayor Registrado' : 'Perfil verificado');
        }

        // Photo rendering
        const photoEl = document.getElementById('p-photo');
        if (photoEl) {
            const hasPhoto = profile.photoUrl && profile.photoUrl.trim() !== '' && profile.photoUrl !== NEUTRAL_AVATAR_SVG;
            photoEl.src = hasPhoto ? profile.photoUrl.trim() : NEUTRAL_AVATAR_SVG;
            photoEl.alt = profile.name;
        }

        // Age / Birth Date
        const ageBox = document.getElementById('box-age');
        const ageValEl = document.getElementById('p-age');
        const computedAge = this.calculateAgeFromBirthDate(profile.birthDate, profile.age);
        if (ageBox && ageValEl) {
            if (computedAge !== '' && computedAge !== undefined && computedAge !== null) {
                ageValEl.textContent = `${computedAge} años`;
                ageBox.style.display = 'flex';
            } else {
                ageBox.style.display = 'none';
            }
        }

        // Blood Type
        const bloodBox = document.getElementById('box-blood');
        const bloodValEl = document.getElementById('p-blood');
        if (bloodBox && bloodValEl) {
            if (!isPet && profile.bloodType && profile.bloodType.trim() !== '' && profile.bloodType.toUpperCase() !== 'N/A') {
                bloodValEl.textContent = profile.bloodType.trim();
                bloodBox.style.display = 'flex';
            } else {
                bloodBox.style.display = 'none';
            }
        }

        // School Information
        const schoolBox = document.getElementById('box-school');
        const schoolValEl = document.getElementById('p-school');
        if (schoolBox && schoolValEl) {
            if (!isPet && !isSenior && profile.school && profile.school.trim() !== '') {
                schoolValEl.textContent = profile.school.trim();
                schoolBox.style.display = 'flex';
            } else {
                schoolBox.style.display = 'none';
            }
        }

        // Grade Information
        const gradeBox = document.getElementById('box-grade');
        const gradeValEl = document.getElementById('p-grade');
        if (gradeBox && gradeValEl) {
            if (!isPet && !isSenior && profile.grade && profile.grade.trim() !== '') {
                gradeValEl.textContent = profile.grade.trim();
                gradeBox.style.display = 'flex';
            } else {
                gradeBox.style.display = 'none';
            }
        }

        // Medical Conditions
        const medicalBox = document.getElementById('box-medical');
        const medicalValEl = document.getElementById('p-medical');
        if (medicalBox && medicalValEl) {
            if (!isPet && profile.medicalConditions && profile.medicalConditions.trim() !== '') {
                medicalValEl.textContent = profile.medicalConditions.trim();
                medicalBox.style.display = 'block';
            } else {
                medicalBox.style.display = 'none';
            }
        }

        // Primary WhatsApp Contact
        const waBtn1 = document.getElementById('btn-whatsapp-action');
        const waMainText1 = document.getElementById('wa-main-text-1');
        const waSubText1 = document.getElementById('wa-sub-text-1');
        
        if (waBtn1) {
            const hasPhone1 = profile.parentPhone && profile.parentPhone.trim() !== '';
            if (hasPhone1) {
                const phoneClean = profile.parentPhone.replace(/[^0-9]/g, '');
                let rawMsg = profile.whatsappMessage;
                if (!rawMsg || rawMsg.trim() === '') {
                    rawMsg = isPet
                        ? 'Hola, encontré a la mascota {nombre} y quiero comunicarme con su dueño.'
                        : (isSenior ? 'Hola, encontré el perfil de seguridad del adulto mayor {nombre} y quiero comunicarme con sus familiares.' : 'Hola, encontré la información del perfil de {nombre}.');
                }
                const msgFinal = rawMsg.replace(/\{nombre\}/gi, profile.name);
                waBtn1.href = `https://wa.me/${phoneClean}?text=${encodeURIComponent(msgFinal)}`;
                waBtn1.style.display = 'flex';

                if (waMainText1) {
                    waMainText1.textContent = (isPet || isSenior || isGirl) ? 'Contacto Principal' : 'Contactar a mis papás';
                }
                if (waSubText1) waSubText1.textContent = 'Escríbenos por WhatsApp';
            } else {
                waBtn1.style.display = 'none';
            }
        }

        // Secondary WhatsApp Contact
        const waBtn2 = document.getElementById('btn-whatsapp-action-2');
        const waMainText2 = document.getElementById('wa-main-text-2');
        const waSubText2 = document.getElementById('wa-sub-text-2');

        if (waBtn2) {
            const hasPhone2 = profile.parentPhone2 && profile.parentPhone2.trim() !== '' && profile.parentPhone2.trim() !== 'null';
            if (hasPhone2) {
                const phoneClean2 = profile.parentPhone2.replace(/[^0-9]/g, '');
                let rawMsg2 = profile.whatsappMessage;
                if (!rawMsg2 || rawMsg2.trim() === '') {
                    rawMsg2 = isPet
                        ? 'Hola, encontré a la mascota {nombre} y quiero comunicarme con su dueño.'
                        : (isSenior ? 'Hola, encontré el perfil de seguridad del adulto mayor {nombre} y quiero comunicarme con sus familiares.' : 'Hola, encontré la información del perfil de {nombre}.');
                }
                const msgFinal2 = rawMsg2.replace(/\{nombre\}/gi, profile.name);
                waBtn2.href = `https://wa.me/${phoneClean2}?text=${encodeURIComponent(msgFinal2)}`;
                waBtn2.style.display = 'flex';

                if (waMainText2) {
                    waMainText2.textContent = 'Contacto Alterno';
                }
                if (waSubText2) waSubText2.textContent = 'Escríbenos por WhatsApp';
            } else {
                waBtn2.style.display = 'none';
            }
        }

        // Google Maps Location
        const mapsBtn = document.getElementById('btn-location-action');
        if (mapsBtn) {
            const hasMaps = profile.locationMapsUrl && profile.locationMapsUrl.trim() !== '';
            if (hasMaps) {
                mapsBtn.href = profile.locationMapsUrl.trim();
                mapsBtn.style.display = 'flex';
            } else {
                mapsBtn.style.display = 'none';
            }
        }

        // Footer Tag Text
        const footerTag = document.getElementById('p-footer-tag');
        if (footerTag) {
            footerTag.innerHTML = isPet
                ? `<i class="fa-solid fa-bone" style="margin-right: 4px;"></i> Mascota protegida con amor <i class="fa-solid fa-heart" style="color: #38bdf8; margin-left: 4px;"></i>`
                : `<i class="fa-solid fa-shield-heart"></i> Protegido con amor <i class="fa-solid fa-heart" style="color: #ec4899;"></i>`;
        }
    }

    renderFloatingDecorators(gender) {
        const float1 = document.getElementById('float-decor-1');
        const float2 = document.getElementById('float-decor-2');
        const float3 = document.getElementById('float-decor-3');

        const sceneLeft = document.getElementById('scene-left');
        const sceneRight = document.getElementById('scene-right');

        if (gender === 'girl') {
            if (float1) float1.className = 'floating-icon icon-1 fa-solid fa-wand-magic-sparkles';
            if (float2) float2.className = 'floating-icon icon-2 fa-solid fa-star';
            if (float3) float3.className = 'floating-icon icon-3 fa-solid fa-heart';
            if (sceneLeft) sceneLeft.innerHTML = '<i class="fa-solid fa-cloud-moon"></i>';
            if (sceneRight) sceneRight.innerHTML = '<i class="fa-solid fa-sparkles"></i>';
        } else if (gender === 'pet') {
            if (float1) float1.className = 'floating-icon icon-1 fa-solid fa-paw';
            if (float2) float2.className = 'floating-icon icon-2 fa-solid fa-bone';
            if (float3) float3.className = 'floating-icon icon-3 fa-solid fa-heart';
            if (sceneLeft) sceneLeft.innerHTML = '<i class="fa-solid fa-house"></i>';
            if (sceneRight) sceneRight.innerHTML = '<i class="fa-solid fa-shield-cat"></i>';
        } else if (gender === 'senior') {
            if (float1) float1.className = 'floating-icon icon-1 fa-solid fa-shield-halved';
            if (float2) float2.className = 'floating-icon icon-2 fa-solid fa-heart-pulse';
            if (float3) float3.className = 'floating-icon icon-3 fa-solid fa-hand-holding-heart';
            if (sceneLeft) sceneLeft.innerHTML = '<i class="fa-solid fa-sun"></i>';
            if (sceneRight) sceneRight.innerHTML = '<i class="fa-solid fa-user-shield"></i>';
        } else {
            if (float1) float1.className = 'floating-icon icon-1 fa-solid fa-rocket';
            if (float2) float2.className = 'floating-icon icon-2 fa-solid fa-atom';
            if (float3) float3.className = 'floating-icon icon-3 fa-solid fa-user-astronaut';
            if (sceneLeft) sceneLeft.innerHTML = '<i class="fa-solid fa-tree"></i>';
            if (sceneRight) sceneRight.innerHTML = '<i class="fa-solid fa-paw"></i>';
        }
    }

    showInactive(title, desc) {
        const profileView = document.getElementById('view-profile');
        const inactiveView = document.getElementById('view-inactive');

        if (profileView) {
            profileView.classList.remove('active-view');
            profileView.classList.add('hidden');
        }

        if (inactiveView) {
            inactiveView.classList.remove('hidden');
            inactiveView.classList.add('active-view');

            const titleEl = document.getElementById('inactive-title');
            const descEl = document.getElementById('inactive-desc');
            if (titleEl) titleEl.textContent = title;
            if (descEl) descEl.textContent = desc;
        }

        document.documentElement.classList.add('ready');
    }
}

export let profileApp;
document.addEventListener('DOMContentLoaded', () => {
    profileApp = new ProfileApp();
    window.profileApp = profileApp;
});
