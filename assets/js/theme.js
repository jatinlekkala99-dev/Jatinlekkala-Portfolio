document.addEventListener("DOMContentLoaded", () => {
    // Inject overlay for Lumos effect
    const lumosOverlay = document.createElement("div");
    lumosOverlay.id = "lumos-overlay";
    document.body.appendChild(lumosOverlay);

    const themeToggleBtn = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");
    const htmlElement = document.documentElement;

    // Check saved theme
    const savedTheme = localStorage.getItem("theme") || "dark";
    htmlElement.setAttribute("data-bs-theme", savedTheme);
    updateIcon(savedTheme);

    themeToggleBtn.addEventListener("click", () => {
        const currentTheme = htmlElement.getAttribute("data-bs-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        
        // Trigger Lumos Effect if turning to light mode
        if (newTheme === "light") {
            lumosOverlay.style.display = "block";
            lumosOverlay.classList.remove("lumos-flash");
            // Trigger reflow
            void lumosOverlay.offsetWidth;
            lumosOverlay.classList.add("lumos-flash");
            
            setTimeout(() => {
                lumosOverlay.style.display = "none";
            }, 1000);
        }
        
        htmlElement.setAttribute("data-bs-theme", newTheme);
        localStorage.setItem("theme", newTheme);
        updateIcon(newTheme);
        
        // Dispatch custom event to re-render charts for theme compatibility
        window.dispatchEvent(new Event('themeChanged'));
    });

    function updateIcon(theme) {
        if (theme === "dark") {
            themeIcon.className = "bi bi-sun-fill";
            themeToggleBtn.title = "Lumos! (Switch to Light Mode)";
        } else {
            themeIcon.className = "bi bi-moon-stars-fill";
            themeToggleBtn.title = "Nox! (Switch to Dark Mode)";
        }
    }
});
