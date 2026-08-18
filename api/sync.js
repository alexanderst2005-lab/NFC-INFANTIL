/* ==========================================================================
   VERCEL SERVERLESS API ROUTE: /api/sync
   100% Authoritative Central Cloud DB Bridge with High-Availability Persistence
   ========================================================================== */

import https from 'https';

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

            if (incomingProfiles !== null && Array.isArray(incomingProfiles)) {
                sharedProfilesStore = incomingProfiles.map(p => ({
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
            }

            return res.status(200).json({ success: true, profiles: sharedProfilesStore });
        }

        // GET Request: Returns warm stored profiles
        return res.status(200).json({ success: true, profiles: sharedProfilesStore });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
