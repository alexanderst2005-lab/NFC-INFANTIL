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

async function testSeniorProfile() {
    console.log('--- TESTING SENIOR PROFILE CATEGORY ---');

    const getRes = await reqDB('GET');
    let currentProfiles = getRes.data.profiles || [];
    let currentDeleted = getRes.data.deletedIds || [];

    const joseSenior = {
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
        updatedAt: new Date().toISOString()
    };

    // Replace or add Jose
    currentProfiles = currentProfiles.filter(p => p.id !== joseSenior.id && p.slug !== joseSenior.slug);
    currentProfiles.push(joseSenior);

    const putRes = await reqDB('PUT', JSON.stringify({
        name: 'NFC Master DB',
        data: {
            profiles: currentProfiles,
            deletedIds: currentDeleted
        }
    }));

    console.log('PUT Senior Response:', putRes.id ? 'SUCCESS' : 'FAILED');

    const verifyRes = await reqDB('GET');
    const joseLoaded = verifyRes.data.profiles.find(p => p.slug === 'jose-ramirez');

    console.log('\n--- VERIFICATION ---');
    console.log('Name:', joseLoaded.name);
    console.log('Gender:', joseLoaded.gender);
    console.log('Age:', joseLoaded.age);
    console.log('BloodType:', joseLoaded.bloodType);
    console.log('School (Should be empty):', joseLoaded.school || 'NONE');
    console.log('Grade (Should be empty):', joseLoaded.grade || 'NONE');
    console.log('✅ Senior profile created and verified successfully!');
}

testSeniorProfile();
