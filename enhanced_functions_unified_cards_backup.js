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
    
    // Combine all matches
    const allMatches = [...exactMatches, ...searchTermMatches, ...categoryMatches];
    
    // Return unique medications only (first occurrence per name)
    const uniqueMedications = [];
    const seenNames = new Set();
    
    for (const med of allMatches) {
        if (!seenNames.has(med.name.toLowerCase())) {
            seenNames.add(med.name.toLowerCase());
            uniqueMedications.push(med);
        }
    }
    
    return uniqueMedications.slice(0, 20);
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
    
    // Determine more accurate status for user display
    let displayStatus = guidance.status;
    if (guidance.status === 'permitted' && guidance.customsDeclaration === 'required') {
        displayStatus = 'declaration_required';
    }
    
    return {
        status: guidance.status, // Original CSV status
        displayStatus: displayStatus, // More accurate user-facing status
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
    const uniqueId = `calc-${medication.name.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    return `
        <div class="medication-card unified-card">
            <div class="handy-guide">
                <div class="guide-header">
                    <div class="medication-title">
                        <h3 class="medication-name">${medication.name}</h3>
                        <div class="medication-generic">${medication.genericName}</div>
                    </div>
                    <span class="status-badge info">CALCULATE NEEDED</span>
                </div>
                
                <div class="medication-calculator" id="${uniqueId}">
                    <div class="calculator-inputs">
                        <h4>📊 Quantity Calculator</h4>
                        <div class="calc-row">
                            <div class="calc-field">
                                <label>Strength per pill/dose (mg):</label>
                                <input type="number" class="calc-strength" placeholder="e.g. 0.5" step="0.1" oninput="calculateForCard('${medication.name}', '${uniqueId}')">
                            </div>
                            <div class="calc-field">
                                <label>Pills/doses per day:</label>
                                <input type="number" class="calc-tablets" placeholder="e.g. 2" step="1" oninput="calculateForCard('${medication.name}', '${uniqueId}')">
                            </div>
                            <div class="calc-field">
                                <label>Days in Japan:</label>
                                <input type="number" class="calc-days" placeholder="e.g. 14" step="1" oninput="calculateForCard('${medication.name}', '${uniqueId}')">
                            </div>
                        </div>
                    </div>
                    
                    <div class="calculation-result" style="display: none;">
                        <!-- Results will be populated by calculateForCard() -->
                    </div>
                    
                    <div class="permit-options" style="display: none;">
                        <!-- Permit options will be populated by calculateForCard() -->
                    </div>
                </div>
                
                ${medication.officialSource ? `
                    <div class="source-citation" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 12px; color: #495057;">
                        <strong>Source:</strong> <a href="${medication.officialSource}" target="_blank" style="color: #007bff; text-decoration: none;">${medication.officialSource.includes('mhlw.go.jp') ? 'MHLW Official Documentation' : 'Official Source'}</a>
                    </div>
                ` : ''}
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

function openPermitWizard(medicationName, itemId = null) {
    // Get the specific medication scenario if itemId provided
    let guidance;
    if (itemId) {
        // Find the exact medication scenario by itemId
        guidance = window.medications.find(med => med.itemId === itemId);
    } else {
        // Fallback to general search
        guidance = findMedicationGuidance(medicationName);
    }
    
    if (!guidance) {
        alert('Medication data not found. Please try searching again.');
        return;
    }
    
    // Prepare comprehensive data package for permit wizard
    const permitData = {
        // Core medication info
        name: guidance.name,
        genericName: guidance.genericName,
        category: guidance.category,
        
        // Permit logic data
        status: guidance.status,
        thresholdDescription: guidance.thresholdDescription,
        thresholdNumeric: guidance.thresholdNumeric,
        
        // Requirements and actions
        actionRequired: guidance.actionRequired,
        customsDeclaration: guidance.customsDeclaration,
        channelRequired: guidance.channelRequired,
        
        // Processing info
        processingDaysMin: guidance.processingDaysMin,
        processingDaysMax: guidance.processingDaysMax,
        documentationNeeded: guidance.documentationNeeded,
        
        // Reasoning and sources
        reasonForClassification: guidance.reasonForClassification,
        officialSource: guidance.officialSource,
        itemId: guidance.itemId,
        
        // Search terms for reference
        searchTerms: guidance.searchTerms || [],
        
        // Timestamp for data freshness
        passedAt: Date.now()
    };
    
    // Store data for permit wizard to consume
    try {
        sessionStorage.setItem('permitMedicationData', JSON.stringify(permitData));
        
        // Launch permit wizard
        window.open('permit-wizard.html', '_blank');
        
        console.log(`Permit wizard launched for: ${medicationName} (${guidance.itemId}) with complete CSV data`);
        console.log('Threshold:', guidance.thresholdDescription, '- Processing days:', guidance.processingDaysMin);
    } catch (error) {
        console.error('Failed to pass medication data to permit wizard:', error);
        alert('Unable to launch permit wizard. Please try again.');
    }
}

function addToTripPlanner(medicationName) {
    // Add medication to trip planner
    console.log(`Adding ${medicationName} to trip planner`);
    // This will be implemented when we build the trip planner UI
}

// ===== UNIFIED CARD CALCULATOR =====
function calculateForCard(medicationName, calculatorId) {
    const calculator = document.getElementById(calculatorId);
    const strength = parseFloat(calculator.querySelector('.calc-strength').value);
    const tablets = parseInt(calculator.querySelector('.calc-tablets').value);
    const days = parseInt(calculator.querySelector('.calc-days').value);

    if (!strength || !tablets || !days) {
        calculator.querySelector('.calculation-result').style.display = 'none';
        calculator.querySelector('.permit-options').style.display = 'none';
        // Reset status badge
        const card = calculator.closest('.medication-card');
        const badge = card.querySelector('.status-badge');
        badge.textContent = 'CALCULATE NEEDED';
        badge.className = 'status-badge info';
        return;
    }

    // Use comprehensive calculator
    const results = calculateMedicationStatus(medicationName, strength, tablets, days);
    
    // Update status badge with more accurate display status
    const card = calculator.closest('.medication-card');
    const badge = card.querySelector('.status-badge');
    badge.textContent = results.displayStatus.toUpperCase().replace('_', ' ');
    badge.className = `status-badge ${results.displayStatus.replace('_', '-')}`;
    
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

// ===== ENHANCED CALCULATOR INTEGRATION (Legacy) =====
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
        permitted: '#28a745',
        declaration_required: '#fd7e14'
    };
    
    const borderColor = statusColors[results.displayStatus] || statusColors[results.status];
    const displayText = results.displayStatus.toUpperCase().replace('_', ' ');
    
    return `
        <div style="background: white; padding: 25px; border-radius: 8px; border: 2px solid ${borderColor}; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h4 style="margin: 0; font-size: 1.3rem;">${results.medication}</h4>
                <span style="background: ${borderColor}; color: white; padding: 8px 14px; border-radius: 15px; font-size: 12px; font-weight: bold;">
                    ${displayText}
                </span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div style="padding: 15px; background: #f8f9fa; border-radius: 6px;">
                    <strong>Total Quantity:</strong> ${results.totalQuantity}mg<br><br>
                    <strong>Threshold:</strong> ${results.thresholdDescription}<br><br>
                    ${results.dailyDose ? `<strong>Daily Dose:</strong> ${results.dailyDose} tablets<br>` : ''}
                </div>
                <div style="padding: 15px; background: #f8f9fa; border-radius: 6px;">
                    <strong>Within Limit:</strong> ${results.withinLimit ? '✅ Yes' : '❌ No'}<br><br>
                    <strong>Customs Channel:</strong> ${results.channelRequired}<br><br>
                    <strong>Permit Required:</strong> ${results.permitRequired ? '✅ Yes' : '❌ No'}
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                <strong style="font-size: 1.1rem;">Action Required:</strong><br><br>
                ${results.actionRequired}
            </div>
            
            ${results.permitRequired ? `
                <div style="background: #fff3cd; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                    <strong style="font-size: 1.1rem;">📋 Permit Information:</strong><br><br>
                    <strong>Processing Time:</strong> ${results.processingTime}<br><br>
                    <strong>Documentation:</strong> ${results.documentationNeeded}
                </div>
            ` : ''}
            
            <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 6px; font-size: 14px; color: #6c757d;">
                <strong>Reasoning:</strong> ${results.reasoning}
            </div>
        </div>
    `;
}

function generatePermitOptionsHTML(results) {
    return `
        <div style="margin-top: 15px;">
            ${results.permitRequired ? 
                `<button onclick="openPermitWizard('${results.medication}')" 
                        style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-right: 10px; cursor: pointer;">
                    📋 Permit Application
                </button>` 
                : ''}
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
window.calculateForCard = calculateForCard;
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
    
    /* Unified Card Styling */
    .unified-card {
        border: 2px solid #dee2e6;
        border-radius: 8px;
        margin: 15px 0;
        transition: border-color 0.3s ease;
    }
    
    .unified-card:hover {
        border-color: #007bff;
    }
    
    .status-badge.info {
        background: #17a2b8;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
    }
    
    .status-badge.declaration-required {
        background: #fd7e14;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
    }
    
    /* Calculator Form Styling */
    .calculator-inputs {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 6px;
        margin: 15px 0;
    }
    
    .calc-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 15px;
        margin-top: 15px;
    }
    
    .calc-field {
        display: flex;
        flex-direction: column;
    }
    
    .calc-field label {
        font-weight: 500;
        margin-bottom: 5px;
        font-size: 14px;
        color: #495057;
    }
    
    .calc-field input {
        padding: 8px 12px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 14px;
        transition: border-color 0.15s ease-in-out;
    }
    
    .calc-field input:focus {
        outline: none;
        border-color: #80bdff;
        box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
    }
    
    @media (max-width: 768px) {
        .calc-row {
            grid-template-columns: 1fr;
            gap: 10px;
        }
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