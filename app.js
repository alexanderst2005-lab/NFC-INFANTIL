// NFC INFANTIL - APPLICATION LOGIC

// Default Initial Data
const DEFAULT_KIDS = [
    {
        id: "nfc-001",
        name: "Mateo Alexander",
        age: 6,
        blood: "O+",
        parent: "Diana Torres",
        phone: "+57 300 123 4567",
        allergies: "Alergia a la Penicilina",
        school: "Jardín Infantil Los Pequeños Exploradores",
        avatar: "https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80"
    },
    {
        id: "nfc-002",
        name: "Sofía Martínez",
        age: 5,
        blood: "A+",
        parent: "Carlos Martínez",
        phone: "+57 315 987 6543",
        allergies: "Ninguna conocida",
        school: "Colegio San José Infantil",
        avatar: "https://images.unsplash.com/photo-1595454223600-91fb272189d5?w=150&auto=format&fit=crop&q=80"
    },
    {
        id: "nfc-003",
        name: "Lucas Benítez",
        age: 7,
        blood: "B+",
        parent: "Andrea Benítez",
        phone: "+57 320 444 5566",
        allergies: "Asma leve (Usa inhalador)",
        school: "Gimnasio Campestre del Norte",
        avatar: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=150&auto=format&fit=crop&q=80"
    }
];

class NFCApp {
    constructor() {
        this.kids = JSON.parse(localStorage.getItem('nfc_kids')) || DEFAULT_KIDS;
        this.scansCount = parseInt(localStorage.getItem('nfc_scans_count')) || 12;
        this.init();
    }

    init() {
        this.saveKids();
        this.setupNavigation();
        this.setupTheme();
        this.renderKidsDirectory();
        this.updateStats();
        this.setupEventListeners();
    }

    saveKids() {
        localStorage.setItem('nfc_kids', JSON.stringify(this.kids));
        localStorage.setItem('nfc_scans_count', this.scansCount);
    }

    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn[data-tab]');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                const selectedTab = document.getElementById(`tab-${targetTab}`);
                if (selectedTab) selectedTab.classList.add('active');
            });
        });

        // Hero buttons shortcut
        document.getElementById('hero-scan-btn')?.addEventListener('click', () => {
            document.querySelector('[data-tab="scanner"]')?.click();
            this.startScanSimulation();
        });

        document.getElementById('hero-add-btn')?.addEventListener('click', () => {
            this.openModal();
        });
    }

    setupTheme() {
        const themeBtn = document.getElementById('theme-toggle');
        const currentTheme = localStorage.getItem('nfc_theme') || 'dark';
        document.body.setAttribute('data-theme', currentTheme);
        this.updateThemeIcon(currentTheme);

        themeBtn?.addEventListener('click', () => {
            const newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('nfc_theme', newTheme);
            this.updateThemeIcon(newTheme);
        });
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#theme-toggle i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    }

    updateStats() {
        document.getElementById('kids-count').textContent = this.kids.length;
        document.getElementById('stat-registered').textContent = this.kids.length;
        document.getElementById('stat-scans').textContent = this.scansCount;
    }

    renderKidsDirectory(filterText = '') {
        const container = document.getElementById('kids-grid-container');
        if (!container) return;

        const filtered = this.kids.filter(k =>
            k.name.toLowerCase().includes(filterText.toLowerCase()) ||
            k.school.toLowerCase().includes(filterText.toLowerCase()) ||
            k.blood.toLowerCase().includes(filterText.toLowerCase())
        );

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <i class="fa-solid fa-folder-open" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>No se encontraron tarjetas o niños registrados.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(kid => `
            <div class="nfc-card-preview" style="transform: none;">
                <div class="card-header">
                    <span class="badge"><i class="fa-solid fa-id-badge"></i> ID: ${kid.id}</span>
                    <span class="card-type">${kid.age} Años</span>
                </div>
                <div class="card-body">
                    <div class="avatar-ring">
                        <img src="${kid.avatar}" alt="${kid.name}">
                    </div>
                    <h3>${kid.name}</h3>
                    <p><i class="fa-solid fa-droplet text-danger"></i> Sangre: ${kid.blood}</p>
                    <p class="text-muted" style="margin-top:0.4rem; font-size: 0.85rem;">
                        <i class="fa-solid fa-school"></i> ${kid.school}
                    </p>
                </div>
                <div class="card-footer">
                    <span><i class="fa-solid fa-user-nurse"></i> ${kid.parent}</span>
                    <button onclick="app.scanSpecificKid('${kid.id}')" class="btn btn-secondary" style="padding: 0.3rem 0.7rem; font-size: 0.8rem;">
                        <i class="fa-solid fa-wifi"></i> Probar NFC
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Search filter
        document.getElementById('search-kids')?.addEventListener('input', (e) => {
            this.renderKidsDirectory(e.target.value);
        });

        // Start Scanner
        document.getElementById('btn-start-scan')?.addEventListener('click', () => {
            this.startScanSimulation();
        });

        // Modal triggers
        document.getElementById('btn-register-modal')?.addEventListener('click', () => this.openModal());
        document.getElementById('close-modal')?.addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-modal')?.addEventListener('click', () => this.closeModal());

        // Form Submit
        document.getElementById('kid-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegisterKid();
        });
    }

    openModal() {
        document.getElementById('register-modal')?.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('register-modal')?.classList.add('hidden');
        document.getElementById('kid-form')?.reset();
    }

    handleRegisterKid() {
        const newKid = {
            id: `nfc-00${this.kids.length + 1}`,
            name: document.getElementById('input-name').value,
            blood: document.getElementById('input-blood').value,
            age: parseInt(document.getElementById('input-age').value) || 5,
            parent: document.getElementById('input-parent').value,
            phone: document.getElementById('input-phone').value,
            allergies: document.getElementById('input-allergies').value || 'Ninguna',
            school: document.getElementById('input-school').value || 'Sin especificar',
            avatar: `https://images.unsplash.com/photo-1543332164-6e82f355badc?w=150&auto=format&fit=crop&q=80`
        };

        this.kids.unshift(newKid);
        this.saveKids();
        this.renderKidsDirectory();
        this.updateStats();
        this.closeModal();
        this.showToast(`¡Pulsera NFC vinculada exitosamente para ${newKid.name}!`);
    }

    startScanSimulation() {
        const statusEl = document.getElementById('scan-status');
        const resultCard = document.getElementById('scan-result');
        
        statusEl.textContent = "Buscando señal de antena NFC...";
        statusEl.className = "scan-status text-warning";
        resultCard.classList.add('hidden');

        // Check Web NFC if available on Android Chrome
        if ('NDEFReader' in window) {
            try {
                const ndef = new NDEFReader();
                ndef.scan();
                statusEl.textContent = "Acerca la pulsera NFC al reverso de tu teléfono...";
            } catch (err) {
                console.log("Web NFC fallback to simulation mode");
            }
        }

        setTimeout(() => {
            const randomKid = this.kids[Math.floor(Math.random() * this.kids.length)];
            this.displayScanResult(randomKid);
        }, 1500);
    }

    scanSpecificKid(id) {
        document.querySelector('[data-tab="scanner"]')?.click();
        const kid = this.kids.find(k => k.id === id);
        if (kid) {
            this.displayScanResult(kid);
        }
    }

    displayScanResult(kid) {
        this.scansCount++;
        this.saveKids();
        this.updateStats();

        const statusEl = document.getElementById('scan-status');
        const resultCard = document.getElementById('scan-result');

        statusEl.textContent = "¡Lectura NFC completada con éxito!";
        statusEl.className = "scan-status text-muted";

        document.getElementById('result-name').textContent = kid.name;
        document.getElementById('result-parent').textContent = kid.parent;
        document.getElementById('result-phone').textContent = kid.phone;
        document.getElementById('result-phone').href = `tel:${kid.phone}`;
        document.getElementById('result-blood').textContent = kid.blood;
        document.getElementById('result-allergies').textContent = kid.allergies;
        document.getElementById('result-school').textContent = kid.school;
        document.getElementById('btn-call-emergency').href = `tel:${kid.phone}`;

        resultCard.classList.remove('hidden');
        this.showToast(`NFC Detectado: Perfil de ${kid.name}`);
    }

    showToast(msg) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3500);
    }
}

// Initialize on DOM Ready
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NFCApp();
});
