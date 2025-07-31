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
    
    // Find the correct threshold row based on quantity and description matching
    // We need to find which row's description actually applies to the user's quantity
    
    // First, identify all unique thresholds and sort them
    const thresholds = [...new Set(medicationRows.map(row => row.thresholdNumeric))].sort((a, b) => a - b);
    
    // Special case: if threshold is 0, it means always requires permit regardless of quantity
    const zeroThresholdRow = medicationRows.find(row => row.thresholdNumeric === 0);
    if (zeroThresholdRow) {
        return zeroThresholdRow;
    }
    
    // Find the appropriate threshold row based on user quantity
    for (const row of medicationRows) {
        const threshold = row.thresholdNumeric;
        const description = row.thresholdDescription.toLowerCase();
        
        // Check if this row's description matches the user's quantity situation
        if (description.includes('up to') || description.includes('below') || description.includes('under') || description.includes('within')) {
            // This is the "under/at threshold" row
            if (userQuantityMg <= threshold) {
                return row;
            }
        } else if (description.includes('more than') || description.includes('above') || description.includes('exceeds') || description.includes('over')) {
            // This is the "over threshold" row  
            if (userQuantityMg > threshold) {
                return row;
            }
        } else if (description.includes('exactly') || description.includes('equal')) {
            // Handle exact match cases
            if (userQuantityMg === threshold) {
                return row;
            }
        }
    }
    
    // If no specific match found, find the most appropriate row
    // For quantities at or below any threshold, prefer "up to" rows
    // For quantities above all thresholds, prefer "more than" rows
    const maxThreshold = Math.max(...thresholds);
    
    if (userQuantityMg <= maxThreshold) {
        // Look for an "up to" row with the closest threshold
        const upToRow = medicationRows.find(row => {
            const desc = row.thresholdDescription.toLowerCase();
            return desc.includes('up to') || desc.includes('below') || desc.includes('under');
        });
        if (upToRow) return upToRow;
    } else {
        // Look for a "more than" row
        const moreThanRow = medicationRows.find(row => {
            const desc = row.thresholdDescription.toLowerCase();
            return desc.includes('more than') || desc.includes('above') || desc.includes('over');
        });
        if (moreThanRow) return moreThanRow;
    }
    
    // Final fallback
    return medicationRows[0];
}

// ===== HELPER FUNCTIONS =====
function getInitialBadgeText(medication) {
    if (medication.status === 'prohibited') {
        return 'PROHIBITED';
    } else if (medication.status === 'controlled') {
        // All controlled substances are quantity-dependent
        return 'QUANTITY CHECK NEEDED';
    } else {
        // Permitted medications require no declaration
        return 'NO DECLARATION NEEDED';
    }
}

// Helper functions for clean design
function getCleanStatusText(status) {
    switch(status) {
        case 'prohibited': return 'Import Prohibited';
        case 'controlled': return 'Controlled Substance';
        case 'permitted': return 'Standard Medication';
        default: return 'Status Unknown';
    }
}

function generateCleanActionSteps(med) {
    let steps = [];
    
    if (med.status === 'prohibited') {
        steps.push(`<li class="step-item"><div class="step-marker">!</div><div class="step-text">Do not bring to Japan - possession is illegal</div></li>`);
        return steps.join('');
    }
    
    if (med.status === 'controlled') {
        // Step 1: Always determine quantity first
        const threshold = med.thresholdDescription || `${med.thresholdNumeric} units`;
        steps.push(`<li class="step-item"><div class="step-marker">1</div><div class="step-text">Determine your quantity: ${threshold}</div></li>`);
        
        // Step 2: Conditional path based on quantity
        // Find the "above threshold" entry for this medication (if it exists)
        const higherThresholdMed = window.medications?.find(m => 
            m.name === med.name && 
            m.thresholdNumeric === med.thresholdNumeric && 
            (m.thresholdDescription.toLowerCase().includes('more than') || 
             m.thresholdDescription.toLowerCase().includes('or more') ||
             m.thresholdDescription.toLowerCase().includes('above')) &&
            parseFloat(m.processingDaysMin) > 0
        );
        
        if (higherThresholdMed) {
            steps.push(`<li class="step-item"><div class="step-marker">2</div><div class="step-text">If ${higherThresholdMed.thresholdDescription.toLowerCase()}: Apply for Import Confirmation Certificate (${higherThresholdMed.processingDaysMin}-${higherThresholdMed.processingDaysMax} days)</div></li>`);
            steps.push(`<li class="step-item"><div class="step-marker">3</div><div class="step-text">Bring valid prescription and any permit documentation</div></li>`);
        } else {
            steps.push(`<li class="step-item"><div class="step-marker">2</div><div class="step-text">Bring valid prescription from your doctor</div></li>`);
        }
        
        // Final steps: Digital customs process (consolidated)
        const nextStep = higherThresholdMed ? 4 : 3;
        steps.push(`<li class="step-item"><div class="step-marker">${nextStep}</div><div class="step-text">Answer "Yes" to controlled substances on Visit Japan Web customs form</div></li>`);
        steps.push(`<li class="step-item"><div class="step-marker">${nextStep + 1}</div><div class="step-text">Be prepared for customs inspection</div></li>`);
    }
    
    if (med.status === 'permitted') {
        steps.push(`<li class="step-item"><div class="step-marker">1</div><div class="step-text">Bring in original packaging with labels</div></li>`);
        steps.push(`<li class="step-item"><div class="step-marker">2</div><div class="step-text">Limit to personal use (typically 1-month supply)</div></li>`);
        steps.push(`<li class="step-item"><div class="step-marker">3</div><div class="step-text">Proceed through standard customs - no special declaration needed</div></li>`);
    }
    
    return steps.join('');
}

function generateCleanKeyInfo(med) {
    let info = [];
    
    if (med.customsDeclaration && med.customsDeclaration !== 'not_required') {
        info.push(`
            <div class="info-section">
                <div class="info-label">Digital Customs Process</div>
                <div class="info-content muted">${med.customsDeclaration}</div>
            </div>
        `);
    }
    
    if (med.reasonForClassification) {
        info.push(`
            <div class="info-section">
                <div class="info-label">Background</div>
                <div class="info-content muted">${med.reasonForClassification}</div>
            </div>
        `);
    }
    
    return info.join('');
}

function getInitialBadgeClass(medication) {
    if (medication.status === 'prohibited') {
        return 'prohibited';
    } else if (medication.status === 'controlled') {
        return 'info';
    } else {
        return 'no-declaration';
    }
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
    const totalMg = strengthMg * tablets * days;
    const guidance = findMedicationGuidance(medicationName, totalMg);
    
    if (!guidance) {
        return {
            status: 'not_found',
            message: 'Medication not found in database',
            medication: medicationName,
            totalQuantity: totalMg
        };
    }
    
    // Use CSV data as authoritative source for declaration requirements
    let declarationStatus;
    let declarationGuidance;
    
    if (guidance.status === 'prohibited') {
        declarationStatus = 'prohibited';
        declarationGuidance = 'Cannot import to Japan';
    } else if (guidance.status === 'controlled' || guidance.customsDeclaration.includes('Answer "Yes"')) {
        declarationStatus = 'declaration_required';
        if (guidance.processingDaysMin > 0) {
            declarationGuidance = 'Check "Yes" on Visit Japan Web - Permit required, inspection likely but routine';
        } else {
            declarationGuidance = 'Check "Yes" on Visit Japan Web - Inspection likely but routine';
        }
    } else {
        declarationStatus = 'exempt';
        declarationGuidance = 'Check "No" - Personal use exemption applies';
    }
    
    return {
        status: guidance.status, // Original CSV status (for drug classification)
        declarationStatus: declarationStatus, // VJW declaration category
        declarationGuidance: declarationGuidance, // User guidance text
        medication: medicationName,
        totalQuantity: totalMg,
        // Individual calculation inputs for permit wizard auto-population
        strengthMg: strengthMg,
        tablets: tablets,
        days: days,
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
        dailyDose: days ? tablets.toFixed(1) : null
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
        controlled_count: declarations.filter(d => d.status === 'controlled').length,
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
            controlled: 0,
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
        } else if (guidance.status === 'controlled') {
            plan.summary.controlled++;
        } else if (guidance.status === 'permitted') {
            plan.summary.permitted++;
        }
        
        if (guidance.status === 'controlled' || guidance.customsDeclaration.includes('Answer "Yes"')) {
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

        <div class="category-card category-controlled">
            <h3>Controlled (${uniqueMeds.controlled.length})</h3>
            <p>Requires permits or customs declaration</p>
            <div class="med-buttons">
                ${uniqueMeds.controlled.map(med => 
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
        controlled: [],
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
        <div class="medication-card">
            <div class="handy-guide">
                <div class="guide-header">
                    <div class="medication-title">
                        <h2 class="medication-name">${medication.name}</h2>
                        <div class="medication-generic">${medication.genericName || ''}</div>
                        <div class="medication-status">${getCleanStatusText(medication.status)}</div>
                    </div>
                </div>
                
                <!-- What You Need to Do -->
                <div class="action-steps">
                    <div class="action-title">What You Need to Do</div>
                    <ul class="step-list">
                        ${generateCleanActionSteps(medication)}
                    </ul>
                </div>
                
                <!-- Key Information -->
                <div class="medication-info">
                    ${generateCleanKeyInfo(medication)}
                </div>
                
                <!-- Interactive Tool Section -->
                ${generateToolSection(medication, detectThresholdType(medication), uniqueId)}
            </div>
        </div>
    `;
}

// Helper function to detect threshold type
function detectThresholdType(medication) {
    const desc = medication.thresholdDescription.toLowerCase();
    if (desc.includes('mg') || desc.includes('gram')) {
        return 'quantity';
    } else if (desc.includes('unit') || desc.includes('device')) {
        return 'units';
    } else if (desc.includes('month') || desc.includes('supply') || desc.includes('day')) {
        return 'duration';
    }
    return 'quantity'; // default fallback
}

// Generate appropriate tool section based on threshold type
function generateToolSection(medication, thresholdType, uniqueId) {
    // Prohibited medications don't need calculators - the answer is always "cannot enter"
    if (medication.status === 'prohibited') {
        return '';
    }
    
    switch(thresholdType) {
        case 'quantity':
            return `
                <div class="tool-section" id="${uniqueId}">
                    <h4>Calculate Your Total Quantity</h4>
                    <div class="calculator-inputs">
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
                    <div class="immediate-result" style="display: none;"></div>
                    <div class="calculation-result" style="display: none;"></div>
                    <div class="permit-options" style="display: none;"></div>
                </div>
            `;
        case 'units':
            return `
                <div class="tool-section" id="${uniqueId}">
                    <h4>How Many Units Are You Bringing?</h4>
                    <div class="unit-counter">
                        <input type="number" class="unit-count" min="1" placeholder="Number of units" oninput="calculateUnitsForCard('${medication.name}', '${uniqueId}')">
                        <span class="unit-label">units</span>
                    </div>
                    <div class="immediate-result" style="display: none;"></div>
                    <div class="calculation-result" style="display: none;"></div>
                    <div class="permit-options" style="display: none;"></div>
                </div>
            `;
        case 'duration':
            return `
                <div class="tool-section" id="${uniqueId}">
                    <h4>Select Your Scenario</h4>
                    <div class="scenario-buttons">
                        <button class="scenario-btn" onclick="selectScenario('${medication.name}', '${uniqueId}', 'under')">
                            Up to 1-month supply
                        </button>
                        <button class="scenario-btn" onclick="selectScenario('${medication.name}', '${uniqueId}', 'over')">
                            More than 1-month supply
                        </button>
                    </div>
                    <div class="immediate-result" style="display: none;"></div>
                    <div class="calculation-result" style="display: none;"></div>
                    <div class="permit-options" style="display: none;"></div>
                </div>
            `;
        default:
            return '';
    }
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
    
}

function openPermitWizard(medicationName, itemId = null, calculatedResults = null) {
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
        passedAt: Date.now(),
        
        // Pre-calculated quantity data if available
        preCalculated: calculatedResults
    };
    
    // Store data for permit wizard to consume
    try {
        sessionStorage.setItem('permitMedicationData', JSON.stringify(permitData));
        
        // Also store all medications for threshold matching
        sessionStorage.setItem('allMedicationsData', JSON.stringify(window.medications));
        
        // Launch permit wizard
        window.open('permit-wizard.html', '_blank');
        
    } catch (error) {
        console.error('Failed to pass medication data to permit wizard:', error);
        alert('Unable to launch permit wizard. Please try again.');
    }
}

function addToTripPlanner(medicationName) {
    // Add medication to trip planner
    // This will be implemented when we build the trip planner UI
}

// ===== UNIFIED CARD CALCULATOR =====
function calculateForCard(medicationName, calculatorId) {
    const calculator = document.getElementById(calculatorId);
    const strength = parseFloat(calculator.querySelector('.calc-strength').value);
    const tablets = parseInt(calculator.querySelector('.calc-tablets').value);
    const days = parseInt(calculator.querySelector('.calc-days').value);

    if (!strength || !tablets || !days) {
        calculator.querySelector('.immediate-result').style.display = 'none';
        calculator.querySelector('.calculation-result').style.display = 'none';
        calculator.querySelector('.permit-options').style.display = 'none';
        // Reset status display
        const card = calculator.closest('.medication-card');
        const statusElement = card.querySelector('.medication-status');
        const medName = card.querySelector('.medication-name').textContent;
        const medication = window.medications?.find(m => m.name === medName);
        if (statusElement && medication) {
            statusElement.textContent = getCleanStatusText(medication.status);
        }
        return;
    }

    // Use comprehensive calculator
    const results = calculateMedicationStatus(medicationName, strength, tablets, days);
    
    // Update status display to show user's situation
    const card = calculator.closest('.medication-card');
    const statusElement = card.querySelector('.medication-status');
    
    // Show what the user actually needs to do
    if (results.status === 'prohibited') {
        statusElement.textContent = 'Import Prohibited';
    } else if (results.permitRequired) {
        statusElement.textContent = 'Import Permit Required';
    } else if (results.status === 'controlled' || results.declarationStatus === 'declaration_required') {
        statusElement.textContent = 'Declaration Required';
    } else {
        statusElement.textContent = 'No Declaration Needed';
    }
    
    // Show immediate progress feedback right after calculator
    const immediateResultDiv = calculator.querySelector('.immediate-result');
    if (immediateResultDiv) {
        immediateResultDiv.innerHTML = generateImmediateProgressFeedback(results);
        immediateResultDiv.style.display = 'block';
    }
    
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

// ===== UNITS CALCULATOR =====
function calculateUnitsForCard(medicationName, calculatorId) {
    const calculator = document.getElementById(calculatorId);
    const units = parseInt(calculator.querySelector('.unit-count').value);

    if (!units || units < 1) {
        calculator.querySelector('.immediate-result').style.display = 'none';
        calculator.querySelector('.calculation-result').style.display = 'none';
        calculator.querySelector('.permit-options').style.display = 'none';
        return;
    }

    // Find the appropriate CSV row based on unit count
    const guidance = findMedicationGuidanceByUnits(medicationName, units);
    if (!guidance) return;

    const results = {
        status: guidance.status,
        declarationStatus: (guidance.status === 'controlled' || guidance.customsDeclaration.includes('Answer "Yes"')) ? 'declaration_required' : 'exempt',
        declarationGuidance: (guidance.status === 'controlled' || guidance.customsDeclaration.includes('Answer "Yes"')) ? 
            `Check "Yes" on Visit Japan Web - Inspection likely but routine` :
            `Check "No" - Personal use exemption applies`,
        medication: medicationName,
        totalQuantity: `${units} units`,
        threshold: guidance.thresholdNumeric,
        thresholdDescription: guidance.thresholdDescription,
        withinLimit: units <= guidance.thresholdNumeric,
        actionRequired: guidance.actionRequired,
        customsDeclaration: guidance.customsDeclaration,
        channelRequired: guidance.channelRequired,
        permitRequired: guidance.processingDaysMin > 0,
        processingTime: guidance.processingDaysMin > 0 ? 
            `${guidance.processingDaysMin}-${guidance.processingDaysMax} days` : 'No permit needed',
        processingDaysMin: guidance.processingDaysMin,
        processingDaysMax: guidance.processingDaysMax,
        documentationNeeded: guidance.documentationNeeded,
        reasoning: guidance.reasonForClassification
    };
    
    // Show immediate progress feedback right after calculator
    const immediateResultDiv = calculator.querySelector('.immediate-result');
    if (immediateResultDiv) {
        immediateResultDiv.innerHTML = generateImmediateProgressFeedback(results);
        immediateResultDiv.style.display = 'block';
    }

    // Display results
    const resultDiv = calculator.querySelector('.calculation-result');
    resultDiv.innerHTML = generateCalculatorResultsHTML(results);
    resultDiv.style.display = 'block';
    
    const optionsDiv = calculator.querySelector('.permit-options');
    optionsDiv.innerHTML = generatePermitOptionsHTML(results);
    optionsDiv.style.display = 'block';
}

// ===== SCENARIO SELECTOR =====
function selectScenario(medicationName, calculatorId, scenario) {
    const calculator = document.getElementById(calculatorId);
    
    // Find the appropriate CSV row based on scenario
    const guidance = findMedicationGuidanceByScenario(medicationName, scenario);
    if (!guidance) return;

    const results = {
        status: guidance.status,
        declarationStatus: (guidance.status === 'controlled' || guidance.customsDeclaration.includes('Answer "Yes"')) ? 'declaration_required' : 'exempt',
        declarationGuidance: (guidance.status === 'controlled' || guidance.customsDeclaration.includes('Answer "Yes"')) ? 
            `Check "Yes" on Visit Japan Web - Inspection likely but routine` :
            `Check "No" - Personal use exemption applies`,
        medication: medicationName,
        totalQuantity: guidance.thresholdDescription,
        threshold: guidance.thresholdNumeric,
        thresholdDescription: guidance.thresholdDescription,
        withinLimit: scenario === 'under',
        actionRequired: guidance.actionRequired,
        customsDeclaration: guidance.customsDeclaration,
        channelRequired: guidance.channelRequired,
        permitRequired: guidance.processingDaysMin > 0,
        processingTime: guidance.processingDaysMin > 0 ? 
            `${guidance.processingDaysMin}-${guidance.processingDaysMax} days` : 'No permit needed',
        processingDaysMin: guidance.processingDaysMin,
        processingDaysMax: guidance.processingDaysMax,
        documentationNeeded: guidance.documentationNeeded,
        reasoning: guidance.reasonForClassification
    };

    // Highlight selected scenario
    calculator.querySelectorAll('.scenario-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');

    // Display results
    const resultDiv = calculator.querySelector('.calculation-result');
    resultDiv.innerHTML = generateCalculatorResultsHTML(results);
    resultDiv.style.display = 'block';
    
    const optionsDiv = calculator.querySelector('.permit-options');
    optionsDiv.innerHTML = generatePermitOptionsHTML(results);
    optionsDiv.style.display = 'block';
}

// Helper functions for finding CSV data
function findMedicationGuidanceByUnits(medicationName, units) {
    const medicationRows = window.medications.filter(med => 
        med.name.toLowerCase().includes(medicationName.toLowerCase())
    );
    
    // Find appropriate row based on units
    return medicationRows.find(row => 
        units <= (row.thresholdNumeric || Infinity)
    ) || medicationRows[medicationRows.length - 1];
}

function findMedicationGuidanceByScenario(medicationName, scenario) {
    const medicationRows = window.medications.filter(med => 
        med.name.toLowerCase().includes(medicationName.toLowerCase())
    );
    
    // Find row based on scenario (under/over threshold)
    if (scenario === 'under') {
        return medicationRows.find(row => 
            row.thresholdDescription.toLowerCase().includes('up to') ||
            row.thresholdDescription.toLowerCase().includes('below')
        );
    } else {
        return medicationRows.find(row => 
            row.thresholdDescription.toLowerCase().includes('more than') ||
            row.thresholdDescription.toLowerCase().includes('above') ||
            row.thresholdDescription.toLowerCase().includes('exceeds')
        );
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
    
    // Determine most important status to highlight
    const isPermanentlyProhibited = results.status === 'prohibited';
    const needsPermit = results.permitRequired;
    
    let primaryStatus, primaryColor, primaryMessage;
    
    if (isPermanentlyProhibited) {
        primaryStatus = "PROHIBITED";
        primaryColor = "#dc3545";
        primaryMessage = "Cannot import to Japan";
    } else if (needsPermit) {
        primaryStatus = "IMPORT CONFIRMATION CERTIFICATE REQUIRED";
        primaryColor = "#dc3545";
        primaryMessage = "Apply 2-4 weeks before travel";
    } else {
        primaryStatus = "NO IMPORT CONFIRMATION CERTIFICATE REQUIRED";
        primaryColor = "#28a745";
        primaryMessage = "Personal use exemption applies";
    }
    
    return `
        <div style="background: white; padding: 25px; border-radius: 8px; border: 2px solid ${primaryColor}; margin: 20px 0;">
            <!-- 1. Status Summary -->
            <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #e9ecef;">
                <h3 style="margin: 0 0 10px 0; font-size: 1.4rem; color: ${primaryColor}; font-weight: 600;">
                    ${primaryStatus}
                </h3>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">
                    Your calculation: ${results.totalQuantity}mg total for ${results.tripDays || results.days || 'trip'}-day trip
                </p>
                <p style="margin: 8px 0 0 0; color: #5a5a5a; font-size: 14px; font-weight: 500;">
                    ${primaryMessage}
                </p>
            </div>
            
            <!-- 2. Your Action Plan -->
            <div style="margin-bottom: 25px;">
                <h4 style="margin: 0 0 15px 0; font-size: 1.1rem; color: #2c3e50; font-weight: 600;">Your Action Plan</h4>
                <div style="color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    ${generateStreamlinedActionPlan(results)}
                </div>
            </div>
            
            <!-- 3. Key Information -->
            <div style="margin-bottom: 25px;">
                <h4 style="margin: 0 0 15px 0; font-size: 1.1rem; color: #2c3e50; font-weight: 600;">Key Information</h4>
                <div style="background: #f8f9fa; padding: 18px; border-radius: 6px; color: #5a5a5a; font-size: 14px; line-height: 1.6;">
                    ${generateKeyInformation(results)}
                </div>
            </div>
            
            <!-- 4. Classification Logic -->
            <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; font-size: 1.0rem; color: #6c757d; font-weight: 500;">Classification Logic</h4>
                <p style="margin: 0; color: #6c757d; font-size: 13px; line-height: 1.5;">
                    <strong>Matched Rule:</strong> "${results.thresholdDescription}" → ${results.permitRequired ? 'Import Certificate required' : 'Personal use exemption'}<br>
                    <strong>Reasoning:</strong> ${results.reasoning}
                </p>
            </div>
            
            <!-- 5. Official Source Citation -->
            ${results.officialSource ? `
                <div style="border-top: 1px solid #e9ecef; padding-top: 15px;">
                    <h4 style="margin: 0 0 8px 0; font-size: 0.9rem; color: #6c757d; font-weight: 500;">Official Source</h4>
                    <p style="margin: 0; color: #6c757d; font-size: 12px; line-height: 1.4;">
                        <a href="${results.officialSource}" target="_blank" style="color: #007bff; text-decoration: none;">
                            ${getSourceDisplayName(results.officialSource)}
                        </a>
                        <span style="color: #9ca3af; margin-left: 8px;">• Japanese Ministry of Health, Labour and Welfare</span>
                    </p>
                </div>
            ` : ''}
        </div>
    `;
}

// Helper function for streamlined action plan
function generateStreamlinedActionPlan(results) {
    if (results.status === 'prohibited') {
        return `
            <div style="color: #dc3545; font-weight: 500;">
                ⚠️ Do not bring to Japan - possession is illegal
            </div>
        `;
    }
    
    let steps = [];
    
    if (results.permitRequired) {
        steps.push("1. <strong>Apply for Import Confirmation Certificate</strong> (2-4 weeks before travel)");
        steps.push("2. <strong>Answer \"Yes\"</strong> to controlled substances questions on Visit Japan Web");
        steps.push("3. <strong>Bring Certificate and prescription</strong> to customs inspection");
        steps.push("4. <strong>Keep medication</strong> in original packaging with labels");
    } else if (results.status === 'controlled' || results.declarationStatus === 'declaration_required') {
        steps.push("1. <strong>Answer \"Yes\"</strong> to controlled substances questions on Visit Japan Web");
        steps.push("2. <strong>Bring prescription</strong> to customs inspection");
        steps.push("3. <strong>Keep medication</strong> in original packaging with labels");
    } else {
        steps.push("1. <strong>Keep medication</strong> in original packaging with labels");
        steps.push("2. <strong>Proceed through standard customs</strong> - no special declaration needed");
    }
    
    return steps.join("<br>");
}

// Helper function for displaying source names
function getSourceDisplayName(url) {
    if (!url) return 'Official Source';
    
    if (url.includes('mhlw.go.jp')) {
        if (url.includes('pharmaceuticals/dl/qa')) {
            return 'MHLW Import Guidelines (PDF)';
        } else if (url.includes('pharmaceuticals/01.html')) {
            return 'MHLW Pharmaceutical Import Regulations';
        } else if (url.includes('ncd.mhlw.go.jp') && url.includes('total.pdf')) {
            return 'MHLW Controlled Substances List (PDF)';
        } else {
            return 'MHLW Official Documentation';
        }
    }
    
    // For other sources, try to extract a readable name
    try {
        const domain = new URL(url).hostname;
        return domain.replace('www.', '').toUpperCase();
    } catch {
        return 'Official Source';
    }
}

// Helper function for immediate progress feedback (shown right after calculator)
function generateImmediateProgressFeedback(results) {
    // Skip for prohibited medications
    if (results.status === 'prohibited') {
        return `
            <div style="background: rgba(220, 53, 69, 0.1); border: 1px solid rgba(220, 53, 69, 0.3); border-radius: 8px; padding: 16px; margin: 15px 0;">
                <div style="color: #dc3545; font-weight: 600; text-align: center;">
                    ⚠️ This medication cannot be imported to Japan
                </div>
            </div>
        `;
    }
    
    return `
        <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 16px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            ${generateElegantProgressBar(results)}
        </div>
    `;
}

// Helper function for elegant progress bar visualization
function generateElegantProgressBar(results) {
    // Skip progress bar for prohibited or zero-threshold medications
    if (results.status === 'prohibited' || results.threshold <= 0) {
        return `<div style="margin: 8px 0; color: #6c757d; font-size: 13px;">Your quantity: ${results.totalQuantity}</div>`;
    }
    
    // Parse user quantity - handle mg, units, gm, etc.
    const totalQuantityStr = results.totalQuantity.toString();
    let userQuantityNumeric = 0;
    let displayUnit = '';
    
    if (totalQuantityStr.includes('mg')) {
        userQuantityNumeric = parseFloat(totalQuantityStr.replace('mg', ''));
        displayUnit = 'mg';
    } else if (totalQuantityStr.includes('units')) {
        userQuantityNumeric = parseFloat(totalQuantityStr.replace('units', '').trim());
        displayUnit = 'units';
    } else if (totalQuantityStr.includes('gm') || totalQuantityStr.includes('g')) {
        // Convert grams to mg for comparison with threshold
        userQuantityNumeric = parseFloat(totalQuantityStr.replace(/gm?/g, '')) * 1000;
        displayUnit = totalQuantityStr.includes('gm') ? 'gm' : 'g';
    } else {
        // Fallback - assume it's a numeric value, try to parse
        userQuantityNumeric = parseFloat(totalQuantityStr) || 0;
        displayUnit = '';
    }
    
    // Calculate percentage of threshold limit
    const thresholdNumeric = results.threshold;
    const percentage = Math.min((userQuantityNumeric / thresholdNumeric) * 100, 100);
    
    // Elegant muted color scheme based on risk level
    let progressColor, backgroundColor, textColor, statusText;
    
    if (percentage <= 50) {
        // Safe zone - muted green
        progressColor = '#28a745';
        backgroundColor = 'rgba(40, 167, 69, 0.1)';
        textColor = '#28a745';
        statusText = 'Well within limit';
    } else if (percentage <= 85) {
        // Caution zone - muted amber
        progressColor = '#ffc107';
        backgroundColor = 'rgba(255, 193, 7, 0.1)';
        textColor = '#856404';
        statusText = 'Approaching limit';
    } else {
        // Warning zone - muted red
        progressColor = '#dc3545';
        backgroundColor = 'rgba(220, 53, 69, 0.1)';
        textColor = '#dc3545';
        statusText = 'Near threshold';
    }
    
    // Format threshold display to match user's input units (avoid forcing metric conversions)
    let thresholdDisplay;
    if (displayUnit === 'units') {
        // Devices stay in units
        thresholdDisplay = `${thresholdNumeric} units`;
    } else if (displayUnit === 'gm') {
        // User entered grams, show threshold in grams (no mg conversion needed)
        thresholdDisplay = `${(thresholdNumeric/1000).toFixed(1)}gm`;
    } else if (displayUnit === 'g') {
        // User entered grams, show threshold in grams
        thresholdDisplay = `${(thresholdNumeric/1000).toFixed(1)}g`;
    } else {
        // User entered mg, show in mg (avoid forcing them to think in grams)
        thresholdDisplay = `${thresholdNumeric}mg`;
    }
    
    return `
        <div style="margin: 12px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 13px; color: #6c757d;">Your quantity: ${results.totalQuantity}</span>
                <span style="font-size: 12px; color: ${textColor}; font-weight: 500;">${statusText}</span>
            </div>
            <div style="background: ${backgroundColor}; border: 1px solid rgba(${hexToRgb(progressColor)}, 0.2); border-radius: 8px; height: 8px; overflow: hidden;">
                <div style="background: ${progressColor}; height: 100%; width: ${percentage}%; border-radius: 8px; transition: width 0.4s ease;"></div>
            </div>
            <div style="text-align: right; margin-top: 4px;">
                <span style="font-size: 11px; color: #9ca3af;">${percentage.toFixed(0)}% of ${thresholdDisplay} limit</span>
            </div>
        </div>
    `;
}

// Helper function to convert hex to rgb for alpha blending
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '0, 0, 0';
}

// Helper function for key information section
function generateKeyInformation(results) {
    const threshold = results.threshold > 0 ? 
        `${results.threshold >= 1000 ? (results.threshold / 1000) + 'g' : results.threshold + 'mg'}` : 
        'No exemption limit';
    
    const processingTime = results.permitRequired ? 
        '2-4 weeks for certificate' : 
        'No permit needed';
    
    const importStatus = results.permitRequired ? 
        'Import Certificate required' : 
        results.status === 'controlled' ? 'Declaration required' : 'Standard import';
    
    return `
        <strong>Personal Use Limit:</strong> ${threshold}<br>
        <strong>Processing Timeline:</strong> ${processingTime}<br>
        <strong>Import Status:</strong> ${importStatus}
    `;
}

function generateNextSteps(results) {
    if (results.status === 'prohibited') {
        return "Do not bring to Japan - possession is illegal";
    }
    
    let steps = [];
    
    if (results.permitRequired) {
        steps.push("1. Apply for Import Confirmation Certificate (apply 2-4 weeks before travel)");
        steps.push("2. Answer \"Yes\" to controlled substances questions on Visit Japan Web - system will route you for inspection");
        steps.push("3. Be prepared for customs inspection with Import Confirmation Certificate and prescription");
    } else if (results.status === 'controlled' || results.declarationStatus === 'declaration_required') {
        steps.push("1. Answer \"Yes\" to controlled substances questions on Visit Japan Web - system will route you for inspection");
        steps.push("2. Be prepared for customs inspection with prescription");
    } else {
        steps.push("1. Bring medication in original packaging with labels");
        steps.push("2. Proceed through standard customs - no special declaration needed");
    }
    
    return steps.join("<br>");
}

function generatePermitOptionsHTML(results) {
    return `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                ${results.permitRequired ? 
                    `<button onclick="openPermitWizard('${results.medication}', null, ${JSON.stringify(results).replace(/"/g, '&quot;')})" 
                            style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                        Import Confirmation Certificate Application
                    </button>` 
                    : ''}
                ${results.declarationStatus !== 'prohibited' ?
                    `<button onclick="generateTravelLetter('${results.medication}', ${JSON.stringify(results).replace(/"/g, '&quot;')})" 
                            style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                        Travel Documentation
                    </button>` 
                    : ''}
                <button onclick="addToTripPlanner('${results.medication}')" 
                        style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    Add to Trip Planner
                </button>
            </div>
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
window.calculateUnitsForCard = calculateUnitsForCard;
window.selectScenario = selectScenario;
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
        background: #007bff;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
    }
    
    .status-badge.permit-required {
        background: #dc3545;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
    }
    
    .status-badge.declaration-only {
        background: #28a745;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
    }
    
    .status-badge.no-declaration {
        background: #6f42c1;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: bold;
    }
    
    /* Three-Category Declaration Status Styling */
    .declaration-status-exempt {
        background: rgba(40, 167, 69, 0.1);
        color: #28a745;
        border: 1px solid rgba(40, 167, 69, 0.2);
    }
    
    .declaration-status-required {
        background: transparent;
        color: #007bff;
        border: 1px solid #007bff;
    }
    
    .declaration-status-prohibited {
        background: rgba(220, 53, 69, 0.1);
        color: #dc3545;
        border: 1px solid rgba(220, 53, 69, 0.2);
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
    
    /* Information-First Card Design */
    .medication-info {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 6px;
        margin: 15px 0;
        border: 1px solid #dee2e6;
    }
    
    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 15px;
    }
    
    .info-item {
        font-size: 14px;
        line-height: 1.4;
    }
    
    .info-item strong {
        color: #495057;
        display: block;
        margin-bottom: 2px;
    }
    
    .reasoning-section {
        padding-top: 15px;
        border-top: 1px solid #dee2e6;
        margin-top: 15px;
    }
    
    .reasoning-section p {
        margin: 0;
        font-size: 14px;
        color: #6c757d;
        font-style: italic;
    }
    
    /* Tool Section Styling */
    .tool-section {
        background: white;
        padding: 20px;
        border-radius: 6px;
        margin: 15px 0;
        border: 2px solid #e9ecef;
    }
    
    .tool-section h4 {
        margin: 0 0 15px 0;
        color: #495057;
        font-size: 1.1rem;
    }
    
    /* Unit Counter */
    .unit-counter {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
    }
    
    .unit-count {
        width: 120px;
        padding: 10px 12px;
        border: 2px solid #dee2e6;
        border-radius: 6px;
        font-size: 16px;
        text-align: center;
    }
    
    .unit-label {
        font-weight: 500;
        color: #6c757d;
    }
    
    /* Scenario Buttons */
    .scenario-buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 15px;
    }
    
    .scenario-btn {
        padding: 12px 20px;
        border: 2px solid #dee2e6;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
        flex: 1;
        min-width: 200px;
    }
    
    .scenario-btn:hover {
        border-color: #007bff;
        background: #f8f9fa;
    }
    
    .scenario-btn.selected {
        border-color: #007bff;
        background: #e3f2fd;
        color: #1565c0;
        font-weight: 500;
    }
    
    /* Source Citation */
    .source-citation {
        margin-top: 15px;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 4px;
        font-size: 12px;
        color: #495057;
        border-left: 3px solid #007bff;
    }
    
    .source-citation a {
        color: #007bff;
        text-decoration: none;
    }
    
    .source-citation a:hover {
        text-decoration: underline;
    }
    
    @media (max-width: 768px) {
        .info-grid {
            grid-template-columns: 1fr;
            gap: 10px;
        }
        
        .scenario-buttons {
            flex-direction: column;
        }
        
        .scenario-btn {
            min-width: auto;
        }
    }
`;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Add enhanced CSS
    const style = document.createElement('style');
    style.textContent = enhancedCSS;
    document.head.appendChild(style);
    
    // System ready - all medication tools loaded
    if (window.medications) {
        // Database loaded successfully
    }
});