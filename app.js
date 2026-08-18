/* ==========================================================================
   NFC INFANTIL - PUBLIC SINGLE CHILD PROFILE VIEWER (REAL-TIME GLOBAL DB)
   ========================================================================== */

const CLOUD_DB_ENDPOINT = "/api/sync";
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
        locationMapsUrl: "https://maps.google.com/?q=4.6853,-74.0435",
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
        locationMapsUrl: "https://maps.google.com/?q=6.2088,-75.5674",
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
        locationMapsUrl: "https://maps.google.com/?q=4.6581,-74.1084",
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
        locationMapsUrl: "https://maps.google.com/?q=3.4516,-76.5320",
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

    loadProfilesLocal() {
        const stored = localStorage.getItem('nfc_profiles_db');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this.profiles = parsed && parsed.length > 0 ? parsed : DEFAULT_PROFILES;
            } catch (e) {
                this.profiles = DEFAULT_PROFILES;
            }
        } else {
            this.profiles = DEFAULT_PROFILES;
            localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));
        }
    }

    saveProfilesLocal() {
        localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));
    }

    async syncFromCloudDB() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4500);

            const cacheBustUrl = `${CLOUD_DB_ENDPOINT}?t=${Date.now()}`;
            const res = await fetch(cacheBustUrl, { cache: 'no-store', signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const jsonRes = await res.json();
                const cloudProfiles = jsonRes && Array.isArray(jsonRes.profiles) ? jsonRes.profiles : [];

                if (cloudProfiles.length > 0) {
                    this.profiles = cloudProfiles;
                    this.saveProfilesLocal();
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
        } else if (urlParams.has('p')) {
            slug = urlParams.get('p');
        } else if (path !== '' && path !== '/' && path !== '/index.html' && path !== '/admin' && path !== '/admin.html') {
            slug = path.substring(1);
        } else {
            slug = '';
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

        // If no slug specified or root, return first profile
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

        // 2. Exact match by profile ID
        if (!profile) {
            profile = this.profiles.find(p => p && p.id && p.id.toLowerCase() === cleanSlug);
        }

        // 3. Match normalized child name (e.g. "Arias santi" -> "arias-santi")
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

        // 5. Fallback: If still no match, default to first profile
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

        if (!profile.active) {
            this.showInactive("Perfil No Disponible", `Este perfil no se encuentra disponible actualmente.`);
            return;
        }

        // Make profile view active
        if (profileView) profileView.classList.add('active-view');
        if (inactiveView) inactiveView.classList.remove('active-view');

        // Apply Theme based on gender ('boy' vs 'girl')
        document.body.className = profile.gender === 'girl' ? 'theme-girl' : 'theme-boy';
        this.renderFloatingDecorators(profile.gender);

        // Render Title
        document.title = `Perfil de ${profile.name} | NFC Seguridad Infantil`;

        const heroNameEl = document.getElementById('p-hero-name');
        if (heroNameEl) heroNameEl.textContent = profile.name;

        const genderTextEl = document.getElementById('p-gender-text');
        if (genderTextEl) genderTextEl.textContent = profile.gender === 'girl' ? 'Perfil Niña' : 'Perfil Niño';

        const ageEl = document.getElementById('p-age');
        if (ageEl) ageEl.textContent = profile.age;

        const bloodEl = document.getElementById('p-blood');
        if (bloodEl) bloodEl.textContent = profile.bloodType;

        // Badge Icon
        const badgeEl = document.getElementById('p-badge');
        if (badgeEl) {
            if (profile.gender === 'girl') {
                badgeEl.innerHTML = `<i class="fa-solid fa-child-dress"></i> <span>Perfil Niña</span>`;
            } else {
                badgeEl.innerHTML = `<i class="fa-solid fa-child"></i> <span>Perfil Niño</span>`;
            }
        }

        // Avatar Photo
        const avatarEl = document.getElementById('p-avatar');
        if (avatarEl) {
            avatarEl.src = (profile.photoUrl && profile.photoUrl.trim() !== '') ? profile.photoUrl : NEUTRAL_AVATAR_SVG;
        }

        // WhatsApp Link Generator
        const waBtn = document.getElementById('btn-whatsapp-action');
        if (waBtn) {
            if (profile.parentPhone && profile.parentPhone.trim() !== '') {
                const customMsg = profile.whatsappMessage || `Hola, encontré el perfil de ${profile.name} y me gustaría comunicarme con sus padres.`;
                const formattedMsg = customMsg.replace('{nombre}', profile.name);
                const waCleanPhone = profile.parentPhone.replace(/[^0-9]/g, '');
                waBtn.href = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(formattedMsg)}`;
                waBtn.style.display = 'inline-flex';
            } else {
                waBtn.style.display = 'none';
            }
        }

        // Maps Link Generator
        const mapsBtn = document.getElementById('btn-location-action');
        if (mapsBtn) {
            if (profile.locationMapsUrl && profile.locationMapsUrl.trim() !== '') {
                const url = profile.locationMapsUrl.trim();
                mapsBtn.href = url.startsWith('http') ? url : `https://maps.google.com/?q=${encodeURIComponent(url)}`;
                mapsBtn.style.display = 'inline-flex';
            } else {
                mapsBtn.style.display = 'none';
            }
        }
    }

    showInactive(title, message) {
        const profileView = document.getElementById('view-profile');
        const inactiveView = document.getElementById('view-inactive');

        if (profileView) profileView.classList.remove('active-view');
        if (inactiveView) inactiveView.classList.add('active-view');

        const titleEl = document.getElementById('inactive-title');
        const descEl = document.getElementById('inactive-desc');
        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = message;
    }

    renderFloatingDecorators(gender) {
        const container = document.getElementById('floating-decorators-container');
        if (!container) return;

        const boyIcons = ['fa-soccer-ball', 'fa-rocket', 'fa-star', 'fa-gamepad', 'fa-car', 'fa-plane'];
        const girlIcons = ['fa-heart', 'fa-sparkles', 'fa-star', 'fa-wand-magic-sparkles', 'fa-flower-tulip', 'fa-sun'];
        const icons = gender === 'girl' ? girlIcons : boyIcons;

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
