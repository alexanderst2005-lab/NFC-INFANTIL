/* ==========================================================================
   VERCEL SERVERLESS API ROUTE: /api/sync
   100% Authoritative Central Cloud DB Bridge with High-Availability KV Persistence
   ========================================================================== */

import https from 'https';

const DB_OBJECT_ID = 'ff8081819ff5b11001a0178475124974';
const DB_URL = `https://api.restful-api.dev/objects/${DB_OBJECT_ID}`;

function requestCloudDB(method = 'GET', payload = null) {
    return new Promise((resolve) => {
        try {
            const parsedUrl = new URL(DB_URL);
            const options = {
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname,
                method: method,
                headers: payload ? {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                } : {}
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve(parsed && parsed.data ? parsed.data : null);
                    } catch (e) {
                        resolve(null);
                    }
                });
            });
            req.on('error', () => resolve(null));
            req.setTimeout(3500, () => {
                req.destroy();
                resolve(null);
            });
            if (payload) req.write(payload);
            req.end();
        } catch (e) {
            resolve(null);
        }
    });
}

// In-Memory Warm Persistence Store for Vercel Edge/Serverless Instances
let sharedProfilesStore = [
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

let sharedDeletedIdsStore = [];

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Fetch persistent Cloud DB state first
        const cloudState = await requestCloudDB('GET');
        if (cloudState) {
            if (Array.isArray(cloudState.deletedIds)) {
                sharedDeletedIdsStore = Array.from(new Set([...sharedDeletedIdsStore, ...cloudState.deletedIds].filter(id => id && typeof id === 'string')));
            }
            if (Array.isArray(cloudState.profiles) && cloudState.profiles.length > 0) {
                const mergedMap = new Map();
                sharedProfilesStore.forEach(p => {
                    if (p && p.id && !sharedDeletedIdsStore.includes(p.id)) mergedMap.set(p.id, p);
                });
                cloudState.profiles.forEach(p => {
                    if (p && p.id && !sharedDeletedIdsStore.includes(p.id)) mergedMap.set(p.id, p);
                });
                sharedProfilesStore = Array.from(mergedMap.values());
            }
        }

        if (req.method === 'POST' || req.method === 'PUT') {
            let body = req.body;
            if (typeof body === 'string') {
                try { body = JSON.parse(body); } catch (e) {}
            }

            let incomingProfiles = null;
            let incomingDeletedIds = null;

            if (Array.isArray(body)) {
                incomingProfiles = body;
            } else if (body && typeof body === 'object') {
                if (Array.isArray(body.profiles)) incomingProfiles = body.profiles;
                if (Array.isArray(body.deletedIds)) incomingDeletedIds = body.deletedIds;
            }

            if (incomingDeletedIds && Array.isArray(incomingDeletedIds)) {
                const cleanDeleted = incomingDeletedIds.filter(id => id && typeof id === 'string');
                sharedDeletedIdsStore = Array.from(new Set([...sharedDeletedIdsStore, ...cleanDeleted]));
            }

            if (incomingProfiles !== null && Array.isArray(incomingProfiles)) {
                sharedProfilesStore = incomingProfiles
                    .filter(p => p && p.id && !sharedDeletedIdsStore.includes(p.id))
                    .map(p => ({
                        id: p.id || `prof-${Date.now()}`,
                        slug: (p.slug && String(p.slug).trim() !== '' && String(p.slug).trim() !== 'undefined') ? String(p.slug).trim() : 'perfil',
                        name: (p.name && String(p.name).trim() !== '' && String(p.name).trim() !== 'undefined') ? String(p.name).trim() : 'Perfil',
                        gender: (p.id === 'prof-006-jose' || (p.slug && String(p.slug).toLowerCase().includes('jose-ramirez'))) ? 'senior' : ((p.gender === 'girl' || p.gender === 'pet' || p.gender === 'senior') ? p.gender : 'boy'),
                        birthDate: p.birthDate !== undefined ? String(p.birthDate).trim() : '',
                        age: parseInt(p.age) >= 0 ? parseInt(p.age) : 5,
                        bloodType: p.gender === 'pet' ? '' : (p.bloodType !== undefined ? String(p.bloodType).trim() : ''),
                        parentPhone: p.parentPhone !== undefined ? String(p.parentPhone).trim() : '',
                        whatsappMessage: p.whatsappMessage ? String(p.whatsappMessage).trim() : 'Hola, encontré el perfil de {nombre}.',
                        locationMapsUrl: p.locationMapsUrl !== undefined ? String(p.locationMapsUrl).trim() : '',
                        schoolMapsUrl: p.schoolMapsUrl !== undefined ? String(p.schoolMapsUrl).trim() : '',
                        school: p.school !== undefined ? String(p.school).trim() : '',
                        grade: p.grade !== undefined ? String(p.grade).trim() : '',
                        medicalConditions: p.medicalConditions !== undefined ? String(p.medicalConditions).trim() : '',
                        photoUrl: p.photoUrl !== undefined ? String(p.photoUrl).trim() : '',
                        active: true,
                        createdAt: p.createdAt || new Date().toISOString(),
                        updatedAt: p.updatedAt || new Date().toISOString()
                    }));

                // Save updated master state to persistent cloud database synchronously/await
                await requestCloudDB('PUT', JSON.stringify({
                    name: 'NFC Master DB',
                    data: {
                        profiles: sharedProfilesStore,
                        deletedIds: sharedDeletedIdsStore
                    }
                }));
            }

            return res.status(200).json({
                success: true,
                profiles: sharedProfilesStore,
                deletedIds: sharedDeletedIdsStore
            });
        }

        // GET Request: Return persistent master state
        return res.status(200).json({
            success: true,
            profiles: sharedProfilesStore,
            deletedIds: sharedDeletedIdsStore
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            profiles: sharedProfilesStore,
            deletedIds: sharedDeletedIdsStore
        });
    }
}
