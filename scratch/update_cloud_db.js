const https = require('https');

const dataToFetch = {
    method: 'GET'
};

https.get('https://api.restful-api.dev/objects/ff8081819ff5b11001a0178475124974', (res) => {
    let raw = '';
    res.on('data', chunk => raw += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(raw);
            let profiles = parsed.data ? parsed.data.profiles : [];
            let deletedIds = parsed.data ? parsed.data.deletedIds : [];

            // Find or update Jose Ramirez
            let jose = profiles.find(p => p.id === 'prof-006-jose' || p.slug === 'jose-ramirez');
            if (jose) {
                jose.parentPhone = "573109876543";
                jose.parentPhone2 = "573209998877";
                jose.updatedAt = new Date().toISOString();
            } else {
                profiles.push({
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
                    school: "",
                    grade: "",
                    medicalConditions: "",
                    importantMedications: "Insulina 10 UI mañana y noche, Losartán 50mg",
                    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80",
                    active: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }

            const payload = JSON.stringify({
                name: 'NFC Master DB',
                data: {
                    profiles: profiles,
                    deletedIds: deletedIds
                }
            });

            const req = https.request('https://api.restful-api.dev/objects/ff8081819ff5b11001a0178475124974', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload)
                }
            }, (putRes) => {
                let putRaw = '';
                putRes.on('data', chunk => putRaw += chunk);
                putRes.on('end', () => {
                    console.log('CLOUD DB UPDATE RESPONSE STATUS:', putRes.statusCode);
                    console.log('CLOUD DB UPDATE RESULT:', putRaw);
                });
            });

            req.write(payload);
            req.end();

        } catch (e) {
            console.error('Error updating cloud DB:', e.message);
        }
    });
});
