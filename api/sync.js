/* ==========================================================================
   VERCEL SERVERLESS API ROUTE: /api/sync
   100% Authoritative Central Cloud DB Bridge for Multi-Device Real-Time Sync
   ========================================================================== */

import https from 'https';

const REST_DB_URL = "https://api.restful-api.dev/objects/ff8081819ff5b11001a0131229ea3dd5";

function getCloudDb() {
    return new Promise((resolve) => {
        const req = https.get(REST_DB_URL, (res) => {
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
        });
        req.on('error', () => resolve([]));
        req.setTimeout(4000, () => { req.destroy(); resolve([]); });
    });
}

function updateCloudDb(profiles) {
    return new Promise((resolve) => {
        const payload = JSON.stringify({ name: 'NFC_Store', data: { profiles: profiles } });
        const req = https.request(REST_DB_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(true));
        });
        req.on('error', () => resolve(false));
        req.setTimeout(4000, () => { req.destroy(); resolve(false); });
        req.write(payload);
        req.end();
    });
}

export default async function handler(req, res) {
    // Strict Anti-Caching Headers to force real-time sync on every device
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
            const body = req.body;
            let incomingProfiles = null;

            if (Array.isArray(body)) {
                incomingProfiles = body;
            } else if (body && Array.isArray(body.profiles)) {
                incomingProfiles = body.profiles;
            }

            if (incomingProfiles !== null) {
                await updateCloudDb(incomingProfiles);
            }
            return res.status(200).json({ success: true, profiles: incomingProfiles || [] });
        }

        // GET Request: Fetches real-time authoritative profiles from REST DB
        const cloudProfiles = await getCloudDb();
        return res.status(200).json({ success: true, profiles: cloudProfiles });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
