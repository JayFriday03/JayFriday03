
// ============================================
// TUTORIAL 6: LOAD REAL DATA
// From static data to async data loading
// ============================================

// Global variable to store loaded restaurant data
let restaurants = [];

// Wait for the page to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Tutorial 6: Async data loading ready!');
    
    // Get UI elements
    const loadButton = document.querySelector('#load-data-button');
    const statusDisplay = document.querySelector('#loading-status');
    const statusMessage = statusDisplay.querySelector('.status-message');
    
    // Get the method buttons (start disabled)
    const displayButton = document.querySelector('#display-button');
    const filterButton = document.querySelector('#filter-button');
    const mapButton = document.querySelector('#map-button');
    const errorButton = document.querySelector('#error-button');
    
    // ============================================
    // MAIN DATA LOADING FUNCTION
    // ============================================
    
    // This is the key new skill - loading data asynchronously
    loadButton.addEventListener('click', async function() {
        
        // Step 1: Show loading state
        updateStatus('loading', 'Loading restaurant data...');
        loadButton.disabled = true;

        try {
            // Step 2: Use fetch() to load data
            const response = await fetch('restaurants.json');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Step 3: Convert response to JSON
            const data = await response.json();

            // Step 4: Store data in global variable
            restaurants = data;

            // Step 5: Show success state and enable buttons
            updateStatus('success', `Successfully loaded ${restaurants.length} restaurants!`);
            toggleMethodButtons(true);
            loadButton.disabled = false;

        } catch (error) {
            // Step 6: Handle errors gracefully
            updateStatus('error', 'Failed to load data. Please try again.');
            console.error('Load error:', error);
            loadButton.disabled = false;
        }
    });
    
    // ============================================
    // ARRAY METHOD FUNCTIONS - Same as Tutorial 5
    // ============================================
    
    // Display all restaurants (same as Tutorial 5, but using loaded data)
    displayButton.addEventListener('click', function() {
        const restaurantList = document.querySelector('#restaurant-list');
        
        // Check if we have data first
        if (restaurants.length === 0) {
            restaurantList.innerHTML = '<p class="placeholder">No data loaded yet</p>';
            return;
        }
        
        // Step 7: Use forEach to build the restaurant list
        let html = '';
        restaurants.forEach(function(restaurant) {
            html += `<div class="restaurant-card">
                <h3>${restaurant.name}</h3>
                <p><strong>Cuisine:</strong> ${restaurant.cuisine}</p>
                <p><strong>Rating:</strong> ${restaurant.rating} ⭐</p>
                <p><strong>Price:</strong> ${restaurant.priceRange}</p>
                <p><strong>Neighborhood:</strong> ${restaurant.neighborhood}</p>
                <p><strong>Hours:</strong> ${restaurant.hours}</p>
            </div>`;
        });
        restaurantList.innerHTML = html;
        
        
    });
    
    // Filter cheap restaurants (same logic, loaded data)
    filterButton.addEventListener('click', function() {
        const filteredList = document.querySelector('#filtered-list');
        
        if (restaurants.length === 0) {
            filteredList.innerHTML = '<p class="placeholder">No data loaded yet</p>';
            return;
        }
        
        // Step 8: Filter to $ and $$ price ranges
        const cheapRestaurants = restaurants.filter(function(restaurant) {
            return restaurant.priceRange === '$' || restaurant.priceRange === '$$';
        });

        let html = `<p><strong>Found ${cheapRestaurants.length} affordable restaurants ($ or $$):</strong></p>`;
        cheapRestaurants.forEach(function(restaurant) {
            html += `<div class="restaurant-card">
                <h3>${restaurant.name}</h3>
                <p><strong>Price:</strong> ${restaurant.priceRange} &nbsp;|&nbsp; <strong>Cuisine:</strong> ${restaurant.cuisine} &nbsp;|&nbsp; <strong>Rating:</strong> ${restaurant.rating} ⭐</p>
            </div>`;
        });
        filteredList.innerHTML = html;
        
        
    });
    
    // Show restaurant names (same logic, loaded data)
    mapButton.addEventListener('click', function() {
        const mappedList = document.querySelector('#mapped-list');
        
        if (restaurants.length === 0) {
            mappedList.innerHTML = '<p class="placeholder">No data loaded yet</p>';
            return;
        }
        
        // Step 9: Map to extract just the names
        const names = restaurants.map(function(restaurant) {
            return restaurant.name;
        });

        let html = `<p><strong>${names.length} restaurant names:</strong></p><ul>`;
        names.forEach(function(name) {
            html += `<li>${name}</li>`;
        });
        html += '</ul>';
        mappedList.innerHTML = html;
        
        
    });
    
    // ============================================
    // ERROR HANDLING DEMO
    // ============================================
    
    // This demonstrates what happens when fetch() fails
    errorButton.addEventListener('click', async function() {
        const errorDisplay = document.querySelector('#error-display');
        
        errorDisplay.innerHTML = '<div class="status-display loading"><p class="status-message">Trying to load from bad URL...</p></div>';
        
        try {
            // This will fail because the URL doesn't exist
            const response = await fetch('nonexistent-file.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            errorDisplay.innerHTML = '<p class="placeholder">This should not appear</p>';
            
        } catch (error) {
            // Step 10: Show user-friendly error message
            errorDisplay.innerHTML = `<div class="status-display error">
                <p class="status-message">Error: Could not load data from that URL.</p>
                <p>This is expected! The file "nonexistent-file.json" doesn't exist.</p>
                <p><strong>What happened:</strong> ${error.message}</p>
                <p><strong>In a real app:</strong> You would show a retry button or suggest the user check their connection.</p>
            </div>`;

            console.error('Demonstrated error:', error);
        }
    });
    
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Helper function to enable/disable method buttons
function toggleMethodButtons(enabled) {
    const buttons = [
        document.querySelector('#display-button'),
        document.querySelector('#filter-button'),
        document.querySelector('#map-button')
    ];
    
    buttons.forEach(button => {
        button.disabled = !enabled;
    });
}

// Helper function to update status display
function updateStatus(state, message) {
    const statusDisplay = document.querySelector('#loading-status');
    const statusMessage = statusDisplay.querySelector('.status-message');
    
    // Remove all state classes
    statusDisplay.classList.remove('loading', 'success', 'error');
    
    // Add new state class
    if (state !== 'ready') {
        statusDisplay.classList.add(state);
    }
    
    statusMessage.textContent = message;
}

// ============================================
// DEBUGGING FUNCTIONS
// ============================================

// Check if data is loaded
function checkDataStatus() {
    console.log('=== Data Status ===');
    console.log('Restaurants loaded:', restaurants.length);
    if (restaurants.length > 0) {
        console.log('First restaurant:', restaurants[0].name);
        console.log('All restaurant names:', restaurants.map(r => r.name));
    }
    console.log('==================');
}

// Manually load data (for testing)
async function manualLoadData() {
    try {
        const response = await fetch('restaurants.json');
        if (!response.ok) throw new Error('Load failed');
        const data = await response.json();
        restaurants = data;
        console.log(`Manually loaded ${restaurants.length} restaurants`);
        toggleMethodButtons(true);
        updateStatus('success', `Successfully loaded ${restaurants.length} restaurants`);
    } catch (error) {
        console.error('Manual load failed:', error);
        updateStatus('error', 'Failed to load data');
    }
}

// Reset everything
function resetTutorial() {
    restaurants = [];
    toggleMethodButtons(false);
    updateStatus('ready', 'Ready to load data');
    
    // Clear all displays
    document.querySelector('#restaurant-list').innerHTML = '<p class="placeholder">Load data first, then click to display all restaurants</p>';
    document.querySelector('#filtered-list').innerHTML = '<p class="placeholder">Load data first, then click to show only affordable restaurants</p>';
    document.querySelector('#mapped-list').innerHTML = '<p class="placeholder">Load data first, then click to show just the restaurant names</p>';
    document.querySelector('#error-display').innerHTML = '<p class="placeholder">Click to see error handling in action</p>';
    
    console.log('Tutorial reset');
}

// Call these functions in the browser console:
// checkDataStatus() - see if data is loaded
// manualLoadData() - load data without clicking button
// resetTutorial() - reset everything for testing