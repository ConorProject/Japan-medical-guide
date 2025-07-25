// Japan Medication Import Permit Wizard - Technical Architecture
// Single-page application with no backend dependencies

class PermitWizard {
    constructor() {
        // Core state management
        this.state = {
            currentStep: 'medication-selection',
            medications: [],
            travelDetails: {},
            permitType: null,
            documents: {},
            submissionStatus: 'pending',
            insuranceOffers: []
        };
        
        // Persistence layer using localStorage
        this.storage = new WizardStorage();
        
        // Decision engine for permit logic
        this.permitEngine = new PermitDecisionEngine();
        
        // Form generators
        this.formGenerator = new FormGenerator();
        
        // Analytics and conversion tracking
        this.analytics = new WizardAnalytics();
    }
}

// State Management with LocalStorage Persistence
class WizardStorage {
    constructor() {
        this.storageKey = 'japan-permit-wizard';
        this.sessionKey = 'wizard-session-id';
    }
    
    save(state) {
        try {
            const data = {
                state: state,
                timestamp: Date.now(),
                sessionId: this.getSessionId()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage failed:', e);
            return false;
        }
    }
    
    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return null;
            
            const data = JSON.parse(stored);
            // Check if data is less than 30 days old
            if (Date.now() - data.timestamp > 30 * 24 * 60 * 60 * 1000) {
                this.clear();
                return null;
            }
            return data.state;
        } catch (e) {
            return null;
        }
    }
    
    getSessionId() {
        let sessionId = sessionStorage.getItem(this.sessionKey);
        if (!sessionId) {
            sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem(this.sessionKey, sessionId);
        }
        return sessionId;
    }
}

// Permit Decision Engine
class PermitDecisionEngine {
    constructor() {
        // Medication thresholds database
        this.thresholds = {
            'clonazepam': { limit: 180, unit: 'mg', permitType: 'yunyu-kakunin' },
            'alprazolam': { limit: 72, unit: 'mg', permitType: 'yunyu-kakunin' },
            'lorazepam': { limit: 90, unit: 'mg', permitType: 'yunyu-kakunin' },
            'diazepam': { limit: 300, unit: 'mg', permitType: 'yunyu-kakunin' },
            'zolpidem': { limit: 300, unit: 'mg', permitType: 'yunyu-kakunin' },
            'methylphenidate': { limit: 0, unit: 'mg', permitType: 'psychotropic' },
            'adderall': { limit: 0, unit: 'mg', permitType: 'prohibited' },
            // ... comprehensive medication database
        };
        
        // Regional bureau mapping
        this.regionalBureaus = {
            'NRT': 'kanto-shinetsu',  // Narita
            'HND': 'kanto-shinetsu',  // Haneda
            'KIX': 'kinki',          // Kansai
            'NGO': 'tokai-hokuriku', // Nagoya
            'CTS': 'hokkaido',       // Sapporo
            'FUK': 'kyushu',         // Fukuoka
            // ... all entry points
        };
    }
    
    determinePermitRequirement(medication, quantity, travelDetails) {
        const med = medication.genericName.toLowerCase();
        const threshold = this.thresholds[med];
        
        if (!threshold) {
            return { type: 'standard', reason: 'Not in controlled list' };
        }
        
        if (threshold.permitType === 'prohibited') {
            return { 
                type: 'prohibited', 
                reason: 'Medication is prohibited in Japan',
                alternatives: this.suggestAlternatives(med)
            };
        }
        
        const totalAmount = this.calculateTotalAmount(quantity, medication.strength);
        
        if (totalAmount <= threshold.limit) {
            return { 
                type: 'no-permit', 
                reason: `Under ${threshold.limit}${threshold.unit} threshold`,
                documentation: ['prescription', 'doctor-letter']
            };
        }
        
        return {
            type: threshold.permitType,
            reason: `Exceeds ${threshold.limit}${threshold.unit} threshold`,
            bureau: this.regionalBureaus[travelDetails.entryPort],
            processingTime: threshold.permitType === 'psychotropic' ? 21 : 14,
            documentation: this.getRequiredDocuments(threshold.permitType)
        };
    }
    
    calculateTotalAmount(quantity, strength) {
        // Extract numeric value from strength string (e.g., "0.5mg" → 0.5)
        const strengthValue = parseFloat(strength.match(/[\d.]+/)[0]);
        const strengthUnit = strength.match(/[a-zA-Z]+$/)[0].toLowerCase();
        
        // Convert to standard units if necessary
        let multiplier = 1;
        if (strengthUnit === 'mcg' || strengthUnit === 'μg') {
            multiplier = 0.001; // Convert to mg
        }
        
        return quantity * strengthValue * multiplier;
    }
    
    getRequiredDocuments(permitType) {
        const baseDocuments = [
            'prescription',
            'doctor-letter',
            'itinerary',
            'passport-copy'
        ];
        
        if (permitType === 'psychotropic') {
            return [...baseDocuments, 'medical-certificate', 'treatment-plan'];
        }
        
        return baseDocuments;
    }
}

// Form Generation System
class FormGenerator {
    constructor() {
        this.templates = {
            'yunyu-kakunin': this.loadYunyuKakuninTemplate(),
            'doctor-letter': this.loadDoctorLetterTemplate(),
            'customs-declaration': this.loadCustomsTemplate()
        };
    }
    
    generateYunyuKakunin(userData, medications) {
        const template = this.templates['yunyu-kakunin'];
        
        // Auto-fill logic
        const formData = {
            applicantName: this.formatJapaneseName(userData.name),
            nationality: userData.nationality,
            passportNumber: userData.passport,
            address: this.formatJapaneseAddress(userData.hotelAddress),
            entryDate: this.formatJapaneseDate(userData.arrivalDate),
            entryPort: this.getPortName(userData.entryPort),
            stayDuration: userData.stayDuration,
            medications: medications.map(med => ({
                name: med.brandName,
                genericName: med.genericName,
                strength: med.strength,
                quantity: med.quantity,
                purpose: this.translatePurpose(med.condition),
                manufacturer: med.manufacturer || 'Unknown'
            }))
        };
        
        return this.fillTemplate(template, formData);
    }
    
    generateDoctorLetter(userData, medications, doctor) {
        const template = this.templates['doctor-letter'];
        
        // Generate bilingual medical letter
        return {
            english: this.generateEnglishLetter(userData, medications, doctor),
            japanese: this.generateJapaneseTranslation(userData, medications),
            formatting: {
                letterhead: true,
                signature: true,
                stamp: doctor.country === 'Japan',
                date: new Date().toISOString()
            }
        };
    }
    
    formatJapaneseName(westernName) {
        // Last name first in Japanese style
        const parts = westernName.split(' ');
        if (parts.length >= 2) {
            return `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}`;
        }
        return westernName;
    }
    
    formatJapaneseDate(date) {
        // Convert to Japanese era format (Reiwa)
        const jsDate = new Date(date);
        const year = jsDate.getFullYear();
        const reiwaYear = year - 2018; // Reiwa era started in 2019
        
        if (reiwaYear > 0) {
            return `令和${reiwaYear}年${jsDate.getMonth() + 1}月${jsDate.getDate()}日`;
        }
        
        // Fallback to Western format
        return jsDate.toISOString().split('T')[0];
    }
}

// Analytics and Conversion Tracking
class WizardAnalytics {
    constructor() {
        this.events = [];
        this.conversionPoints = {
            'wizard-start': 0,
            'permit-required': 0.2,
            'documents-prepared': 0.5,
            'insurance-viewed': 0.7,
            'submission-complete': 0.9,
            'insurance-clicked': 1.0
        };
    }
    
    track(eventName, data = {}) {
        const event = {
            name: eventName,
            timestamp: Date.now(),
            data: data,
            conversionValue: this.conversionPoints[eventName] || 0,
            sessionId: sessionStorage.getItem('wizard-session-id')
        };
        
        this.events.push(event);
        
        // Send to analytics service (Google Analytics, etc.)
        if (window.gtag) {
            window.gtag('event', eventName, {
                event_category: 'Permit Wizard',
                event_label: data.medication || 'unknown',
                value: event.conversionValue
            });
        }
        
        // Trigger insurance offers at optimal points
        if (eventName === 'permit-required' && data.permitType !== 'no-permit') {
            this.triggerInsuranceOffer('complex-permit');
        }
    }
    
    triggerInsuranceOffer(trigger) {
        // Dynamic insurance offer based on user journey
        const offers = {
            'complex-permit': {
                headline: 'Complex permit? Get peace of mind.',
                message: 'Travel insurance covers prescription issues abroad',
                cta: 'Compare Coverage',
                urgency: 'medium'
            },
            'high-value-meds': {
                headline: 'Protect your medication investment',
                message: 'Coverage for lost or delayed prescriptions',
                cta: 'Get Protected',
                urgency: 'high'
            },
            'near-submission': {
                headline: 'Almost done! One more thing...',
                message: 'What happens if your permit is delayed?',
                cta: 'View Backup Options',
                urgency: 'low'
            }
        };
        
        return offers[trigger];
    }
}

// UI Component Library
class WizardUI {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            'medication-selection',
            'quantity-calculation',
            'travel-details',
            'permit-determination',
            'document-preparation',
            'submission-guide',
            'contingency-planning'
        ];
    }
    
    renderStep(stepName, data) {
        const stepRenderers = {
            'medication-selection': this.renderMedicationStep,
            'quantity-calculation': this.renderQuantityStep,
            'travel-details': this.renderTravelStep,
            'permit-determination': this.renderPermitStep,
            'document-preparation': this.renderDocumentStep,
            'submission-guide': this.renderSubmissionStep,
            'contingency-planning': this.renderContingencyStep
        };
        
        return stepRenderers[stepName].call(this, data);
    }
    
    renderMedicationStep(data) {
        return `
            <div class="wizard-step medication-selection">
                <h2>Select Your Medications</h2>
                <div class="search-container">
                    <input type="text" id="med-search" placeholder="Search by name or active ingredient">
                    <div class="search-results"></div>
                </div>
                <div class="selected-medications">
                    ${this.renderSelectedMedications(data.medications)}
                </div>
                <button class="add-medication">+ Add Another Medication</button>
            </div>
        `;
    }
    
    renderProgressBar() {
        const progress = ((this.currentStep + 1) / this.steps.length) * 100;
        return `
            <div class="progress-container">
                <div class="progress-bar" style="width: ${progress}%"></div>
                <div class="progress-steps">
                    ${this.steps.map((step, i) => `
                        <div class="progress-step ${i <= this.currentStep ? 'active' : ''}">
                            ${i + 1}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    renderInsuranceWidget(offer) {
        if (!offer) return '';
        
        return `
            <div class="insurance-widget ${offer.urgency}">
                <button class="close-widget">×</button>
                <h3>${offer.headline}</h3>
                <p>${offer.message}</p>
                <div class="insurance-benefits">
                    <div class="benefit">✓ 24/7 medical support</div>
                    <div class="benefit">✓ Prescription replacement</div>
                    <div class="benefit">✓ Emergency evacuation</div>
                </div>
                <button class="cta-button">${offer.cta}</button>
                <small>Trusted by 50,000+ Japan travelers</small>
            </div>
        `;
    }
}

// Offline Capability with Service Worker
class OfflineManager {
    constructor() {
        this.dbName = 'permit-wizard-offline';
        this.version = 1;
    }
    
    async init() {
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/permit-wizard-sw.js');
                console.log('Service Worker registered');
            } catch (e) {
                console.error('Service Worker registration failed:', e);
            }
        }
        
        // Initialize IndexedDB for offline storage
        this.db = await this.openDatabase();
    }
    
    async openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('wizardState')) {
                    db.createObjectStore('wizardState', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('documents')) {
                    db.createObjectStore('documents', { keyPath: 'id' });
                }
            };
        });
    }
    
    async saveOffline(data) {
        const transaction = this.db.transaction(['wizardState'], 'readwrite');
        const store = transaction.objectStore('wizardState');
        
        return store.put({
            id: 'current',
            data: data,
            timestamp: Date.now()
        });
    }
}

// Integration with Existing Site
class SiteIntegration {
    constructor() {
        this.existingSite = {
            medicationDatabase: window.medicationData || [],
            searchFunction: window.searchMedications,
            styleSystem: window.siteStyles
        };
    }
    
    injectWizard() {
        // Add wizard entry points to existing medication pages
        document.querySelectorAll('.medication-detail').forEach(medPage => {
            const permitButton = document.createElement('button');
            permitButton.className = 'permit-wizard-launcher';
            permitButton.textContent = 'Start Permit Application';
            permitButton.onclick = () => this.launchWizard(medPage.dataset.medicationId);
            
            medPage.querySelector('.action-buttons').appendChild(permitButton);
        });
        
        // Add global wizard access
        const globalLauncher = document.createElement('div');
        globalLauncher.className = 'wizard-fab';
        globalLauncher.innerHTML = `
            <button class="fab-button">
                <span class="fab-icon">📋</span>
                <span class="fab-text">Permit Helper</span>
            </button>
        `;
        document.body.appendChild(globalLauncher);
    }
    
    launchWizard(medicationId = null) {
        const wizard = new PermitWizard();
        
        if (medicationId) {
            // Pre-populate with selected medication
            const medication = this.existingSite.medicationDatabase.find(
                med => med.id === medicationId
            );
            wizard.state.medications = [medication];
            wizard.state.currentStep = 'quantity-calculation';
        }
        
        wizard.init();
    }
}

// Mobile Optimization
class MobileOptimization {
    constructor() {
        this.touchEnabled = 'ontouchstart' in window;
        this.viewportWidth = window.innerWidth;
    }
    
    optimizeForMobile() {
        if (this.viewportWidth < 768) {
            // Mobile-specific optimizations
            document.body.classList.add('mobile-wizard');
            
            // Simplified navigation
            this.