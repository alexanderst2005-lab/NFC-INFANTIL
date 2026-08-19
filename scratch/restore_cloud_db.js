const https = require('https');

const DB_URL = 'https://api.restful-api.dev/objects/ff8081819ff5b11001a0178475124974';

function reqDB(method, payload) {
    return new Promise((resolve) => {
        const parsed = new URL(DB_URL);
        const req = https.request({
            hostname: parsed.hostname,
            path: parsed.pathname,
            method: method,
            headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}
        }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        if (payload) req.write(payload);
        req.end();
    });
}

const ALL_PROFILES = [
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
        createdAt: "2026-08-18T00:00:00.000Z",
        updatedAt: "2026-08-18T00:00:00.000Z"
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
        createdAt: "2026-08-18T00:00:00.000Z",
        updatedAt: "2026-08-18T00:00:00.000Z"
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
        createdAt: "2026-08-18T00:00:00.000Z",
        updatedAt: "2026-08-18T00:00:00.000Z"
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
        createdAt: "2026-08-18T00:00:00.000Z",
        updatedAt: "2026-08-18T00:00:00.000Z"
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
        createdAt: "2026-08-18T00:00:00.000Z",
        updatedAt: "2026-08-18T00:00:00.000Z"
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
        createdAt: "2026-08-18T20:00:00.000Z",
        updatedAt: "2026-08-18T20:00:00.000Z"
    }
];

async function restoreDB() {
    console.log('--- RESTORING CLOUD DB WITH ALL PROFILES ---');
    const putRes = await reqDB('PUT', JSON.stringify({
        name: 'NFC Master DB',
        data: {
            profiles: ALL_PROFILES,
            deletedIds: []
        }
    }));
    console.log('Cloud DB Restore Result:', putRes.id ? 'SUCCESS' : 'FAILED');

    const verify = await reqDB('GET');
    console.log('Restored profiles count:', verify.data ? verify.data.profiles.length : 0);
    if (verify.data && verify.data.profiles) {
        verify.data.profiles.forEach(p => console.log('  -', p.id, p.slug, p.name, p.gender));
    }
}

restoreDB();
