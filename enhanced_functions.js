// COMPREHENSIVE MEDICATION TOOLS - Japan Medical Guide
// Built from your CSV structure + React testing tool insights
// Vanilla JavaScript implementation with enhanced UX features

// ===== CORE LOOKUP ENGINE =====
// Revolutionary simplicity: find exact row for medication + quantity
function findMedicationGuidance(medicationName, userQuantityMg = null) {
    if (!window.medications || window.medications.length === 0) {
        return null;
    }
    
    // Find all rows for this medication
    const medicationRows = window.medications.filter(med => 
        med.name.toLowerCase().includes(medicationName.toLowerCase()) ||
        med.genericName.toLowerCase().includes(medicationName.toLowerCase()) ||
        med.searchTerms.some(term => term.includes(medicationName.toLowerCase()))
    );
    
    if (medicationRows.length === 0) {
        return null;
    }
    
    // If no quantity specified, return first match (for basic lookup)
    if (userQuantityMg === null) {
        return medicationRows[0];
    }
    
    // Find the right threshold scenario - THIS IS THE KEY BREAKTHROUGH
    const matchingRow = medicationRows.find(row => 
        userQuantityMg <= (row.thresholdNumeric || Infinity)
    );
    
    return matchingRow || medicationRows[medicationRows.length - 1]; // Fallback to highest threshold
}

// ===== ENHANCED SEARCH WITH SMART RANKING =====
function searchMedications(query) {
    if (!query || query.length < 1) return [];
    
    const queryLower = query.toLowerCase();
    
    // Exact matches first
    const exactMatches = window.medications.filter(med => 
        med.name.toLowerCase().includes(queryLower) ||
        med.genericName.toLowerCase().includes(queryLower)
    );
    
    // Then search terms matches
    const searchTermMatches = window.medications.filter(med => 
        !exactMatches.includes(med) &&
        med.searchTerms.some(term => term.includes(queryLower))
    );
    
    // Then category matches
    const categoryMatches = window.medications.filter(med => 
        !exactMatches.includes(med) && 
        !searchTermMatches.includes(med) &&
        med.category.toLowerCase().includes(queryLower)
    );
    
    return [...exactMatches, ...searchTermMatches, ...categoryMatches].slice(0, 20);
}

// ===== AUTOCOMPLETE SUGGESTIONS =====
function getAutocompleteSuggestions(query) {
    if (!query || query.length < 2) return [];
    
    const uniqueNames = [...new Set(window.medications.map(med => med.name))];
    return uniqueNames
        .filter(name => name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8);
}

// ===== SPELL CHECK WITH LEVENSHTEIN DISTANCE =====
function levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[str2.length][str1.length];
}

function findSpellSuggestions(query) {
    if (query.length < 3) return '';
    
    const allTerms = window.medications.flatMap(med => [
        med.name,
        med.genericName,
        ...med.searchTerms
    ]).filter(Boolean);
    
    const suggestions = allTerms
        .map(term => ({
            term,
            distance: levenshteinDistance(query.toLowerCase(), term.toLowerCase())
        }))
        .filter(item => item.distance <= 2 && item.distance > 0)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 1);
    
    return suggestions.length > 0 ? suggestions[0].term : '';
}

// ===== COMPREHENSIVE QUANTITY CALCULATOR =====
function calculateMedicationStatus(medicationName, strengthMg, tablets, days = null) {
    const totalMg = strengthMg * tablets;
    const guidance = findMedicationGuidance(medicationName, totalMg);
    
    if (!guidance) {
        return {
            status: 'not_found',
            message: 'Medication not found in database',
            medication: medicationName,
            totalQuantity: totalMg
        };
    }
    
    return {
        status: guidance.status,
        medication: medicationName,
        totalQuantity: totalMg,
        threshold: guidance.thresholdNumeric,
        thresholdDescription: guidance.thresholdDescription,
        withinLimit: totalMg <= (guidance.thresholdNumeric || Infinity),
        actionRequired: guidance.actionRequired,
        customsDeclaration: guidance.customsDeclaration,
        channelRequired: guidance.channelRequired,
        permitRequired: guidance.processingDaysMin > 0,
        processingTime: guidance.processingDaysMin > 0 ? 
            `${guidance.processingDaysMin}-${guidance.processingDaysMax} days` : 'No permit needed',
        processingDaysMin: guidance.processingDaysMin,
        processingDaysMax: guidance.processingDaysMax,
        documentationNeeded: guidance.documentationNeeded,
        reasoning: guidance.reasonForClassification,
        dailyDose: days ? (tablets / days).toFixed(1) : null
    };
}

// ===== VJW DECLARATION HELPER =====
function getVJWDeclarationGuidance(medications_list) {
    const declarations = medications_list.map(med => {
        const guidance = findMedicationGuidance(med.name, med.quantity);
        return {
            medication: med.name,
            quantity: med.quantity,
            declaration: guidance?.customsDeclaration || 'unknown',
            action: guidance?.actionRequired || 'Check medication database',
            status: guidance?.status || 'unknown'
        };
    });
    
    const requiresYes = declarations.some(d => d.declaration === 'required');
    
    return {
        vjw_answer: requiresYes ? 'YES' : 'NO',
        reasoning: requiresYes ? 
            'One or more medications require customs declaration' : 
            'All medications can use standard processing',
        details: declarations,
        prohibited_count: declarations.filter(d => d.status === 'prohibited').length,
        restricted_count: declarations.filter(d => d.status === 'restricted').length,
        permitted_count: declarations.filter(d => d.status === 'permitted').length
    };
}

// ===== PERMIT TIMELINE CALCULATOR =====
function calculatePermitTimeline(medications_list) {
    let maxProcessingDays = 0;
    const permitMedications = [];
    
    medications_list.forEach(med => {
        const guidance = findMedicationGuidance(med.name, med.quantity);
        if (guidance && guidance.processingDaysMin > 0) {
            permitMedications.push({
                name: med.name,
                quantity: med.quantity,
                processingDaysMin: guidance.processingDaysMin,
                processingDaysMax: guidance.processingDaysMax,
                documentation: guidance.documentationNeeded
            });
            maxProcessingDays = Math.max(maxProcessingDays, guidance.processingDaysMax);
        }
    });
    
    if (permitMedications.length === 0) {
        return {
            permitRequired: false,
            message: 'No permits required for your medications'
        };
    }
    
    // Calculate timeline with buffer
    const applicationDeadline = new Date();
    applicationDeadline.setDate(applicationDeadline.getDate() + maxProcessingDays + 7); // Add buffer
    
    return {
        permitRequired: true,
        medications: permitMedications,
        maxProcessingDays: maxProcessingDays,
        recommendedApplicationDate: new Date().toISOString().split('T')[0],
        deadlineDate: applicationDeadline.toISOString().split('T')[0],
        urgencyLevel: maxProcessingDays > 21 ? 'high' : maxProcessingDays > 14 ? 'medium' : 'low',
        bufferDays: 7
    };
}

// ===== MULTI-MEDICATION TRIP PLANNER =====
function planMedicationTrip(medications_list, tripDurationDays = null) {
    const plan = {
        medications: [],
        totalPermitsNeeded: 0,
        customsDeclarationRequired: false,
        timeline: {},
        warnings: [],
        summary: {
            prohibited: 0,
            restricted: 0,
            permitted: 0
        }
    };
    
    medications_list.forEach(med => {
        const guidance = findMedicationGuidance(med.name, med.quantity);
        
        if (!guidance) {
            plan.warnings.push(`${med.name}: Not found in database - verify import rules`);
            return;
        }
        
        const medicationPlan = {
            name: med.name,
            quantity: med.quantity,
            status: guidance.status,
            actionRequired: guidance.actionRequired,
            permitNeeded: guidance.processingDaysMin > 0,
            declaration: guidance.customsDeclaration,
            channel: guidance.channelRequired,
            reasoning: guidance.reasonForClassification
        };
        
        // Status-specific handling
        if (guidance.status === 'prohibited') {
            plan.warnings.push(`${med.name}: PROHIBITED - Cannot import to Japan`);
            plan.summary.prohibited++;
        } else if (guidance.status === 'restricted') {
            plan.summary.restricted++;
        } else if (guidance.status === 'permitted') {
            plan.summary.permitted++;
        }
        
        if (guidance.customsDeclaration === 'required') {
            plan.customsDeclarationRequired = true;
        }
        
        if (guidance.processingDaysMin > 0) {
            plan.totalPermitsNeeded++;
        }
        
        plan.medications.push(medicationPlan);
    });
    
    // Calculate timeline
    plan.timeline = calculatePermitTimeline(medications_list);
    
    return plan;
}

// ===== DYNAMIC CATEGORY CARDS GENERATION =====
function generateCategoryCards() {
    if (!window.medications || window.medications.length === 0) return '';
    
    // Get unique medications grouped by status
    const uniqueMeds = getUniqueMedicationsByStatus();
    
    return `
        <div class="category-card category-prohibited">
            <h3>Prohibited (${uniqueMeds.prohibited.length})</h3>
            <p>Cannot enter Japan under any circumstances</p>
            <div class="med-buttons">
                ${uniqueMeds.prohibited.map(med => 
                    `<button class="med-button" style="color: #dc3545;" onclick="searchSpecific('${med.name}')">${getDisplayName(med.name)}</button>`
                ).join('')}
            </div>
        </div>

        <div class="category-card category-restricted">
            <h3>Restricted (${uniqueMeds.restricted.length})</h3>
            <p>Requires permits or customs declaration</p>
            <div class="med-buttons">
                ${uniqueMeds.restricted.map(med => 
                    `<button class="med-button" style="color: #856404;" onclick="searchSpecific('${med.name}')">${getDisplayName(med.name)}</button>`
                ).join('')}
            </div>
        </div>

        <div class="category-card category-permitted">
            <h3>Permitted (${uniqueMeds.permitted.length})</h3>
            <p>Allowed with standard requirements</p>
            <div class="med-buttons">
                ${uniqueMeds.permitted.map(med => 
                    `<button class="med-button" style="color: #155724;" onclick="searchSpecific('${med.name}')">${getDisplayName(med.name)}</button>`
                ).join('')}
            </div>
        </div>
    `;
}

function getUniqueMedicationsByStatus() {
    const uniqueMedications = {};
    const statusGroups = {
        prohibited: [],
        restricted: [],
        permitted: []
    };
    
    // Get unique medications (avoid duplicates from threshold scenarios)
    window.medications.forEach(med => {
        const key = med.name.toLowerCase();
        if (!uniqueMedications[key]) {
            uniqueMedications[key] = med;
            
            if (statusGroups[med.status]) {
                statusGroups[med.status].push(med);
            }
        }
    });
    
    // Sort medications alphabetically within each category
    Object.keys(statusGroups).forEach(status => {
        statusGroups[status].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return statusGroups;
}

function getDisplayName(fullName) {
    // Convert "Advil (Ibuprofen, Motrin, Nurofen)" to "Advil"
    // Convert "Birth Control Pills (Yaz, etc.)" to "Birth Control"
    return fullName.split('(')[0].trim().replace(' Pills', '');
}

// ===== DISPLAY FUNCTIONS FOR EXISTING UI =====
function displayMedicationCard(medication) {
    const statusColors = {
        prohibited: 'bg-red-500',
        restricted: 'bg-yellow-500', 
        permitted: 'bg-green-500'
    };
    
    return `
        <div class="medication-card status-${medication.status}">
            <div class="medication-header">
                <h3 class="medication-name">${medication.name}</h3>
                <span class="status-badge ${medication.status}">${medication.status.toUpperCase()}</span>
            </div>
            
            <div class="medication-details">
                <p><strong>Generic:</strong> ${medication.genericName}</p>
                <p><strong>Threshold:</strong> ${medication.thresholdDescription}</p>
                <p><strong>Action Required:</strong> ${medication.actionRequired}</p>
                <p><strong>Customs Declaration:</strong> ${medication.customsDeclaration}</p>
                
                ${medication.processingDaysMin > 0 ? 
                    `<p><strong>Permit Processing:</strong> ${medication.processingDaysMin}-${medication.processingDaysMax} days</p>` 
                    : ''}
                
                <div class="reasoning">
                    <strong>Why:</strong> ${medication.reasonForClassification}
                </div>
            </div>
            
            <div class="tool-actions">
                <button onclick="openQuantityCalculator('${medication.name}')" class="tool-btn">
                    📊 Calculate Quantity
                </button>
                ${medication.processingDaysMin > 0 ? 
                    `<button onclick="openPermitWizard('${medication.name}')" class="tool-btn">
                        📋 Permit Application
                    </button>` 
                    : ''}
                <button onclick="addToTripPlanner('${medication.name}')" class="tool-btn">
                    ✈️ Add to Trip
                </button>
            </div>
        </div>
    `;
}

// ===== TOOL LAUNCHER FUNCTIONS =====
function openQuantityCalculator(medicationName) {
    // Auto-populate search and calculator
    const searchInput = document.getElementById('medicationSearch');
    if (searchInput) {
        searchInput.value = medicationName;
    }
    
    // Scroll to calculator if it exists
    const calculator = document.querySelector('.medication-calculator');
    if (calculator) {
        calculator.scrollIntoView({ behavior: 'smooth' });
    }
    
    console.log(`Opening calculator for: ${medicationName}`);
}

function openPermitWizard(medicationName) {
    // Integration point for permit wizard
    const guidance = findMedicationGuidance(medicationName);
    if (guidance) {
        alert(`Permit Wizard for ${medicationName}\n\nProcessing Time: ${guidance.processingDaysMin}-${guidance.processingDaysMax} days\nDocumentation: ${guidance.documentationNeeded}\n\nFull permit wizard coming soon!`);
    }
    console.log(`Opening permit wizard for: ${medicationName}`);
}

function addToTripPlanner(medicationName) {
    // Add medication to trip planner
    console.log(`Adding ${medicationName} to trip planner`);
    // This will be implemented when we build the trip planner UI
}

// ===== ENHANCED CALCULATOR INTEGRATION =====
function enhancedCalculateMedicationQuantity(calculator, medication, medName, genericName) {
    const strength = parseFloat(calculator.querySelector('.calc-strength').value);
    const tablets = parseInt(calculator.querySelector('.calc-tablets').value);
    const days = parseInt(calculator.querySelector('.calc-days').value);

    if (!strength || !tablets || !days) {
        calculator.querySelector('.calculation-result').style.display = 'none';
        calculator.querySelector('.permit-options').style.display = 'none';
        return;
    }

    // Use comprehensive calculator
    const results = calculateMedicationStatus(medName, strength, tablets, days);
    
    // Display enhanced results
    const resultDiv = calculator.querySelector('.calculation-result');
    resultDiv.innerHTML = generateCalculatorResultsHTML(results);
    resultDiv.style.display = 'block';
    
    // Show permit options with enhanced data
    const optionsDiv = calculator.querySelector('.permit-options');
    if (optionsDiv) {
        optionsDiv.innerHTML = generatePermitOptionsHTML(results);
        optionsDiv.style.display = 'block';
    }
}

function generateCalculatorResultsHTML(results) {
    if (results.status === 'not_found') {
        return `
            <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px;">
                <h4>❌ Medication Not Found</h4>
                <p>${results.message}</p>
            </div>
        `;
    }
    
    const statusColors = {
        prohibited: '#dc3545',
        restricted: '#ffc107', 
        permitted: '#28a745'
    };
    
    return `
        <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid ${statusColors[results.status]};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin: 0;">${results.medication}</h4>
                <span style="background: ${statusColors[results.status]}; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold;">
                    ${results.status.toUpperCase()}
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                <div>
                    <strong>Total Quantity:</strong> ${results.totalQuantity}mg<br>
                    <strong>Threshold:</strong> ${results.thresholdDescription}<br>
                    ${results.dailyDose ? `<strong>Daily Dose:</strong> ${results.dailyDose} tablets<br>` : ''}
                </div>
                <div>
                    <strong>Within Limit:</strong> ${results.withinLimit ? '✅ Yes' : '❌ No'}<br>
                    <strong>Customs Channel:</strong> ${results.channelRequired}<br>
                    <strong>Permit Required:</strong> ${results.permitRequired ? '✅ Yes' : '❌ No'}
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
                <strong>Action Required:</strong><br>
                ${results.actionRequired}
            </div>
            
            ${results.permitRequired ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px;">
                    <strong>📋 Permit Information:</strong><br>
                    <strong>Processing Time:</strong> ${results.processingTime}<br>
                    <strong>Documentation:</strong> ${results.documentationNeeded}
                </div>
            ` : ''}
            
            <div style="margin-top: 15px; font-size: 14px; color: #6c757d;">
                <strong>Reasoning:</strong> ${results.reasoning}
            </div>
        </div>
    `;
}

function generatePermitOptionsHTML(results) {
    return `
        <div style="margin-top: 15px;">
            <button onclick="generateTravelLetter('${results.medication}', ${JSON.stringify(results).replace(/"/g, '&quot;')})" 
                    style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-right: 10px; cursor: pointer;">
                📄 Generate Travel Letter
            </button>
            <button onclick="addToTripPlanner('${results.medication}')" 
                    style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                ✈️ Add to Trip Planner
            </button>
        </div>
    `;
}

function generateTravelLetter(medName, quantityData) {
    alert(`Travel Documentation Letter for ${medName}\n\nThis feature will generate:\n- Customs declaration letter\n- Medication details summary\n- Legal basis statement\n- Contact information\n\nComing soon!`);
}

// ===== GLOBAL FUNCTION EXPOSURE =====
window.findMedicationGuidance = findMedicationGuidance;
window.searchMedications = searchMedications;
window.getAutocompleteSuggestions = getAutocompleteSuggestions;
window.findSpellSuggestions = findSpellSuggestions;
window.calculateMedicationStatus = calculateMedicationStatus;
window.getVJWDeclarationGuidance = getVJWDeclarationGuidance;
window.calculatePermitTimeline = calculatePermitTimeline;
window.planMedicationTrip = planMedicationTrip;
window.generateCategoryCards = generateCategoryCards;
window.displayMedicationCard = displayMedicationCard;
window.openQuantityCalculator = openQuantityCalculator;
window.openPermitWizard = openPermitWizard;
window.addToTripPlanner = addToTripPlanner;
window.enhancedCalculateMedicationQuantity = enhancedCalculateMedicationQuantity;
window.generateTravelLetter = generateTravelLetter;

// ===== CSS STYLING =====
const enhancedCSS = `
    /* Autocomplete Dropdown */
    .search-container {
        position: relative;
    }
    
    .autocomplete-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-top: none;
        border-radius: 0 0 8px 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        max-height: 300px;
        overflow-y: auto;
    }
    
    .autocomplete-item {
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.2s;
    }
    
    .autocomplete-item:hover {
        background-color: #f8f9fa;
    }
    
    .autocomplete-item:last-child {
        border-bottom: none;
    }
    
    .autocomplete-suggestion {
        font-weight: 500;
        color: #333;
    }
    
    .autocomplete-quick-select {
        font-size: 12px;
        color: #6c757d;
        margin-left: 8px;
    }
    
    /* Spell Check Suggestion */
    .spell-suggestion {
        margin-top: 8px;
        padding: 8px 12px;
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 6px;
        font-size: 14px;
    }
    
    .spell-suggestion-link {
        color: #007bff;
        text-decoration: underline;
        cursor: pointer;
        font-weight: 500;
    }
    
    .spell-suggestion-link:hover {
        color: #0056b3;
    }
    
    /* Enhanced Calculator Results */
    .calculator-results-enhanced {
        margin-top: 20px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    /* Tool Buttons */
    .tool-btn {
        background: #007bff;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        margin: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    }
    
    .tool-btn:hover {
        background: #0056b3;
    }
    
    .tool-actions {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #eee;
    }
    
    /* Trip Planner Styles */
    .trip-planner-container {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
    }
    
    .trip-medication-input {
        display: flex;
        gap: 10px;
        margin: 10px 0;
        align-items: center;
    }
    
    .trip-results {
        background: white;
        padding: 15px;
        border-radius: 6px;
        margin-top: 15px;
        border: 1px solid #ddd;
    }
    
    .trip-warning {
        background: #f8d7da;
        color: #721c24;
        padding: 10px;
        border-radius: 6px;
        margin: 5px 0;
        border: 1px solid #f5c6cb;
    }
    
    .trip-success {
        background: #d4edda;
        color: #155724;
        padding: 10px;
        border-radius: 6px;
        margin: 5px 0;
        border: 1px solid #c3e6cb;
    }
`;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Add enhanced CSS
    const style = document.createElement('style');
    style.textContent = enhancedCSS;
    document.head.appendChild(style);
    
    console.log('✅ Comprehensive medication tools loaded');
    console.log('🔍 Enhanced search with autocomplete ready');
    console.log('📊 Advanced calculator with comprehensive results ready');
    console.log('✈️ Trip planner and VJW helper ready');
    
    if (window.medications) {
        console.log(`📋 Database: ${window.medications.length} medication scenarios loaded`);
    }
});