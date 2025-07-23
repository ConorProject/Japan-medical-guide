// ============================================================================
// Enhanced Search Functions for Japan Medical Guide
// Compatible with new CSV-derived JSON structure
// ============================================================================

// Enhanced Search with Autocomplete and Spell Check
function enhancedSearchMedications() {
    const searchTerm = document.getElementById('medicationSearch').value.toLowerCase().trim();
    const resultsGrid = document.getElementById('searchResults');
    const categoryOverview = document.getElementById('categoryOverview');
    const noResults = document.getElementById('noResults');

    if (!searchTerm) {
        showOverview();
        return;
    }

    // Hide overview, show results
    categoryOverview.style.display = 'none';
    resultsGrid.style.display = 'grid';

    // Smart search with ranking: exact → generic → search terms → category
    const results = smartSearchMedications(searchTerm);

    if (results.length === 0) {
        showNoResults(searchTerm);
        return;
    }

    noResults.style.display = 'none';
    displaySearchResults(results);
}

// Smart search with ranking and spell check
function smartSearchMedications(searchTerm) {
    const exactMatches = [];
    const genericMatches = [];
    const searchTermMatches = [];
    const categoryMatches = [];

    medications.forEach(med => {
        const name = med.name.toLowerCase();
        const generic = (med.genericName || '').toLowerCase();
        const searchTerms = med.searchTerms || [];
        const category = (med.category || '').toLowerCase();

        // Exact name match (highest priority)
        if (name.includes(searchTerm)) {
            exactMatches.push({...med, matchType: 'exact', matchText: med.name});
        }
        // Generic name match
        else if (generic.includes(searchTerm)) {
            genericMatches.push({...med, matchType: 'generic', matchText: med.genericName});
        }
        // Search terms match
        else if (searchTerms.some(term => term.includes(searchTerm))) {
            const matchingTerm = searchTerms.find(term => term.includes(searchTerm));
            searchTermMatches.push({...med, matchType: 'searchTerm', matchText: matchingTerm});
        }
        // Category match (lowest priority)
        else if (category.includes(searchTerm)) {
            categoryMatches.push({...med, matchType: 'category', matchText: med.category});
        }
    });

    // Return results in priority order
    return [...exactMatches, ...genericMatches, ...searchTermMatches, ...categoryMatches];
}

// Autocomplete functionality
function setupAutocomplete() {
    const searchInput = document.getElementById('medicationSearch');
    const autocompleteContainer = createAutocompleteContainer();

    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm.length < 2) {
            hideAutocomplete();
            return;
        }

        const suggestions = generateSuggestions(searchTerm);
        showAutocomplete(suggestions);
    });

    // Hide autocomplete when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
            hideAutocomplete();
        }
    });
}

function createAutocompleteContainer() {
    let container = document.getElementById('autocompleteContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'autocompleteContainer';
        container.className = 'autocomplete-container';
        document.getElementById('medicationSearch').parentNode.appendChild(container);
    }
    return container;
}

function generateSuggestions(searchTerm) {
    const suggestions = new Set();
    
    medications.forEach(med => {
        // Add medication name if it matches
        if (med.name.toLowerCase().includes(searchTerm)) {
            suggestions.add(med.name);
        }
        
        // Add generic name if it matches
        if (med.genericName && med.genericName.toLowerCase().includes(searchTerm)) {
            suggestions.add(med.genericName);
        }
        
        // Add matching search terms
        if (med.searchTerms) {
            med.searchTerms.forEach(term => {
                if (term.includes(searchTerm)) {
                    suggestions.add(term);
                }
            });
        }
    });

    return Array.from(suggestions).slice(0, 8); // Limit to 8 suggestions
}

function showAutocomplete(suggestions) {
    const container = document.getElementById('autocompleteContainer');
    
    if (suggestions.length === 0) {
        hideAutocomplete();
        return;
    }

    container.innerHTML = suggestions.map(suggestion => 
        `<div class="autocomplete-item" onclick="selectSuggestion('${suggestion}')">${suggestion}</div>`
    ).join('');
    
    container.style.display = 'block';
}

function hideAutocomplete() {
    const container = document.getElementById('autocompleteContainer');
    if (container) {
        container.style.display = 'none';
    }
}

function selectSuggestion(suggestion) {
    document.getElementById('medicationSearch').value = suggestion;
    hideAutocomplete();
    enhancedSearchMedications();
}

// Simple medication finder for calculator integration
function findMedicationGuidance(medicationName, quantity = 0) {
    const name = medicationName.toLowerCase().trim();
    
    // Find all matching medications (there might be above/below threshold variants)
    const matches = medications.filter(med => 
        med.name.toLowerCase().includes(name) ||
        (med.genericName && med.genericName.toLowerCase().includes(name)) ||
        (med.searchTerms && med.searchTerms.some(term => term.includes(name)))
    );
    
    if (matches.length === 0) return null;
    
    // If quantity is specified, find the appropriate threshold variant
    if (quantity > 0 && matches.length > 1) {
        // Sort by thresholdNumeric to find the right threshold
        matches.sort((a, b) => a.thresholdNumeric - b.thresholdNumeric);
        
        // Find the appropriate threshold match
        for (let i = 0; i < matches.length; i++) {
            const med = matches[i];
            if (quantity <= med.thresholdNumeric || med.thresholdNumeric === 0) {
                return med;
            }
        }
        
        // If quantity exceeds all thresholds, return the highest threshold medication
        return matches[matches.length - 1];
    }
    
    // Return first match if no quantity specified
    return matches[0];
}

// Display results using simplified data structure
function displaySearchResults(results) {
    const resultsGrid = document.getElementById('searchResults');
    resultsGrid.innerHTML = results.map(med => createMedicationCard(med)).join('');
}

// Create medication card with new simplified structure
function createMedicationCard(med) {
    const statusClass = med.status || 'unknown';
    const statusIcon = getStatusIcon(med.status);
    const statusText = getStatusText(med.status);
    
    return `
        <div class="medication-card status-${statusClass}">
            <div class="handy-guide">
                <div class="guide-header">
                    <div class="medication-title">
                        <h2 class="medication-name">${med.name}</h2>
                        <div class="medication-generic">${med.genericName || ''}</div>
                    </div>
                    <div class="status-badge ${statusClass}">
                        ${statusIcon} ${statusText}
                    </div>
                </div>

                <div class="essential-info">
                    <div class="threshold-display">
                        <strong>Quantity Limit:</strong> ${med.thresholdDescription}
                    </div>
                    <div class="action-display">
                        <strong>Action Required:</strong> ${med.actionRequired}
                    </div>
                    <div class="channel-display">
                        <strong>Customs Channel:</strong> ${med.channelRequired}
                    </div>
                </div>

                ${med.documentationNeeded ? `
                <div class="documentation-info">
                    <strong>Documentation Needed:</strong> ${med.documentationNeeded}
                    ${med.processingDaysMin > 0 ? `<br><strong>Processing Time:</strong> ${med.processingDaysMin}-${med.processingDaysMax} days` : ''}
                </div>
                ` : ''}

                ${med.reasonForClassification ? `
                <div class="classification-reason">
                    <strong>Why:</strong> ${med.reasonForClassification}
                </div>
                ` : ''}

                ${med.officialSource ? `
                <div class="official-source">
                    <small><strong>Source:</strong> <a href="${med.officialSource}" target="_blank">Official Documentation</a></small>
                </div>
                ` : ''}
            </div>
        </div>
    `;
}

function getStatusIcon(status) {
    switch(status) {
        case 'prohibited': return '🔴';
        case 'restricted': return '🟡';
        case 'permitted': return '🟢';
        default: return '❓';
    }
}

function getStatusText(status) {
    switch(status) {
        case 'prohibited': return 'PROHIBITED';
        case 'restricted': return 'RESTRICTED';
        case 'permitted': return 'PERMITTED';
        default: return 'UNKNOWN';
    }
}

function showOverview() {
    document.getElementById('categoryOverview').style.display = 'grid';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('noResults').style.display = 'none';
}

function showNoResults(searchTerm) {
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('noResults').style.display = 'block';
    // Could add spell check suggestions here
}

// Initialize enhanced search on page load
document.addEventListener('DOMContentLoaded', function() {
    setupAutocomplete();
    
    // Add CSS for autocomplete
    const autocompleteCSS = `
        .autocomplete-container {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
            display: none;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .autocomplete-item {
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .autocomplete-item:hover {
            background-color: #f8f9fa;
        }
        
        .autocomplete-item:last-child {
            border-bottom: none;
        }
        
        .search-container {
            position: relative;
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = autocompleteCSS;
    document.head.appendChild(style);
});