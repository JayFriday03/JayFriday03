/**
 * CATEGORY VIEW - STUDENTS IMPLEMENT
 * Group data by categories - good for understanding relationships and patterns
 */
function showCategories(data) {
  const groups = {};
    data.forEach(function(restaurant) {
        const city = restaurant.city || 'Unknown';
        if (!groups[city]) {
            groups[city] = [];
        }
        groups[city].push(restaurant);
    });

    // Build HTML for each group
    const groupsHTML = Object.entries(groups)
        .sort((a, b) => b[1].length - a[1].length)
        .map(function([city, restaurants]) {
            const items = restaurants.map(r => `
                <div class="category-item">
                    <span>${r.name || '—'}</span>
                    <span>${r.inspection_results || '—'}</span>
                </div>
            `).join('');
            return `
            
                <details class="category-section">
                    <summary class="category-header">${city} <span class="category-count">(${restaurants.length})</span></summary>
                    <div class="category-items">
                        ${items}
                    </div>
                </details>
            `;
        }).join('');
        
  return `
        <h2 class="view-title">Category View — By City</h2>
        ${groupsHTML}
    `;
}


export default showCategories;