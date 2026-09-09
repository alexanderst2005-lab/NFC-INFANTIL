import fs from 'fs';

try {
    const code = fs.readFileSync('./app.js', 'utf8');
    console.log("App.js read successfully, total lines:", code.split('\n').length);
} catch (e) {
    console.error("Error reading app.js:", e);
    process.exit(1);
}
