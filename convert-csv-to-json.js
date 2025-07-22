const fs = require('fs');
const Papa = require('papaparse'); // You may need: npm install papaparse

// Read your CSV file
const csvContent = fs.readFileSync('japan_med_guide_v3.csv', 'utf8');

// Parse CSV
const parsed = Papa.parse(csvContent, { 
    header: true, 
    skipEmptyLines: true 
});

// Convert to clean JSON structure
const medications = parsed.data.map((row, index) => {
    return {
        // Core identification - for search functionality
        name: row['Medication Name (Example Brand)']?.trim() || '',
        genericName: row['Active Ingredient(s)']?.trim() || '',
        category: row['Medication Category']?.trim() || '',
        
        // Tool-critical fields
        status: convertStatus(row['Classification']),
        thresholdDescription: row['Quantity Threshold (Without Permit)']?.trim() || '',
        thresholdNumeric: parseInt(row['threshold_numeric']) || 0,
        
        // VJW-compatible guidance 
        actionRequired: row['Action Required']?.trim() || '',
        customsDeclaration: extractCustomsDeclaration(row['Action Required']),
        channelRequired: extractChannel(row['Action Required']),
        
        // Permit wizard fields
        documentationNeeded: row['Documentation Needed (for Permit)']?.trim() || '',
        processingDaysMin: parseInt(row['processing_days_min']) || 0,
        processingDaysMax: parseInt(row['processing_days_max']) || 0,
        
        // Authority building (minimal)
        reasonForClassification: row['Reason for Classification']?.trim() || '',
        officialSource: row['Official Source / Notes']?.trim() || '',
        
        // Tool integration
        itemId: row['item_id']?.trim() || `med_${index}`,
        
        // Search terms - extracted from name and generic
        searchTerms: generateSearchTerms(
            row['Medication Name (Example Brand)'], 
            row['Active Ingredient(s)']
        )
    };
});

function convertStatus(classification) {
    if (!classification) return 'unknown';
    if (classification.includes('🔴')) return 'prohibited';
    if (classification.includes('🟡')) return 'restricted';  
    if (classification.includes('🟢')) return 'permitted';
    return 'unknown';
}

function extractCustomsDeclaration(action) {
    if (!action) return 'unknown';
    const actionLower = action.toLowerCase();
    if (actionLower.includes("check 'yes'")) return 'required';
    if (actionLower.includes("check 'no'")) return 'not_required';
    return 'see_action';
}

function extractChannel(action) {
    if (!action) return 'unknown';
    const actionLower = action.toLowerCase();
    if (actionLower.includes("check 'yes'")) return 'Red Channel';
    if (actionLower.includes("check 'no'")) return 'Green Channel';
    return 'See Action Required';
}

function generateSearchTerms(medicationName, genericName) {
    const terms = [];
    
    if (medicationName) {
        const nameTerms = medicationName.split(/[,()\/]/).map(term => 
            term.trim().toLowerCase()
        ).filter(term => term && term.length > 1);
        terms.push(...nameTerms);
    }
    
    if (genericName) {
        const genericTerms = genericName.split(/[,()\/]/).map(term => 
            term.trim().toLowerCase()
        ).filter(term => term && term.length > 1);
        terms.push(...genericTerms);
    }
    
    return [...new Set(terms)]; // Remove duplicates
}

// Write new medications.json
fs.writeFileSync('medications.json', JSON.stringify(medications, null, 2));

console.log(`✅ Converted ${medications.length} medication scenarios to new medications.json`);
console.log(`📊 Status distribution:`);

const statusCounts = {};
medications.forEach(med => {
    statusCounts[med.status] = (statusCounts[med.status] || 0) + 1;
});

Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
});