// ===== ENHANCED SEARCH WITH AUTOCOMPLETE =====
function searchMedications(query) {
    if (!query || query.length < 1) return [];
    
    const queryLower = query.toLowerCase();
    
    // Exact matches first
    const exactMatches = medications.filter(med => 
        med.name.toLowerCase().includes(queryLower) ||
        med.genericName.toLowerCase().includes(queryLower)
    );
    
    // Then search terms matches
    const searchTermMatches = medications.filter(med => 
        !exactMatches.includes(med) &&
        med.searchTerms.some(term => term.includes(queryLower))
    );
    
    // Then category matches
    const categoryMatches = medications.filter(med => 
        !exactMatches.includes(med) && 
        !searchTermMatches.includes(med) &&
        med.category.toLowerCase().includes(queryLower)
    );
    
    return [...exactMatches, ...searchTermMatches, ...categoryMatches].slice(0, 8);
}

// ===== CORE LOOKUP ENGINE =====
function findMedicationGuidance(medicationName, userQuantityMg = null) {
    if (!medications || medications.length === 0) return null;
    
    // Find all rows for this medication
    const medicationRows = medications.filter(med => 
        med.name.toLowerCase().includes(medicationName.toLowerCase()) ||
        med.genericName.toLowerCase().includes(medicationName.toLowerCase()) ||
        med.searchTerms.some(term => term.includes(medicationName.toLowerCase()))
    );
    
    if (medicationRows.length === 0) return null;
    if (userQuantityMg === null) return medicationRows[0];
    
    // Find the right threshold scenario - THIS IS THE KEY BREAKTHROUGH
    const matchingRow = medicationRows.find(row => 
        userQuantityMg <= (row.thresholdNumeric || Infinity)
    );
    
    return matchingRow || medicationRows[medicationRows.length - 1];
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

    const totalMg = strength * tablets;
    const dailyDose = (strength * tablets) / days;
    
    // Use our new simplified lookup
    const guidance = findMedicationGuidance(medName, totalMg);
    
    if (!guidance) {
        console.log('No guidance found for:', medName);
        return;
    }

    const resultDiv = calculator.querySelector('.calculation-result');
    const withinLimit = totalMg <= (guidance.thresholdNumeric || Infinity);
    const threshold = guidance.thresholdNumeric || 0;
    
    // Enhanced result display with our new data structure
    resultDiv.innerHTML = `
        <div style="background: ${withinLimit ? '#d4edda' : '#f8d7da'}; color: ${withinLimit ? '#155724' : '#721c24'}; padding: 15px; border-radius: 6px; margin: 10px 0;">
            <h5 style="margin: 0 0 10px 0;">${getStatusIcon(guidance.status)} ${guidance.status.toUpperCase()}</h5>
            <p style="margin: 5px 0;"><strong>Your Quantity:</strong> ${totalMg}mg total (${dailyDose.toFixed(1)}mg daily)</p>
            <p style="margin: 5px 0;"><strong>Threshold:</strong> ${guidance.thresholdDescription}</p>
            <p style="margin: 5px 0;"><strong>Action Required:</strong> ${guidance.actionRequired}</p>
            <p style="margin: 5px 0;"><strong>Customs Channel:</strong> ${guidance.channelRequired}</p>
            ${guidance.processingDaysMin > 0 ? 
                `<p style="margin: 5px 0;"><strong>Processing Time:</strong> ${guidance.processingDaysMin}-${guidance.processingDaysMax} days</p>` : 
                ''
            }
            <p style="margin: 10px 0 0 0; font-size: 14px; font-style: italic;">${guidance.reasonForClassification}</p>
        </div>
    `;
    
    resultDiv.style.display = 'block';
    
    // Show enhanced permit options using our new structure
    showEnhancedPermitOptions(calculator, withinLimit, guidance, medName, genericName, {
        strength, tablets, days, totalMg, dailyDose
    });
}

function showEnhancedPermitOptions(calculator, withinLimit, guidance, medName, genericName, quantityData) {
    const optionsDiv = calculator.querySelector('.permit-options');
    
    if (guidance.status === 'prohibited') {
        optionsDiv.innerHTML = `
            <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; margin: 10px 0;">
                <h5 style="margin: 0 0 10px 0;">🚫 Cannot Enter Japan</h5>
                <p>This medication is completely prohibited. Consider alternatives before travel.</p>
            </div>
        `;
    } else if (guidance.processingDaysMin > 0) {
        optionsDiv.innerHTML = `
            <div style="background: #fff3cd; color: #856404; padding: 15px; border-radius: 6px; margin: 10px 0;">
                <h5 style="margin: 0 0 10px 0;">📋 Import Permit Required</h5>
                <p><strong>Processing Time:</strong> ${guidance.processingDaysMin}-${guidance.processingDaysMax} days</p>
                <p><strong>Documentation:</strong> ${guidance.documentationNeeded}</p>
                <button onclick="generatePermitLetter('${medName}', ${JSON.stringify(quantityData).replace(/"/g, '&quot;')})" 
                        style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                    Generate Application Letter
                </button>
            </div>
        `;
    } else {
        optionsDiv.innerHTML = `
            <div style="background: #d4edda; color: #155724; padding: 15px; border-radius: 6px; margin: 10px 0;">
                <h5 style="margin: 0 0 10px 0;">✅ Travel Letter Recommended</h5>
                <p>No permit required, but bring documentation for customs.</p>
                <button onclick="generateTravelLetter('${medName}', ${JSON.stringify(quantityData).replace(/"/g, '&quot;')})" 
                        style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-top: 10px;">
                    Generate Travel Letter
                </button>
            </div>
        `;
    }
    
    optionsDiv.style.display = 'block';
}

// ===== DISPLAY CALCULATOR RESULTS =====
function displayCalculatorResults(results) {
    console.log('Calculator results:', results);
    
    // Example integration with your existing UI:
    const resultsContainer = document.querySelector('.calculation-result') || 
                           document.getElementById('calculatorResults') ||
                           document.createElement('div');
    
    if (!resultsContainer.parentNode) {
        resultsContainer.id = 'calculatorResults';
        resultsContainer.className = 'calculation-result';
        document.getElementById('searchResults').appendChild(resultsContainer);
    }
    
    if (results.status === 'not_found') {
        resultsContainer.innerHTML = `
            <div class="result-card not-found">
                <h3>⚠️ Medication Not Found</h3>
                <p>${results.message}</p>
            </div>
        `;
        return;
    }
    
    resultsContainer.innerHTML = `
        <div class="result-card ${results.status}">
            <h3>📊 Calculation Results: ${results.medication}</h3>
            <div class="result-details">
                <p><strong>Total Quantity:</strong> ${results.totalQuantity}mg</p>
                <p><strong>Status:</strong> <span class="status-badge ${results.status}">${results.status.toUpperCase()}</span></p>
                <p><strong>Action Required:</strong> ${results.actionRequired}</p>
                <p><strong>Customs Channel:</strong> ${results.channelRequired}</p>
                ${results.permitRequired ? 
                    `<p><strong>Permit Processing Time:</strong> ${results.processingTime}</p>` : 
                    '<p><strong>Permit:</strong> Not required</p>'
                }
                <p><strong>Reasoning:</strong> ${results.reasoning}</p>
            </div>
        </div>
    `;
}

// Enhanced search with auto-population
function handleMedicationSearch() {
    const searchInput = document.getElementById('medicationSearch');
    const query = searchInput.value;
    
    // Auto-populate calculator field (THIS IS THE KEY UX IMPROVEMENT)
    // No additional clicks needed - typing in search auto-fills calculator
    
    // Search and display results
    const results = searchMedications(query);
    displaySearchResults(results);
}

function displaySearchResults(results) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    
    if (results.length === 0) {
        container.innerHTML = '<div class="no-results"><p>No medications found. Try a different search term.</p></div>';
        return;
    }
    
    container.innerHTML = results.map(med => `
        <div class="medication-card status-${med.status}" onclick="selectMedication('${med.name}')">
            <div class="medication-header">
                <h3>${med.name}</h3>
                <div class="medication-generic">${med.genericName || ''}</div>
                <span class="status-badge ${med.status}">${getStatusIcon(med.status)} ${med.status.toUpperCase()}</span>
            </div>
            <div class="medication-details">
                <p><strong>Threshold:</strong> ${med.thresholdDescription}</p>
                <p><strong>Action:</strong> ${med.actionRequired}</p>
                <p><strong>Channel:</strong> ${med.channelRequired}</p>
                ${med.reasonForClassification ? `<p><strong>Why:</strong> ${med.reasonForClassification}</p>` : ''}
            </div>
        </div>
    `).join('');
}

function selectMedication(medicationName) {
    // Auto-populate search field
    document.getElementById('medicationSearch').value = medicationName;
    
    // If calculator fields exist, trigger calculation
    if (document.getElementById('strength') && document.getElementById('tabletCount')) {
        // Focus on first empty calculator field
        const strength = document.getElementById('strength');
        const tabletCount = document.getElementById('tabletCount');
        
        if (!strength.value) {
            strength.focus();
        } else if (!tabletCount.value) {
            tabletCount.focus();
        } else {
            calculateQuantity();
        }
    }
}

function getStatusIcon(status) {
    switch(status) {
        case 'prohibited': return '🔴';
        case 'restricted': return '🟡';
        case 'permitted': return '🟢';
        default: return '❓';
    }
}

// Replace the old searchMedications function
function enhancedSearchMedications() {
    handleMedicationSearch();
}

// Add CSS for calculator results
const calculatorCSS = `
    .calculation-result {
        margin-top: 20px;
    }
    
    .result-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        border-left: 4px solid #ddd;
    }
    
    .result-card.prohibited {
        border-left-color: #dc3545;
        background: #fdf2f2;
    }
    
    .result-card.restricted {
        border-left-color: #ffc107;
        background: #fffdf5;
    }
    
    .result-card.permitted {
        border-left-color: #28a745;
        background: #f8fbf8;
    }
    
    .result-card.not-found {
        border-left-color: #6c757d;
        background: #f8f9fa;
    }
    
    .result-details p {
        margin: 8px 0;
    }
    
    .medication-card {
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .medication-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0,0,0,0.15);
    }
`;

// ===== LETTER GENERATION PLACEHOLDERS =====
function generatePermitLetter(medName, quantityData) {
    alert(`Permit Application Letter for ${medName}\n\nThis feature will generate a formal application letter with:\n- Medical necessity statement\n- Quantity justification\n- Doctor contact information\n- Travel itinerary requirements\n\nComing soon!`);
}

function generateTravelLetter(medName, quantityData) {
    alert(`Travel Documentation Letter for ${medName}\n\nThis feature will generate:\n- Customs declaration letter\n- Medication details summary\n- Legal basis statement\n- Contact information\n\nComing soon!`);
}

// Add CSS when page loads
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = calculatorCSS;
    document.head.appendChild(style);
});