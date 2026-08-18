/* ==========================================================================
   VERCEL SERVERLESS API ROUTE: /api/sync
   100% Automatic, Authoritative Same-Origin Cloud Database Sync & Deletion
   ========================================================================== */

let memoryCache = null;
const EXTERNAL_KV_URL = "https://kvdb.io/NFCInfantilVercelServer2026/profiles_master_v7";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

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
                memoryCache = incomingProfiles;
                // Overwrite external KV store so deletions are PERMANENT
                try {
                    await fetch(EXTERNAL_KV_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(incomingProfiles)
                    });
                } catch (e) {
                    console.log("External KV push error:", e);
                }
            }

            return res.status(200).json({ success: true, profiles: memoryCache || [] });
        }

        // GET Request: Returns authoritative cloud list
        let profiles = memoryCache;

        if (!profiles) {
            try {
                const kvRes = await fetch(EXTERNAL_KV_URL, { cache: 'no-cache' });
                if (kvRes.ok) {
                    const data = await kvRes.json();
                    if (Array.isArray(data)) {
                        profiles = data;
                        memoryCache = profiles;
                    }
                }
            } catch (e) {
                console.log("External KV get error:", e);
            }
        }

        return res.status(200).json({ success: true, profiles: profiles || [] });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
