/* ==========================================================================
   NFC INFANTIL - PUBLIC PROFILE VIEWER LOGIC (FIREBASE FIRESTORE REAL-TIME SINGLE SOURCE OF TRUTH)
   ========================================================================== */
import { 
    db, 
    collection, 
    doc, 
    setDoc, 
    onSnapshot, 
    INITIAL_PROFILES_SEED 
} from './firebase-config.js';

// Neutral SVG Silhouette for profiles without a custom photo
const NEUTRAL_AVATAR_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%2364748b'%3E%3Ccircle cx='50' cy='35' r='22'/%3E%3Cpath d='M18 85c0-18 14-30 32-30s32 12 32 30Z'/%3E%3C/svg%3E";

class App {
    constructor() {
        const stored = localStorage.getItem('nfc_profiles_db');
        let initialList = [];
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    initialList = parsed;
                }
            } catch (e) {}
        }
        this.profiles = this.deduplicateProfiles(initialList);
        this.currentProfile = null;
        this.nfcSession = null;
        this.init();
    }

    async init() {
        const targetSlug = this.getSlugFromUrl();
        this.setupNfcListener();
        this.setupSimulatedScanner();

        // 🚀 Instant local render so page is NEVER blank or empty
        this.renderSingleProfile(targetSlug);
        document.documentElement.classList.add('ready');

        // Firestore Realtime Single Source of Truth Listener
        onSnapshot(collection(db, "nfc_profiles"), async (snapshot) => {
            const loaded = [];
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                if (data) loaded.push(data);
            });

            this.profiles = this.deduplicateProfiles(loaded);

            localStorage.setItem('nfc_profiles_db', JSON.stringify(this.profiles));

            this.renderSingleProfile(targetSlug);
            document.documentElement.classList.add('ready');
        }, (error) => {
            console.error("Firestore Realtime Listener Error:", error);
            this.renderSingleProfile(targetSlug);
            document.documentElement.classList.add('ready');
        });
    }

    calculateAgeFromBirthDate(birthDateStr, fallbackAge = '') {
        if (!birthDateStr || String(birthDateStr).trim() === '') {
            return (fallbackAge !== undefined && fallbackAge !== null && String(fallbackAge).trim() !== '' && parseInt(fallbackAge) >= 0) ? parseInt(fallbackAge) : '';
        }
        const str = String(birthDateStr).trim();
        let birthYear, birthMonth, birthDay;

        // Parse YYYY-MM-DD or YYYY/MM/DD directly as calendar date
        const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
        // Parse DD/MM/YYYY or DD-MM-YYYY
        const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);

        if (isoMatch) {
            birthYear = parseInt(isoMatch[1], 10);
            birthMonth = parseInt(isoMatch[2], 10);
            birthDay = parseInt(isoMatch[3], 10);
        } else if (dmyMatch) {
            birthDay = parseInt(dmyMatch[1], 10);
            birthMonth = parseInt(dmyMatch[2], 10);
            birthYear = parseInt(dmyMatch[3], 10);
        } else {
            const d = new Date(str);
            if (isNaN(d.getTime())) {
                return (fallbackAge !== undefined && fallbackAge !== null && String(fallbackAge).trim() !== '' && parseInt(fallbackAge) >= 0) ? parseInt(fallbackAge) : '';
            }
            birthYear = d.getUTCFullYear();
            birthMonth = d.getUTCMonth() + 1;
            birthDay = d.getUTCDate();
        }

        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1; // 1 to 12
        const currentDay = today.getDate(); // 1 to 31

        let age = currentYear - birthYear;
        if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
            age--;
        }
        return age >= 0 ? age : '';
    }

    sanitizeProfile(p) {
        if (!p) return null;

        const name = (p.name && String(p.name).trim() !== '' && String(p.name).trim() !== 'undefined') 
            ? String(p.name).trim() 
            : 'Perfil';
        
        let gender = (p.gender === 'girl' || p.gender === 'pet' || p.gender === 'senior' || p.gender === 'vehicle') ? p.gender : 'boy';
        if (p.id === 'prof-006-jose' || (p.slug && String(p.slug).toLowerCase().includes('jose-ramirez'))) {
            gender = 'senior';
        }

        const rawSlug = (p.slug && String(p.slug).trim() !== '') ? String(p.slug).trim() : name;
        let slug = rawSlug.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        if (!slug) slug = 'perfil';

        let locationMapsUrl = (p.locationMapsUrl !== undefined && p.locationMapsUrl !== null) ? String(p.locationMapsUrl).trim() : '';
        if (locationMapsUrl.includes('maps.google.com/?q=6.2088') || 
            locationMapsUrl.includes('maps.google.com/?q=4.6581') || 
            locationMapsUrl.includes('maps.google.com/?q=3.4516')) {
            locationMapsUrl = '';
        }

        let schoolMapsUrl = (p.schoolMapsUrl !== undefined && p.schoolMapsUrl !== null) ? String(p.schoolMapsUrl).trim() : '';
        let school = (p.school !== undefined && p.school !== null) ? String(p.school).trim() : '';
        let grade = (p.grade !== undefined && p.grade !== null) ? String(p.grade).trim() : '';
        let medicalConditions = (p.medicalConditions !== undefined && p.medicalConditions !== null) ? String(p.medicalConditions).trim() : '';
        let importantMedications = (p.importantMedications !== undefined && p.importantMedications !== null) ? String(p.importantMedications).trim() : '';

        // Vehicle Fields
        let vehicleType = (p.vehicleType === 'car' || p.vehicleType === 'moto' || p.vehicleType === 'bike') ? p.vehicleType : 'car';
        let vehicleBrand = (p.vehicleBrand !== undefined && p.vehicleBrand !== null) ? String(p.vehicleBrand).trim() : '';
        let vehicleModel = (p.vehicleModel !== undefined && p.vehicleModel !== null) ? String(p.vehicleModel).trim() : '';
        let vehicleYear = (p.vehicleYear !== undefined && p.vehicleYear !== null) ? String(p.vehicleYear).trim() : '';
        let vehicleColor = (p.vehicleColor !== undefined && p.vehicleColor !== null) ? String(p.vehicleColor).trim() : '';
        let vehiclePlate = (p.vehiclePlate !== undefined && p.vehiclePlate !== null) ? String(p.vehiclePlate).trim() : '';
        let vehicleOwner = (p.vehicleOwner !== undefined && p.vehicleOwner !== null) ? String(p.vehicleOwner).trim() : '';
        let vehicleEngine = (p.vehicleEngine !== undefined && p.vehicleEngine !== null) ? String(p.vehicleEngine).trim() : '';

        const defaultWaMsg = gender === 'pet'
            ? 'Hola, encontré a la mascota {nombre} y quiero comunicarme con su dueño.'
            : (gender === 'senior' 
                ? 'Hola, encontré el perfil de seguridad del adulto mayor {nombre} y quiero comunicarme con sus familiares.' 
                : (gender === 'vehicle'
                    ? 'Hola, encontré la información del vehículo {nombre} y quiero comunicarme con el propietario o contacto de emergencia.'
                    : 'Hola, encontré la información del perfil de {nombre}.'));

        const birthDate = (p.birthDate !== undefined && p.birthDate !== null) ? String(p.birthDate).trim() : '';
        const computedAge = this.calculateAgeFromBirthDate(birthDate, (p.age !== undefined && p.age !== null) ? p.age : '');
        const bloodType = gender === 'pet' ? '' : ((p.bloodType !== undefined && p.bloodType !== null && String(p.bloodType).trim() !== 'undefined') ? String(p.bloodType).trim() : '');
        const allergies = (p.allergies !== undefined && p.allergies !== null) ? String(p.allergies).trim() : '';
        const contactName1 = (p.contactName1 !== undefined && p.contactName1 !== null) ? String(p.contactName1).trim() : '';
        const contactRole1 = (p.contactRole1 !== undefined && p.contactRole1 !== null) ? String(p.contactRole1).trim() : '';
        const contactName2 = (p.contactName2 !== undefined && p.contactName2 !== null) ? String(p.contactName2).trim() : '';
        const contactRole2 = (p.contactRole2 !== undefined && p.contactRole2 !== null) ? String(p.contactRole2).trim() : '';
        const parentPhone = (p.parentPhone !== undefined && p.parentPhone !== null && String(p.parentPhone).trim() !== 'undefined') ? String(p.parentPhone).trim() : '';
        const parentPhone2 = (p.parentPhone2 !== undefined && p.parentPhone2 !== null && String(p.parentPhone2).trim() !== 'undefined') ? String(p.parentPhone2).trim() : '';
        const emergencyPhone = (p.emergencyPhone !== undefined && p.emergencyPhone !== null && String(p.emergencyPhone).trim() !== '') ? String(p.emergencyPhone).trim() : '123';
        const whatsappMessage = (p.whatsappMessage && String(p.whatsappMessage).trim() !== '') ? String(p.whatsappMessage).trim() : defaultWaMsg;
        const photoUrl = (p.photoUrl !== undefined && p.photoUrl !== null && String(p.photoUrl).trim() !== 'undefined') ? String(p.photoUrl).trim() : '';

        return {
            id: p.id || `prof-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            slug: slug,
            name: name,
            gender: gender,
            vehicleType: vehicleType,
            vehicleBrand: vehicleBrand,
            vehicleModel: vehicleModel,
            vehicleYear: vehicleYear,
            vehicleColor: vehicleColor,
            vehiclePlate: vehiclePlate,
            vehicleOwner: vehicleOwner,
            vehicleEngine: vehicleEngine,
            birthDate: birthDate,
            age: computedAge,
            bloodType: bloodType,
            allergies: allergies,
            contactName1: contactName1,
            contactRole1: contactRole1,
            contactName2: contactName2,
            contactRole2: contactRole2,
            parentPhone: parentPhone,
            parentPhone2: parentPhone2,
            emergencyPhone: emergencyPhone,
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

    getSlugFromUrl() {
        const path = window.location.pathname.replace(/^\/|\/$/g, '');
        if (path && path !== 'index.html' && path !== 'admin' && path !== 'admin.html') {
            return path.toLowerCase();
        }
        const urlParams = new URLSearchParams(window.location.search);
        const slugParam = urlParams.get('slug') || urlParams.get('id');
        if (slugParam) return slugParam.toLowerCase();

        return '';
    }

    findProfileBySlug(slug) {
        if (!slug) {
            // Si entra a la página principal sin escanear pulsera, expulsarlo al Login
            window.location.href = '/admin.html';
            return null;
        }
        const cleanSlug = slug.toLowerCase().trim();

        let profile = this.profiles.find(p => p.slug === cleanSlug || p.id === cleanSlug);

        if (!profile) {
            profile = this.profiles.find(p => p.slug && p.slug.toLowerCase().includes(cleanSlug));
        }

        if (!profile) {
            profile = this.profiles.find(p => {
                if (!p || !p.name) return false;
                const normName = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-');
                return normName === cleanSlug || normName.includes(cleanSlug) || cleanSlug.includes(normName);
            });
        }

        if (!profile) {
            profile = this.profiles.find(p => {
                if (!p || !p.slug) return false;
                return p.slug.toLowerCase().includes(cleanSlug);
            });
        }

        return profile || null;
    }

    renderSingleProfile(rawSlug) {
        const viewProfile = document.getElementById('view-profile');
        const viewInactive = document.getElementById('view-inactive');
        const profile = this.findProfileBySlug(rawSlug);
        if (!profile || profile.active === false) {
            viewProfile?.classList.add('hidden');
            viewInactive?.classList.remove('hidden');
            const inactiveTitle = document.getElementById('inactive-title');
            const inactiveDesc = document.getElementById('inactive-desc');
            if (inactiveTitle) inactiveTitle.textContent = profile ? 'Perfil Inactivo' : 'Perfil No Encontrado';
            if (inactiveDesc) inactiveDesc.textContent = profile ? 'Este perfil ha sido deshabilitado temporalmente.' : 'No existe ningún perfil registrado con este enlace.';
            return;
        }
        this.currentProfile = profile;
        viewInactive?.classList.add('hidden');
        viewProfile?.classList.remove('hidden');
        // Apply Theme
        const isPet = profile.gender === 'pet';
        const isSenior = profile.gender === 'senior';
        const isGirl = profile.gender === 'girl';
        const isVehicle = profile.gender === 'vehicle';
        const vehicleType = profile.vehicleType || 'car'; // 'car', 'moto', 'bike'
        
        let themeClass = isPet ? 'theme-pet' : (isSenior ? 'theme-senior' : (isGirl ? 'theme-girl' : 'theme-boy'));
        if (isVehicle) {
            themeClass = `theme-vehicle theme-${vehicleType}`;
        }
        
        document.documentElement.classList.remove('theme-boy', 'theme-girl', 'theme-pet', 'theme-senior', 'theme-vehicle', 'theme-car', 'theme-moto', 'theme-bike');
        document.documentElement.classList.add(...themeClass.split(' '));

        // Vehicle Hero Cover Banner Visibility
        const vehicleBanner = document.getElementById('vehicle-hero-banner');
        const standardTopBar = document.getElementById('standard-top-bar');
        const coverImg = document.getElementById('vehicle-cover-img');
        const vBadgeSub = document.getElementById('p-v-badge-sub');

        if (isVehicle) {
            vehicleBanner?.classList.remove('hidden');
            standardTopBar?.classList.add('hidden');

            let coverUrl = 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop&q=80'; // Moto
            let subTitleText = 'Perfil de Emergencia Motociclista';

            if (vehicleType === 'car') {
                coverUrl = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80'; // Car
                subTitleText = 'Perfil de Emergencia Conductor';
            } else if (vehicleType === 'bike') {
                coverUrl = 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=1200&auto=format&fit=crop&q=80'; // Bike
                subTitleText = 'Perfil de Identificación Ciclista';
            }

            if (coverImg) coverImg.src = coverUrl;
            if (vBadgeSub) vBadgeSub.textContent = subTitleText;
        } else {
            vehicleBanner?.classList.add('hidden');
            standardTopBar?.classList.remove('hidden');
        }

        // Emergency Instruction Banner
        const instructionBox = document.getElementById('box-emergency-instruction');
        if (isVehicle || profile.medicalConditions || profile.importantMedications || profile.allergies) {
            instructionBox?.classList.remove('hidden');
        } else {
            instructionBox?.classList.add('hidden');
        }

        // Update Category-Specific Decorator Icons
        const decoTl = document.getElementById('p-deco-tl');
        const decoTr = document.getElementById('p-deco-tr');
        const decoBr = document.getElementById('p-deco-br');
        const sceneLeft = document.getElementById('scene-left');
        const sceneRight = document.getElementById('scene-right');
        const footerTag = document.getElementById('p-footer-tag');

        if (isVehicle) {
            let stickerColor = '#dc2626'; // Default Moto Red
            if (vehicleType === 'car') stickerColor = '#ef4444'; // Red Car
            else if (vehicleType === 'bike') stickerColor = '#ef4444'; // Red Bike

            if (vehicleType === 'moto') {
                if (decoTl) decoTl.innerHTML = `<i class="fa-solid fa-motorcycle" style="color: ${stickerColor}; text-shadow: 0 4px 10px rgba(220,38,38,0.3);"></i>`;
                if (decoTr) decoTr.innerHTML = `<i class="fa-solid fa-helmet-safety" style="color: ${stickerColor}; text-shadow: 0 4px 10px rgba(220,38,38,0.3);"></i>`;
                if (decoBr) decoBr.innerHTML = `<i class="fa-solid fa-shield-halved" style="color: ${stickerColor}; text-shadow: 0 4px 10px rgba(220,38,38,0.3);"></i>`;
                if (sceneLeft) sceneLeft.innerHTML = `<i class="fa-solid fa-motorcycle" style="color: ${stickerColor};"></i>`;
                if (sceneRight) sceneRight.innerHTML = `<i class="fa-solid fa-shield-heart" style="color: ${stickerColor};"></i>`;
                if (footerTag) footerTag.innerHTML = `<i class="fa-solid fa-motorcycle" style="color: ${stickerColor};"></i> NFC - COL • Perfil Oficial de Seguridad <i class="fa-solid fa-shield-halved" style="color: ${stickerColor};"></i>`;
            } else if (vehicleType === 'bike') {
                if (decoTl) decoTl.innerHTML = `<i class="fa-solid fa-bicycle" style="color: ${stickerColor}; text-shadow: 0 4px 10px rgba(220,38,38,0.3);"></i>`;
                if (decoTr) decoTr.innerHTML = `<i class="fa-solid fa-route" style="color: ${stickerColor}; text-shadow: 0 4px 10px rgba(220,38,38,0.3);"></i>`;
                if (decoBr) decoBr.innerHTML = `<i class="fa-solid fa-heart-pulse" style="color: ${stickerColor}; text-shadow: 0 4px 10px rgba(220,38,38,0.3);"></i>`;
                if (sceneLeft) sceneLeft.innerHTML = `<i class="fa-solid fa-bicycle" style="color: ${stickerColor};"></i>`;
                if (sceneRight) sceneRight.innerHTML = `<i class="fa-solid fa-shield-heart" style="color: ${stickerColor};"></i>`;
                if (footerTag) footerTag.innerHTML = `<i class="fa-solid fa-bicycle" style="color: ${stickerColor};"></i> NFC - COL • Perfil Oficial de Seguridad <i class="fa-solid fa-shield-halved" style="color: ${stickerColor};"></i>`;
            } else {
                if (decoTl) decoTl.innerHTML = `<i class="fa-solid fa-car" style="color: ${stickerColor}; text-shadow: 0 4px 10px rgba(220,38,38,0.3);"></i>`;
                if (decoTr) decoTr.innerHTML = `<i class="fa-solid fa-gauge-high" style="color: ${stickerColor}; text-shadow: 0 4px 10px rgba(220,38,38,0.3);"></i>`;
                if (decoBr) decoBr.innerHTML = `<i class="fa-solid fa-road" style="color: ${stickerColor}; text-shadow: 0 4px 10px rgba(220,38,38,0.3);"></i>`;
                if (sceneLeft) sceneLeft.innerHTML = `<i class="fa-solid fa-car-side" style="color: ${stickerColor};"></i>`;
                if (sceneRight) sceneRight.innerHTML = `<i class="fa-solid fa-shield-heart" style="color: ${stickerColor};"></i>`;
                if (footerTag) footerTag.innerHTML = `<i class="fa-solid fa-car-side" style="color: ${stickerColor};"></i> NFC - COL • Perfil Oficial de Seguridad <i class="fa-solid fa-shield-halved" style="color: ${stickerColor};"></i>`;
            }
        } else if (isGirl) {
            if (footerTag) footerTag.innerHTML = '<i class="fa-solid fa-shield-heart"></i> Protegido con amor <i class="fa-solid fa-heart" style="color: #ec4899;"></i>';
            if (decoTl) decoTl.innerHTML = '<i class="fa-solid fa-feather"></i>';
            if (decoTr) decoTr.innerHTML = '<i class="fa-solid fa-rainbow"></i>';
            if (decoBr) decoBr.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
            if (sceneLeft) sceneLeft.innerHTML = '<i class="fa-solid fa-seedling"></i>';
            if (sceneRight) sceneRight.innerHTML = '<i class="fa-solid fa-chess-rook"></i>';
        } else if (isPet) {
            if (footerTag) footerTag.innerHTML = '<i class="fa-solid fa-shield-heart"></i> Protegido con amor <i class="fa-solid fa-heart" style="color: #ec4899;"></i>';
            if (decoTl) decoTl.innerHTML = '<i class="fa-solid fa-paw"></i>';
            if (decoTr) decoTr.innerHTML = '<i class="fa-solid fa-bone"></i>';
            if (decoBr) decoBr.innerHTML = '<i class="fa-solid fa-heart"></i>';
            if (sceneLeft) sceneLeft.innerHTML = '<i class="fa-solid fa-tree"></i>';
            if (sceneRight) sceneRight.innerHTML = '<i class="fa-solid fa-paw"></i>';
        } else if (isSenior) {
            if (footerTag) footerTag.innerHTML = '<i class="fa-solid fa-shield-heart"></i> Protegido con amor <i class="fa-solid fa-heart" style="color: #ec4899;"></i>';
            if (decoTl) decoTl.innerHTML = '<i class="fa-solid fa-heart-pulse"></i>';
            if (decoTr) decoTr.innerHTML = '<i class="fa-solid fa-user-shield"></i>';
            if (decoBr) decoBr.innerHTML = '<i class="fa-solid fa-hand-holding-heart"></i>';
            if (sceneLeft) sceneLeft.innerHTML = '<i class="fa-solid fa-tree"></i>';
            if (sceneRight) sceneRight.innerHTML = '<i class="fa-solid fa-shield-heart"></i>';
        } else {
            // Default Boy Theme
            if (footerTag) footerTag.innerHTML = '<i class="fa-solid fa-shield-heart"></i> Protegido con amor <i class="fa-solid fa-heart" style="color: #ec4899;"></i>';
            if (decoTl) decoTl.innerHTML = '<i class="fa-solid fa-rocket"></i>';
            if (decoTr) decoTr.innerHTML = '<i class="fa-solid fa-atom"></i>';
            if (decoBr) decoBr.innerHTML = '<i class="fa-solid fa-user-astronaut"></i>';
            if (sceneLeft) sceneLeft.innerHTML = '<i class="fa-solid fa-futbol"></i>';
            if (sceneRight) sceneRight.innerHTML = '<i class="fa-solid fa-shoe-prints"></i>';
        }

        // Header & Card Top Bar Title Badge
        const topBrandTitle = document.getElementById('p-top-brand-title');
        const badgeTitle = document.getElementById('badge-category-title');
        const headerBadgeText = document.getElementById('header-badge-text');
        const secRibbon = document.getElementById('p-security-ribbon');

        if (isVehicle) {
            if (topBrandTitle) topBrandTitle.textContent = vehicleType === 'moto' ? 'Perfil de Emergencia - Motocicleta' : (vehicleType === 'bike' ? 'Identificación de Bicicleta' : 'Identificación de Vehículo');
            if (badgeTitle) badgeTitle.textContent = vehicleType === 'moto' ? 'NFC - COL / Motocicleta' : (vehicleType === 'bike' ? 'NFC - COL / Bicicleta' : 'NFC - COL / Vehículo');
            if (headerBadgeText) headerBadgeText.textContent = 'Perfil Oficial de Seguridad';
            if (secRibbon) secRibbon.textContent = vehicleType === 'moto' ? 'MOTOCICLISTA' : (vehicleType === 'bike' ? 'CICLISTA' : 'CONDUCTOR / VEHÍCULO');
        } else if (isPet) {
            if (topBrandTitle) topBrandTitle.textContent = 'Identificación de Mascotas';
            if (badgeTitle) badgeTitle.textContent = 'Mascota Perdida / Identificación';
            if (headerBadgeText) headerBadgeText.textContent = 'Perfil de Seguridad Mascota';
            if (secRibbon) secRibbon.textContent = 'Mi perfil de seguridad';
        } else if (isSenior) {
            if (topBrandTitle) topBrandTitle.textContent = 'Identificación Ad Mayor';
            if (badgeTitle) badgeTitle.textContent = 'Adulto Mayor / Identificación';
            if (headerBadgeText) headerBadgeText.textContent = 'Perfil de Seguridad Adulto Mayor';
            if (secRibbon) secRibbon.textContent = 'Mi perfil de seguridad';
        } else {
            if (topBrandTitle) topBrandTitle.textContent = 'Identificación Infantil';
            if (badgeTitle) badgeTitle.textContent = 'NFC - INFANTIL';
            if (headerBadgeText) headerBadgeText.textContent = 'Perfil Oficial de Seguridad';
            if (secRibbon) secRibbon.textContent = 'Mi perfil de seguridad';
        }

        // Avatar Image
        const avatarImg = document.getElementById('p-avatar');
        if (avatarImg) {
            avatarImg.src = (profile.photoUrl && profile.photoUrl.trim() !== '') ? profile.photoUrl : NEUTRAL_AVATAR_SVG;
            avatarImg.onerror = function() {
                this.onerror = null;
                this.src = NEUTRAL_AVATAR_SVG;
            };
        }
        // Name
        const nameEl = document.getElementById('p-hero-name');
        if (nameEl) nameEl.textContent = profile.name;
        // Category Badge Pill
        const genderText = document.getElementById('p-gender-text');
        if (genderText) {
            if (isVehicle) {
                genderText.textContent = vehicleType === 'moto' ? 'Motocicleta Registrada' : (vehicleType === 'bike' ? 'Bicicleta Registrada' : 'Vehículo Registrado');
            } else {
                genderText.textContent = isPet ? 'Mascota Protegida' : (isSenior ? 'Adulto Mayor Protegido' : 'Perfil Verificado');
            }
        }
        // Age
        const ageCard = document.getElementById('box-age');
        const ageEl = document.getElementById('p-age-val');
        if (!isVehicle && profile.age !== undefined && profile.age !== null && String(profile.age).trim() !== '') {
            ageCard?.classList.remove('hidden');
            if (ageEl) ageEl.textContent = `${profile.age} años`;
        } else {
            ageCard?.classList.add('hidden'); // Ocultar si no hay edad o es vehículo
        }
        
        // Blood Type Card Visibility
        const bloodCard = document.getElementById('box-blood');
        const bloodEl = document.getElementById('p-blood-val');
        if (isPet || !profile.bloodType || profile.bloodType.trim() === '') {
            bloodCard?.classList.add('hidden'); // Ocultar si está vacío o es mascota
        } else {
            bloodCard?.classList.remove('hidden');
            if (bloodEl) bloodEl.textContent = profile.bloodType;
        }

        // Allergies Card Visibility
        const allergiesCard = document.getElementById('box-allergies');
        const allergiesEl = document.getElementById('p-allergies-val');
        if (profile.allergies && profile.allergies.trim() !== '') {
            allergiesCard?.classList.remove('hidden');
            if (allergiesEl) allergiesEl.textContent = profile.allergies;
        } else {
            allergiesCard?.classList.add('hidden');
        }

        // School Card Visibility
        const schoolCard = document.getElementById('box-school');
        const schoolEl = document.getElementById('p-school');
        const gradeCard = document.getElementById('box-grade');
        const gradeEl = document.getElementById('p-grade');
        if (isPet || isSenior || isVehicle) {
            schoolCard?.classList.add('hidden');
            gradeCard?.classList.add('hidden');
        } else {
            if (profile.school && profile.school.trim() !== '') {
                schoolCard?.classList.remove('hidden');
                if (schoolEl) schoolEl.textContent = profile.school;
            } else {
                schoolCard?.classList.add('hidden');
            }
            if (profile.grade && profile.grade.trim() !== '') {
                gradeCard?.classList.remove('hidden');
                if (gradeEl) gradeEl.textContent = profile.grade;
            } else {
                gradeCard?.classList.add('hidden');
            }
        }
        // Medical Conditions
        const medicalCard = document.getElementById('box-medical');
        const medicalEl = document.getElementById('p-medical-notes');
        const medicalTitle = document.getElementById('p-medical-header-title');
        if (medicalCard) {
            if (profile.medicalConditions && profile.medicalConditions.trim() !== '') {
                medicalCard.classList.remove('hidden');
                if (medicalEl) medicalEl.textContent = profile.medicalConditions;
                if (medicalTitle) medicalTitle.textContent = isVehicle ? 'Condiciones Médicas' : 'Enfermedad o Condición';
            } else {
                medicalCard.classList.add('hidden');
            }
        }
        
        // Medications
        const medsCard = document.getElementById('box-medications');
        const medsEl = document.getElementById('p-medications-notes');
        if (medsCard) {
            if (profile.importantMedications && profile.importantMedications.trim() !== '') {
                medsCard.classList.remove('hidden');
                if (medsEl) medsEl.textContent = profile.importantMedications;
            } else {
                medsCard.classList.add('hidden');
            }
        }

        // EMERGENCY CONTACTS SECTION (MATCHING MOCKUP DESIGN)
        const contactsSection = document.getElementById('box-emergency-contacts');
        const cardContact1 = document.getElementById('card-contact-1');
        const role1El = document.getElementById('p-contact-role1');
        const name1El = document.getElementById('p-contact-name1');
        const phone1El = document.getElementById('p-contact-phone1');
        const btnContactWa1 = document.getElementById('btn-contact-wa1');

        const cardContact2 = document.getElementById('card-contact-2');
        const role2El = document.getElementById('p-contact-role2');
        const name2El = document.getElementById('p-contact-name2');
        const phone2El = document.getElementById('p-contact-phone2');
        const btnContactWa2 = document.getElementById('btn-contact-wa2');

        const standardActions = document.getElementById('standard-actions-stack');

        let hasContact1 = profile.parentPhone && profile.parentPhone.trim() !== '';
        let hasContact2 = profile.parentPhone2 && profile.parentPhone2.trim() !== '';

        if (isVehicle && (hasContact1 || hasContact2)) {
            contactsSection?.classList.remove('hidden');
            standardActions?.classList.add('hidden'); // Use dedicated contact cards for vehicles

            // Contact 1
            if (hasContact1) {
                cardContact1?.classList.remove('hidden');
                if (role1El) role1El.textContent = (profile.contactRole1 && profile.contactRole1.trim() !== '') ? profile.contactRole1.toUpperCase() : (profile.vehicleOwner ? 'PROPIETARIO / FAMILIAR' : 'CONTACTO PRINCIPAL');
                if (name1El) name1El.textContent = (profile.contactName1 && profile.contactName1.trim() !== '') ? profile.contactName1 : (profile.vehicleOwner || profile.name);
                if (phone1El) phone1El.textContent = profile.parentPhone;
                if (btnContactWa1) {
                    btnContactWa1.onclick = (e) => {
                        e.preventDefault();
                        const waText = profile.whatsappMessage || `Hola, encontré el perfil de emergencia del conductor ${profile.name} y me quiero comunicar con sus contactos.`;
                        openWhatsAppWithLocation(profile.parentPhone, waText);
                    };
                }
            } else {
                cardContact1?.classList.add('hidden');
            }

            // Contact 2
            if (hasContact2) {
                cardContact2?.classList.remove('hidden');
                if (role2El) role2El.textContent = (profile.contactRole2 && profile.contactRole2.trim() !== '') ? profile.contactRole2.toUpperCase() : 'CONTACTO DE EMERGENCIA 2';
                if (name2El) name2El.textContent = (profile.contactName2 && profile.contactName2.trim() !== '') ? profile.contactName2 : 'Contacto Secundario';
                if (phone2El) phone2El.textContent = profile.parentPhone2;
                if (btnContactWa2) {
                    btnContactWa2.onclick = (e) => {
                        e.preventDefault();
                        const waText = profile.whatsappMessage || `Hola, encontré el perfil de emergencia del conductor ${profile.name} y me quiero comunicar con sus contactos.`;
                        openWhatsAppWithLocation(profile.parentPhone2, waText);
                    };
                }
            } else {
                cardContact2?.classList.add('hidden');
            }
        } else {
            contactsSection?.classList.add('hidden');
            standardActions?.classList.remove('hidden');
        }

        // PROMINENT EMERGENCY CALL BAR (INDEPENDENT FROM OWNER CONTACTS)
        const emergencyCallBox = document.getElementById('box-emergency-call');
        const emergencyCallLink = document.getElementById('btn-emergency-call-link');
        const emergencyNum = document.getElementById('p-emergency-num');

        if (isVehicle) {
            emergencyCallBox?.classList.remove('hidden');
            const targetEmergency = (profile.emergencyPhone && profile.emergencyPhone.trim() !== '') ? profile.emergencyPhone.trim() : '123';
            if (emergencyCallLink) emergencyCallLink.href = `tel:${targetEmergency}`;
            if (emergencyNum) emergencyNum.textContent = (targetEmergency.startsWith('+') || targetEmergency.length > 5) ? `+${targetEmergency}` : targetEmergency;
        } else {
            emergencyCallBox?.classList.add('hidden');
        }

        // Vehicle Specs Card Rendering
        const vehicleBox = document.getElementById('box-vehicle-specs');
        if (isVehicle) {
            const vIcon = document.getElementById('p-vehicle-icon');
            const vTitle = document.getElementById('p-vehicle-title');
            const vMainSpec = document.getElementById('p-vehicle-main-spec');
            const vColorItem = document.getElementById('p-vehicle-color-item');
            const vColorVal = document.getElementById('p-vehicle-color');
            const vYearItem = document.getElementById('p-vehicle-year-item');
            const vYearVal = document.getElementById('p-vehicle-year');
            const vEngineItem = document.getElementById('p-vehicle-engine-item');
            const vEngineVal = document.getElementById('p-vehicle-engine');
            const vOwnerItem = document.getElementById('p-vehicle-owner-item');
            const vOwnerVal = document.getElementById('p-vehicle-owner');

            let vTypeName = 'DEL VEHÍCULO';
            let iconClass = 'fa-car-side';
            if (vehicleType === 'moto') { vTypeName = 'DE LA MOTO'; iconClass = 'fa-motorcycle'; }
            else if (vehicleType === 'bike') { vTypeName = 'DE LA BICICLETA'; iconClass = 'fa-bicycle'; }
            else { vTypeName = 'DEL AUTOMÓVIL'; iconClass = 'fa-car'; }

            if (vIcon) vIcon.className = `fa-solid ${iconClass}`;
            if (vTitle) vTitle.textContent = `INFORMACIÓN ${vTypeName}`;

            const brandStr = profile.vehicleBrand || '';
            const modelStr = profile.vehicleModel || '';
            let plateLabel = vehicleType === 'bike' ? 'Serial' : 'Placa';
            const plateStr = profile.vehiclePlate ? ` | ${plateLabel}: ${profile.vehiclePlate}` : '';
            const mainText = `${brandStr} ${modelStr}${plateStr}`.trim();

            const mainRow = document.getElementById('p-vehicle-row-main');
            if (mainText && mainText !== '|' && mainText !== 'Serial:' && mainText !== 'Placa:') {
                mainRow?.classList.remove('hidden');
                if (vMainSpec) vMainSpec.textContent = mainText;
            } else {
                mainRow?.classList.add('hidden');
            }

            if (profile.vehicleColor && profile.vehicleColor.trim() !== '') {
                vColorItem?.classList.remove('hidden');
                if (vColorVal) vColorVal.textContent = profile.vehicleColor;
            } else { vColorItem?.classList.add('hidden'); }

            if (profile.vehicleYear && profile.vehicleYear.trim() !== '') {
                vYearItem?.classList.remove('hidden');
                if (vYearVal) vYearVal.textContent = profile.vehicleYear;
            } else { vYearItem?.classList.add('hidden'); }

            if (profile.vehicleEngine && profile.vehicleEngine.trim() !== '') {
                vEngineItem?.classList.remove('hidden');
                if (vEngineVal) vEngineVal.textContent = profile.vehicleEngine;
            } else { vEngineItem?.classList.add('hidden'); }

            if (profile.vehicleOwner && profile.vehicleOwner.trim() !== '') {
                vOwnerItem?.classList.remove('hidden');
                if (vOwnerVal) vOwnerVal.textContent = profile.vehicleOwner;
            } else { vOwnerItem?.classList.add('hidden'); }

            vehicleBox?.classList.remove('hidden');
        } else {
            vehicleBox?.classList.add('hidden');
        }

        // WhatsApp Buttons Titles
        const wa1Title = document.getElementById('p-wa1-title');
        const wa2Title = document.getElementById('p-wa2-title');
        if (isVehicle) {
            if (wa1Title) wa1Title.textContent = 'Contactar al Propietario';
            if (wa2Title) wa2Title.textContent = 'Contacto de Emergencia 2';
        } else {
            if (wa1Title) wa1Title.textContent = 'Contacto Principal';
            if (wa2Title) wa2Title.textContent = 'Contacto Alterno';
        }
        // Helper to open WhatsApp with optional live location of the scanner
        const openWhatsAppWithLocation = (phone, baseMessage) => {
            let messageText = baseMessage.replace('{nombre}', profile.name);
            
            const launchWhatsApp = (finalText) => {
                const encodedWa = encodeURIComponent(finalText);
                const waUrl = `https://wa.me/${phone}?text=${encodedWa}`;
                // Use window.location.href so iOS Safari (Apple iPhone) does not block as an async pop-up
                window.location.href = waUrl;
            };

            if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
                        const textWithLocation = `${messageText}\n\n📍 Mi ubicación actual al escanear es: ${mapsUrl}`;
                        launchWhatsApp(textWithLocation);
                    },
                    (error) => {
                        console.log("Geolocation permission denied or unavailable:", error);
                        launchWhatsApp(messageText);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            } else {
                launchWhatsApp(messageText);
            }
        };

        // WhatsApp Main Action Button 1
        const btnWa1 = document.getElementById('btn-whatsapp-action');
        if (btnWa1) {
            if (profile.parentPhone && profile.parentPhone.trim() !== '') {
                btnWa1.classList.remove('hidden');
                let waText = profile.whatsappMessage || (isPet 
                    ? `Hola, encontré a la mascota ${profile.name} y me quiero comunicar con su dueño.`
                    : (isSenior ? `Hola, encontré el perfil de seguridad del adulto mayor ${profile.name} y me quiero comunicar con sus familiares.` : `Hola, encontré la información del perfil de ${profile.name}.`));
                btnWa1.onclick = (e) => { 
                    e.preventDefault(); 
                    openWhatsAppWithLocation(profile.parentPhone, waText);
                };
            } else {
                btnWa1.classList.add('hidden');
            }
        }
        
        // WhatsApp Action Button 2
        const btnWa2 = document.getElementById('btn-whatsapp-action2');
        if (btnWa2) {
            if (profile.parentPhone2 && profile.parentPhone2.trim() !== '') {
                btnWa2.classList.remove('hidden');
                let waText = profile.whatsappMessage || (isPet 
                    ? `Hola, encontré a la mascota ${profile.name} y me quiero comunicar con su dueño.`
                    : (isSenior ? `Hola, encontré el perfil de seguridad del adulto mayor ${profile.name} y me quiero comunicar con sus familiares.` : `Hola, encontré la información del perfil de ${profile.name}.`));
                btnWa2.onclick = (e) => { 
                    e.preventDefault(); 
                    openWhatsAppWithLocation(profile.parentPhone2, waText);
                };
            } else {
                btnWa2.classList.add('hidden');
            }
        }
        // Location / Home Maps Button
        const btnLocation = document.getElementById('btn-location-action');
        if (btnLocation) {
            if (profile.locationMapsUrl && profile.locationMapsUrl.trim() !== '') {
                btnLocation.classList.remove('hidden');
                btnLocation.onclick = (e) => { e.preventDefault(); window.open(profile.locationMapsUrl, '_blank'); };
            } else {
                btnLocation.classList.add('hidden');
            }
        }
    }

    setupNfcListener() {
        if ('NDEFReader' in window) {
            try {
                const ndef = new NDEFReader();
                ndef.scan().then(() => {
                    ndef.addEventListener("reading", ({ message, serialNumber }) => {
                        console.log(`NFC Tag detectado! Serial: ${serialNumber}`);
                        for (const record of message.records) {
                            if (record.recordType === "url" || record.recordType === "text") {
                                const textDecoder = new TextDecoder();
                                const decoded = textDecoder.decode(record.data);
                                console.log("Contenido NFC:", decoded);
                                const found = this.findProfileBySlug(decoded);
                                if (found) {
                                    this.renderSingleProfile(found.slug);
                                }
                            }
                        }
                    });
                }).catch(err => console.log("NFC scan info:", err));
            } catch (e) {
                console.log("NFC error:", e);
            }
        }
    }

    setupSimulatedScanner() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'n') {
                const slug = prompt("Simular lectura de Tag NFC (ingresa el slug):", "samuel");
                if (slug) {
                    this.renderSingleProfile(slug);
                }
            }
        });
    }
}

function startPublicApp() {
    window.app = new App();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPublicApp);
} else {
    startPublicApp();
}
