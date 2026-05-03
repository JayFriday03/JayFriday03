
/**
 * EXTERNAL LIBRARY VIEW
 * Pick an external library and pipe your data to it.
 */
function showTable(data) {
  // Requirements:
  // - Show data using an external library, such as leaflet.js or chartsjs or similar.
  // - Make a filter on this page so your external library only shows useful data.

    
  const resultCounts = {};
  data.forEach(function(r) {
      const result = r.inspection_results || 'Unknown';
      if (result !== '------') {
          resultCounts[result] = (resultCounts[result] || 0) + 1;
      }
  });

  const sorted = Object.entries(resultCounts).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(e => e[0]);
  const counts = sorted.map(e => e[1]);

  // Store data on window so we can access it after render
  window._chartLabels = labels;
  window._chartCounts = counts;

setTimeout(function() {
      const canvas = document.getElementById('results-chart');
      if (canvas && typeof Chart !== 'undefined') {
          new Chart(canvas.getContext('2d'), {
              type: 'bar',
              data: {
                  labels: window._chartLabels,
                  datasets: [{
                      label: 'Number of Inspections',
                      data: window._chartCounts,
                      backgroundColor: 'rgba(0, 124, 186, 0.7)',
                      borderWidth: 1
                  }]
              },
              options: {
                  responsive: true,
                  scales: {
                      x: { ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                      y: { beginAtZero: true, ticks: { color: 'white' }, grid: { color: 'rgba(255,255,255,0.1)' } }
                  },
                  plugins: { legend: { labels: { color: 'white' } } }
              }
          });
      }
  }, 100);

return `
      <h2 class="view-title">External Library View (Chart.js)</h2>
      
      <canvas id="results-chart" height="120"></canvas>
  `;
}
     

export default showTable;