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
    },
    {
        id: "prof-005",
        slug: "max",
        name: "Max",
        gender: "pet",
        age: 3,
        bloodType: "",
        parentPhone: "573001234567",
        whatsappMessage: "Hola, encontré a la mascota Max y quiero comunicarme con su dueño.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        school: "",
        grade: "",
        medicalConditions: "",
        photoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: new Date().toISOString()
    },
    {
        id: "prof-006-jose",
        slug: "jose-ramirez",
        name: "José Ramírez",
        gender: "senior",
        birthDate: "1952-08-15",
        age: 74,
        bloodType: "O+",
        parentPhone: "573109876543",
        parentPhone2: "573209998877",
        whatsappMessage: "Hola, encontré el perfil de seguridad del adulto mayor José Ramírez y quiero comunicarme con sus familiares.",
        locationMapsUrl: "https://maps.google.com/?q=4.6097,74.0817",
        schoolMapsUrl: "",
        school: "",
        grade: "",
        medicalConditions: "",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
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

        // 2. Fetch latest Cloud DB automatically (syncFromCloudDB re-renders only if data changed)
        await this.syncFromCloudDB();

        // 3. Continuous background auto-sync polling every 4 seconds
        setInterval(() => this.syncFromCloudDB(), 4000);
        window.addEventListener('focus', () => this.syncFromCloudDB());
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.syncFromCloudDB();
        });
    }

    calculateAgeFromBirthDate(birthDateStr, fallbackAge = 5) {
        if (!birthDateStr || String(birthDateStr).trim() === '') {
            return parseInt(fallbackAge) >= 0 ? parseInt(fallbackAge) : 5;
        }
        const birthDate = new Date(birthDateStr);
        if (isNaN(birthDate.getTime())) {
            return parseInt(fallbackAge) >= 0 ? parseInt(fallbackAge) : 5;
        }
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age >= 0 ? age : 0;
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

        const birthDate = (p.birthDate !== undefined && p.birthDate !== null) ? String(p.birthDate).trim() : '';
        const computedAge = this.calculateAgeFromBirthDate(birthDate, p.age !== undefined ? p.age : 5);
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

    areProfilesEqual(listA, listB) {
        if (!Array.isArray(listA) || !Array.isArray(listB)) return false;
        if (listA.length !== listB.length) return false;
        for (let i = 0; i < listA.length; i++) {
            const pA = listA[i];
            const pB = listB[i];
            if (!pA || !pB) return false;
            if (pA.id !== pB.id || pA.slug !== pB.slug || pA.name !== pB.name || pA.updatedAt !== pB.updatedAt || pA.parentPhone !== pB.parentPhone || pA.parentPhone2 !== pB.parentPhone2) {
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

        let mergedGender = override.gender || base.gender || 'boy';
        if (override.gender && override.gender !== 'boy') {
            mergedGender = override.gender;
        } else if (base.gender && base.gender !== 'boy') {
            mergedGender = base.gender;
        }
        if (override.id === 'prof-006-jose' || base.id === 'prof-006-jose' || (override.slug && String(override.slug).includes('jose-ramirez')) || (base.slug && String(base.slug).includes('jose-ramirez'))) {
            mergedGender = 'senior';
        }

        return {
            ...base,
            ...override,
            name: (override.name && override.name.trim() !== '') ? override.name.trim() : (base.name || 'Perfil'),
            gender: mergedGender,
            birthDate: override.birthDate !== undefined && override.birthDate !== '' ? override.birthDate : (base.birthDate || ''),
            age: override.age !== undefined ? override.age : (base.age || 5),
            bloodType: override.bloodType !== undefined && override.bloodType !== '' ? override.bloodType : (base.bloodType || ''),
            parentPhone: override.parentPhone !== undefined && override.parentPhone !== '' ? override.parentPhone : (base.parentPhone || ''),
            parentPhone2: override.parentPhone2 !== undefined && override.parentPhone2 !== '' ? override.parentPhone2 : (base.parentPhone2 || ''),
            whatsappMessage: override.whatsappMessage !== undefined && override.whatsappMessage !== '' ? override.whatsappMessage : (base.whatsappMessage || ''),
            locationMapsUrl: override.locationMapsUrl !== undefined && override.locationMapsUrl !== '' ? override.locationMapsUrl : (base.locationMapsUrl || ''),
            schoolMapsUrl: override.schoolMapsUrl !== undefined && override.schoolMapsUrl !== '' ? override.schoolMapsUrl : (base.schoolMapsUrl || ''),
            school: override.school !== undefined && override.school !== '' ? override.school : (base.school || ''),
            grade: override.grade !== undefined && override.grade !== '' ? override.grade : (base.grade || ''),
            medicalConditions: override.medicalConditions !== undefined && override.medicalConditions !== '' ? override.medicalConditions : (base.medicalConditions || ''),
            importantMedications: override.importantMedications !== undefined && override.importantMedications !== '' ? override.importantMedications : (base.importantMedications || ''),
            photoUrl: (override.photoUrl && override.photoUrl.trim() !== '' && override.photoUrl !== NEUTRAL_AVATAR_SVG)
                ? override.photoUrl.trim()
                : (base.photoUrl || ''),
            updatedAt: override.updatedAt || base.updatedAt || new Date().toISOString()
        };
    }

    mergeAndPreserveProfiles(localProfiles = [], cloudProfiles = [], cloudDeletedIds = []) {
        // 1. Build Master Tombstone Set from both Local and Cloud immediately
        const localDeleted = JSON.parse(localStorage.getItem('nfc_deleted_ids') || '[]');
        const cloudDeleted = Array.isArray(cloudDeletedIds) ? cloudDeletedIds : [];
        const masterDeletedIds = Array.from(new Set([...localDeleted, ...cloudDeleted].filter(id => id && typeof id === 'string')));
        localStorage.setItem('nfc_deleted_ids', JSON.stringify(masterDeletedIds));

        const profileMap = new Map();

        // 2. Seed DEFAULT_PROFILES into profileMap first (unless in masterDeletedIds)
        DEFAULT_PROFILES.forEach(p => {
            if (p && p.id && !masterDeletedIds.includes(p.id)) {
                profileMap.set(p.id, this.sanitizeProfile({ ...p }));
            }
        });

        // 3. Load Local Profiles first into map
        localProfiles.forEach(p => {
            if (p && p.id && !masterDeletedIds.includes(p.id)) {
                const sanitized = this.sanitizeProfile(p);
                if (!sanitized) return;

                if (profileMap.has(p.id)) {
                    profileMap.set(p.id, this.mergeSingleProfile(profileMap.get(p.id), sanitized));
                } else {
                    profileMap.set(p.id, sanitized);
                }
            }
        });

        // 4. Merge Cloud Profiles (Cloud DB is Authoritative Master across devices)
        cloudProfiles.forEach(p => {
            if (p && p.id && !masterDeletedIds.includes(p.id)) {
                const sanitizedCloud = this.sanitizeProfile(p);
                if (!sanitizedCloud) return;

                if (profileMap.has(p.id)) {
                    const localProf = profileMap.get(p.id);
                    const cloudTime = new Date(sanitizedCloud.updatedAt || sanitizedCloud.createdAt || 0).getTime();
                    const localTime = new Date(localProf.updatedAt || localProf.createdAt || 0).getTime();

                    if (cloudTime >= localTime) {
                        // Cloud edit is newer or equal: Cloud overwrites local stale cache
                        profileMap.set(p.id, this.mergeSingleProfile(localProf, sanitizedCloud));
                    } else {
                        // Local edit is newer: Local overwrites cloud
                        profileMap.set(p.id, this.mergeSingleProfile(sanitizedCloud, localProf));
                    }
                } else {
                    profileMap.set(p.id, sanitizedCloud);
                }
            }
        });

        // 5. Final Filter: guarantee zero deleted profiles ever resurrect
        return Array.from(profileMap.values()).filter(p => p && p.id && !masterDeletedIds.includes(p.id));
    }

    async syncFromCloudDB() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const cacheBustUrl = `${CLOUD_DB_ENDPOINT}?t=${Date.now()}`;
            const res = await fetch(cacheBustUrl, { cache: 'no-store', signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const jsonRes = await res.json();
                if (jsonRes && Array.isArray(jsonRes.profiles)) {
                    const cloudProfiles = jsonRes.profiles;
                    const cloudDeletedIds = Array.isArray(jsonRes.deletedIds) ? jsonRes.deletedIds : [];
                    const merged = this.mergeAndPreserveProfiles(this.profiles, cloudProfiles, cloudDeletedIds);
                    const sanitizedMerged = this.deduplicateProfiles(merged);

                    if (!this.areProfilesEqual(sanitizedMerged, this.profiles)) {
                        this.profiles = sanitizedMerged;
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

        // 5. Ultimate Fallback: Smart category fallback to prevent theme flickering
        if (!profile) {
            if (document.documentElement.className.includes('theme-pet') || (cleanSlug && (cleanSlug.includes('max') || cleanSlug.includes('pet') || cleanSlug.includes('mascota')))) {
                profile = this.profiles.find(p => p && p.gender === 'pet') || this.profiles[0];
            } else if (document.documentElement.className.includes('theme-girl') || (cleanSlug && (cleanSlug.includes('valentina') || cleanSlug.includes('sofia')))) {
                profile = this.profiles.find(p => p && p.gender === 'girl') || this.profiles[0];
            } else {
                profile = this.profiles[0];
            }
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
        document.documentElement.className = themeClass;
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

        const topBrandTitleEl = document.getElementById('p-top-brand-title');
        if (topBrandTitleEl) {
            topBrandTitleEl.textContent = isPet ? 'Identificación de Mascota' : (isSenior ? 'Perfil de Seguridad' : 'Identificación Infantil');
        }

        const genderTextEl = document.getElementById('p-gender-text');
        if (genderTextEl) {
            genderTextEl.innerHTML = isPet 
                ? '<i class="fa-solid fa-paw"></i> Mascota Registrada' 
                : 'Perfil verificado';
        }

        const securityRibbonEl = document.getElementById('p-security-ribbon');
        if (securityRibbonEl) {
            securityRibbonEl.innerHTML = isPet 
                ? '<i class="fa-solid fa-paw"></i> Mi perfil de seguridad <i class="fa-solid fa-paw"></i>' 
                : (isSenior ? '<i class="fa-solid fa-shield-heart" style="color: #f77f00;"></i> Mi perfil de seguridad <i class="fa-solid fa-shield-heart" style="color: #f77f00;"></i>' : 'Mi perfil de seguridad');
        }

        const footerTagEl = document.getElementById('p-footer-tag');
        if (footerTagEl) {
            if (isSenior) {
                footerTagEl.innerHTML = '<i class="fa-solid fa-shield-heart" style="color: #f77f00;"></i> Protegido con amor <i class="fa-solid fa-heart" style="color: #f77f00;"></i>';
            } else if (isGirl) {
                footerTagEl.innerHTML = '<i class="fa-solid fa-shield-heart"></i> Protegida con amor <i class="fa-solid fa-heart" style="color: #ec4899;"></i>';
            } else if (isPet) {
                footerTagEl.innerHTML = '<i class="fa-solid fa-paw"></i> Mascota protegida con amor <i class="fa-solid fa-heart" style="color: #10b981;"></i>';
            } else {
                footerTagEl.innerHTML = '<i class="fa-solid fa-shield-heart"></i> Protegido con amor <i class="fa-solid fa-heart" style="color: #38bdf8;"></i>';
            }
        }

        // 1. Age Box Handling (Dynamic Hide if Empty)
        const computedAge = this.calculateAgeFromBirthDate(profile.birthDate, profile.age);
        const hasAge = (profile.birthDate && String(profile.birthDate).trim() !== '') || (computedAge > 0);
        const boxAgeEl = document.getElementById('box-age');
        
        if (hasAge && computedAge > 0) {
            const ageValEl = document.getElementById('p-age-val') || document.getElementById('p-age');
            if (ageValEl) ageValEl.textContent = `${computedAge} ${computedAge === 1 ? 'año' : 'años'}`;
            const ageIconEl = document.getElementById('p-age-icon');
            if (ageIconEl) ageIconEl.className = isPet ? 'fa-solid fa-paw' : (isSenior ? 'fa-solid fa-cake-candles' : 'fa-solid fa-cake-candles');
            if (boxAgeEl) {
                boxAgeEl.classList.remove('hidden');
                boxAgeEl.style.display = 'flex';
            }
        } else if (boxAgeEl) {
            boxAgeEl.classList.add('hidden');
            boxAgeEl.style.display = 'none';
        }

        // 2. Blood Type Box Handling (Dynamic Hide if Empty or N/A)
        const rawBlood = profile.bloodType ? String(profile.bloodType).trim() : '';
        const hasBlood = rawBlood !== '' && rawBlood.toUpperCase() !== 'N/A' && rawBlood !== 'undefined';
        const boxBloodEl = document.getElementById('box-blood');
        
        if (!isPet && hasBlood) {
            const bloodValEl = document.getElementById('p-blood-val') || document.getElementById('p-blood');
            if (bloodValEl) bloodValEl.textContent = rawBlood;
            if (boxBloodEl) {
                boxBloodEl.classList.remove('hidden');
                boxBloodEl.style.display = 'flex';
            }
        } else if (boxBloodEl) {
            boxBloodEl.classList.add('hidden');
            boxBloodEl.style.display = 'none';
        }

        // Adjust Grid layout dynamically if only 1 card is visible
        const cardsRowEl = document.querySelector('.info-cards-row');
        if (cardsRowEl) {
            const visibleAge = hasAge && computedAge > 0;
            const visibleBlood = !isPet && hasBlood;
            
            if (visibleAge && visibleBlood) {
                cardsRowEl.style.gridTemplateColumns = '1fr 1fr';
                cardsRowEl.style.display = 'grid';
            } else if (visibleAge || visibleBlood) {
                cardsRowEl.style.gridTemplateColumns = '1fr';
                cardsRowEl.style.display = 'grid';
            } else {
                cardsRowEl.style.display = 'none';
            }
        }

        // 3. School Box (HIDDEN for Senior or if Empty)
        const schoolBoxEl = document.getElementById('box-school');
        const schoolValEl = document.getElementById('p-school');
        if (!isSenior && profile.school && String(profile.school).trim() !== '') {
            if (schoolValEl) schoolValEl.textContent = profile.school.trim();
            if (schoolBoxEl) {
                schoolBoxEl.classList.remove('hidden');
                schoolBoxEl.style.display = 'flex';
            }
        } else if (schoolBoxEl) {
            schoolBoxEl.classList.add('hidden');
            schoolBoxEl.style.display = 'none';
        }

        // 4. Grade Box (HIDDEN for Senior or if Empty)
        const gradeBoxEl = document.getElementById('box-grade');
        const gradeValEl = document.getElementById('p-grade');
        if (!isSenior && profile.grade && String(profile.grade).trim() !== '') {
            if (gradeValEl) gradeValEl.textContent = profile.grade.trim();
            if (gradeBoxEl) {
                gradeBoxEl.classList.remove('hidden');
                gradeBoxEl.style.display = 'flex';
            }
        } else if (gradeBoxEl) {
            gradeBoxEl.classList.add('hidden');
            gradeBoxEl.style.display = 'none';
        }

        // 5. Medical Box (HIDDEN if Empty)
        const medicalBoxEl = document.getElementById('box-medical');
        const medicalValEl = document.getElementById('p-medical-notes');
        if (profile.medicalConditions && String(profile.medicalConditions).trim() !== '') {
            if (medicalValEl) medicalValEl.textContent = profile.medicalConditions.trim();
            if (medicalBoxEl) {
                medicalBoxEl.classList.remove('hidden');
                medicalBoxEl.style.display = 'block';
            }
        } else if (medicalBoxEl) {
            medicalBoxEl.classList.add('hidden');
            medicalBoxEl.style.display = 'none';
        }

        // 6. Important Medications Box (HIDDEN if Empty)
        const medicationsBoxEl = document.getElementById('box-medications');
        const medicationsValEl = document.getElementById('p-medications-notes');
        if (profile.importantMedications && String(profile.importantMedications).trim() !== '') {
            if (medicationsValEl) medicationsValEl.textContent = profile.importantMedications.trim();
            if (medicationsBoxEl) {
                medicationsBoxEl.classList.remove('hidden');
                medicationsBoxEl.style.display = 'block';
            }
        } else if (medicationsBoxEl) {
            medicationsBoxEl.classList.add('hidden');
            medicationsBoxEl.style.display = 'none';
        }

        const bloodIconEl = document.getElementById('p-blood-icon');
        if (bloodIconEl) {
            bloodIconEl.innerHTML = isPet ? '<i class="fa-solid fa-paw"></i>' : (isGirl ? '<i class="fa-solid fa-heart"></i>' : '<i class="fa-solid fa-droplet"></i>');
        }

        // Dynamic Arch Floating Badges per theme
        const decoTl = document.getElementById('p-deco-tl');
        const decoTr = document.getElementById('p-deco-tr');
        const decoBr = document.getElementById('p-deco-br');

        if (isPet) {
            if (decoTl) { decoTl.style.display = 'block'; decoTl.innerHTML = '<i class="fa-solid fa-house-chimney"></i>'; }
            if (decoTr) { decoTr.style.display = 'block'; decoTr.innerHTML = '<i class="fa-solid fa-bone"></i>'; }
            if (decoBr) { decoBr.style.display = 'block'; decoBr.innerHTML = '<i class="fa-solid fa-heart"></i>'; }
        } else if (isGirl) {
            if (decoTl) { decoTl.style.display = 'block'; decoTl.innerHTML = '<i class="fa-solid fa-crown"></i>'; }
            if (decoTr) { decoTr.style.display = 'block'; decoTr.innerHTML = '<i class="fa-solid fa-star"></i>'; }
            if (decoBr) { decoBr.style.display = 'block'; decoBr.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>'; }
        } else if (isSenior) {
            if (decoTl) { decoTl.style.display = 'none'; decoTl.innerHTML = ''; }
            if (decoTr) { decoTr.style.display = 'none'; decoTr.innerHTML = ''; }
            if (decoBr) { decoBr.style.display = 'none'; decoBr.innerHTML = ''; }
        } else {
            // Boy
            if (decoTl) { decoTl.style.display = 'block'; decoTl.innerHTML = '<i class="fa-solid fa-rocket"></i>'; }
            if (decoTr) { decoTr.style.display = 'block'; decoTr.innerHTML = '<i class="fa-solid fa-atom"></i>'; }
            if (decoBr) { decoBr.style.display = 'block'; decoBr.innerHTML = '<i class="fa-solid fa-user-astronaut"></i>'; }
        }

        const sceneLeft = document.getElementById('scene-left');
        if (sceneLeft) {
            sceneLeft.innerHTML = isPet ? '<i class="fa-solid fa-bone"></i>' : (isSenior ? '<i class="fa-solid fa-tree"></i>' : (isGirl ? '<i class="fa-solid fa-seedling"></i>' : '<i class="fa-solid fa-tree"></i>'));
        }

        const sceneRight = document.getElementById('scene-right');
        if (sceneRight) {
            sceneRight.innerHTML = isPet ? '<i class="fa-solid fa-paw"></i>' : (isSenior ? '<i class="fa-solid fa-heart"></i>' : (isGirl ? '<i class="fa-solid fa-chess-rook"></i>' : '<i class="fa-solid fa-paw"></i>'));
        }

        // Avatar Photo
        const avatarEl = document.getElementById('p-avatar');
        if (avatarEl) {
            avatarEl.src = (profile.photoUrl && profile.photoUrl.trim() !== '') ? profile.photoUrl : NEUTRAL_AVATAR_SVG;
        }

        // WhatsApp Link Generator 1 & 2 (OPCIONAL: Ocultos dinámicamente si los teléfonos están vacíos)
        const waBtn1 = document.getElementById('btn-whatsapp-action');
        const waBtn2 = document.getElementById('btn-whatsapp-action2');

        const rawPhone1 = (profile.parentPhone && String(profile.parentPhone).trim() !== '' && String(profile.parentPhone) !== 'undefined' && String(profile.parentPhone) !== 'null') ? String(profile.parentPhone).trim() : '';
        const rawPhone2 = (profile.parentPhone2 && String(profile.parentPhone2).trim() !== '' && String(profile.parentPhone2) !== 'undefined' && String(profile.parentPhone2) !== 'null') ? String(profile.parentPhone2).trim() : '';

        const defaultMsg = isPet
            ? `Hola, encontré a la mascota ${profile.name} y quiero comunicarme con su dueño.`
            : (isSenior ? `Hola, encontré el perfil de seguridad del adulto mayor ${profile.name} y quiero comunicarme con sus familiares.` : `Hola, encontré la información del perfil de ${profile.name} y me gustaría comunicarme con sus padres.`);
        const customMsg = profile.whatsappMessage || defaultMsg;
        const formattedMsg = customMsg.replace('{nombre}', profile.name);

        // WhatsApp Button 1
        if (waBtn1) {
            if (rawPhone1 !== '') {
                const title1El = document.getElementById('p-wa1-title') || waBtn1.querySelector('.btn-main-text');
                if (title1El) {
                    if (rawPhone2 !== '') {
                        title1El.textContent = isPet ? 'Contactar al Dueño 1' : (isSenior ? 'Contactar Familiar 1' : 'Contactar a Papá / Contacto 1');
                    } else {
                        title1El.textContent = isPet ? 'Contactar a mi dueño' : (isSenior ? 'Contactar a mis familiares' : 'Contactar a mis papás');
                    }
                }
                const waCleanPhone1 = rawPhone1.replace(/[^0-9]/g, '');
                waBtn1.href = `https://wa.me/${waCleanPhone1}?text=${encodeURIComponent(formattedMsg)}`;
                waBtn1.classList.remove('hidden', 'hidden-btn');
                waBtn1.style.setProperty('display', 'flex', 'important');
            } else {
                waBtn1.classList.add('hidden-btn');
                waBtn1.style.setProperty('display', 'none', 'important');
            }
        }

        // WhatsApp Button 2
        if (waBtn2) {
            if (rawPhone2 !== '') {
                const title2El = document.getElementById('p-wa2-title') || waBtn2.querySelector('.btn-main-text');
                if (title2El) {
                    title2El.textContent = isPet ? 'Contactar al Dueño 2' : (isSenior ? 'Contactar Familiar 2' : 'Contactar a Mamá / Contacto 2');
                }
                const waCleanPhone2 = rawPhone2.replace(/[^0-9]/g, '');
                waBtn2.href = `https://wa.me/${waCleanPhone2}?text=${encodeURIComponent(formattedMsg)}`;
                waBtn2.classList.remove('hidden', 'hidden-btn');
                waBtn2.style.setProperty('display', 'flex', 'important');
            } else {
                waBtn2.classList.add('hidden', 'hidden-btn');
                waBtn2.style.setProperty('display', 'none', 'important');
            }
        }

        // Location Link Generator ("Ver ubicación" - OPCIONAL: Oculto si no hay link, visible con link)
        const mapsBtn = document.getElementById('btn-location-action');
        if (mapsBtn) {
            const subTextEl = mapsBtn.querySelector('.btn-sub-text');
            if (subTextEl && isSenior) {
                subTextEl.textContent = 'Ver mi ubicación en el mapa';
            }

            const hasLocation = profile.locationMapsUrl && 
                String(profile.locationMapsUrl).trim() !== '' && 
                String(profile.locationMapsUrl) !== 'undefined' &&
                String(profile.locationMapsUrl) !== 'null';

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

        if (container.getAttribute('data-rendered-gender') === gender && container.children.length > 0) {
            return;
        }
        container.setAttribute('data-rendered-gender', gender);

        const boyIcons = ['fa-rocket', 'fa-user-astronaut', 'fa-star', 'fa-cloud-moon', 'fa-compass', 'fa-shuttle-space'];
        const girlIcons = ['fa-wand-magic-sparkles', 'fa-heart', 'fa-sun', 'fa-cloud', 'fa-feather', 'fa-spa'];
        const petIcons = ['fa-paw', 'fa-bone', 'fa-heart', 'fa-paw', 'fa-bone', 'fa-shield-dog'];
        const seniorIcons = ['fa-shield-heart', 'fa-leaf', 'fa-heart-pulse', 'fa-sun', 'fa-shield', 'fa-house-user'];
        
        let icons = boyIcons;
        if (gender === 'girl') icons = girlIcons;
        else if (gender === 'pet') icons = petIcons;
        else if (gender === 'senior') icons = seniorIcons;

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
