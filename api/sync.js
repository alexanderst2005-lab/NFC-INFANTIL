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
let sharedProfilesStore = [];
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
            if (Array.isArray(cloudState.deletedIds)) {
                sharedDeletedIdsStore = Array.from(new Set([...sharedDeletedIdsStore, ...cloudState.deletedIds].filter(id => id && typeof id === 'string')));
            }
            if (Array.isArray(cloudState.profiles)) {
                sharedProfilesStore = cloudState.profiles.filter(p => p && p.id && !sharedDeletedIdsStore.includes(p.id));
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
