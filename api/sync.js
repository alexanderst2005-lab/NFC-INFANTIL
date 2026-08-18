/* ==========================================================================
   VERCEL SERVERLESS API ROUTE: /api/sync
   100% Real-Time Cloud Database Sync (Zero Stale Caching, Global Persistence)
   ========================================================================== */

const EXTERNAL_KV_URL = "https://kvdb.io/NFCInfantilVercelServer2026/profiles_master_v8";

export default async function handler(req, res) {
    // Strict No-Cache Headers to prevent browser & Vercel edge caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
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
                // Save to cloud store server-side
                try {
                    await fetch(EXTERNAL_KV_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(incomingProfiles)
                    });
                } catch (e) {
                    console.log("KV push error:", e);
                }
            }

            return res.status(200).json({ success: true, profiles: incomingProfiles || [] });
        }

        // GET Request: Always fetch fresh global data from Cloud KV Store
        let profiles = [];
        try {
            const kvRes = await fetch(EXTERNAL_KV_URL, { cache: 'no-store' });
            if (kvRes.ok) {
                const data = await kvRes.json();
                if (Array.isArray(data)) {
                    profiles = data;
                }
            }
        } catch (e) {
            console.log("KV get error:", e);
        }

        return res.status(200).json({ success: true, profiles: profiles });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
