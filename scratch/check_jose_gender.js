const https = require('https');

https.get('https://api.restful-api.dev/objects/ff8081819ff5b11001a0178475124974', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            const profiles = parsed.data ? parsed.data.profiles : [];
            profiles.forEach(p => {
                console.log(`Profile: ${p.name} | gender: "${p.gender}" | slug: "${p.slug}" | id: "${p.id}"`);
            });
        } catch(e) {
            console.error('Error parsing:', e.message);
        }
    });
});
