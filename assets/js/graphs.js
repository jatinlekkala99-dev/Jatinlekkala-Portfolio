document.addEventListener("DOMContentLoaded", () => {
    // Chart configurations
    let langChartInstance = null;
    let aiChartInstance = null;
    
    // Function to get current theme colors
    function getThemeColors() {
        const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";
        return {
            textColor: isDark ? '#e0fbfc' : '#023e8a',
            gridColor: isDark ? 'rgba(144, 224, 239, 0.2)' : 'rgba(0, 119, 182, 0.2)',
            primary: 'rgba(0, 180, 216, 0.7)',
            primaryBorder: '#00b4d8',
            secondary: 'rgba(144, 224, 239, 0.4)'
        };
    }

    function initCharts() {
        const colors = getThemeColors();
        
        // Common chart options
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: {
                    angleLines: { color: colors.gridColor },
                    grid: { color: colors.gridColor },
                    pointLabels: { 
                        color: colors.textColor,
                        font: { size: 12, family: "'Segoe UI', sans-serif" }
                    },
                    min: 0,
                    max: 100,
                    ticks: { display: false, stepSize: 20 }
                }
            }
        };

        // Languages & Frameworks Radar Chart
        const langCtx = document.getElementById('languagesChart').getContext('2d');
        if(langChartInstance) langChartInstance.destroy();
        
        langChartInstance = new Chart(langCtx, {
            type: 'radar',
            data: {
                labels: ['C# / .NET Core', 'Python', 'React JS / Next.js', 'JavaScript / TypeScript', 'SQL / MongoDB'],
                datasets: [{
                    label: 'Proficiency',
                    data: [100, 80, 100, 100, 80],
                    backgroundColor: colors.primary,
                    borderColor: colors.primaryBorder,
                    pointBackgroundColor: colors.primaryBorder,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: colors.primaryBorder
                }]
            },
            options: commonOptions
        });

        // AI & Automation Radar Chart
        const aiCtx = document.getElementById('aiChart').getContext('2d');
        if(aiChartInstance) aiChartInstance.destroy();
        
        aiChartInstance = new Chart(aiCtx, {
            type: 'polarArea',
            data: {
                labels: ['Prompt Eng (Gemini/Claude)', 'Machine Learning', 'Playwright / n8n / Apify', 'GitHub Actions', 'Sanity CMS'],
                datasets: [{
                    label: 'Expertise',
                    data: [95, 80, 90, 85, 80],
                    backgroundColor: [
                        'rgba(0, 119, 182, 0.8)',   /* Deep Blue */
                        'rgba(0, 150, 199, 0.8)',   /* Mid Blue */
                        'rgba(0, 180, 216, 0.8)',   /* Bright Cerulean */
                        'rgba(72, 202, 228, 0.8)',  /* Soft Light Blue */
                        'rgba(144, 224, 239, 0.8)'  /* Pale Blue */
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 2000, easing: 'easeOutQuart' },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: colors.textColor, font: { size: 12 } }
                    }
                },
                scales: {
                    r: {
                        grid: { color: colors.gridColor },
                        ticks: { display: false }
                    }
                }
            }
        });
    }

    // Initialize charts on load if element exists
    if(document.getElementById('languagesChart') && document.getElementById('aiChart')) {
        // Use IntersectionObserver to trigger animation when scrolled into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    initCharts();
                    observer.disconnect(); // Animate only once
                }
            });
        }, { threshold: 0.2 });
        
        observer.observe(document.getElementById('skills'));
    }

    // Re-render on theme change
    window.addEventListener('themeChanged', () => {
        if(langChartInstance || aiChartInstance) {
            initCharts();
        }
    });
});
