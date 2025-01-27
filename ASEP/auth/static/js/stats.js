// Bar Chart
const barCtx = document.getElementById('barChart').getContext('2d');
new Chart(barCtx, {
    type: 'bar',
    data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: 'Food Collected (kg)',
            data: [250, 320, 280, 400, 350, 290, 310],
            backgroundColor: '#4285f4',
            borderRadius: 5,
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    display: true,
                    color: '#f0f0f0'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    }
});

// Pie Chart
const pieCtx = document.getElementById('pieChart').getContext('2d');
new Chart(pieCtx, {
    type: 'doughnut',
    data: {
        labels: ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Protein'],
        datasets: [{
            data: [35, 20, 15, 20, 10],
            backgroundColor: [
                '#34A853',  // Green for Vegetables
                '#FBBC05',  // Yellow for Fruits
                '#9C27B0',  // Purple for Grains
                '#E91E63',  // Pink for Dairy
                '#4285F4'   // Blue for Protein
            ]
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'right'
            }
        }
    }
});