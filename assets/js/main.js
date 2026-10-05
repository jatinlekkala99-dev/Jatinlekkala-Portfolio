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

    // Initialize tsParticles for the hero background
    if (document.getElementById("particles-js")) {
        tsParticles.load("particles-js", {
            fpsLimit: 60,
            particles: {
                number: {
                    value: 40,
                    density: { enable: true, value_area: 800 }
                },
                color: { value: "#ffffff" },
                shape: { type: "circle" },
                opacity: {
                    value: 0.3,
                    random: true,
                    anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
                },
                size: {
                    value: 3,
                    random: true,
                    anim: { enable: true, speed: 2, size_min: 0.1, sync: false }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#ffffff",
                    opacity: 0.2,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 1,
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
                    onhover: { enable: true, mode: "grab" },
                    onclick: { enable: true, mode: "push" },
                    resize: true
                },
                modes: {
                    grab: { distance: 140, line_linked: { opacity: 1 } },
                    push: { particles_nb: 4 }
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
