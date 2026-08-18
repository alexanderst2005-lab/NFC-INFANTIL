/* ==========================================================================
   NFC INFANTIL - PUBLIC CHILD PROFILE APP LOGIC
   ========================================================================== */

const CLOUD_DB_ENDPOINT = "/api/sync";

// Neutral SVG Silhouette for profiles without a custom photo
const NEUTRAL_AVATAR_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%2364748b'%3E%3Ccircle cx='50' cy='35' r='22'/%3E%3Cpath d='M18 85c0-18 14-30 32-30s32 12 32 30Z'/%3E%3C/svg%3E";

const DEFAULT_PROFILES = [
    {
        id: "prof-001",
        slug: "samuel",
        name: "Samuel Arias Rodríguez",
        gender: "boy",
        age: 13,
        bloodType: "B+",
        parentPhone: "573001234567",
        whatsappMessage: "Hola, encontré la información del perfil de Samuel y me gustaría comunicarme con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: new Date().toISOString()
    },
    {
        id: "prof-002",
        slug: "valentina",
        name: "Valentina Gómez",
        gender: "girl",
        age: 5,
        bloodType: "A+",
        parentPhone: "573159876543",
        whatsappMessage: "Hola, encontré la información del perfil de Valentina y quiero comunicarme con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1595454223600-91fb272189d5?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: new Date().toISOString()
    },
    {
        id: "prof-003",
        slug: "juan",
        name: "Juan Diego Benítez",
        gender: "boy",
        age: 7,
        bloodType: "B+",
        parentPhone: "573204445566",
        whatsappMessage: "Hola, encontré la información del perfil de Juan Diego y me comunico con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: new Date().toISOString()
    },
    {
        id: "prof-004",
        slug: "sofia",
        name: "Sofía Rodríguez",
        gender: "girl",
        age: 4,
        bloodType: "AB+",
        parentPhone: "573108889900",
        whatsappMessage: "Hola, estoy escaneando la pulsera NFC de Sofía y me comunico con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: new Date().toISOString()
    }
];

class ProfileApp {
    constructor() {
        this.profiles = [];
        this.init();
    }

    async init() {
        const targetSlug = this.getSlugFromUrl();
        this.loadProfilesLocal();

        // 1. Render immediately from local memory
        this.renderSingleProfile(targetSlug);

        // 2. Fetch latest Cloud DB automatically
        await this.syncFromCloudDB();

        // 3. Re-render immediately with updated cloud data
        this.renderSingleProfile(targetSlug);
    }

    sanitizeProfile(p) {
        if (!p) return null;
        let baseDefault = DEFAULT_PROFILES.find(d => d.id === p.id || d.slug === p.slug);

        const name = (p.name && String(p.name).trim() !== '' && String(p.name).trim() !== 'undefined') 
            ? String(p.name).trim() 
            : (baseDefault ? baseDefault.name : 'Perfil');
        
        const gender = (p.gender === 'girl' || p.gender === 'boy') 
            ? p.gender 
            : (baseDefault ? baseDefault.gender : 'boy');

        let slug = (p.slug && String(p.slug).trim() !== '' && String(p.slug).trim() !== 'undefined') 
            ? String(p.slug).trim() 
            : (baseDefault ? baseDefault.slug : name.toLowerCase().replace(/[^a-z0-9]/g, '-'));

        // Purge old demo Google Maps URLs out of localStorage
        let locationMapsUrl = (p.locationMapsUrl !== undefined && p.locationMapsUrl !== null) ? String(p.locationMapsUrl).trim() : '';
        if (locationMapsUrl.includes('maps.google.com/?q=4.6853') || 
            locationMapsUrl.includes('maps.google.com/?q=6.2088') || 
            locationMapsUrl.includes('maps.google.com/?q=4.6581') || 
            locationMapsUrl.includes('maps.google.com/?q=3.4516')) {
            locationMapsUrl = '';
        }

        let schoolMapsUrl = (p.schoolMapsUrl !== undefined && p.schoolMapsUrl !== null) ? String(p.schoolMapsUrl).trim() : '';

        return {
            id: p.id || `prof-${Date.now()}`,
            slug: slug,
            name: name,
            gender: gender,
            age: parseInt(p.age) > 0 ? parseInt(p.age) : (baseDefault ? baseDefault.age : 5),
            bloodType: (p.bloodType && String(p.bloodType).trim() !== '' && String(p.bloodType) !== 'undefined') ? String(p.bloodType).trim() : (baseDefault ? baseDefault.bloodType : 'O+'),
            parentPhone: (p.parentPhone && String(p.parentPhone).trim() !== '' && String(p.parentPhone) !== 'undefined') ? String(p.parentPhone).trim() : (baseDefault ? baseDefault.parentPhone : ''),
            whatsappMessage: (p.whatsappMessage && String(p.whatsappMessage).trim() !== '') ? String(p.whatsappMessage).trim() : (baseDefault ? baseDefault.whatsappMessage : 'Hola, encontré la información del perfil de {nombre}.'),
            locationMapsUrl: locationMapsUrl,
            schoolMapsUrl: schoolMapsUrl,
            photoUrl: (p.photoUrl && String(p.photoUrl).trim() !== '' && String(p.photoUrl) !== 'undefined') ? String(p.photoUrl).trim() : '',
            active: true,
            createdAt: p.createdAt || new Date().toISOString()
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

    loadProfilesLocal() {
        const stored = localStorage.getItem('nfc_profiles_db');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.profiles = this.deduplicateProfiles(parsed);
                } else {
                    this.profiles = this.deduplicateProfiles(DEFAULT_PROFILES);
                }
            } catch (e) {
                this.profiles = this.deduplicateProfiles(DEFAULT_PROFILES);
            }
        } else {
            this.profiles = this.deduplicateProfiles(DEFAULT_PROFILES);
        }
        this.saveProfilesLocal();
    }

    saveProfilesLocal() {
        this.profiles = this.deduplicateProfiles(this.profiles);
        localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));
    }

    mergeSingleProfile(base, override) {
        if (!base) return override;
        if (!override) return base;

        const photo = (override.photoUrl && override.photoUrl.trim() !== '' && override.photoUrl !== NEUTRAL_AVATAR_SVG)
            ? override.photoUrl
            : (base.photoUrl || '');

        const location = (override.locationMapsUrl && override.locationMapsUrl.trim() !== '')
            ? override.locationMapsUrl
            : (base.locationMapsUrl || '');

        const school = (override.school && override.school.trim() !== '')
            ? override.school
            : (base.school || '');

        const grade = (override.grade && override.grade.trim() !== '')
            ? override.grade
            : (base.grade || '');

        const medical = (override.medicalConditions && override.medicalConditions.trim() !== '')
            ? override.medicalConditions
            : (base.medicalConditions || '');

        return {
            ...base,
            ...override,
            photoUrl: photo,
            locationMapsUrl: location,
            school: school,
            grade: grade,
            medicalConditions: medical
        };
    }

    mergeAndPreserveProfiles(localProfiles = [], cloudProfiles = []) {
        const deletedIds = JSON.parse(localStorage.getItem('nfc_deleted_ids') || '[]');
        const profileMap = new Map();

        // 1. Load Cloud Profiles (excluding explicitly deleted ones)
        cloudProfiles.forEach(p => {
            if (p && p.id && !deletedIds.includes(p.id)) {
                profileMap.set(p.id, { ...p });
            }
        });

        // 2. Merge Local Profiles (preserving user custom data across serverless cold-starts)
        localProfiles.forEach(p => {
            if (p && p.id && !deletedIds.includes(p.id)) {
                if (profileMap.has(p.id)) {
                    const existing = profileMap.get(p.id);
                    const pTime = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
                    const exTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;

                    if (pTime >= exTime) {
                        profileMap.set(p.id, this.mergeSingleProfile(existing, p));
                    } else {
                        profileMap.set(p.id, this.mergeSingleProfile(p, existing));
                    }
                } else {
                    // Local profile not in cloud (user created it & serverless cold-started) -> PRESERVE IT!
                    profileMap.set(p.id, { ...p });
                }
            }
        });

        return Array.from(profileMap.values());
    }

    async syncFromCloudDB() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const cacheBustUrl = `${CLOUD_DB_ENDPOINT}?t=${Date.now()}`;
            const res = await fetch(cacheBustUrl, { cache: 'no-store', signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const jsonRes = await res.json();
                const cloudProfiles = jsonRes && Array.isArray(jsonRes.profiles) ? jsonRes.profiles : [];

                if (Array.isArray(cloudProfiles) && cloudProfiles.length > 0) {
                    const sanitizedCloud = this.deduplicateProfiles(cloudProfiles);
                    if (JSON.stringify(sanitizedCloud) !== JSON.stringify(this.profiles)) {
                        this.profiles = sanitizedCloud;
                        this.saveProfilesLocal();
                        const currentSlug = this.getSlugFromUrl();
                        if (currentSlug) this.renderSingleProfile(currentSlug);
                    }
                }
            }
        } catch (err) {
            console.log("Cloud sync load offline, using LocalStorage:", err);
        }
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

        // 5. Ultimate Fallback: Default to first profile if still not found
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

        // Apply Theme based on gender ('boy', 'girl', 'pet')
        let themeClass = 'theme-boy';
        if (profile.gender === 'girl') themeClass = 'theme-girl';
        else if (profile.gender === 'pet') themeClass = 'theme-pet';

        document.body.className = themeClass;
        document.documentElement.className = themeClass;
        this.renderFloatingDecorators(profile.gender);

        // Render Page Title
        document.title = profile.gender === 'pet' 
            ? `Perfil de ${profile.name} | Identificación de Mascota`
            : `Perfil de ${profile.name} | NFC Seguridad Infantil`;

        const heroNameEl = document.getElementById('p-hero-name');
        if (heroNameEl) heroNameEl.textContent = profile.name;

        const topBrandTitleEl = document.getElementById('p-top-brand-title');
        if (topBrandTitleEl) {
            topBrandTitleEl.textContent = profile.gender === 'pet' ? 'Identificación de Mascota' : 'Identificación Infantil';
        }

        const genderTextEl = document.getElementById('p-gender-text');
        if (genderTextEl) {
            genderTextEl.innerHTML = profile.gender === 'pet' 
                ? '<i class="fa-solid fa-paw"></i> Mascota Registrada' 
                : 'Perfil verificado';
        }

        const securityRibbonEl = document.getElementById('p-security-ribbon');
        if (securityRibbonEl) {
            securityRibbonEl.textContent = profile.gender === 'pet' ? 'Perfil de mascota 🐾' : 'Mi perfil de seguridad';
        }

        const footerTagEl = document.getElementById('p-footer-tag');
        if (footerTagEl) {
            if (profile.gender === 'girl') {
                footerTagEl.innerHTML = '<i class="fa-solid fa-shield-heart"></i> Protegida con amor <i class="fa-solid fa-heart" style="color: #ec4899;"></i>';
            } else if (profile.gender === 'pet') {
                footerTagEl.innerHTML = '<i class="fa-solid fa-paw"></i> Mascota protegida con amor <i class="fa-solid fa-heart" style="color: #10b981;"></i>';
            } else {
                footerTagEl.innerHTML = '<i class="fa-solid fa-shield-heart"></i> Protegido con amor <i class="fa-solid fa-heart" style="color: #38bdf8;"></i>';
            }
        }

        const ageValEl = document.getElementById('p-age-val') || document.getElementById('p-age');
        if (ageValEl) ageValEl.textContent = `${profile.age} años`;

        const ageIconEl = document.getElementById('p-age-icon');
        if (ageIconEl) {
            ageIconEl.className = profile.gender === 'pet' ? 'fa-solid fa-paw' : 'fa-solid fa-cake-candles';
        }

        const bloodValEl = document.getElementById('p-blood-val') || document.getElementById('p-blood');
        if (bloodValEl) bloodValEl.textContent = profile.bloodType || (profile.gender === 'pet' ? 'N/A' : 'O+');

        const boxBloodEl = document.getElementById('box-blood');
        if (boxBloodEl && profile.gender === 'pet' && (profile.bloodType === 'N/A' || !profile.bloodType)) {
            // For pets with N/A blood, keep card clean
        }

        // 1. School Optional Box
        const schoolBoxEl = document.getElementById('box-school');
        const schoolValEl = document.getElementById('p-school');
        if (profile.school && String(profile.school).trim() !== '') {
            if (schoolValEl) schoolValEl.textContent = profile.school.trim();
            if (schoolBoxEl) schoolBoxEl.classList.remove('hidden');
        } else if (schoolBoxEl) {
            schoolBoxEl.classList.add('hidden');
        }

        // 2. Grade Optional Box
        const gradeBoxEl = document.getElementById('box-grade');
        const gradeValEl = document.getElementById('p-grade');
        if (profile.grade && String(profile.grade).trim() !== '') {
            if (gradeValEl) gradeValEl.textContent = profile.grade.trim();
            if (gradeBoxEl) gradeBoxEl.classList.remove('hidden');
        } else if (gradeBoxEl) {
            gradeBoxEl.classList.add('hidden');
        }

        // 3. Medical / Special Care Notes Optional Box
        const medicalBoxEl = document.getElementById('box-medical');
        const medicalValEl = document.getElementById('p-medical-notes');
        if (profile.medicalConditions && String(profile.medicalConditions).trim() !== '') {
            if (medicalValEl) medicalValEl.textContent = profile.medicalConditions.trim();
            if (medicalBoxEl) medicalBoxEl.classList.remove('hidden');
        } else if (medicalBoxEl) {
            medicalBoxEl.classList.add('hidden');
        }

        // Update Mockup Deco Icons per Gender
        const isGirl = profile.gender === 'girl';
        const isPet = profile.gender === 'pet';
        
        const topLeftDeco = document.getElementById('deco-top-left');
        if (topLeftDeco) {
            topLeftDeco.innerHTML = isPet ? '<i class="fa-solid fa-paw"></i>' : (isGirl ? '<i class="fa-solid fa-feather-pointed"></i>' : '<i class="fa-solid fa-rocket"></i>');
        }

        const topRightDeco = document.getElementById('deco-top-right');
        if (topRightDeco) {
            topRightDeco.innerHTML = isPet ? '<i class="fa-solid fa-bone"></i>' : (isGirl ? '<i class="fa-solid fa-rainbow"></i>' : '<i class="fa-solid fa-atom"></i>');
        }

        const bottomRightDeco = document.getElementById('deco-bottom-right');
        if (bottomRightDeco) {
            bottomRightDeco.innerHTML = isPet ? '<i class="fa-solid fa-heart"></i>' : (isGirl ? '<i class="fa-solid fa-wand-magic-sparkles"></i>' : '<i class="fa-solid fa-user-astronaut"></i>');
        }

        const bloodIconEl = document.getElementById('p-blood-icon');
        if (bloodIconEl) {
            bloodIconEl.innerHTML = isPet ? '<i class="fa-solid fa-paw"></i>' : (isGirl ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-solid fa-droplet"></i>');
        }

        const sceneLeft = document.getElementById('scene-left');
        if (sceneLeft) {
            sceneLeft.innerHTML = isPet ? '<i class="fa-solid fa-bone"></i>' : (isGirl ? '<i class="fa-solid fa-seedling"></i>' : '<i class="fa-solid fa-tree"></i>');
        }

        const sceneRight = document.getElementById('scene-right');
        if (sceneRight) {
            sceneRight.innerHTML = isPet ? '<i class="fa-solid fa-paw"></i>' : (isGirl ? '<i class="fa-solid fa-chess-rook"></i>' : '<i class="fa-solid fa-paw"></i>');
        }

        // Avatar Photo
        const avatarEl = document.getElementById('p-avatar');
        if (avatarEl) {
            avatarEl.src = (profile.photoUrl && profile.photoUrl.trim() !== '') ? profile.photoUrl : NEUTRAL_AVATAR_SVG;
        }

        // WhatsApp Link Generator ("CONTACTAR A MIS PAPÁS" / "CONTACTAR A MI DUEÑO")
        const waBtn = document.getElementById('btn-whatsapp-action');
        if (waBtn) {
            const mainTextEl = waBtn.querySelector('.btn-main-text');
            if (mainTextEl) {
                mainTextEl.textContent = isPet ? 'Contactar a mi dueño' : 'Contactar a mis papás';
            }

            const phone = (profile.parentPhone && String(profile.parentPhone).trim() !== '' && String(profile.parentPhone) !== 'undefined') ? String(profile.parentPhone).trim() : '573001234567';
            
            const defaultMsg = isPet
                ? `Hola, encontré a la mascota ${profile.name} y quiero comunicarme con su dueño.`
                : `Hola, encontré la información del perfil de ${profile.name} y me gustaría comunicarme con sus padres.`;

            const customMsg = profile.whatsappMessage || defaultMsg;
            const formattedMsg = customMsg.replace('{nombre}', profile.name);
            const waCleanPhone = phone.replace(/[^0-9]/g, '');
            
            waBtn.href = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(formattedMsg)}`;
            waBtn.style.display = 'flex';
        }

        // Location Link Generator ("Ver ubicación" - OPCIONAL: Oculto si no hay link, visible con link)
        const mapsBtn = document.getElementById('btn-location-action');
        if (mapsBtn) {
            const hasLocation = profile.locationMapsUrl && 
                String(profile.locationMapsUrl).trim() !== '' && 
                String(profile.locationMapsUrl) !== 'undefined';

            if (hasLocation) {
                const url = String(profile.locationMapsUrl).trim();
                mapsBtn.href = url.startsWith('http') ? url : `https://maps.google.com/?q=${encodeURIComponent(url)}`;
                mapsBtn.classList.remove('hidden-btn');
                mapsBtn.style.setProperty('display', 'flex', 'important');
            } else {
                mapsBtn.classList.add('hidden-btn');
                mapsBtn.style.setProperty('display', 'none', 'important');
            }
        }
    }

    showInactive(title, message) {
        const profileView = document.getElementById('view-profile');
        const inactiveView = document.getElementById('view-inactive');

        if (profileView) {
            profileView.classList.remove('active-view');
            profileView.classList.add('hidden');
        }
        if (inactiveView) {
            inactiveView.classList.remove('hidden');
            inactiveView.classList.add('active-view');
        }

        const titleEl = document.getElementById('inactive-title');
        const descEl = document.getElementById('inactive-desc');
        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = message;
    }

    renderFloatingDecorators(gender) {
        const container = document.getElementById('floating-decorators-container');
        if (!container) return;

        const boyIcons = ['fa-rocket', 'fa-user-astronaut', 'fa-star', 'fa-cloud-moon', 'fa-compass', 'fa-shuttle-space'];
        const girlIcons = ['fa-wand-magic-sparkles', 'fa-heart', 'fa-sun', 'fa-cloud', 'fa-feather', 'fa-spa'];
        const petIcons = ['fa-paw', 'fa-bone', 'fa-heart', 'fa-paw', 'fa-bone', 'fa-shield-dog'];
        
        let icons = boyIcons;
        if (gender === 'girl') icons = girlIcons;
        else if (gender === 'pet') icons = petIcons;

        container.innerHTML = icons.map((icon, idx) => `
            <div class="decorator dec-${idx + 1}">
                <i class="fa-solid ${icon}"></i>
            </div>
        `).join('');
    }
}

let profileApp;
document.addEventListener('DOMContentLoaded', () => {
    profileApp = new ProfileApp();
});
