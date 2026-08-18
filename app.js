/* ==========================================================================
   NFC INFANTIL - PUBLIC OFFICIAL WEBSITE & PROFILE VIEWER
   ========================================================================== */

const DEFAULT_PROFILES = [
    {
        id: "prof-001",
        slug: "samuel",
        name: "Samuel Torres",
        gender: "boy",
        age: 6,
        bloodType: "O+",
        parentName: "Carlos y Diana Torres",
        parentPhone: "573001234567",
        whatsappMessage: "Hola, encontré el perfil de Samuel y me gustaría comunicarme con sus padres.",
        locationAddress: "Calle 100 #15-20, Bogotá",
        locationMapsUrl: "https://maps.google.com/?q=4.6853,-74.0435",
        allergies: "Alergico a la Penicilina",
        medicalNotes: "Usa inhalador en caso de crisis asmática. Autorizado entregar solo a abuela materna.",
        school: "Jardín Infantil Los Pequeños Exploradores",
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
        parentName: "María y Andrés Gómez",
        parentPhone: "573159876543",
        whatsappMessage: "Hola, encontré la información del perfil de Valentina y quiero comunicarme con sus padres.",
        locationAddress: "Carrera 43A #1-50, Medellín",
        locationMapsUrl: "https://maps.google.com/?q=6.2088,-75.5674",
        allergies: "Ninguna conocida",
        medicalNotes: "Lleva carnet de vacunación al día.",
        school: "Colegio San José Infantil",
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
        parentName: "Andrea Benítez",
        parentPhone: "573204445566",
        whatsappMessage: "Hola, encontré la información de Juan Diego y requiero contactar a sus acudientes.",
        locationAddress: "Calle 26 #68-80, Bogotá",
        locationMapsUrl: "https://maps.google.com/?q=4.6581,-74.1084",
        allergies: "Intolerancia a la Lactosa",
        medicalNotes: "Gafas recetadas para lectura.",
        school: "Gimnasio Campestre del Norte",
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
        parentName: "Laura y Roberto Rodríguez",
        parentPhone: "573108889900",
        whatsappMessage: "Hola, estoy escaneando el perfil NFC de Sofía y me comunico con sus padres.",
        locationAddress: "Avenida 4 Norte #10-15, Cali",
        locationMapsUrl: "https://maps.google.com/?q=3.4516,-76.5320",
        allergies: "Alergia leve al maní",
        medicalNotes: "Siempre porta su pulsera médica NFC rosa.",
        school: "Jardín Infantil Mis Primeros Pasos",
        photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: new Date().toISOString()
    }
];

class OfficialApp {
    constructor() {
        this.profiles = [];
        this.currentProfile = null;
        this.init();
    }

    init() {
        this.loadProfiles();
        this.setupEventListeners();
        this.handleRouting();
    }

    loadProfiles() {
        const stored = localStorage.getItem('nfc_profiles_db');
        if (stored) {
            try { this.profiles = JSON.parse(stored); } catch (e) { this.profiles = DEFAULT_PROFILES; }
        } else {
            this.profiles = DEFAULT_PROFILES;
            localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));
        }
    }

    // Client Router
    handleRouting() {
        const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
        const urlParams = new URLSearchParams(window.location.search);

        let slug = '';
        if (urlParams.has('slug')) {
            slug = urlParams.get('slug');
        } else if (path !== '/' && path !== '/index.html') {
            slug = path.substring(1);
        }

        if (slug) {
            this.renderSingleProfile(slug);
        } else {
            this.renderOfficialDirectory();
        }
    }

    // Render Official Directory Grid (Root / Page)
    renderOfficialDirectory(filterText = '') {
        document.body.className = 'theme-default';
        document.title = "Página Oficial | NFC Seguridad Infantil";

        const homeView = document.getElementById('view-home');
        const profileView = document.getElementById('view-profile');
        const inactiveView = document.getElementById('view-inactive');

        if (homeView) {
            homeView.classList.remove('hidden');
            homeView.classList.add('active-view');
        }
        if (profileView) profileView.classList.add('hidden');
        if (inactiveView) inactiveView.classList.add('hidden');

        const activeKids = this.profiles.filter(p => p.active);
        const filtered = activeKids.filter(k =>
            k.name.toLowerCase().includes(filterText.toLowerCase()) ||
            k.bloodType.toLowerCase().includes(filterText.toLowerCase())
        );

        const countEl = document.getElementById('public-kids-count');
        if (countEl) countEl.textContent = activeKids.length;

        const grid = document.getElementById('public-kids-grid');
        if (!grid) return;

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-user-slash" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No se encontraron perfiles con la búsqueda actual.</p>
                </div>
            `;
            return;
        }

        const baseUrl = window.location.origin;

        grid.innerHTML = filtered.map(k => {
            const publicUrl = `${baseUrl}/${k.slug}`;
            return `
                <div class="admin-card">
                    <div class="admin-card-head">
                        <img src="${k.photoUrl}" alt="${k.name}" class="admin-card-avatar">
                        <div class="admin-card-meta">
                            <h4>${k.name}</h4>
                            <span class="slug-pill">/${k.slug}</span>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.3rem;">
                                ${k.gender === 'girl' ? '👧 Niña' : '👦 Niño'} • ${k.age} Años • Sangre ${k.bloodType}
                            </div>
                        </div>
                    </div>

                    <div class="admin-card-actions" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 0.5rem; margin-top: 1rem;">
                        <a href="/${k.slug}" onclick="officialApp.navigateToProfile('/${k.slug}', event)" class="btn btn-primary btn-sm">
                            <i class="fa-solid fa-eye"></i> Ver Ficha Única
                        </a>
                        <button onclick="officialApp.copyUrl('${publicUrl}')" class="btn btn-secondary btn-sm" title="Copiar Link">
                            <i class="fa-solid fa-copy"></i> Copiar Link
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    navigateToProfile(path, event) {
        if (event) event.preventDefault();
        window.history.pushState({}, '', path);
        this.handleRouting();
    }

    // Render Individual Unique Profile Page (/samuel, /valentina, etc.)
    renderSingleProfile(slug) {
        const profile = this.profiles.find(p => p.slug.toLowerCase() === slug.toLowerCase());

        const homeView = document.getElementById('view-home');
        const profileView = document.getElementById('view-profile');
        const inactiveView = document.getElementById('view-inactive');

        if (!profile) {
            this.showInactive("Perfil No Encontrado", `No se encontró ningún perfil registrado en la dirección '/${slug}'.`);
            return;
        }

        if (!profile.active) {
            this.showInactive("Perfil No Disponible", `El perfil de ${profile.name} se encuentra desactivado temporalmente.`);
            return;
        }

        this.currentProfile = profile;

        // Set Theme (theme-boy vs theme-girl)
        document.body.className = profile.gender === 'girl' ? 'theme-girl' : 'theme-boy';

        // Render Values safely with null checks
        document.title = `Perfil de ${profile.name} | NFC Seguridad Infantil`;
        
        const nameEl = document.getElementById('p-name');
        if (nameEl) nameEl.textContent = profile.name;

        const ageEl = document.getElementById('p-age');
        if (ageEl) ageEl.textContent = profile.age;

        const bloodEl = document.getElementById('p-blood');
        if (bloodEl) bloodEl.textContent = profile.bloodType;

        const parentEl = document.getElementById('p-parent');
        if (parentEl) parentEl.textContent = profile.parentName;

        const schoolEl = document.getElementById('p-school');
        if (schoolEl) schoolEl.textContent = profile.school || '';

        const allergiesEl = document.getElementById('p-allergies');
        if (allergiesEl) allergiesEl.textContent = profile.allergies || '';

        const notesContainer = document.getElementById('p-notes-container');
        const notesEl = document.getElementById('p-notes');
        if (notesContainer && notesEl) {
            if (profile.medicalNotes && profile.medicalNotes.trim() !== '') {
                notesEl.textContent = profile.medicalNotes;
                notesContainer.classList.remove('hidden');
            } else {
                notesContainer.classList.add('hidden');
            }
        }

        // Badge
        const badgeEl = document.getElementById('p-badge');
        if (badgeEl) {
            if (profile.gender === 'girl') {
                badgeEl.innerHTML = `<i class="fa-solid fa-child-dress"></i> <span>Perfil Niña</span>`;
            } else {
                badgeEl.innerHTML = `<i class="fa-solid fa-child"></i> <span>Perfil Niño</span>`;
            }
        }

        // Avatar
        const avatarEl = document.getElementById('p-avatar');
        if (avatarEl) {
            avatarEl.src = profile.photoUrl || (profile.gender === 'girl' 
                ? 'https://images.unsplash.com/photo-1595454223600-91fb272189d5?w=400&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&auto=format&fit=crop&q=80');
        }

        // WhatsApp Link Generator
        const waBtn = document.getElementById('btn-whatsapp-action');
        if (waBtn) {
            const customMsg = profile.whatsappMessage || `Hola, encontré el perfil de ${profile.name} y me gustaría comunicarme con sus padres.`;
            const formattedMsg = customMsg.replace('{nombre}', profile.name);
            const waCleanPhone = profile.parentPhone.replace(/[^0-9]/g, '');
            waBtn.href = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(formattedMsg)}`;
        }

        // Maps Link Generator
        const mapsBtn = document.getElementById('btn-location-action');
        if (mapsBtn) {
            if (profile.locationMapsUrl && profile.locationMapsUrl.trim() !== '') {
                mapsBtn.href = profile.locationMapsUrl;
                mapsBtn.classList.remove('hidden');
            } else if (profile.locationAddress && profile.locationAddress.trim() !== '') {
                mapsBtn.href = `https://maps.google.com/?q=${encodeURIComponent(profile.locationAddress)}`;
                mapsBtn.classList.remove('hidden');
            } else {
                mapsBtn.classList.add('hidden');
            }
        }

        if (homeView) homeView.classList.add('hidden');
        if (profileView) {
            profileView.classList.remove('hidden');
            profileView.classList.add('active-view');
        }
        if (inactiveView) inactiveView.classList.add('hidden');
    }

    showInactive(title, desc) {
        document.body.className = 'theme-default';
        const titleEl = document.getElementById('inactive-title');
        const descEl = document.getElementById('inactive-desc');
        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = desc;
        
        const homeView = document.getElementById('view-home');
        const profileView = document.getElementById('view-profile');
        const inactiveView = document.getElementById('view-inactive');

        if (homeView) homeView.classList.add('hidden');
        if (profileView) profileView.classList.add('hidden');
        if (inactiveView) inactiveView.classList.remove('hidden');
    }

    copyUrl(url) {
        navigator.clipboard.writeText(url).then(() => {
            this.showToast(`¡Enlace copiado! ${url}`);
        }).catch(() => {
            prompt("Copia este enlace:", url);
        });
    }

    setupEventListeners() {
        document.getElementById('public-search-input')?.addEventListener('input', (e) => {
            this.renderOfficialDirectory(e.target.value);
        });

        document.getElementById('btn-copy-current-link')?.addEventListener('click', () => {
            this.copyUrl(window.location.href);
        });

        document.getElementById('btn-back-home')?.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/');
            this.handleRouting();
        });

        window.addEventListener('popstate', () => this.handleRouting());
    }

    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3500);
    }
}

let officialApp;
document.addEventListener('DOMContentLoaded', () => {
    officialApp = new OfficialApp();
});
