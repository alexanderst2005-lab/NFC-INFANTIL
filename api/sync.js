/* ==========================================================================
   VERCEL SERVERLESS API ROUTE: /api/sync
   100% Authoritative Central Cloud DB Bridge with High-Availability KV Persistence
   ========================================================================== */

import https from 'https';

const KV_KEY = 'https://kvdb.io/A8Z3nQjJ7W9xK2mP4vL9rT/nfc_infantil_master_store_v4';

function requestKV(url, method = 'GET', payload = null) {
    return new Promise((resolve) => {
        try {
            const parsedUrl = new URL(url);
            const options = {
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname + parsedUrl.search,
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
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(null);
                    }
                });
            });
            req.on('error', () => resolve(null));
            req.setTimeout(2500, () => {
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
        // Try fetching persistent KV state first
        const kvState = await requestKV(KV_KEY, 'GET');
        if (kvState && Array.isArray(kvState.profiles) && kvState.profiles.length > 0) {
            sharedProfilesStore = kvState.profiles;
            if (Array.isArray(kvState.deletedIds)) {
                sharedDeletedIdsStore = kvState.deletedIds;
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
                        gender: (p.gender === 'girl' || p.gender === 'pet') ? p.gender : 'boy',
                        birthDate: p.birthDate ? String(p.birthDate).trim() : '',
                        age: parseInt(p.age) >= 0 ? parseInt(p.age) : 5,
                        bloodType: p.gender === 'pet' ? '' : (p.bloodType ? String(p.bloodType).trim() : 'O+'),
                        parentPhone: p.parentPhone ? String(p.parentPhone).trim() : '',
                        whatsappMessage: p.whatsappMessage ? String(p.whatsappMessage).trim() : 'Hola, encontré el perfil de {nombre}.',
                        locationMapsUrl: p.locationMapsUrl ? String(p.locationMapsUrl).trim() : '',
                        schoolMapsUrl: p.schoolMapsUrl ? String(p.schoolMapsUrl).trim() : '',
                        school: p.school ? String(p.school).trim() : '',
                        grade: p.grade ? String(p.grade).trim() : '',
                        medicalConditions: p.medicalConditions ? String(p.medicalConditions).trim() : '',
                        photoUrl: p.photoUrl ? String(p.photoUrl).trim() : '',
                        active: true,
                        createdAt: p.createdAt || new Date().toISOString(),
                        updatedAt: p.updatedAt || new Date().toISOString()
                    }));

                // Save updated master state to persistent cloud KV asynchronously
                await requestKV(KV_KEY, 'POST', JSON.stringify({
                    profiles: sharedProfilesStore,
                    deletedIds: sharedDeletedIdsStore
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
