// ============================================================================
// COMPREHENSIVE URL MAPPING DATABASE FOR JAPANESE SOURCES
// This should be included in your citation fixing scripts
// ============================================================================

const JAPAN_MEDICATION_URL_DATABASE = {
    // ===== JAPANESE GOVERNMENT AGENCIES =====
    government: {
        // Ministry of Health, Labour and Welfare (MHLW)
        'MHLW': 'https://www.mhlw.go.jp/english/',
        'Ministry of Health': 'https://www.mhlw.go.jp/english/',
        'Ministry of Health, Labour and Welfare': 'https://www.mhlw.go.jp/english/',
        'MHLW Import Guidelines': 'https://www.mhlw.go.jp/english/policy/health-medical/pharmaceuticals/01.html',
        'MHLW Pharmaceutical Policy': 'https://www.mhlw.go.jp/english/policy/health-medical/pharmaceuticals/index.html',
        'MHLW Q&A': 'https://www.mhlw.go.jp/english/policy/health-medical/pharmaceuticals/qa.html',
        
        // Narcotics Control Department (NCD)
        'NCD': 'https://www.ncd.mhlw.go.jp/en/',
        'Narcotics Control': 'https://www.ncd.mhlw.go.jp/en/',
        'Narcotics Control Department': 'https://www.ncd.mhlw.go.jp/en/',
        'MHLW/NCD': 'https://www.ncd.mhlw.go.jp/en/',
        'NCD Import Information': 'https://www.ncd.mhlw.go.jp/en/topic_medicine.html',
        'Controlled Substances List': 'https://www.ncd.mhlw.go.jp/en/topic_medicine.html',
        'Psychotropic List': 'https://www.ncd.mhlw.go.jp/en/topic_medicine.html',
        
        // Pharmaceuticals and Medical Devices Agency (PMDA)
        'PMDA': 'https://www.pmda.go.jp/english/',
        'Pharmaceuticals and Medical Devices Agency': 'https://www.pmda.go.jp/english/',
        'PMDA Safety Information': 'https://www.pmda.go.jp/english/safety/info-services/drugs/0001.html',
        
        // Japan Customs
        'Japan Customs': 'https://www.customs.go.jp/english/',
        'Customs Japan': 'https://www.customs.go.jp/english/',
        'Customs Declaration': 'https://www.customs.go.jp/english/summary/passenger.htm',
        'Import Procedures': 'https://www.customs.go.jp/english/summary/import.htm',
        
        // Regional Health Bureaus
        'Kanto-Shinetsu Regional Bureau': 'https://kouseikyoku.mhlw.go.jp/kantoshinetsu/english/',
        'Kinki Regional Bureau': 'https://kouseikyoku.mhlw.go.jp/kinki/',
        'Tokai Hokuriku Regional Bureau': 'https://kouseikyoku.mhlw.go.jp/tokaihokuriku/',
        'Chugoku Shikoku Regional Bureau': 'https://kouseikyoku.mhlw.go.jp/chugokushikoku/',
        'Kyushu Regional Bureau': 'https://kouseikyoku.mhlw.go.jp/kyushu/'
    },
    
    // ===== EMBASSY SOURCES =====
    embassies: {
        // US Embassy
        'US Embassy': 'https://jp.usembassy.gov/services/importing-medication/',
        'US Embassy Tokyo': 'https://jp.usembassy.gov/services/importing-medication/',
        'US Embassy Japan': 'https://jp.usembassy.gov/services/importing-medication/',
        'American Embassy': 'https://jp.usembassy.gov/services/importing-medication/',
        'US Consulate': 'https://jp.usembassy.gov/embassy-consulates/',
        
        // UK Embassy
        'UK Embassy': 'https://www.gov.uk/guidance/living-in-japan#health',
        'UK Embassy Tokyo': 'https://www.gov.uk/guidance/living-in-japan#health',
        'British Embassy': 'https://www.gov.uk/guidance/living-in-japan#health',
        'British Embassy Tokyo': 'https://www.gov.uk/guidance/living-in-japan#health',
        'UK Government Japan': 'https://www.gov.uk/world/japan',
        
        // Canadian Embassy
        'Canadian Embassy': 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadians/international/japan.html',
        'Canadian Embassy Tokyo': 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadians/international/japan.html',
        'Embassy of Canada': 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadians/international/japan.html',
        'Canada Japan': 'https://www.international.gc.ca/country-pays/japan-japon/',
        
        // Australian Embassy
        'Australian Embassy': 'https://japan.embassy.gov.au/tkyo/medical.html',
        'Australian Embassy Tokyo': 'https://japan.embassy.gov.au/tkyo/medical.html',
        'Embassy of Australia': 'https://japan.embassy.gov.au/',
        'Australia Japan Medical': 'https://japan.embassy.gov.au/tkyo/medical.html',
        
        // Other Embassies
        'German Embassy': 'https://japan.diplo.de/ja-en',
        'French Embassy': 'https://jp.ambafrance.org/English',
        'Netherlands Embassy': 'https://www.netherlandsworldwide.nl/countries/japan',
        'New Zealand Embassy': 'https://www.mfat.govt.nz/en/countries-and-regions/north-asia/japan/new-zealand-embassy/',
        'Singapore Embassy': 'https://www.mfa.gov.sg/tokyo'
    },
    
    // ===== MEDICAL ORGANIZATIONS =====
    medical: {
        // Japanese Medical Associations
        'Japan Medical Association': 'https://www.med.or.jp/english/',
        'JMA': 'https://www.med.or.jp/english/',
        'Japanese Medical Association': 'https://www.med.or.jp/english/',
        
        // Specialty Medical Societies
        'Japanese Epilepsy Society': 'https://www.jepilepsysociety.jp/english/',
        'Japan Epilepsy Society': 'https://www.jepilepsysociety.jp/english/',
        'Japanese Society of Psychiatry': 'https://www.jspn.or.jp/english/',
        'Japanese Society of Neurology': 'https://www.neurology-jp.org/en/',
        'Japan Diabetes Society': 'http://www.jds.or.jp/modules/en/',
        'Japanese Circulation Society': 'https://www.j-circ.or.jp/english/',
        'Japan Pediatric Society': 'http://www.jpeds.or.jp/modules/en/',
        
        // Pharmaceutical Organizations
        'Japan Pharmaceutical Association': 'https://www.nichiyaku.or.jp/e/',
        'JPA': 'https://www.nichiyaku.or.jp/e/',
        'Japan Generic Medicines Association': 'https://www.jga.gr.jp/english/',
        'Federation of Pharmaceutical Manufacturers': 'https://www.jpma.or.jp/english/',
        'JPMA': 'https://www.jpma.or.jp/english/',
        
        // Hospitals and Medical Centers
        'St. Luke\'s International Hospital': 'https://hospital.luke.ac.jp/eng/',
        'Tokyo Medical University Hospital': 'http://hospinfo.tokyo-med.ac.jp/english/',
        'Keio University Hospital': 'http://www.hosp.keio.ac.jp/en/',
        'National Center for Global Health': 'https://www.ncgm.go.jp/en/'
    },
    
    // ===== REGULATORY DOCUMENTS & FORMS =====
    documents: {
        // Import Forms and Applications
        'Yunyu Kakunin-sho': 'https://www.ncd.mhlw.go.jp/en/application.html',
        'Import Confirmation Form': 'https://www.ncd.mhlw.go.jp/en/application.html',
        'Yakkan Shoumei': 'https://www.mhlw.go.jp/english/policy/health-medical/pharmaceuticals/01.html',
        'Import Certificate': 'https://www.mhlw.go.jp/english/policy/health-medical/pharmaceuticals/01.html',
        
        // Lists and Regulations
        'Narcotics List': 'https://www.ncd.mhlw.go.jp/en/topic_medicine.html',
        'Psychotropics List': 'https://www.ncd.mhlw.go.jp/en/topic_medicine.html',
        'Stimulants List': 'https://www.ncd.mhlw.go.jp/en/topic_medicine.html',
        'Import Regulations': 'https://www.mhlw.go.jp/english/policy/health-medical/pharmaceuticals/01.html',
        'Pharmaceutical Affairs Law': 'https://www.japaneselawtranslation.go.jp/en/laws/view/3213'
    },
    
    // ===== TRAVEL & EXPAT RESOURCES =====
    resources: {
        // Official Travel Resources
        'JNTO': 'https://www.jnto.go.jp/eng/',
        'Japan National Tourism': 'https://www.jnto.go.jp/eng/',
        'Visit Japan': 'https://www.japan.travel/en/',
        
        // Expat Communities
        'Tokyo Metropolitan Government': 'https://www.metro.tokyo.lg.jp/english/',
        'Japan Healthcare Info': 'http://japanhealthinfo.com/',
        'AMDA International Medical Information': 'https://www.amdamedicalcenter.com/',
        
        // Emergency Services
        'Japan Helpline': 'https://jhelp.com/en/',
        'Tokyo English Lifeline': 'https://telljp.com/',
        'Emergency Medical Interpretation': 'https://www.jnto.go.jp/emergency/eng/mi_guide.html'
    }
};

// ===== HELPER FUNCTIONS FOR URL MAPPING =====

/**
 * Find the best matching URL for a given source name
 * @param {string} sourceName - The source name to find URL for
 * @returns {string|null} - The matched URL or null
 */
function findBestUrlMatch(sourceName) {
    if (!sourceName) return null;
    
    // Clean the source name
    let cleanSource = sourceName.trim();
    
    // Remove dates if present (e.g., "MHLW (2025-07-04)" -> "MHLW")
    cleanSource = cleanSource.replace(/\s*\(\d{4}-\d{2}-\d{2}\)\s*$/, '');
    
    // Search through all categories
    for (const category of Object.values(JAPAN_MEDICATION_URL_DATABASE)) {
        // Try exact match first
        if (category[cleanSource]) {
            return category[cleanSource];
        }
        
        // Try case-insensitive match
        for (const [key, url] of Object.entries(category)) {
            if (key.toLowerCase() === cleanSource.toLowerCase()) {
                return url;
            }
        }
        
        // Try partial match
        for (const [key, url] of Object.entries(category)) {
            if (cleanSource.toLowerCase().includes(key.toLowerCase()) || 
                key.toLowerCase().includes(cleanSource.toLowerCase())) {
                return url;
            }
        }
    }
    
    return null;
}

/**
 * Get all URLs for a specific category
 * @param {string} categoryName - Category name (government, embassies, medical, etc.)
 * @returns {object} - Object with source names and URLs
 */
function getUrlsByCategory(categoryName) {
    return JAPAN_MEDICATION_URL_DATABASE[categoryName] || {};
}

/**
 * Validate and fix a source URL
 * @param {string} sourceName - The source name
 * @param {string} currentUrl - The current URL (may be invalid)
 * @returns {object} - Object with validation result and fixed URL if applicable
 */
function validateAndFixSourceUrl(sourceName, currentUrl) {
    const result = {
        isValid: false,
        originalUrl: currentUrl,
        fixedUrl: null,
        source: sourceName,
        issue: null
    };
    
    // Check if current URL is valid
    if (currentUrl && isValidUrl(currentUrl)) {
        result.isValid = true;
        return result;
    }
    
    // Try to find correct URL
    const matchedUrl = findBestUrlMatch(sourceName);
    if (matchedUrl) {
        result.fixedUrl = matchedUrl;
        result.issue = currentUrl ? 'invalid_url' : 'missing_url';
    } else {
        result.issue = 'no_match_found';
    }
    
    return result;
}

/**
 * Simple URL validation
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is valid
 */
function isValidUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.trim() === '') return false;
    
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

// ===== EXPORT FOR USE IN OTHER SCRIPTS =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        JAPAN_MEDICATION_URL_DATABASE,
        findBestUrlMatch,
        getUrlsByCategory,
        validateAndFixSourceUrl,
        isValidUrl
    };
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.JapanMedicationUrls = {
        database: JAPAN_MEDICATION_URL_DATABASE,
        findUrl: findBestUrlMatch,
        getCategory: getUrlsByCategory,
        validateAndFix: validateAndFixSourceUrl,
        isValid: isValidUrl
    };
}

console.log('✅ Japan Medication URL Database loaded with', 
    Object.values(JAPAN_MEDICATION_URL_DATABASE).reduce((acc, cat) => acc + Object.keys(cat).length, 0), 
    'source mappings');