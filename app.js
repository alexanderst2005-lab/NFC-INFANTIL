/* ==========================================================================
   NFC INFANTIL - PUBLIC PROFILE VIEWER LOGIC (MAIN INDEX PAGE)
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

class ProfileViewer {
    constructor() {
        this.profiles = [];
        this.init();
    }

    init() {
        this.loadProfiles();
        this.renderProfileFromUrl();
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

    renderProfileFromUrl() {
        const path = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
        const urlParams = new URLSearchParams(window.location.search);

        let slug = '';
        if (urlParams.has('slug')) {
            slug = urlParams.get('slug');
        } else if (path !== '/' && path !== '/index.html') {
            slug = path.substring(1);
        } else {
            // Default to 'samuel' if visiting root index without params
            slug = 'samuel';
        }

        this.renderProfile(slug);
    }

    renderProfile(slug) {
        const profile = this.profiles.find(p => p.slug.toLowerCase() === slug.toLowerCase());

        const profileView = document.getElementById('view-profile');
        const inactiveView = document.getElementById('view-inactive');

        if (!profile) {
            this.showInactive("Perfil No Encontrado", `No existe ningún perfil registrado con la dirección '/${slug}'.`);
            return;
        }

        if (!profile.active) {
            this.showInactive("Perfil No Disponible", `El perfil de ${profile.name} se encuentra temporalmente deshabilitado.`);
            return;
        }

        // Set Theme (boy vs girl)
        document.body.className = profile.gender === 'girl' ? 'theme-girl' : 'theme-boy';

        // Render Values
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

        // Badge
        const badgeEl = document.getElementById('p-badge');
        if (profile.gender === 'girl') {
            badgeEl.innerHTML = `<i class="fa-solid fa-child-dress"></i> <span>Perfil Niña</span>`;
        } else {
            badgeEl.innerHTML = `<i class="fa-solid fa-child"></i> <span>Perfil Niño</span>`;
        }

        // Avatar
        const avatarEl = document.getElementById('p-avatar');
        avatarEl.src = profile.photoUrl || (profile.gender === 'girl' 
            ? 'https://images.unsplash.com/photo-1595454223600-91fb272189d5?w=400&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&auto=format&fit=crop&q=80');

        // WhatsApp Link Generator
        const waBtn = document.getElementById('btn-whatsapp-action');
        const customMsg = profile.whatsappMessage || `Hola, encontré el perfil de ${profile.name} y me gustaría comunicarme con sus padres.`;
        const formattedMsg = customMsg.replace('{nombre}', profile.name);
        const waCleanPhone = profile.parentPhone.replace(/[^0-9]/g, '');
        waBtn.href = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(formattedMsg)}`;

        // Maps Link Generator
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

        profileView.classList.remove('hidden');
        inactiveView.classList.add('hidden');
    }

    showInactive(title, desc) {
        document.body.className = 'theme-default';
        document.getElementById('inactive-title').textContent = title;
        document.getElementById('inactive-desc').textContent = desc;
        document.getElementById('view-profile').classList.add('hidden');
        document.getElementById('view-inactive').classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ProfileViewer();
});
