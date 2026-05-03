/**
 * STATS VIEW
 * Show aggregate statistics and insights - good for understanding the big picture
 */
function showStats(data) {
  // Requirements:
  // Replace the below "task" description with the following:
  // - One meaningful statistic calculation from the supplied dataset
  // ===- percent of restaurants not passing hand-washing, for example
  // - Present insights visually
  // - Show distributions, averages, counts, etc.
  // - Help users understand patterns in the data
  
  // Stat 1: Total inspections
  const total = data.length;

  // Stat 2: How many passed (compliant)
  const passing = data.filter(function(r) {
      const result = (r.inspection_results || '').toLowerCase();
      return result.includes('compliant') || result.includes('reopened') || result.includes('completed');
  }).length;

  // Stat 3: How many were non-compliant
  const nonCompliant = data.filter(function(r) {
      return (r.inspection_results || '').toLowerCase().includes('non-compliant');
  }).length;

  // Stat 4: How many had critical violations
  const critical = data.filter(function(r) {
      return (r.inspection_results || '').toLowerCase().includes('critical');
  }).length;

  // Stat 5: Most inspected city
  const cityCounts = {};
  data.forEach(function(r) {
      const city = r.city || 'Unknown';
      cityCounts[city] = (cityCounts[city] || 0) + 1;
  });
  const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0];

  // Stat 6: Re-inspections
  const reInspections = data.filter(function(r) {
      return (r.inspection_type || '').toLowerCase().includes('re-inspection');
  }).length;

return `
      <h2 class="view-title">Stats View</h2>
      <div class="stats-grid">
          <div class="stat-card">
              <div class="stat-label">Total Inspections</div>
              <div class="stat-number">${total}</div>
          </div>
          <div class="stat-card">
              <div class="stat-label">Passed / Compliant</div>
              <div class="stat-number stat-number--passing">${passing}</div>
          </div>
          <div class="stat-card">
              <div class="stat-label">Non-Compliant</div>
              <div class="stat-number stat-number--warning">${nonCompliant}</div>
          </div>
          <div class="stat-card">
              <div class="stat-label">Critical Violations</div>
              <div class="stat-number stat-number--critical">${critical}</div>
          </div>
          <div class="stat-card">
              <div class="stat-label">Most Inspected City</div>
              <div class="stat-number stat-number--city">${topCity[0]}</div>
          </div>
          <div class="stat-card">
              <div class="stat-label">Re-Inspections</div>
              <div class="stat-number">${reInspections}</div>
          </div>
      </div>
  `;
}

export default showStats