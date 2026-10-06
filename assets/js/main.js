document.addEventListener("DOMContentLoaded", () => {
    // Initialize AOS (Animate on Scroll)
    AOS.init({
        duration: 800,
        easing: 'slide',
        once: true,
        offset: 50
    });

    // Navbar shrink function
    const navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-scrolled')
        } else {
            navbarCollapsible.classList.add('navbar-scrolled')
        }
    };

    // Shrink the navbar 
    navbarShrink();
    document.addEventListener('scroll', navbarShrink);

    // Initialize tsParticles for the hero background (Organic Orbs)
    if (document.getElementById("particles-js")) {
        tsParticles.load("particles-js", {
            fpsLimit: 60,
            particles: {
                number: {
                    value: 15,
                    density: { enable: true, value_area: 800 }
                },
                color: { value: ["#00b4d8", "#90e0ef", "#caf0f8", "#ffffff"] },
                shape: { type: "circle" },
                opacity: {
                    value: 0.6,
                    random: true,
                    anim: { enable: true, speed: 0.5, opacity_min: 0.2, sync: false }
                },
                size: {
                    value: 40,
                    random: true,
                    anim: { enable: true, speed: 2, size_min: 15, sync: false }
                },
                line_linked: {
                    enable: false /* Removed generic lines for organic feel */
                },
                move: {
                    enable: true,
                    speed: 0.8,
                    direction: "none",
                    random: true,
                    straight: false,
                    out_mode: "out",
                    bounce: false,
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: { enable: true, mode: "bubble" },
                    onclick: { enable: true, mode: "push" },
                    resize: true
                },
                modes: {
                    bubble: { distance: 250, size: 60, duration: 2, opacity: 0.8 },
                    push: { particles_nb: 3 }
                }
            },
            retina_detect: true
        });
        
        // CSS for particles container
        const particlesContainer = document.getElementById("particles-js");
        particlesContainer.style.position = "absolute";
        particlesContainer.style.top = "0";
        particlesContainer.style.left = "0";
        particlesContainer.style.width = "100%";
        particlesContainer.style.height = "100%";
        particlesContainer.style.zIndex = "1";
        
        // Make sure hero content is above particles
        const heroRow = document.querySelector(".masthead .row");
        if(heroRow) {
            heroRow.style.position = "relative";
            heroRow.style.zIndex = "2";
        }
    }
});
