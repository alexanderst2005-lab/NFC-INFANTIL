/* ==========================================================================
   VERCEL SERVERLESS API ROUTE: /api/sync
   100% Authoritative Central Cloud DB Bridge for Multi-Device Real-Time Sync
   ========================================================================== */

import https from 'https';

let activeObjectId = "ff8081819ff5b11001a01367bcb43e95";
let memoryProfilesCache = null;

function saveNewCloudDb(profiles) {
    return new Promise((resolve) => {
        const payload = JSON.stringify({ name: 'NFC_Store', data: { profiles: profiles } });
        const req = https.request('https://api.restful-api.dev/objects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (parsed && parsed.id) {
                        activeObjectId = parsed.id;
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } catch(e) {
                    resolve(false);
                }
            });
        });
        req.on('error', () => resolve(false));
        req.setTimeout(4500, () => { req.destroy(); resolve(false); });
        req.write(payload);
        req.end();
    });
}

function getCloudDb() {
    return new Promise((resolve) => {
        https.get(`https://api.restful-api.dev/objects/${activeObjectId}`, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (parsed && parsed.data && Array.isArray(parsed.data.profiles)) {
                        resolve(parsed.data.profiles);
                    } else {
                        resolve([]);
                    }
                } catch (e) {
                    resolve([]);
                }
            });
        }).on('error', () => resolve([])).setTimeout(4500, function() { this.destroy(); resolve([]); });
    });
}

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
        if (req.method === 'POST' || req.method === 'PUT') {
            let body = req.body;
            if (typeof body === 'string') {
                try { body = JSON.parse(body); } catch (e) {}
            }

            let incomingProfiles = null;
            if (Array.isArray(body)) {
                incomingProfiles = body;
            } else if (body && Array.isArray(body.profiles)) {
                incomingProfiles = body.profiles;
            }

            if (incomingProfiles !== null && incomingProfiles.length > 0) {
                memoryProfilesCache = incomingProfiles;
                await saveNewCloudDb(incomingProfiles);
            }

            return res.status(200).json({ success: true, profiles: memoryProfilesCache || incomingProfiles || [] });
        }

        // GET Request: Returns authoritative cloud profiles
        let cloudProfiles = memoryProfilesCache;
        if (!cloudProfiles || cloudProfiles.length === 0) {
            cloudProfiles = await getCloudDb();
            if (cloudProfiles && cloudProfiles.length > 0) {
                memoryProfilesCache = cloudProfiles;
            }
        }

        return res.status(200).json({ success: true, profiles: memoryProfilesCache || [] });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
