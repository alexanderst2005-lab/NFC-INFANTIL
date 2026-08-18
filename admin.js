/* ==========================================================================
   NFC INFANTIL - ADMIN PANEL LOGIC (100% AUTOMATIC CLOUD SYNC & DELETION)
   ========================================================================== */

const DEFAULT_PIN = "1234";
const CLOUD_DB_ENDPOINT = "/api/sync";

const DEFAULT_PROFILES = [
    {
        id: "prof-001",
        slug: "samuel",
        name: "Samuel Arias Rodríguez",
        gender: "boy",
        age: 13,
        bloodType: "B+",
        parentName: "Carlos y Diana Arias",
        parentPhone: "573001234567",
        whatsappMessage: "Hola, encontré la información del perfil de Samuel y me gustaría comunicarme con sus padres.",
        locationAddress: "Calle 100 #15-20, Bogotá",
        locationMapsUrl: "https://maps.google.com/?q=4.6853,-74.0435",
        allergies: "Ninguna",
        medicalNotes: "Usa inhalador en caso de crisis asmática. Entregar únicamente a acudientes registrados.",
        school: "Gimnasio Campestre Los Laureles",
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
        allergies: "Alergias leves a la penicilina",
        medicalNotes: "Lleva su carnet de vacunación completo.",
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
        whatsappMessage: "Hola, encontré la información del perfil de Juan Diego y me comunico con sus padres.",
        locationAddress: "Calle 26 #68-80, Bogotá",
        locationMapsUrl: "https://maps.google.com/?q=4.6581,-74.1084",
        allergies: "Intolerancia a la lactosa",
        medicalNotes: "Utiliza gafas formuladas.",
        school: "Jardín Exploradores del Futuro",
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
        whatsappMessage: "Hola, estoy escaneando la pulsera NFC de Sofía y me comunico con sus padres.",
        locationAddress: "Avenida 4 Norte #10-15, Cali",
        locationMapsUrl: "https://maps.google.com/?q=3.4516,-76.5320",
        allergies: "Alergia al maní",
        medicalNotes: "Siempre porta su pulsera de identificación NFC.",
        school: "Jardín Infantil Mis Primeros Pasos",
        photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: new Date().toISOString()
    }
];

class AdminApp {
    constructor() {
        this.profiles = [];
        this.isAuthenticated = sessionStorage.getItem('nfc_admin_auth') === 'true';
        this.init();
    }

    async init() {
        this.loadProfilesLocal();
        this.setupEventListeners();
        this.renderState();
        await this.syncFromCloudDB();
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
            this.saveProfilesLocal();
        }
    }

    saveProfilesLocal() {
        localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));
    }

    // Automatically sync profiles with cloud database on load
    async syncFromCloudDB() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4500);

            const res = await fetch(CLOUD_DB_ENDPOINT, { cache: 'no-cache', signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const jsonRes = await res.json();
                const cloudProfiles = jsonRes && Array.isArray(jsonRes.profiles) ? jsonRes.profiles : [];

                if (cloudProfiles.length > 0) {
                    this.profiles = cloudProfiles;
                    this.saveProfilesLocal();
                } else if (this.profiles.length > 0) {
                    // First time initialization if cloud is empty
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

        const filtered = this.profiles.filter(p =>
            p.name.toLowerCase().includes(filterText.toLowerCase()) ||
            p.slug.toLowerCase().includes(filterText.toLowerCase())
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

        const origin = window.location.origin;

        grid.innerHTML = filtered.map(p => {
            const publicUrl = `${origin}/${p.slug}`;

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
                            <input type="checkbox" ${p.active ? 'checked' : ''} onchange="adminApp.toggleProfileActive('${p.id}', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="admin-card-actions">
                        <button onclick="adminApp.copyProfileLink('${publicUrl}')" class="btn btn-secondary btn-sm" title="Copiar URL Corta Única">
                            <i class="fa-solid fa-link"></i> Copiar URL
                        </button>
                        <button onclick="adminApp.openEditModal('${p.id}')" class="btn btn-primary btn-sm">
                            <i class="fa-solid fa-pen"></i> Editar
                        </button>
                        <button onclick="adminApp.deleteProfile('${p.id}')" class="btn btn-danger btn-sm" title="Eliminar Definitivamente">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async toggleProfileActive(id, isActive) {
        const profile = this.profiles.find(p => p.id === id);
        if (profile) {
            profile.active = isActive;
            await this.pushToCloudDB();
            this.renderProfilesGrid();
            this.showToast(`Estado de ${profile.name} actualizado: ${isActive ? 'Activo' : 'Inactivo'}`);
        }
    }

    copyProfileLink(url) {
        navigator.clipboard.writeText(url).then(() => {
            this.showToast(`¡URL corta copiada! ${url}`);
        }).catch(() => {
            prompt("Copia este enlace:", url);
        });
    }

    // Permanent Deletion across PC, mobile, and cloud database
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
        let baseSlug = name.toLowerCase()
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
        document.getElementById('modal-title').innerHTML = `<i class="fa-solid fa-user-plus"></i> Crear Perfil Infantil`;
        document.getElementById('form-save-profile').reset();
        document.getElementById('input-profile-id').value = '';
        document.getElementById('input-active').checked = true;
        document.getElementById('photo-preview').src = 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80';
        document.getElementById('input-whatsapp-msg').value = 'Hola, encontré la información del perfil de {nombre} y me gustaría comunicarme con sus padres.';
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
        document.getElementById('input-whatsapp-msg').value = p.whatsappMessage || 'Hola, encontré el perfil de {nombre} y quiero comunicarme con sus padres.';
        document.getElementById('input-maps-url').value = p.locationMapsUrl || '';
        document.getElementById('input-allergies').value = p.allergies || '';
        document.getElementById('input-notes').value = p.medicalNotes || '';
        document.getElementById('input-photo-url').value = p.photoUrl || '';
        document.getElementById('photo-preview').src = p.photoUrl || 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&auto=format&fit=crop&q=80';
        document.getElementById('input-active').checked = p.active;

        document.getElementById('modal-profile').classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modal-profile').classList.add('hidden');
    }

    async saveProfileFromForm() {
        const id = document.getElementById('input-profile-id').value;
        const name = document.getElementById('input-name').value.trim();
        let slug = document.getElementById('input-slug').value.trim();

        if (!name) return;

        slug = this.generateUniqueSlug(slug || name, id);

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
            const idx = this.profiles.findIndex(p => p.id === id);
            if (idx !== -1) this.profiles[idx] = profileData;
        } else {
            this.profiles.unshift(profileData);
        }

        this.showToast("Guardando cambios...");
        await this.pushToCloudDB();
        this.closeModal();
        this.renderProfilesGrid();
        this.showToast(`¡Perfil de ${name} guardado! URL: /${slug}`);
    }

    compressImage(base64Data, maxWidth = 300, quality = 0.75) {
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
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    const compressedBase64 = await this.compressImage(evt.target.result);
                    previewImg.src = compressedBase64;
                    document.getElementById('input-photo-url').value = '';
                };
                reader.readAsDataURL(file);
            }
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
