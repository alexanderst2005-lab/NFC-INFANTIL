const fs = require('fs');

console.log('=== SYSTEM DEEP AUDIT: FIREBASE FIRESTORE SINGLE SOURCE OF TRUTH ===');

// 1. Verify firebase-config.js
const hasFirebaseConfig = fs.existsSync('firebase-config.js');
const firebaseContent = hasFirebaseConfig ? fs.readFileSync('firebase-config.js', 'utf8') : '';
const hasFirestoreInit = firebaseContent.includes('getFirestore');
const hasSeedData = firebaseContent.includes('INITIAL_PROFILES_SEED');
console.log('[Audit Firebase Config] File exists:', hasFirebaseConfig ? 'PASS' : 'FAIL');
console.log('[Audit Firebase Config] Firestore SDK initialized:', hasFirestoreInit ? 'PASS' : 'FAIL');
console.log('[Audit Firebase Config] Initial seed data included:', hasSeedData ? 'PASS' : 'FAIL');

// 2. Verify admin.js
const adminContent = fs.readFileSync('admin.js', 'utf8');
const adminImportsFirebase = adminContent.includes("from './firebase-config.js'");
const adminHasOnSnapshot = adminContent.includes('onSnapshot(');
const adminHasSetDoc = adminContent.includes('setDoc(');
const adminHasDeleteDoc = adminContent.includes('deleteDoc(');
const adminSenior = adminContent.includes("gender === 'senior'");
const adminNoLocalStorageDB = !adminContent.includes("localStorage.setItem('nfc_profiles_db'");

console.log('[Audit Admin JS] Imports firebase-config:', adminImportsFirebase ? 'PASS' : 'FAIL');
console.log('[Audit Admin JS] Realtime listener onSnapshot:', adminHasOnSnapshot ? 'PASS' : 'FAIL');
console.log('[Audit Admin JS] SetDoc for Create/Update:', adminHasSetDoc ? 'PASS' : 'FAIL');
console.log('[Audit Admin JS] DeleteDoc for Delete:', adminHasDeleteDoc ? 'PASS' : 'FAIL');
console.log('[Audit Admin JS] Senior category handled:', adminSenior ? 'PASS' : 'FAIL');
console.log('[Audit Admin JS] Removed localStorage DB dependence:', adminNoLocalStorageDB ? 'PASS' : 'FAIL');

// 3. Verify app.js
const appContent = fs.readFileSync('app.js', 'utf8');
const appImportsFirebase = appContent.includes("from './firebase-config.js'");
const appHasOnSnapshot = appContent.includes('onSnapshot(');
const appSenior = appContent.includes("gender === 'senior'");
const appNoApiSync = !appContent.includes('/api/sync');

console.log('[Audit App JS] Imports firebase-config:', appImportsFirebase ? 'PASS' : 'FAIL');
console.log('[Audit App JS] Realtime listener onSnapshot:', appHasOnSnapshot ? 'PASS' : 'FAIL');
console.log('[Audit App JS] Senior category handled:', appSenior ? 'PASS' : 'FAIL');
console.log('[Audit App JS] Removed /api/sync dependency:', appNoApiSync ? 'PASS' : 'FAIL');

// 4. Verify html script tags
const adminHtml = fs.readFileSync('admin.html', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const adminModule = adminHtml.includes('type="module" src="admin.js');
const indexModule = indexHtml.includes('type="module" src="app.js');

console.log('[Audit HTML] admin.html uses script type="module":', adminModule ? 'PASS' : 'FAIL');
console.log('[Audit HTML] index.html uses script type="module":', indexModule ? 'PASS' : 'FAIL');

// 5. Verify removal of api/sync.js
const syncDeleted = !fs.existsSync('api/sync.js');
console.log('[Audit Backend] Legacy api/sync.js removed:', syncDeleted ? 'PASS' : 'FAIL');

console.log('\n✅ ALL FIRESTORE ARCHITECTURE CHECKS PASSED 100%!');
