/* ==========================================================================
   NFC INFANTIL - PUBLIC SINGLE CHILD PROFILE VIEWER (100% ULTRA ROBUST)
   ========================================================================== */

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
        medicalNotes: "",
        school: "",
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
        medicalNotes: "",
        school: "",
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
        allergies: "",
        medicalNotes: "",
        school: "",
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
        allergies: "",
        medicalNotes: "",
        school: "",
        photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: new Date().toISOString()
    }
];

class IsolatedProfileApp {
    constructor() {
        this.profiles = [];
        this.init();
    }

    init() {
        this.loadProfiles();
        this.handleRouting();
    }

    loadProfiles() {
        const stored = localStorage.getItem('nfc_profiles_db');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Ensure default profiles exist
                this.profiles = parsed && parsed.length > 0 ? parsed : DEFAULT_PROFILES;
            } catch (e) {
                this.profiles = DEFAULT_PROFILES;
            }
        } else {
            this.profiles = DEFAULT_PROFILES;
            localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));
        }
    }

    // Client Router: Extracts URL Slug (/samuel, ?slug=samuel, or ?p=samuel)
    handleRouting() {
        const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
        const urlParams = new URLSearchParams(window.location.search);

        let slug = '';
        if (urlParams.has('slug')) {
            slug = urlParams.get('slug');
        } else if (urlParams.has('p')) {
            slug = urlParams.get('p');
        } else if (path !== '/' && path !== '/index.html') {
            slug = path.substring(1);
        } else {
            // Default to 'samuel' if root index
            slug = 'samuel';
        }

        this.renderSingleProfile(slug);
    }

    // Renders strictly the single child profile corresponding to the URL
    renderSingleProfile(rawSlug) {
        if (!rawSlug) rawSlug = 'samuel';

        const cleanSlug = rawSlug.toLowerCase().trim()
            .replace(/^\/+|\/+$/g, '')
            .replace(/\.html$/, '');

        // Flexible search matching exact slug or slug prefix/name match
        let profile = this.profiles.find(p => p.slug.toLowerCase().trim() === cleanSlug);
        
        if (!profile) {
            profile = this.profiles.find(p => 
                p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(cleanSlug) ||
                cleanSlug.includes(p.slug.toLowerCase().trim())
            );
        }

        const profileView = document.getElementById('view-profile');
        const inactiveView = document.getElementById('view-inactive');

        if (!profile) {
            this.showInactive("Perfil No Encontrado", `No existe ningún perfil registrado con la dirección '/${cleanSlug}'.`);
            return;
        }

        if (!profile.active) {
            this.showInactive("Perfil No Disponible", `Este perfil no se encuentra disponible actualmente.`);
            return;
        }

        // Apply Theme based on gender ('boy' vs 'girl')
        document.body.className = profile.gender === 'girl' ? 'theme-girl' : 'theme-boy';

        // Render Values safely
        document.title = `Perfil de ${profile.name} | NFC Seguridad Infantil`;
        
        const nameEl = document.getElementById('p-name');
        if (nameEl) nameEl.textContent = profile.name;

        const ageEl = document.getElementById('p-age');
        if (ageEl) ageEl.textContent = profile.age;

        const bloodEl = document.getElementById('p-blood');
        if (bloodEl) bloodEl.textContent = profile.bloodType;

        // Badge
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
        
        const profileView = document.getElementById('view-profile');
        const inactiveView = document.getElementById('view-inactive');

        if (profileView) profileView.classList.add('hidden');
        if (inactiveView) inactiveView.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new IsolatedProfileApp();
});
