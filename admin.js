/* ==========================================================================
   NFC INFANTIL - ADMIN PANEL LOGIC (SANITY-CHECKED REAL-TIME CLOUD DB)
   ========================================================================== */

const DEFAULT_PIN = "1234";
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

class AdminApp {
    constructor() {
        this.profiles = [];
        this.isAuthenticated = sessionStorage.getItem('nfc_admin_auth') === 'true';
        this.photoRemoved = false;
        this.init();
    }

    async init() {
        this.loadProfilesLocal();
        this.setupEventListeners();
        this.renderState();
        await this.syncFromCloudDB();
    }

    sanitizeProfile(p) {
        if (!p) return null;
        const name = (p.name && String(p.name).trim() !== '' && String(p.name).trim() !== 'undefined') ? String(p.name).trim() : 'Perfil';
        
        let slug = (p.slug && String(p.slug).trim() !== '' && String(p.slug).trim() !== 'undefined') 
            ? String(p.slug).trim() 
            : this.generateUniqueSlug(name, p.id);

        return {
            id: p.id || `prof-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            slug: slug,
            name: name,
            gender: p.gender === 'girl' ? 'girl' : 'boy',
            age: parseInt(p.age) > 0 ? parseInt(p.age) : 5,
            bloodType: (p.bloodType && String(p.bloodType).trim() !== '' && String(p.bloodType) !== 'undefined') ? String(p.bloodType).trim() : 'O+',
            parentPhone: (p.parentPhone && String(p.parentPhone).trim() !== '' && String(p.parentPhone) !== 'undefined') ? String(p.parentPhone).trim() : '',
            whatsappMessage: (p.whatsappMessage && String(p.whatsappMessage).trim() !== '') ? String(p.whatsappMessage).trim() : 'Hola, encontré la información del perfil de {nombre}.',
            locationMapsUrl: (p.locationMapsUrl && String(p.locationMapsUrl).trim() !== '') ? String(p.locationMapsUrl).trim() : '',
            photoUrl: (p.photoUrl && String(p.photoUrl).trim() !== '' && String(p.photoUrl) !== 'undefined') ? String(p.photoUrl).trim() : '',
            active: true,
            createdAt: p.createdAt || new Date().toISOString()
        };
    }

    loadProfilesLocal() {
        const stored = localStorage.getItem('nfc_profiles_db');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.profiles = parsed.map(p => this.sanitizeProfile(p)).filter(Boolean);
                } else {
                    this.profiles = DEFAULT_PROFILES.map(p => this.sanitizeProfile(p)).filter(Boolean);
                }
            } catch (e) {
                this.profiles = DEFAULT_PROFILES.map(p => this.sanitizeProfile(p)).filter(Boolean);
            }
        } else {
            this.profiles = DEFAULT_PROFILES.map(p => this.sanitizeProfile(p)).filter(Boolean);
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
                    // Sanitize all cloud profiles so no undefined values ever exist
                    this.profiles = cloudProfiles.map(p => this.sanitizeProfile(p)).filter(Boolean);
                    this.saveProfilesLocal();
                } else if (this.profiles.length > 0) {
                    await this.pushToCloudDB();
                }

                if (this.isAuthenticated) {
                    this.renderProfilesGrid();
                }
            }
        } catch (err) {
            console.log("Cloud sync load offline, using LocalStorage:", err);
        }
    }

    async pushToCloudDB() {
        this.saveProfilesLocal();
        try {
            await fetch(CLOUD_DB_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profiles: this.profiles })
            });
        } catch (err) {
            console.log("Cloud sync push error:", err);
        }
    }

    renderState() {
        const loginScreen = document.getElementById('admin-login-screen');
        const dashboardScreen = document.getElementById('admin-dashboard-screen');
        const logoutBtn = document.getElementById('btn-admin-logout');

        if (!this.isAuthenticated) {
            loginScreen.classList.add('active-view');
            dashboardScreen.classList.remove('active-view');
            logoutBtn?.classList.add('hidden');
        } else {
            loginScreen.classList.remove('active-view');
            dashboardScreen.classList.add('active-view');
            logoutBtn?.classList.remove('hidden');
            this.renderProfilesGrid();
        }
    }

    renderProfilesGrid(filterText = '') {
        const grid = document.getElementById('admin-profiles-grid');
        if (!grid) return;

        const totalCountEl = document.getElementById('stat-total-count');
        if (totalCountEl) totalCountEl.textContent = this.profiles.length;

        const filtered = this.profiles.filter(p =>
            p.name.toLowerCase().includes(filterText.toLowerCase()) ||
            p.slug.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-secondary); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem; color: var(--accent-main); opacity: 0.7;"></i>
                    <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">No se encontraron perfiles</h3>
                    <p style="font-size: 0.9rem;">Prueba con otra búsqueda o crea un nuevo perfil infantil.</p>
                </div>
            `;
            return;
        }

        const origin = window.location.origin;

        grid.innerHTML = filtered.map(p => {
            const publicUrl = `${origin}/${p.slug}`;
            const photo = (p.photoUrl && p.photoUrl.trim() !== '') ? p.photoUrl : NEUTRAL_AVATAR_SVG;

            return `
                <div class="admin-card">
                    <!-- Clean Header (Avatar Left, Name & Gender Pill Right) -->
                    <div class="admin-card-header">
                        <img src="${photo}" alt="${p.name}" class="admin-card-avatar" style="${p.gender === 'girl' ? 'border-color: #f472b6;' : ''}">
                        <div class="admin-card-header-info">
                            <h4 class="admin-card-name" title="${p.name}">${p.name}</h4>
                            <span class="gender-pill ${p.gender === 'girl' ? 'pill-girl' : 'pill-boy'}">
                                ${p.gender === 'girl' ? '👧 Niña (Rosa)' : '👦 Niño (Azul)'}
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
                            <div class="meta-item">
                                <i class="fa-solid fa-calendar-day" style="color: var(--accent-main);"></i>
                                <span>${p.age} Años</span>
                            </div>
                            <div class="meta-item">
                                <i class="fa-solid fa-droplet" style="color: #f87171;"></i>
                                <span>${p.bloodType}</span>
                            </div>
                            <div class="meta-item meta-item-full">
                                <i class="fa-solid fa-phone" style="color: #34d399;"></i>
                                <span>${p.parentPhone ? '+' + p.parentPhone : 'Sin WhatsApp'}</span>
                            </div>
                            ${p.locationMapsUrl ? `
                            <div class="meta-item meta-item-full">
                                <i class="fa-solid fa-location-dot" style="color: #fbbf24;"></i>
                                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${p.locationMapsUrl}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Card Footer Actions -->
                    <div class="admin-card-footer">
                        <button onclick="adminApp.openEditModal('${p.id}')" class="btn btn-secondary btn-sm" style="flex: 1;">
                            <i class="fa-solid fa-pen-to-square"></i> Editar Perfil
                        </button>
                        <button onclick="adminApp.deleteProfile('${p.id}')" class="btn btn-danger btn-sm" title="Eliminar Definitivamente">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
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
            this.profiles = this.profiles.filter(p => p.id !== id);
            await this.pushToCloudDB();
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

    openCreateModal() {
        this.photoRemoved = false;
        document.getElementById('modal-title').innerHTML = `<i class="fa-solid fa-user-plus"></i> Crear Perfil Infantil`;
        document.getElementById('form-save-profile').reset();
        document.getElementById('input-profile-id').value = '';
        document.getElementById('photo-preview').src = NEUTRAL_AVATAR_SVG;
        document.getElementById('input-whatsapp-msg').value = 'Hola, encontré la información del perfil de {nombre} y me gustaría comunicarme con sus padres.';
        document.getElementById('modal-profile').classList.remove('hidden');
    }

    openEditModal(id) {
        const p = this.profiles.find(item => item.id === id);
        if (!p) return;

        this.photoRemoved = false;
        const currentPhoto = (p.photoUrl && p.photoUrl.trim() !== '') ? p.photoUrl : NEUTRAL_AVATAR_SVG;

        document.getElementById('modal-title').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Editar Perfil de ${p.name}`;
        document.getElementById('input-profile-id').value = p.id;
        document.getElementById('input-name').value = p.name;
        document.getElementById('input-slug').value = p.slug;
        document.getElementById('input-gender').value = p.gender;
        document.getElementById('input-age').value = p.age;
        document.getElementById('input-blood').value = p.bloodType;
        document.getElementById('input-phone').value = p.parentPhone || '';
        document.getElementById('input-whatsapp-msg').value = p.whatsappMessage || 'Hola, encontré el perfil de {nombre} y quiero comunicarme con sus padres.';
        document.getElementById('input-maps-url').value = p.locationMapsUrl || '';
        document.getElementById('input-photo-url').value = (p.photoUrl && p.photoUrl !== NEUTRAL_AVATAR_SVG) ? p.photoUrl : '';
        document.getElementById('photo-preview').src = currentPhoto;

        document.getElementById('modal-profile').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modal-profile').classList.add('hidden');
    }

    async saveProfileFromForm() {
        const id = document.getElementById('input-profile-id').value;
        const name = document.getElementById('input-name').value.trim();
        let slug = document.getElementById('input-slug').value.trim();
        const gender = document.getElementById('input-gender').value;

        if (!name) return;

        slug = this.generateUniqueSlug(slug || name, id);

        const photoUrlInput = document.getElementById('input-photo-url').value.trim();

        let finalPhoto;
        if (this.photoRemoved) {
            finalPhoto = '';
        } else {
            const previewSrc = document.getElementById('photo-preview').src;
            if (photoUrlInput) {
                finalPhoto = photoUrlInput;
            } else if (previewSrc && previewSrc !== NEUTRAL_AVATAR_SVG && !previewSrc.includes('data:image/svg+xml')) {
                finalPhoto = previewSrc;
            } else {
                finalPhoto = '';
            }
        }

        const rawProfile = {
            id: id || `prof-${Date.now()}`,
            slug: slug,
            name: name,
            gender: gender,
            age: parseInt(document.getElementById('input-age').value) || 5,
            bloodType: document.getElementById('input-blood').value,
            parentPhone: document.getElementById('input-phone').value.trim(),
            whatsappMessage: document.getElementById('input-whatsapp-msg').value.trim(),
            locationMapsUrl: document.getElementById('input-maps-url').value.trim(),
            photoUrl: finalPhoto,
            active: true,
            createdAt: new Date().toISOString()
        };

        const profileData = this.sanitizeProfile(rawProfile);

        if (id) {
            const idx = this.profiles.findIndex(p => p.id === id);
            if (idx !== -1) this.profiles[idx] = profileData;
        } else {
            this.profiles.unshift(profileData);
        }

        this.showToast("Guardando cambios en la base de datos...");
        await this.pushToCloudDB();
        this.closeModal();
        this.renderProfilesGrid();
        this.showToast(`¡Perfil de ${name} guardado! URL: /${slug}`);
    }

    compressImage(base64Data, maxWidth = 200, quality = 0.65) {
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
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => resolve(base64Data);
            img.src = base64Data;
        });
    }

    setupEventListeners() {
        document.getElementById('form-admin-login')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const pin = document.getElementById('input-admin-pin').value;
            if (pin === DEFAULT_PIN) {
                this.isAuthenticated = true;
                sessionStorage.setItem('nfc_admin_auth', 'true');
                this.renderState();
                this.showToast("¡Sesión iniciada!");
            } else {
                alert("Clave PIN incorrecta. (PIN por defecto: 1234)");
            }
        });

        document.getElementById('btn-admin-logout')?.addEventListener('click', () => {
            this.isAuthenticated = false;
            sessionStorage.removeItem('nfc_admin_auth');
            this.renderState();
            this.showToast("Sesión cerrada.");
        });

        document.getElementById('admin-search-input')?.addEventListener('input', (e) => {
            this.renderProfilesGrid(e.target.value);
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
                    previewImg.src = compressedBase64;
                    document.getElementById('input-photo-url').value = '';
                };
                reader.readAsDataURL(file);
            }
        });

        // Remove Photo Button: Sets photoUrl = '' in Cloud DB immediately!
        document.getElementById('btn-remove-photo')?.addEventListener('click', async () => {
            this.photoRemoved = true;
            
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
    adminApp = new AdminApp();
});
