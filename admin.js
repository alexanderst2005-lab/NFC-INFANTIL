/* ==========================================================================
   NFC INFANTIL - ADMIN PANEL LOGIC (SANITY-CHECKED REAL-TIME CLOUD DB)
   ========================================================================== */

const DEFAULT_USER = "admin";
const DEFAULT_PASS = "1234";
const CLOUD_DB_ENDPOINT = "/api/sync";

// Neutral SVG Silhouette for profiles without a custom photo
const NEUTRAL_AVATAR_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%2364748b'%3E%3Ccircle cx='50' cy='35' r='22'/%3E%3Cpath d='M18 85c0-18 14-30 32-30s32 12 32 30Z'/%3E%3C/svg%3E";

const DEFAULT_PROFILES = [
    {
        id: "prof-001",
        slug: "samuel",
        name: "Samuel Arias Rodríguez",
        gender: "boy",
        age: 11,
        bloodType: "B+",
        school: "RIO TAPAJE",
        grade: "4",
        medicalConditions: "ALERGICO",
        parentPhone: "573001234567",
        whatsappMessage: "Hola, encontré la información del perfil de Samuel y me gustaría comunicarme con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: "2026-08-18T00:00:00.000Z",
        updatedAt: "2026-08-18T00:00:00.000Z"
    },
    {
        id: "prof-1787105387792",
        slug: "lucia-torres",
        name: "LUCIA TORRES",
        gender: "girl",
        age: "",
        bloodType: "",
        parentPhone: "",
        whatsappMessage: "Hola, encontré la información del perfil de LUCIA TORRES y quiero comunicarme con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "",
        active: true,
        createdAt: "2026-08-19T02:10:00.000Z",
        updatedAt: "2026-08-19T02:10:00.000Z"
    },
    {
        id: "prof-1787128801484",
        slug: "guillermo-diaz",
        name: "Guillermo Diaz",
        gender: "senior",
        age: "",
        bloodType: "",
        parentPhone: "",
        whatsappMessage: "Hola, encontré el perfil de seguridad del adulto mayor Guillermo Diaz y quiero comunicarme con sus familiares.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: "2026-08-19T08:40:00.000Z",
        updatedAt: "2026-08-19T08:40:00.000Z"
    },
    {
        id: "prof-1787129656850",
        slug: "zeus",
        name: "ZEUS",
        gender: "pet",
        age: 6,
        bloodType: "",
        parentPhone: "",
        whatsappMessage: "Hola, encontré a la mascota ZEUS y quiero comunicarme con su dueño.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: "2026-08-19T08:54:00.000Z",
        updatedAt: "2026-08-19T08:54:00.000Z"
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
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: "2026-08-18T20:00:00.000Z",
        updatedAt: "2026-08-18T20:00:00.000Z"
    },
    {
        id: "prof-1787028202738",
        slug: "arias-santi",
        name: "Arias santi",
        gender: "boy",
        age: 6,
        bloodType: "O+",
        school: "Hshshs",
        parentPhone: "545454",
        whatsappMessage: "Hola, encontré la información del perfil de Arias santi y me gustaría comunicarme con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        medicalConditions: "",
        photoUrl: "",
        active: true,
        createdAt: "2026-08-18T04:55:03.415Z",
        updatedAt: "2026-08-18T04:55:03.415Z"
    }
];

class AdminApp {
    constructor() {
        this.profiles = [];
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
        this.loadProfilesLocal();
        this.setupEventListeners();
        this.renderState();
        document.documentElement.classList.add('ready');
        window.scrollTo(0, 0);
        await this.syncFromCloudDB();
        if (this.isAuthenticated) {
            this.renderProfilesGrid();
        }

        // Real-Time Multi-Device Auto-Sync every 2 seconds (paused while typing for zero lag)
        setInterval(() => {
            const activeInputId = document.activeElement?.id;
            const isTyping = activeInputId === 'admin-search-input' || activeInputId === 'input-name' || activeInputId === 'input-phone';
            if (this.isAuthenticated && !this.isSaving && !document.body.classList.contains('modal-open') && !isTyping) {
                this.syncFromCloudDB();
            }
        }, 2000);

        window.addEventListener('focus', () => {
            if (this.isAuthenticated && !this.isSaving) {
                this.syncFromCloudDB();
            }
        });
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isAuthenticated && !this.isSaving) {
                this.syncFromCloudDB();
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

        let slug = (p.slug && String(p.slug).trim() !== '' && String(p.slug).trim() !== 'undefined') 
            ? String(p.slug).trim() 
            : this.generateUniqueSlug(name, p.id);

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

    loadProfilesLocal() {
        const stored = localStorage.getItem('nfc_profiles_db');
        let localProfs = [];
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    localProfs = parsed;
                }
            } catch (e) {}
        }
        this.profiles = this.mergeAndPreserveProfiles(localProfs, DEFAULT_PROFILES);
        this.saveProfilesLocal();
    }

    saveProfilesLocal() {
        this.profiles = this.deduplicateProfiles(this.profiles);
        localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));
    }

    mergeSingleProfile(base, override) {
        if (!base) return override;
        if (!override) return base;

        const overrideTime = new Date(override.updatedAt || 0).getTime();
        const baseTime = new Date(base.updatedAt || 0).getTime();
        const isOverrideNewer = overrideTime >= baseTime;

        const sourceNew = isOverrideNewer ? override : base;
        const sourceOld = isOverrideNewer ? base : override;

        let mergedGender = sourceNew.gender || sourceOld.gender || 'boy';
        if (sourceNew.id === 'prof-006-jose' || sourceOld.id === 'prof-006-jose' || (sourceNew.slug && String(sourceNew.slug).includes('jose-ramirez')) || (sourceOld.slug && String(sourceOld.slug).includes('jose-ramirez'))) {
            mergedGender = 'senior';
        }

        return {
            ...sourceOld,
            ...sourceNew,
            name: (sourceNew.name && sourceNew.name.trim() !== '') ? sourceNew.name.trim() : (sourceOld.name || 'Perfil'),
            gender: mergedGender,
            photoUrl: (sourceNew.photoUrl && sourceNew.photoUrl.trim() !== '' && sourceNew.photoUrl !== NEUTRAL_AVATAR_SVG)
                ? sourceNew.photoUrl.trim()
                : (sourceOld.photoUrl || ''),
            updatedAt: sourceNew.updatedAt || sourceOld.updatedAt || new Date().toISOString()
        };
    }

    mergeAndPreserveProfiles(localProfiles = [], cloudProfiles = [], cloudDeletedIds = []) {
        const profileMap = new Map();

        // 1. Load ALL Local Profiles into map (100% Preservation Safety)
        localProfiles.forEach(p => {
            if (p && p.id) {
                const sanitized = this.sanitizeProfile(p);
                if (!sanitized) return;

                if (profileMap.has(p.id)) {
                    profileMap.set(p.id, this.mergeSingleProfile(profileMap.get(p.id), sanitized));
                } else {
                    profileMap.set(p.id, sanitized);
                }
            }
        });

        // 2. Merge Cloud Profiles (Cloud DB is Authoritative Master across devices)
        cloudProfiles.forEach(p => {
            if (p && p.id) {
                const sanitizedCloud = this.sanitizeProfile(p);
                if (!sanitizedCloud) return;

                if (profileMap.has(p.id)) {
                    const localProf = profileMap.get(p.id);
                    const cloudTime = new Date(sanitizedCloud.updatedAt || sanitizedCloud.createdAt || 0).getTime();
                    const localTime = new Date(localProf.updatedAt || localProf.createdAt || 0).getTime();

                    if (cloudTime >= localTime) {
                        profileMap.set(p.id, this.mergeSingleProfile(localProf, sanitizedCloud));
                    } else {
                        profileMap.set(p.id, this.mergeSingleProfile(sanitizedCloud, localProf));
                    }
                } else {
                    profileMap.set(p.id, sanitizedCloud);
                }
            }
        });

        return Array.from(profileMap.values()).filter(p => p && p.id);
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
                        if (this.isAuthenticated) {
                            this.renderProfilesGrid();
                        }
                    }

                    // Only push if there are NEW local profiles created offline that cloud does not have
                    const cloudHasAllMerged = sanitizedMerged.every(m => cloudProfiles.some(c => c.id === m.id));
                    if (!cloudHasAllMerged) {
                        await this.pushToCloudDB();
                    }
                }
            }
        } catch (err) {
            console.log("Cloud sync load offline, using LocalStorage:", err);
        }
    }

    async pushToCloudDB() {
        this.saveProfilesLocal();
        const deletedIds = JSON.parse(localStorage.getItem('nfc_deleted_ids') || '[]');
        try {
            const res = await fetch(CLOUD_DB_ENDPOINT, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({
                    profiles: this.profiles,
                    deletedIds: deletedIds
                })
            });
            if (res.ok) {
                const jsonRes = await res.json();
                if (jsonRes && Array.isArray(jsonRes.profiles)) {
                    const sanitizedCloud = this.deduplicateProfiles(jsonRes.profiles);
                    if (!this.areProfilesEqual(sanitizedCloud, this.profiles)) {
                        this.profiles = sanitizedCloud;
                        this.saveProfilesLocal();
                    }
                }
            }
        } catch (err) {
            console.log("Cloud DB push failed, saved offline:", err);
        }
    }

    renderState() {
        const loginScreen = document.getElementById('admin-login-screen');
        const dashboardScreen = document.getElementById('admin-dashboard-screen');
        const logoutBtn = document.getElementById('btn-admin-logout');

        if (!this.isAuthenticated) {
            document.documentElement.classList.remove('is-auth');
            document.documentElement.classList.add('is-no-auth');
            document.body.classList.remove('admin-page-active');
            loginScreen?.classList.add('active-view');
            dashboardScreen?.classList.remove('active-view');
            logoutBtn?.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('is-no-auth');
            document.documentElement.classList.add('is-auth');
            document.body.classList.add('admin-page-active');
            loginScreen?.classList.remove('active-view');
            dashboardScreen?.classList.add('active-view');
            logoutBtn?.classList.remove('hidden');
            this.renderProfilesGrid();
        }

        document.documentElement.classList.add('ready');
    }

    renderProfilesGrid(filterText = '') {
        const grid = document.getElementById('admin-profiles-grid');
        if (!grid) return;

        this.profiles = this.deduplicateProfiles(this.profiles);

        // Update category tab counts
        const countAll = this.profiles.length;
        const countBoy = this.profiles.filter(p => p.gender === 'boy').length;
        const countGirl = this.profiles.filter(p => p.gender === 'girl').length;
        const countPet = this.profiles.filter(p => p.gender === 'pet').length;

        const countSenior = this.profiles.filter(p => p.gender === 'senior').length;

        const totalCountEl = document.getElementById('stat-total-count');
        if (totalCountEl) totalCountEl.textContent = countAll;

        if (document.getElementById('tab-count-all')) document.getElementById('tab-count-all').textContent = countAll;
        if (document.getElementById('tab-count-boy')) document.getElementById('tab-count-boy').textContent = countBoy;
        if (document.getElementById('tab-count-girl')) document.getElementById('tab-count-girl').textContent = countGirl;
        if (document.getElementById('tab-count-pet')) document.getElementById('tab-count-pet').textContent = countPet;
        if (document.getElementById('tab-count-senior')) document.getElementById('tab-count-senior').textContent = countSenior;

        const query = (filterText || '').toLowerCase().trim();
        const filtered = this.profiles.filter(p => {
            const matchesTab = (this.currentCategoryTab === 'all') || (p.gender === this.currentCategoryTab);
            
            if (!query) return matchesTab;

            const nameMatch = (p.name || '').toLowerCase().includes(query);
            const slugMatch = (p.slug || '').toLowerCase().includes(query);
            const schoolMatch = (p.school || '').toLowerCase().includes(query);
            const gradeMatch = (p.grade || '').toLowerCase().includes(query);
            
            const computedAgeStr = String(this.calculateAgeFromBirthDate(p.birthDate, p.age)).toLowerCase();
            const ageMatch = computedAgeStr === query || `${computedAgeStr} años`.includes(query) || `${computedAgeStr} anos`.includes(query);
            
            const bloodMatch = (p.bloodType || '').toLowerCase().includes(query);
            const phoneMatch = (p.parentPhone || '').toLowerCase().includes(query);
            const medicalMatch = (p.medicalConditions || '').toLowerCase().includes(query);
            const mapsMatch = (p.locationMapsUrl || '').toLowerCase().includes(query);

            let categoryName = 'niño nino';
            if (p.gender === 'girl') categoryName = 'niña nina';
            else if (p.gender === 'pet') categoryName = 'mascota pet';
            else if (p.gender === 'senior') categoryName = 'adulto mayor senior';

            const categoryMatch = categoryName.includes(query);

            const matchesSearch = nameMatch || slugMatch || schoolMatch || gradeMatch || 
                                  ageMatch || bloodMatch || phoneMatch || medicalMatch || 
                                  mapsMatch || categoryMatch;

            return matchesTab && matchesSearch;
        });

        if (filtered.length === 0) {
            const categoryLabel = this.currentCategoryTab === 'boy' ? 'niños' : (this.currentCategoryTab === 'girl' ? 'niñas' : (this.currentCategoryTab === 'pet' ? 'mascotas' : (this.currentCategoryTab === 'senior' ? 'adultos mayores' : 'perfiles')));
            const emptyHtml = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-secondary); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; color: var(--accent-main); opacity: 0.7;"></i>
                    <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">No se encontraron ${categoryLabel}</h3>
                    <p style="font-size: 0.9rem;">Prueba con otra búsqueda o crea un nuevo perfil.</p>
                </div>
            `;
            if (grid.innerHTML !== emptyHtml) grid.innerHTML = emptyHtml;
            return;
        }

        const origin = window.location.origin;

        const cardsHtml = filtered.map(p => {
            const genderParam = p.gender === 'pet' ? '?gender=pet' : (p.gender === 'girl' ? '?gender=girl' : (p.gender === 'senior' ? '?gender=senior' : ''));
            const publicUrl = `${origin}/${p.slug}${genderParam}`;
            const photo = (p.photoUrl && p.photoUrl.trim() !== '') ? p.photoUrl : NEUTRAL_AVATAR_SVG;

            let avatarBorder = '';
            let pillClass = 'pill-boy';
            let pillText = '👦 Niño';

            if (p.gender === 'girl') {
                avatarBorder = 'border-color: #f472b6;';
                pillClass = 'pill-girl';
                pillText = '👧 Niña';
            } else if (p.gender === 'pet') {
                avatarBorder = 'border-color: #5e8c31;';
                pillClass = 'pill-pet';
                pillText = '🐾 Mascota';
            } else if (p.gender === 'senior') {
                avatarBorder = 'border-color: #f77f00;';
                pillClass = 'pill-senior';
                pillText = '👴 Adulto Mayor';
            }

            return `
                <div class="admin-card">
                    <!-- Clean Header (Avatar Left, Name & Gender Pill Right) -->
                    <div class="admin-card-header">
                        <img src="${photo}" alt="${p.name}" class="admin-card-avatar" style="${avatarBorder}">
                        <div class="admin-card-header-info">
                            <h4 class="admin-card-name" title="${p.name}">${p.name}</h4>
                            <span class="gender-pill ${pillClass}">
                                ${pillText}
                            </span>
                        </div>
                    </div>

                    <!-- Card Body Info -->
                    <div class="admin-card-body">
                        <!-- URL Link Pill Bar -->
                        <div class="url-pill-bar">
                            <span class="url-slug-text">/${p.slug}</span>
                            <button onclick="adminApp.copyProfileLink('${publicUrl}')" class="btn-copy-mini" title="Copiar URL">
                                <i class="fa-solid fa-copy"></i> Copiar
                            </button>
                        </div>

                        <!-- Metadata Grid -->
                        <div class="card-meta-grid">
                            ${(p.birthDate || (p.age !== undefined && p.age !== null && String(p.age).trim() !== '')) ? `
                            <div class="meta-item">
                                <i class="fa-solid fa-calendar-day" style="color: var(--accent-main);"></i>
                                <span>${this.calculateAgeFromBirthDate(p.birthDate, p.age)} Años</span>
                            </div>
                            ` : ''}
                            ${(p.gender !== 'pet' && p.bloodType && p.bloodType.trim() !== '' && p.bloodType.toUpperCase() !== 'N/A') ? `
                            <div class="meta-item">
                                <i class="fa-solid fa-droplet" style="color: #f87171;"></i>
                                <span>${p.bloodType.trim()}</span>
                            </div>
                            ` : ''}
                            <div class="meta-item meta-item-full">
                                <i class="fa-solid fa-phone" style="color: #34d399;"></i>
                                <span>${p.parentPhone ? '+' + p.parentPhone : 'Sin WhatsApp'}</span>
                            </div>
                            ${(p.school || p.grade) ? `
                            <div class="meta-item meta-item-full">
                                <i class="fa-solid fa-graduation-cap" style="color: #a855f7;"></i>
                                <span>${p.school || ''} ${p.grade ? '(' + p.grade + ')' : ''}</span>
                            </div>
                            ` : ''}
                            ${(p.locationMapsUrl && p.locationMapsUrl.trim() !== '') ? `
                            <div class="meta-item meta-item-full">
                                <i class="fa-solid fa-location-dot" style="color: #fbbf24;"></i>
                                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${p.locationMapsUrl}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Card Footer Actions -->
                    <div class="admin-card-footer">
                        <button onclick="adminApp.openEditModal('${p.id}')" class="btn btn-primary btn-sm" style="flex: 1;">
                            <i class="fa-solid fa-pen-to-square"></i> Editar
                        </button>
                        <a href="/${p.slug}${genderParam}" target="_blank" class="btn btn-secondary btn-sm" title="Ver Perfil Público" style="display: inline-flex; align-items: center; justify-content: center; text-decoration: none; padding: 0.6rem 0.9rem;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i> Ver
                        </a>
                        <button onclick="adminApp.deleteProfile('${p.id}')" class="btn btn-danger btn-sm" title="Eliminar Definitivamente" style="padding: 0.6rem 0.9rem;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (grid.innerHTML !== cardsHtml) {
            grid.innerHTML = cardsHtml;
        }
    }

    copyProfileLink(url) {
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
            // 1. Record tombstone in localStorage
            const deletedIds = JSON.parse(localStorage.getItem('nfc_deleted_ids') || '[]');
            if (!deletedIds.includes(id)) {
                deletedIds.push(id);
                localStorage.setItem('nfc_deleted_ids', JSON.stringify(deletedIds));
            }

            // 2. Remove profile from array & local DB
            this.profiles = this.deduplicateProfiles(this.profiles.filter(p => p.id !== id));
            this.saveProfilesLocal();

            // 3. Push deletion to Cloud DB
            await this.pushToCloudDB();

            // 4. Update UI
            this.renderProfilesGrid();
            this.showToast(`Perfil de ${profile.name} eliminado definitivamente.`);
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
        let counter = 2;

        while (this.profiles.some(p => p.slug === slug && p.id !== currentId)) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        return slug;
    }

    updateModalFormForCategory(genderVal) {
        const bloodGroup = document.getElementById('group-blood');
        const schoolSection = document.getElementById('section-school');
        const healthSection = document.getElementById('section-health');
        const nameLbl = document.getElementById('lbl-input-name');
        const phoneLbl = document.getElementById('lbl-input-phone');
        const bloodInput = document.getElementById('input-blood');
        const waInput = document.getElementById('input-whatsapp-msg');

        if (genderVal === 'pet') {
            if (bloodGroup) bloodGroup.style.display = 'none';
            if (schoolSection) schoolSection.style.display = 'none';
            if (healthSection) healthSection.style.display = 'none';
            if (nameLbl) nameLbl.textContent = 'Nombre de la Mascota';
            if (phoneLbl) phoneLbl.textContent = 'Teléfono del Dueño (WhatsApp)';
            if (bloodInput) {
                bloodInput.removeAttribute('required');
                bloodInput.value = '';
            }
            if (waInput && (!waInput.value || waInput.value.includes('perfil de'))) {
                waInput.value = 'Hola, encontré a la mascota {nombre} y quiero comunicarme con su dueño.';
            }
        } else if (genderVal === 'senior') {
            if (bloodGroup) bloodGroup.style.display = '';
            if (schoolSection) schoolSection.style.display = 'none';
            if (healthSection) healthSection.style.display = '';
            if (nameLbl) nameLbl.textContent = 'Nombre del Adulto Mayor';
            if (phoneLbl) phoneLbl.textContent = 'Teléfono WhatsApp Familiar (Con código país)';
            if (waInput && (!waInput.value || waInput.value.includes('perfil de'))) {
                waInput.value = 'Hola, encontré el perfil de seguridad del adulto mayor {nombre} y quiero comunicarme con sus familiares.';
            }
        } else {
            if (bloodGroup) bloodGroup.style.display = '';
            if (schoolSection) schoolSection.style.display = '';
            if (healthSection) healthSection.style.display = '';
            if (nameLbl) nameLbl.textContent = 'Nombre Completo del Niño/a';
            if (phoneLbl) phoneLbl.textContent = 'Teléfono WhatsApp (Con código país)';
        }
    }

    openCreateModal() {
        this.savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        this.photoRemoved = false;
        this.pendingUploadedPhoto = null;
        const initialGender = (this.currentCategoryTab === 'girl' || this.currentCategoryTab === 'pet' || this.currentCategoryTab === 'senior') ? this.currentCategoryTab : 'boy';

        let titleIcon = 'fa-user-plus';
        let titleText = 'Crear Perfil Infantil';
        if (initialGender === 'pet') {
            titleIcon = 'fa-paw';
            titleText = 'Crear Perfil de Mascota 🐾';
        } else if (initialGender === 'senior') {
            titleIcon = 'fa-user-tie';
            titleText = 'Crear Perfil de Adulto Mayor 👴';
        }

        document.getElementById('modal-title').innerHTML = `<i class="fa-solid ${titleIcon}"></i> ${titleText}`;
        document.getElementById('form-save-profile').reset();
        document.getElementById('input-profile-id').value = '';
        document.getElementById('input-name').value = '';
        document.getElementById('input-slug').value = '';
        document.getElementById('input-gender').value = initialGender;
        if (document.getElementById('input-birthdate')) document.getElementById('input-birthdate').value = '';
        document.getElementById('input-age').value = '';
        document.getElementById('input-blood').value = initialGender === 'pet' ? 'N/A' : '';
        document.getElementById('input-phone').value = '';
        if (document.getElementById('input-phone2')) document.getElementById('input-phone2').value = '';

        const defaultWa = initialGender === 'pet'
            ? 'Hola, encontré a la mascota {nombre} y quiero comunicarme con su dueño.'
            : (initialGender === 'senior' ? 'Hola, encontré el perfil de seguridad del adulto mayor {nombre} y quiero comunicarme con sus familiares.' : '');
        document.getElementById('input-whatsapp-msg').value = defaultWa;
        document.getElementById('input-maps-url').value = '';
        if (document.getElementById('input-school')) document.getElementById('input-school').value = '';
        if (document.getElementById('input-grade')) document.getElementById('input-grade').value = '';
        if (document.getElementById('input-medical')) document.getElementById('input-medical').value = '';
        if (document.getElementById('input-medications')) document.getElementById('input-medications').value = '';
        document.getElementById('input-photo-url').value = '';
        document.getElementById('photo-preview').src = NEUTRAL_AVATAR_SVG;

        this.updateModalFormForCategory(initialGender);

        document.getElementById('modal-profile').classList.remove('hidden');
        document.body.classList.add('modal-open');
        const modalBody = document.querySelector('#modal-profile .modal-body');
        if (modalBody) modalBody.scrollTop = 0;
    }

    openEditModal(id) {
        this.savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
        const p = this.profiles.find(item => item.id === id);
        if (!p) return;

        this.photoRemoved = false;
        this.pendingUploadedPhoto = null;
        const currentPhoto = (p.photoUrl && p.photoUrl.trim() !== '') ? p.photoUrl : NEUTRAL_AVATAR_SVG;

        let titleIcon = 'fa-pen-to-square';
        let titleLabel = `Editar Perfil de ${p.name}`;
        if (p.gender === 'pet') {
            titleIcon = 'fa-paw';
            titleLabel = `Editar Perfil de Mascota: ${p.name}`;
        } else if (p.gender === 'senior') {
            titleIcon = 'fa-user-tie';
            titleLabel = `Editar Perfil de Adulto Mayor: ${p.name}`;
        }
        
        document.getElementById('modal-title').innerHTML = `<i class="fa-solid ${titleIcon}"></i> ${titleLabel}`;
        document.getElementById('input-profile-id').value = p.id;
        document.getElementById('input-name').value = p.name;
        document.getElementById('input-slug').value = p.slug;
        document.getElementById('input-gender').value = p.gender;
        if (document.getElementById('input-birthdate')) document.getElementById('input-birthdate').value = p.birthDate || '';
        document.getElementById('input-age').value = this.calculateAgeFromBirthDate(p.birthDate, p.age);
        document.getElementById('input-blood').value = p.bloodType || (p.gender === 'pet' ? 'N/A' : '');
        document.getElementById('input-phone').value = p.parentPhone || '';
        if (document.getElementById('input-phone2')) document.getElementById('input-phone2').value = p.parentPhone2 || '';
        
        const defaultWa = p.gender === 'pet'
            ? 'Hola, encontré a la mascota {nombre} y quiero comunicarme con su dueño.'
            : (p.gender === 'senior' ? 'Hola, encontré el perfil de seguridad del adulto mayor {nombre} y quiero comunicarme con sus familiares.' : 'Hola, encontré la información del perfil de {nombre} y quiero comunicarme con sus padres.');

        document.getElementById('input-whatsapp-msg').value = p.whatsappMessage || defaultWa;
        document.getElementById('input-maps-url').value = p.locationMapsUrl || '';
        if (document.getElementById('input-school')) document.getElementById('input-school').value = p.school || '';
        if (document.getElementById('input-grade')) document.getElementById('input-grade').value = p.grade || '';
        if (document.getElementById('input-medical')) document.getElementById('input-medical').value = p.medicalConditions || '';
        if (document.getElementById('input-medications')) document.getElementById('input-medications').value = p.importantMedications || '';
        
        const isBase64 = p.photoUrl && p.photoUrl.startsWith('data:');
        document.getElementById('input-photo-url').value = (p.photoUrl && p.photoUrl !== NEUTRAL_AVATAR_SVG && !isBase64) ? p.photoUrl : '';
        document.getElementById('photo-preview').src = currentPhoto;

        this.updateModalFormForCategory(p.gender);

        document.getElementById('modal-profile').classList.remove('hidden');
        document.body.classList.add('modal-open');
        const modalBody = document.querySelector('#modal-profile .modal-body');
        if (modalBody) modalBody.scrollTop = 0;
    }

    closeModal() {
        document.getElementById('modal-profile').classList.add('hidden');
        document.body.classList.remove('modal-open');
        if (typeof this.savedScrollY === 'number') {
            window.scrollTo({ top: this.savedScrollY, behavior: 'instant' });
        }
    }

    onLogoClick() {
        if (this.isAuthenticated) {
            const searchInput = document.getElementById('admin-search-input');
            if (searchInput) searchInput.value = '';
            this.renderProfilesGrid();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            this.showToast("Panel actualizado");
        } else {
            window.location.reload();
        }
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

            if (id) {
                const idx = this.profiles.findIndex(p => p.id === id);
                if (idx !== -1) this.profiles[idx] = profileData;
            } else {
                this.profiles.unshift(profileData);
            }

            this.saveProfilesLocal();
            this.closeModal();
            const currentSearch = document.getElementById('admin-search-input')?.value || '';
            this.renderProfilesGrid(currentSearch);
            this.showToast(`¡Perfil de ${name} guardado! URL: /${slug}`);
            await this.pushToCloudDB();
        } finally {
            setTimeout(() => { this.isSaving = false; }, 2000);
        }
    }

    compressImage(base64Data, maxWidth = 500, quality = 0.82) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(base64Data);
            img.src = base64Data;
        });
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
        document.getElementById('form-admin-login')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('input-admin-user')?.value.trim();
            const pass = document.getElementById('input-admin-pass')?.value.trim();

            if (user === DEFAULT_USER && (pass === DEFAULT_PASS || pass === "admin" || pass === "admin123")) {
                this.isAuthenticated = true;
                localStorage.setItem('nfc_admin_auth', 'true');
                sessionStorage.setItem('nfc_admin_auth', 'true');
                this.renderState();
                this.showToast("¡Sesión iniciada!");
            } else {
                alert("Usuario o contraseña incorrectos.");
            }
        });

        document.getElementById('btn-admin-logout')?.addEventListener('click', () => {
            this.isAuthenticated = false;
            localStorage.removeItem('nfc_admin_auth');
            sessionStorage.removeItem('nfc_admin_auth');
            this.renderState();
            this.showToast("Sesión cerrada.");
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

        // Remove Photo Button: Sets photoUrl = '' in Cloud DB immediately!
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
                    await this.pushToCloudDB();
                    this.renderProfilesGrid();
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

let adminApp;
document.addEventListener('DOMContentLoaded', () => {
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    adminApp = new AdminApp();
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 0);
});
