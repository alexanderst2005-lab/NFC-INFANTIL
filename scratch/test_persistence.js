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

async function testFullPersistence() {
    console.log('--- STARTING PERSISTENCE TEST ---');

    const editedProfile = {
        id: "prof-001",
        slug: "samuel",
        name: "Samuel Mateo Test",
        gender: "boy",
        birthDate: "2016-04-15",
        age: 10,
        bloodType: "O+",
        parentPhone: "573009998877",
        whatsappMessage: "Hola, soy el padre de Samuel Mateo",
        locationMapsUrl: "https://maps.google.com/?q=4.7110,74.0721",
        schoolMapsUrl: "https://maps.google.com/?q=4.7110,74.0721",
        school: "Colegio San José Campestre",
        grade: "5to Grado B",
        medicalConditions: "Alergia a la penicilina",
        photoUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
        active: true,
        updatedAt: new Date().toISOString()
    };

    console.log('1. Saving edited profile to Cloud DB...');
    const putRes = await reqDB('PUT', JSON.stringify({
        name: 'NFC Master DB',
        data: {
            profiles: [editedProfile],
            deletedIds: []
        }
    }));
    console.log('PUT Response Status:', putRes.id ? 'SUCCESS' : 'FAILED');

    console.log('2. Simulating Page Reload by fetching from Cloud DB...');
    const getRes = await reqDB('GET');
    const loadedProfiles = getRes.data.profiles;
    const samuel = loadedProfiles.find(p => p.id === 'prof-001');

    console.log('\n--- VERIFICATION REPORT ---');
    console.log('Name:', samuel.name === editedProfile.name ? '✅ MATCH' : `❌ MISMATCH (${samuel.name})`);
    console.log('BirthDate:', samuel.birthDate === editedProfile.birthDate ? '✅ MATCH' : `❌ MISMATCH (${samuel.birthDate})`);
    console.log('Age:', samuel.age === editedProfile.age ? '✅ MATCH' : `❌ MISMATCH (${samuel.age})`);
    console.log('BloodType:', samuel.bloodType === editedProfile.bloodType ? '✅ MATCH' : `❌ MISMATCH (${samuel.bloodType})`);
    console.log('Phone:', samuel.parentPhone === editedProfile.parentPhone ? '✅ MATCH' : `❌ MISMATCH (${samuel.parentPhone})`);
    console.log('School:', samuel.school === editedProfile.school ? '✅ MATCH' : `❌ MISMATCH (${samuel.school})`);
    console.log('Grade:', samuel.grade === editedProfile.grade ? '✅ MATCH' : `❌ MISMATCH (${samuel.grade})`);
    console.log('Medical:', samuel.medicalConditions === editedProfile.medicalConditions ? '✅ MATCH' : `❌ MISMATCH (${samuel.medicalConditions})`);
    console.log('Photo:', samuel.photoUrl === editedProfile.photoUrl ? '✅ MATCH' : `❌ MISMATCH (${samuel.photoUrl})`);
}

testFullPersistence();
