const https = require('https');

https.get('https://api.restful-api.dev/objects/ff8081819ff5b11001a0178475124974', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('CLOUD DB OBJECT NAME:', parsed.name);
            const profiles = parsed.data ? parsed.data.profiles : [];
            console.log('PROFILES COUNT IN CLOUD DB:', profiles.length);
            profiles.forEach(p => {
                console.log(`- Profile: ${p.name} (${p.slug})`);
                console.log(`  parentPhone 1: "${p.parentPhone}"`);
                console.log(`  parentPhone 2: "${p.parentPhone2}"`);
            });
        } catch(e) {
            console.error('Error parsing:', e.message);
        }
    });
});
