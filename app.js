/* ==========================================================================
   NFC INFANTIL - PLATAFORMA DINÁMICA DE PERFILES INFANTILES
   ========================================================================== */

const DEFAULT_PIN = "1234";

const DEFAULT_PROFILES = [
    {
        id: "prof-001",
        slug: "samuel",
        name: "Samuel Torres",
        gender: "boy", // 'boy' | 'girl'
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
        gender: "girl", // 'boy' | 'girl'
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

class ProfilePlatform {
    constructor() {
        this.profiles = [];
        this.currentProfile = null;
        this.isAdminAuthenticated = sessionStorage.getItem('nfc_admin_auth') === 'true';
        this.init();
    }

    init() {
        this.loadProfiles();
        this.setupEventListeners();
        this.handleRouting();
    }

    // Load Profiles from LocalStorage
    loadProfiles() {
        const stored = localStorage.getItem('nfc_profiles_db');
        if (stored) {
            try {
                this.profiles = JSON.parse(stored);
            } catch (e) {
                this.profiles = DEFAULT_PROFILES;
            }
        } else {
            this.profiles = DEFAULT_PROFILES;
            this.saveProfiles();
        }
    }

    saveProfiles() {
        localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));
    }

    // =========================================================================
    // CLIENT-SIDE ROUTER ENGINE
    // =========================================================================
    handleRouting() {
        const path = window.location.pathname.toLowerCase().trim();
        const urlParams = new URLSearchParams(window.location.search);
        
        // Remove trailing slashes
        const cleanPath = path.replace(/\/$/, '') || '/';

        // Admin Route (/admin or ?admin=true)
        if (cleanPath === '/admin' || urlParams.has('admin')) {
            this.renderAdminView();
            return;
        }

        // Home Route (/)
        if (cleanPath === '/' && !urlParams.has('slug')) {
            this.showView('view-home');
            this.resetTheme();
            return;
        }

        // Public Dynamic Profile Route (/:slug or ?slug=samuel)
        let slug = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
        if (urlParams.has('slug')) {
            slug = urlParams.get('slug');
        }

        this.renderPublicProfile(slug);
    }

    showView(viewId) {
        document.querySelectorAll('.view-section').forEach(el => {
            el.classList.remove('active-view');
        });
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.add('active-view');
        }
    }

    resetTheme() {
        document.body.className = 'theme-default';
    }

    // =========================================================================
    // PUBLIC PROFILE RENDER ENGINE
    // =========================================================================
    renderPublicProfile(slug) {
        const profile = this.profiles.find(p => p.slug.toLowerCase() === slug.toLowerCase());

        if (!profile) {
            this.renderInactiveView("Perfil No Encontrado", `No existe ningún perfil registrado con la dirección '/${slug}'.`);
            return;
        }

        if (!profile.active) {
            this.renderInactiveView("Perfil No Disponible", `El perfil de ${profile.name} ha sido temporalmente deshabilitado por sus acudientes.`);
            return;
        }

        // Apply Gender Theme Class (theme-boy vs theme-girl)
        document.body.className = profile.gender === 'girl' ? 'theme-girl' : 'theme-boy';

        // Fill Profile Data
        document.title = `Perfil de ${profile.name} | NFC Infantil`;
        document.getElementById('p-name').textContent = profile.name;
        document.getElementById('p-age').textContent = profile.age;
        document.getElementById('p-blood').textContent = profile.bloodType;
        document.getElementById('p-parent').textContent = profile.parentName;
        document.getElementById('p-school').textContent = profile.school || 'No especificado';
        document.getElementById('p-allergies').textContent = profile.allergies || 'Ninguna registrada';
        
        const notesContainer = document.getElementById('p-notes-container');
        if (profile.medicalNotes && profile.medicalNotes.trim() !== '') {
            document.getElementById('p-notes').textContent = profile.medicalNotes;
            notesContainer.classList.remove('hidden');
        } else {
            notesContainer.classList.add('hidden');
        }

        // Gender Badge
        const badgeEl = document.getElementById('p-badge');
        const genderTextEl = document.getElementById('p-gender-text');
        if (profile.gender === 'girl') {
            badgeEl.innerHTML = `<i class="fa-solid fa-child-dress"></i> <span id="p-gender-text">Perfil Niña</span>`;
        } else {
            badgeEl.innerHTML = `<i class="fa-solid fa-child"></i> <span id="p-gender-text">Perfil Niño</span>`;
        }

        // Avatar Image
        const avatarEl = document.getElementById('p-avatar');
        avatarEl.src = profile.photoUrl || (profile.gender === 'girl' 
            ? 'https://images.unsplash.com/photo-1595454223600-91fb272189d5?w=400&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&auto=format&fit=crop&q=80');

        // WhatsApp Link Generator
        const waBtn = document.getElementById('btn-whatsapp-action');
        const customMessage = profile.whatsappMessage || `Hola, encontré el perfil de ${profile.name} y me gustaría comunicarme con sus padres.`;
        const formattedMsg = customMessage.replace('{nombre}', profile.name);
        const waCleanPhone = profile.parentPhone.replace(/[^0-9]/g, '');
        waBtn.href = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(formattedMsg)}`;

        // Location / Google Maps Link Generator
        const mapsBtn = document.getElementById('btn-location-action');
        if (profile.locationMapsUrl && profile.locationMapsUrl.trim() !== '') {
            mapsBtn.href = profile.locationMapsUrl;
            mapsBtn.classList.remove('hidden');
        } else if (profile.locationAddress && profile.locationAddress.trim() !== '') {
            mapsBtn.href = `https://maps.google.com/?q=${encodeURIComponent(profile.locationAddress)}`;
            mapsBtn.classList.remove('hidden');
        } else {
            mapsBtn.classList.add('hidden');
        }

        this.showView('view-profile');
    }

    renderInactiveView(title, message) {
        this.resetTheme();
        document.getElementById('inactive-title').textContent = title;
        document.getElementById('inactive-desc').textContent = message;
        this.showView('view-inactive');
    }

    // =========================================================================
    // ADMIN PANEL CONTROLLER
    // =========================================================================
    renderAdminView() {
        this.resetTheme();
        if (!this.isAdminAuthenticated) {
            this.showView('view-admin-login');
        } else {
            this.showView('view-admin-dashboard');
            this.renderAdminProfilesGrid();
        }
    }

    renderAdminProfilesGrid(filterText = '') {
        const grid = document.getElementById('admin-profiles-grid');
        if (!grid) return;

        const filtered = this.profiles.filter(p =>
            p.name.toLowerCase().includes(filterText.toLowerCase()) ||
            p.slug.toLowerCase().includes(filterText.toLowerCase()) ||
            p.school.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No se encontraron perfiles creados.</p>
                </div>
            `;
            return;
        }

        const baseUrl = window.location.origin;

        grid.innerHTML = filtered.map(p => {
            const publicUrl = `${baseUrl}/${p.slug}`;
            return `
                <div class="admin-card ${!p.active ? 'is-inactive' : ''}">
                    <div class="admin-card-head">
                        <img src="${p.photoUrl}" alt="${p.name}" class="admin-card-avatar">
                        <div class="admin-card-meta">
                            <h4>${p.name}</h4>
                            <span class="slug-pill">/${p.slug}</span>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.3rem;">
                                ${p.gender === 'girl' ? '👧 Niña' : '👦 Niño'} • ${p.age} Años • ${p.bloodType}
                            </div>
                        </div>
                    </div>

                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.8rem;">
                        <div><i class="fa-solid fa-phone"></i> WhatsApp: +${p.parentPhone}</div>
                        <div><i class="fa-solid fa-location-dot"></i> ${p.locationAddress || 'Sin ubicación'}</div>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.2); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); margin-bottom: 0.8rem;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: ${p.active ? 'var(--success)' : 'var(--danger)'}">
                            ${p.active ? '● ACTIVO' : '○ INACTIVO'}
                        </span>
                        <label class="switch">
                            <input type="checkbox" ${p.active ? 'checked' : ''} onchange="app.toggleProfileActive('${p.id}', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="admin-card-actions">
                        <button onclick="app.copyProfileLink('${publicUrl}')" class="btn btn-secondary btn-sm" title="Copiar Enlace Público">
                            <i class="fa-solid fa-link"></i> Copiar URL
                        </button>
                        <button onclick="app.openEditModal('${p.id}')" class="btn btn-primary btn-sm">
                            <i class="fa-solid fa-pen"></i> Editar
                        </button>
                        <button onclick="app.deleteProfile('${p.id}')" class="btn btn-danger btn-sm" title="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    toggleProfileActive(id, isActive) {
        const profile = this.profiles.find(p => p.id === id);
        if (profile) {
            profile.active = isActive;
            this.saveProfiles();
            this.renderAdminProfilesGrid();
            this.showToast(`Estado de ${profile.name} actualizado a: ${isActive ? 'Activo' : 'Inactivo'}`);
        }
    }

    copyProfileLink(url) {
        navigator.clipboard.writeText(url).then(() => {
            this.showToast(`¡Enlace copiado al portapapeles! ${url}`);
        }).catch(() => {
            prompt("Copia este enlace:", url);
        });
    }

    deleteProfile(id) {
        const profile = this.profiles.find(p => p.id === id);
        if (!profile) return;

        if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el perfil de ${profile.name}?`)) {
            this.profiles = this.profiles.filter(p => p.id !== id);
            this.saveProfiles();
            this.renderAdminProfilesGrid();
            this.showToast(`Perfil de ${profile.name} eliminado.`);
        }
    }

    // Auto Slug Generator with Collision Handling
    generateUniqueSlug(name, currentId = null) {
        let baseSlug = name.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
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

    // =========================================================================
    // MODAL FORM (CREATE / EDIT)
    // =========================================================================
    openCreateModal() {
        document.getElementById('modal-title').innerHTML = `<i class="fa-solid fa-user-plus"></i> Crear Nuevo Perfil Infantil`;
        document.getElementById('form-save-profile').reset();
        document.getElementById('input-profile-id').value = '';
        document.getElementById('input-active').checked = true;
        document.getElementById('photo-preview').src = 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80';
        document.getElementById('input-whatsapp-msg').value = 'Hola, encontré el perfil de {nombre} y me gustaría comunicarme con sus padres.';
        
        document.getElementById('modal-profile').classList.remove('hidden');
    }

    openEditModal(id) {
        const p = this.profiles.find(item => item.id === id);
        if (!p) return;

        document.getElementById('modal-title').innerHTML = `<i class="fa-solid fa-pen"></i> Editar Perfil de ${p.name}`;
        document.getElementById('input-profile-id').value = p.id;
        document.getElementById('input-name').value = p.name;
        document.getElementById('input-slug').value = p.slug;
        document.getElementById('input-gender').value = p.gender;
        document.getElementById('input-age').value = p.age;
        document.getElementById('input-blood').value = p.bloodType;
        document.getElementById('input-school').value = p.school || '';
        document.getElementById('input-parent').value = p.parentName;
        document.getElementById('input-phone').value = p.parentPhone;
        document.getElementById('input-address').value = p.locationAddress || '';
        document.getElementById('input-whatsapp-msg').value = p.whatsappMessage || 'Hola, encontré la información de {nombre} y quiero comunicarme con sus padres.';
        document.getElementById('input-maps-url').value = p.locationMapsUrl || '';
        document.getElementById('input-allergies').value = p.allergies || '';
        document.getElementById('input-notes').value = p.medicalNotes || '';
        document.getElementById('input-photo-url').value = p.photoUrl || '';
        document.getElementById('photo-preview').src = p.photoUrl || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80';
        document.getElementById('input-active').checked = p.active;

        document.getElementById('modal-profile').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modal-profile').classList.add('hidden');
    }

    saveProfileFromForm() {
        const id = document.getElementById('input-profile-id').value;
        const name = document.getElementById('input-name').value.trim();
        let slug = document.getElementById('input-slug').value.trim();

        if (!name) return;

        // Auto-generate or validate slug
        if (!slug) {
            slug = this.generateUniqueSlug(name, id);
        } else {
            slug = this.generateUniqueSlug(slug, id);
        }

        const photoUrlInput = document.getElementById('input-photo-url').value.trim();
        const photoPreviewSrc = document.getElementById('photo-preview').src;
        const finalPhoto = photoUrlInput || photoPreviewSrc;

        const profileData = {
            id: id || `prof-${Date.now()}`,
            slug: slug,
            name: name,
            gender: document.getElementById('input-gender').value,
            age: parseInt(document.getElementById('input-age').value) || 5,
            bloodType: document.getElementById('input-blood').value,
            school: document.getElementById('input-school').value.trim(),
            parentName: document.getElementById('input-parent').value.trim(),
            parentPhone: document.getElementById('input-phone').value.trim(),
            locationAddress: document.getElementById('input-address').value.trim(),
            whatsappMessage: document.getElementById('input-whatsapp-msg').value.trim(),
            locationMapsUrl: document.getElementById('input-maps-url').value.trim(),
            allergies: document.getElementById('input-allergies').value.trim(),
            medicalNotes: document.getElementById('input-notes').value.trim(),
            photoUrl: finalPhoto,
            active: document.getElementById('input-active').checked,
            createdAt: new Date().toISOString()
        };

        if (id) {
            // Update existing
            const index = this.profiles.findIndex(p => p.id === id);
            if (index !== -1) this.profiles[index] = profileData;
        } else {
            // Create new
            this.profiles.unshift(profileData);
        }

        this.saveProfiles();
        this.closeModal();
        this.renderAdminProfilesGrid();
        this.showToast(`¡Perfil de ${name} guardado correctamente! URL: /${slug}`);
    }

    // =========================================================================
    // EVENT LISTENERS SETUP
    // =========================================================================
    setupEventListeners() {
        // Admin Login
        document.getElementById('form-admin-login')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const pin = document.getElementById('input-admin-pin').value;
            if (pin === DEFAULT_PIN) {
                this.isAdminAuthenticated = true;
                sessionStorage.setItem('nfc_admin_auth', 'true');
                this.renderAdminView();
                this.showToast("¡Sesión iniciada correctamente!");
            } else {
                alert("Clave PIN incorrecta. (PIN por defecto: 1234)");
            }
        });

        // Admin Logout
        document.getElementById('btn-admin-logout')?.addEventListener('click', () => {
            this.isAdminAuthenticated = false;
            sessionStorage.removeItem('nfc_admin_auth');
            this.showView('view-admin-login');
            this.showToast("Sesión cerrada.");
        });

        // Search in Admin
        document.getElementById('admin-search-input')?.addEventListener('input', (e) => {
            this.renderAdminProfilesGrid(e.target.value);
        });

        // Modal Triggers
        document.getElementById('btn-open-create-modal')?.addEventListener('click', () => this.openCreateModal());
        document.getElementById('modal-close-btn')?.addEventListener('click', () => this.closeModal());
        document.getElementById('modal-cancel-btn')?.addEventListener('click', () => this.closeModal());

        // Save Form
        document.getElementById('form-save-profile')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileFromForm();
        });

        // Auto Slug Suggestion on Name Input
        document.getElementById('input-name')?.addEventListener('input', (e) => {
            const currentId = document.getElementById('input-profile-id').value;
            if (!currentId) {
                document.getElementById('input-slug').value = this.generateUniqueSlug(e.target.value);
            }
        });

        // Photo File Upload Handler (Base64 Converter)
        const dropzone = document.getElementById('dropzone-photo');
        const fileInput = document.getElementById('file-photo-input');
        const previewImg = document.getElementById('photo-preview');

        dropzone?.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                fileInput.click();
            }
        });

        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewImg.src = event.target.result;
                    document.getElementById('input-photo-url').value = '';
                };
                reader.readAsDataURL(file);
            }
        });

        // Handle URL links navigation without reload
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.origin === window.location.origin && !link.target) {
                e.preventDefault();
                window.history.pushState({}, '', link.pathname);
                this.handleRouting();
            }
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

// Global App Instance
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ProfilePlatform();
});
