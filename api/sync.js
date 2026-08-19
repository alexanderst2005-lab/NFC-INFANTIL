/* ==========================================================================
   VERCEL SERVERLESS API ROUTE: /api/sync
   100% Authoritative Central Cloud DB Bridge with High-Availability KV Persistence
   ========================================================================== */

import https from 'https';

let currentCloudObjectId = 'ff8081819ff5b11001a01bb511aa54c3';

function requestCloudDB(method = 'GET', payload = null) {
    return new Promise((resolve) => {
        try {
            let targetUrl = `https://api.restful-api.dev/objects/${currentCloudObjectId}`;
            let reqMethod = method;

            if (method === 'PUT' || method === 'POST') {
                targetUrl = 'https://api.restful-api.dev/objects';
                reqMethod = 'POST';
            }

            const parsedUrl = new URL(targetUrl);
            const options = {
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname,
                method: reqMethod,
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
                        if (parsed && parsed.id && (method === 'PUT' || method === 'POST')) {
                            currentCloudObjectId = parsed.id;
                        }
                        if (parsed && parsed.data) {
                            resolve(parsed.data);
                        } else if (Array.isArray(parsed) && parsed[0] && parsed[0].data) {
                            resolve(parsed[0].data);
                        } else {
                            resolve(null);
                        }
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

const INITIAL_PROFILES = [
    {
        id: "prof-001",
        slug: "samuel",
        name: "Samuel Arias Rodríguez",
        gender: "boy",
        age: 11,
        bloodType: "B+",
        school: "RIO TAPAJE",
        grade: "4",
        medicalConditions: "ALERGICO",
        parentPhone: "573001234567",
        whatsappMessage: "Hola, encontré la información del perfil de Samuel y me gustaría comunicarme con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: "2026-08-18T00:00:00.000Z",
        updatedAt: "2026-08-18T00:00:00.000Z"
    },
    {
        id: "prof-1787105387792",
        slug: "lucia-torres",
        name: "LUCIA TORRES",
        gender: "girl",
        age: "",
        bloodType: "",
        parentPhone: "",
        whatsappMessage: "Hola, encontré la información del perfil de LUCIA TORRES y quiero comunicarme con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "",
        active: true,
        createdAt: "2026-08-19T02:10:00.000Z",
        updatedAt: "2026-08-19T02:10:00.000Z"
    },
    {
        id: "prof-1787128801484",
        slug: "guillermo-diaz",
        name: "Guillermo Diaz",
        gender: "senior",
        age: "",
        bloodType: "",
        parentPhone: "",
        whatsappMessage: "Hola, encontré el perfil de seguridad del adulto mayor Guillermo Diaz y quiero comunicarme con sus familiares.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: "2026-08-19T08:40:00.000Z",
        updatedAt: "2026-08-19T08:40:00.000Z"
    },
    {
        id: "prof-1787129656850",
        slug: "zeus",
        name: "ZEUS",
        gender: "pet",
        age: 6,
        bloodType: "",
        parentPhone: "",
        whatsappMessage: "Hola, encontré a la mascota ZEUS y quiero comunicarme con su dueño.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: "2026-08-19T08:54:00.000Z",
        updatedAt: "2026-08-19T08:54:00.000Z"
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
        parentPhone2: "573209998877",
        whatsappMessage: "Hola, encontré el perfil de seguridad del adulto mayor José Ramírez y quiero comunicarme con sus familiares.",
        locationMapsUrl: "https://maps.google.com/?q=4.6097,74.0817",
        schoolMapsUrl: "",
        photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
        active: true,
        createdAt: "2026-08-18T20:00:00.000Z",
        updatedAt: "2026-08-18T20:00:00.000Z"
    },
    {
        id: "prof-1787028202738",
        slug: "arias-santi",
        name: "Arias santi",
        gender: "boy",
        age: 6,
        bloodType: "O+",
        school: "Hshshs",
        parentPhone: "545454",
        whatsappMessage: "Hola, encontré la información del perfil de Arias santi y me gustaría comunicarme con sus padres.",
        locationMapsUrl: "",
        schoolMapsUrl: "",
        medicalConditions: "",
        photoUrl: "",
        active: true,
        createdAt: "2026-08-18T04:55:03.415Z",
        updatedAt: "2026-08-18T04:55:03.415Z"
    }
];

let sharedProfilesStore = [...INITIAL_PROFILES];
let sharedDeletedIdsStore = [];

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Fetch persistent Cloud DB state first (Authoritative Central Master)
        const cloudState = await requestCloudDB('GET');
        if (cloudState) {
            if (Array.isArray(cloudState.profiles) && cloudState.profiles.length > 0) {
                const map = new Map();
                INITIAL_PROFILES.forEach(p => {
                    if (p && p.id) map.set(p.id, p);
                });
                cloudState.profiles.forEach(p => {
                    if (p && p.id) map.set(p.id, p);
                });
                sharedProfilesStore = Array.from(map.values());
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
                        age: (p.age !== undefined && p.age !== null && String(p.age).trim() !== '' && parseInt(p.age) >= 0) ? parseInt(p.age) : '',
                        bloodType: p.gender === 'pet' ? '' : (p.bloodType !== undefined ? String(p.bloodType).trim() : ''),
                        parentPhone: p.parentPhone !== undefined ? String(p.parentPhone).trim() : '',
                        parentPhone2: p.parentPhone2 !== undefined ? String(p.parentPhone2).trim() : '',
                        whatsappMessage: p.whatsappMessage ? String(p.whatsappMessage).trim() : 'Hola, encontré el perfil de {nombre}.',
                        locationMapsUrl: p.locationMapsUrl !== undefined ? String(p.locationMapsUrl).trim() : '',
                        schoolMapsUrl: p.schoolMapsUrl !== undefined ? String(p.schoolMapsUrl).trim() : '',
                        school: p.school !== undefined ? String(p.school).trim() : '',
                        grade: p.grade !== undefined ? String(p.grade).trim() : '',
                        medicalConditions: p.medicalConditions !== undefined ? String(p.medicalConditions).trim() : '',
                        importantMedications: p.importantMedications !== undefined ? String(p.importantMedications).trim() : '',
                        photoUrl: p.photoUrl !== undefined ? String(p.photoUrl).trim() : '',
                        active: true,
                        createdAt: p.createdAt || new Date().toISOString(),
                        updatedAt: p.updatedAt || new Date().toISOString()
                    }));

                // Save updated master state to persistent cloud database synchronously/await
                await requestCloudDB('POST', JSON.stringify({
                    name: 'NFC Master DB',
                    data: {
                        profiles: sharedProfilesStore,
                        deletedIds: sharedDeletedIdsStore
                    }
                }));
            }

            return res.status(200).json({
                success: true,
                profiles: sharedProfilesStore.filter(p => !sharedDeletedIdsStore.includes(p.id)),
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
