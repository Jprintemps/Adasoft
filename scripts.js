document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /**
     * Mobile Navigation Toggle
     * Gère l'ouverture et la fermeture du menu de navigation sur mobile.
     */
    const initMobileNav = () => {
        const menuToggle = document.getElementById('menu-toggle');
        const mainNav = document.querySelector('.header__nav');

        if (menuToggle && mainNav) {
            const mobileNav = mainNav.cloneNode(true);
            mobileNav.classList.add('mobile-nav');
            document.body.appendChild(mobileNav);

            menuToggle.addEventListener('click', () => {
                const isNavOpen = document.body.classList.toggle('nav-open');
                menuToggle.setAttribute('aria-expanded', isNavOpen);
            });
            
            mobileNav.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    document.body.classList.remove('nav-open');
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    };

    /**
     * Lazy Loading Images with Progressive Reveal
     * Charge les images et les fait apparaître en douceur.
     */
    const initLazyLoad = () => {
        const lazyImages = document.querySelectorAll('img[data-src]');
        const lazyImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.addEventListener('load', () => {
                        lazyImage.removeAttribute('data-src');
                        lazyImage.classList.add('is-loaded');
                    }, { once: true });
                    observer.unobserve(lazyImage);
                }
            });
        });

        lazyImages.forEach(lazyImage => {
            lazyImageObserver.observe(lazyImage);
        });
    };

    /**
     * Stats Counter Animation
     * Anime les chiffres des statistiques lorsqu'ils deviennent visibles.
     */
    const initStatsCounter = () => {
        const counters = document.querySelectorAll('.stat-number');
        
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = +counter.getAttribute('data-target');
                    const duration = 2000; // 2 secondes
                    
                    if (prefersReducedMotion) {
                        counter.innerText = target;
                        observer.unobserve(counter);
                        return;
                    }
                    
                    let start = 0;
                    const stepTime = 16; // Environ 60fps
                    const totalSteps = Math.round(duration / stepTime);
                    const increment = target / totalSteps;
                    let currentStep = 0;

                    const timer = setInterval(() => {
                        start += increment;
                        currentStep++;
                        if (currentStep >= totalSteps) {
                            clearInterval(timer);
                            start = target;
                        }
                         const isDecimal = counter.hasAttribute('data-decimal');
                         counter.innerText = isDecimal ? start.toFixed(1) : Math.round(start);
                    }, stepTime);
                    
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    };

    /**
     * Animated Portfolio Filter
     * Filtre les projets avec une animation de fondu et de mise à l'échelle.
     */
    const initPortfolioFilter = () => {
        const filterContainer = document.querySelector('.portfolio__filters');
        if (!filterContainer) return;

        const filterButtons = filterContainer.querySelectorAll('button');
        const portfolioItems = document.querySelectorAll('.portfolio-item');

        filterContainer.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') return;
            
            const filterValue = e.target.dataset.filter;
            filterButtons.forEach(button => button.setAttribute('aria-selected', 'false'));
            e.target.setAttribute('aria-selected', 'true');

            portfolioItems.forEach(item => {
                const matchesFilter = filterValue === 'all' || item.dataset.category === filterValue;
                item.classList.toggle('is-filtered', !matchesFilter);
            });
        });
        
        // Add CSS for transitions if prefers-reduced-motion is not enabled
        if (!prefersReducedMotion) {
            const style = document.createElement('style');
            style.innerHTML = `
                .portfolio-item { transition: transform 0.4s ease, opacity 0.4s ease; }
                .portfolio-item.is-filtered { transform: scale(0.8); opacity: 0; pointer-events: none; height: 0; margin-bottom: 0; }
            `;
            document.head.appendChild(style);
        } else {
             const style = document.createElement('style');
            style.innerHTML = `
                .portfolio-item.is-filtered { display: none; }
            `;
            document.head.appendChild(style);
        }
    };

    /**
     * FAQ Accordion
     * Gère l'ouverture/fermeture des réponses de la FAQ.
     */
    const initFaqAccordion = () => {
        const accordionItems = document.querySelectorAll('.faq-item');
        accordionItems.forEach(item => {
            const question = item.querySelector('.faq-item__question');
            const answer = item.querySelector('.faq-item__answer');

            question.addEventListener('click', () => {
                const isExpanded = question.getAttribute('aria-expanded') === 'true';
                
                // Ne ferme pas les autres, permet d'en avoir plusieurs ouverts
                if (isExpanded) {
                    question.setAttribute('aria-expanded', 'false');
                    answer.setAttribute('hidden', '');
                    answer.style.maxHeight = null;
                } else {
                    question.setAttribute('aria-expanded', 'true');
                    answer.removeAttribute('hidden');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            });
        });
    };

    /**
     * Accessible Carousel for Testimonials
     * Avec autoplay, pause-on-hover et navigation clavier.
     */
    const initCarousel = () => {
        const carousel = document.querySelector('.carousel');
        if (!carousel) return;
        
        const track = carousel.querySelector('.carousel__track');
        const slides = Array.from(track.children);
        const nextButton = carousel.querySelector('.carousel__button--next');
        const prevButton = carousel.querySelector('.carousel__button--prev');
        const indicatorsNav = carousel.querySelector('.carousel__indicators');
        let autoplayInterval = null;

        if (slides.length === 0) return;

        // Set tabindex to make the carousel focusable for keyboard events
        carousel.setAttribute('tabindex', '0');
        
        // Dynamically create indicators
        slides.forEach((_, i) => indicatorsNav.innerHTML += `<button class="carousel__indicator ${i === 0 ? 'current-slide' : ''}" aria-label="Go to slide ${i + 1}"></button>`);
        const indicators = Array.from(indicatorsNav.children);

        const updateCarousel = (targetIndex) => {
            const currentSlide = track.querySelector('.current-slide');
            const currentIndex = slides.indexOf(currentSlide);
            
            track.style.transform = `translateX(-${100 * targetIndex}%)`;
            if (prefersReducedMotion) track.style.transition = 'none';
            else track.style.transition = 'transform 0.5s ease-in-out';
            
            slides[currentIndex].classList.remove('current-slide');
            slides[targetIndex].classList.add('current-slide');
            
            indicators[currentIndex].classList.remove('current-slide');
            indicators[targetIndex].classList.add('current-slide');
            
            prevButton.disabled = targetIndex === 0;
            nextButton.disabled = targetIndex === slides.length - 1;
        };

        nextButton.addEventListener('click', () => {
            const currentIndex = slides.indexOf(track.querySelector('.current-slide'));
            updateCarousel(currentIndex + 1);
        });

        prevButton.addEventListener('click', () => {
            const currentIndex = slides.indexOf(track.querySelector('.current-slide'));
            updateCarousel(currentIndex - 1);
        });

        indicatorsNav.addEventListener('click', e => {
            if (e.target.tagName !== 'BUTTON') return;
            const targetIndex = indicators.indexOf(e.target);
            updateCarousel(targetIndex);
        });

        carousel.addEventListener('keydown', e => {
            const currentIndex = slides.indexOf(track.querySelector('.current-slide'));
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                e.preventDefault();
                updateCarousel(currentIndex - 1);
            }
            if (e.key === 'ArrowRight' && currentIndex < slides.length - 1) {
                e.preventDefault();
                updateCarousel(currentIndex + 1);
            }
        });
        
        const startAutoplay = () => {
            if (prefersReducedMotion) return;
            autoplayInterval = setInterval(() => {
                let currentIndex = slides.indexOf(track.querySelector('.current-slide'));
                const nextIndex = (currentIndex + 1) % slides.length;
                updateCarousel(nextIndex);
            }, 5000);
        };

        const stopAutoplay = () => clearInterval(autoplayInterval);

        carousel.addEventListener('mouseenter', stopAutoplay);
        carousel.addEventListener('focusin', stopAutoplay);
        carousel.addEventListener('mouseleave', startAutoplay);
        carousel.addEventListener('focusout', startAutoplay);

        // Initial setup
        slides.forEach(s => s.classList.remove('current-slide'));
        slides[0].classList.add('current-slide');
        updateCarousel(0);
        startAutoplay();
    };
    
    /**
     * Price Increase Countdown Timer
     * Affiche un compte à rebours jusqu'à la date d'augmentation des prix.
     */
    const initCountdown = () => {
        const notice = document.querySelector('.pricing__notice');
        if (!notice) return;
        
        const targetDate = new Date('2025-09-15T23:00:00-04:00'); // EST is UTC-4 during DST
        const countdownElement = document.createElement('div');
        countdownElement.className = 'countdown-timer';
        notice.appendChild(countdownElement);

        const updateTimer = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                countdownElement.innerHTML = "Prices have been updated.";
                clearInterval(interval);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownElement.innerHTML = `Time left to lock in current price: <strong>${days}d ${hours}h ${minutes}m ${seconds}s</strong>`;
        };

        const interval = setInterval(updateTimer, 1000);
        updateTimer();
    };

    /**
     * Scroll Reveal Animations
     * Fait apparaître les éléments au fur et à mesure du défilement.
     */
    const initScrollReveal = () => {
        if (prefersReducedMotion) return;

        const revealElements = document.querySelectorAll('.feature-card, .pricing-card, .process-step, .portfolio-item, .faq-item, .social-proof__column, .section-header');
        
        const style = document.createElement('style');
        style.innerHTML = `
            .reveal-on-scroll {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.6s ease-out, transform 0.6s ease-out;
            }
            .reveal-on-scroll.is-visible {
                opacity: 1;
                transform: translateY(0);
            }
        `;
        document.head.appendChild(style);

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Ajoute un léger décalage pour un effet plus naturel
                    entry.target.style.transitionDelay = `${(index % 5) * 100}ms`;
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { 
            rootMargin: '0px 0px -100px 0px', // Se déclenche quand l'élément est à 100px dans le viewport
            threshold: 0.1 
        });

        revealElements.forEach(el => {
            el.classList.add('reveal-on-scroll');
            observer.observe(el);
        });
    };

    // --- Initialize all scripts ---
    initMobileNav();
    initLazyLoad();
    initStatsCounter();
    initPortfolioFilter();
    initFaqAccordion();
    initCarousel();
    initCountdown();
    initScrollReveal(); // Ajout de la nouvelle fonction
});

/*
    Fichier: booking.js
    Auteur: Gemini (généré par IA en tant que développeur senior)
    Date: 12 septembre 2025
    Description: Gère la validation du formulaire et la logique
                 de soumission pour la page de réservation.
*/
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('booking-form');
    
    // Si le formulaire n'est pas sur la page, on arrête le script.
    if (!form) {
        return;
    }

    const submitBtn = document.getElementById('submit-btn');
    const bookingContainer = document.getElementById('booking-container');

    // --- Field Validation Logic ---
    const fields = {
        fullName: { required: true },
        email: { required: true, isEmail: true },
        whatsapp: { required: true, isPhone: true },
        projectInfo: { required: true }
    };
    
    const validateField = (field) => {
        const input = form.querySelector(`#${field}`);
        const group = input.parentElement;
        const errorDiv = group.querySelector('.error-message');
        let isValid = true;
        const value = input.value.trim();

        // Reset state
        group.classList.remove('has-error');

        if (fields[field].required && value === '') {
            isValid = false;
        }
        if (fields[field].isEmail && value !== '' && !/^\S+@\S+\.\S+$/.test(value)) {
            isValid = false;
        }
        if (fields[field].isPhone && value !== '' && !/^\+?[1-9]\d{1,14}$/.test(value.replace(/\s/g, ''))) {
             isValid = false;
             // A simple regex to check for a country code and numbers
        }

        if (!isValid) {
            group.classList.add('has-error');
        }
        return isValid;
    };

    // --- Form Submission Logic ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validate all fields on submit
        let isFormValid = true;
        for (const field in fields) {
            if (!validateField(field)) {
                isFormValid = false;
            }
        }

        if (isFormValid) {
            // Simulate API call
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            setTimeout(() => {
                // On success, show confirmation message
                showSuccessMessage();
            }, 1500); // Simulate network delay
        }
    });

    // --- Real-time validation on blur ---
    for (const field in fields) {
        const input = form.querySelector(`#${field}`);
        if(input) {
            input.addEventListener('blur', () => validateField(field));
        }
    }
    
    // --- Success Message Display ---
    const showSuccessMessage = () => {
        const clientName = form.querySelector('#fullName').value.split(' ')[0]; // Get first name

        bookingContainer.innerHTML = `
            <div class="success-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h2>Merci, ${clientName} !</h2>
            <p>Votre appel stratégique a été réservé avec succès.</p>
            <p>Nous avons envoyé une confirmation à votre adresse e-mail et nous vous contacterons bientôt sur WhatsApp pour confirmer l'heure.</p>
            </div>
        `;
    };

});
document.addEventListener('DOMContentLoaded', () => {

    // --- Éléments de la Modale ---
    const modalOverlay = document.getElementById('paymentModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalTitle = document.getElementById('modal-title');
    const modalSummary = document.getElementById('modal-summary');
    const modalSubmitBtn = document.getElementById('modal-submit-btn');
    const modalPaymentContent = document.getElementById('modal-payment-content');
    const modalSuccessMessage = document.getElementById('modal-success-message');

    // --- Éléments de paiement ---
    const selectCardBtn = document.getElementById('selectCard');
    const selectMobileBtn = document.getElementById('selectMobile');
    const cardForm = document.getElementById('card-payment-form');
    const mobileForm = document.getElementById('mobile-money-form');

    // --- Boutons d'ouverture ---
    const openModalBtns = document.querySelectorAll('.openModalBtn');

    // Vérifie que les éléments de base existent
    if (!modalOverlay || !closeModalBtn || openModalBtns.length === 0) {
        console.error("Éléments de la modale manquants. Vérifiez les IDs.");
        return;
    }
    
    // --- Fonctions de gestion de la vue ---
    
    const resetModalView = () => {
        // Affiche le contenu de paiement et cache le message de succès
        modalPaymentContent.classList.remove('hidden');
        modalSuccessMessage.classList.add('hidden');
        // Réinitialise les formulaires
        cardForm.reset();
        mobileForm.reset();
    };

    const openModal = () => {
        resetModalView();
        // Réinitialiser à la vue par défaut (Carte Bancaire)
        selectCardBtn.classList.add('active');
        selectMobileBtn.classList.remove('active');
        cardForm.classList.remove('hidden');
        mobileForm.classList.add('hidden');
        
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        // Petite temporisation pour que l'animation de fermeture se termine avant de réinitialiser
        setTimeout(resetModalView, 300);
    };

    const updateModalContent = (plan, price) => {
        modalTitle.textContent = `Commander : ${plan}`;
        modalSummary.innerHTML = `
            <p>
                <span class="plan-name">${plan}</span>
                <span class="plan-price">$${price}</span>
            </p>
        `;
        modalSubmitBtn.textContent = `Payer $${price}`;
    };

    const showSuccessMessage = () => {
        const cardHolderInput = cardForm.querySelector('#card-holder-name');
        const clientName = cardHolderInput.value.split(' ')[0] || 'Client'; // Prénom ou "Client" par défaut

        modalSuccessMessage.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h2>Merci, ${clientName} !</h2>
            <p>Votre commande a été traitée avec succès.</p>
            <p>Une confirmation a été envoyée à votre adresse e-mail.</p>
        `;

        modalPaymentContent.classList.add('hidden');
        modalSuccessMessage.classList.remove('hidden');
    };

    // --- Logique de validation et de soumission ---
    modalSubmitBtn.addEventListener('click', () => {
        // Détermine quel formulaire est actif
        const activeForm = selectCardBtn.classList.contains('active') ? cardForm : mobileForm;
        
        // Vérifie la validité du formulaire actif
        if (activeForm.checkValidity()) {
            // Si tout est valide, simule un paiement et affiche le succès
            console.log("Formulaire valide, traitement du paiement...");
            showSuccessMessage();
        } else {
            // Si invalide, déclenche le rapport de validité du navigateur pour afficher les messages
            activeForm.reportValidity();
            console.log("Formulaire invalide.");
        }
    });

    // --- Logique du sélecteur de paiement ---
    selectCardBtn.addEventListener('click', () => {
        selectCardBtn.classList.add('active');
        selectMobileBtn.classList.remove('active');
        cardForm.classList.remove('hidden');
        mobileForm.classList.add('hidden');
    });

    selectMobileBtn.addEventListener('click', () => {
        selectMobileBtn.classList.add('active');
        selectCardBtn.classList.remove('active');
        mobileForm.classList.remove('hidden');
        cardForm.classList.add('hidden');
    });

    // --- Ajout des écouteurs d'événements ---

    openModalBtns.forEach(button => {
        button.addEventListener('click', () => {
            const plan = button.dataset.plan;
            const price = button.dataset.price;
            updateModalContent(plan, price);
            openModal();
        });
    });

    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
            const galleryScroll = document.getElementById('gallery-scroll');
            
            // Sélectionne toutes les images directes du conteneur
            const images = Array.from(galleryScroll.children);

            // Duplique chaque image et l'ajoute à la fin de la galerie
            images.forEach(image => {
                const clone = image.cloneNode(true);
                galleryScroll.appendChild(clone);
            });
        });
 // JavaScript for scroll animations
        document.addEventListener("DOMContentLoaded", function() {
            const animatedElements = document.querySelectorAll('.animate-on-scroll_why');

            // Use IntersectionObserver if available for better performance
            if ("IntersectionObserver" in window) {
                const observer = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        // When element comes into view
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible_why');
                            // Stop observing it after animation
                            observer.unobserve(entry.target);
                        }
                    });
                }, {
                    threshold: 0.1 // Trigger when 10% of the element is visible
                });

                animatedElements.forEach(element => {
                    observer.observe(element);
                });
            } else {
                // Fallback for older browsers
                animatedElements.forEach(element => {
                    element.classList.add('is-visible_why');
                });
            }
        });
// Sélection des éléments du DOM
const videoPlayer = document.getElementById('video-player');
const video = document.getElementById('main-video');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const rewindBtn = document.getElementById('rewind-btn');
const forwardBtn = document.getElementById('forward-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');
const volumeBtn = document.getElementById('volume-btn');
const volumeHighIcon = document.getElementById('volume-high-icon');
const volumeMutedIcon = document.getElementById('volume-muted-icon');
const volumeSlider = document.getElementById('volume-slider');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const fullscreenOpenIcon = document.getElementById('fullscreen-open-icon');
const fullscreenCloseIcon = document.getElementById('fullscreen-close-icon');

// --- Fonctions Utilitaires ---

function formatTime(time) {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function togglePlayPauseIcon() {
    if (video.paused) {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    } else {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    }
}

function updateVolumeIcon() {
    if (video.muted || video.volume === 0) {
        volumeHighIcon.classList.add('hidden');
        volumeMutedIcon.classList.remove('hidden');
    } else {
        volumeHighIcon.classList.remove('hidden');
        volumeMutedIcon.classList.add('hidden');
    }
}

// --- Logique du lecteur ---

function togglePlay() {
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

function updateProgress() {
    const progress = (video.currentTime / video.duration) * 100;
    progressBar.value = progress;
    progressBar.style.background = `linear-gradient(to right, var(--progress-thumb) ${progress}%, var(--progress-track) ${progress}%)`;
    currentTimeEl.textContent = formatTime(video.currentTime);
}

function setProgress(e) {
    const newTime = (e.target.value / 100) * video.duration;
    video.currentTime = newTime;
}

function skip(duration) {
    video.currentTime += duration;
}

function setVolume(e) {
    video.volume = e.target.value;
    video.muted = e.target.value == 0;
    updateVolumeIcon();
}

function toggleMute() {
    video.muted = !video.muted;
    if (video.muted) {
        volumeSlider.setAttribute('data-volume-before-mute', volumeSlider.value);
        volumeSlider.value = 0;
    } else {
        volumeSlider.value = volumeSlider.getAttribute('data-volume-before-mute') || 1;
    }
    video.volume = volumeSlider.value;
    updateVolumeIcon();
}

function toggleFullscreen() {
     if (!document.fullscreenElement) {
        videoPlayer.requestFullscreen().catch(err => {
            console.error(`Erreur lors du passage en plein écran : ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

// --- Écouteurs d'événements ---

video.addEventListener('loadedmetadata', () => {
    totalDurationEl.textContent = formatTime(video.duration);
    updateProgress(); // Mettre à jour la couleur initiale
});

video.addEventListener('click', togglePlay);
playPauseBtn.addEventListener('click', togglePlay);
video.addEventListener('play', togglePlayPauseIcon);
video.addEventListener('pause', togglePlayPauseIcon);
video.addEventListener('timeupdate', updateProgress);

progressBar.addEventListener('input', setProgress);

rewindBtn.addEventListener('click', () => skip(-10));
forwardBtn.addEventListener('click', () => skip(10));

volumeBtn.addEventListener('click', toggleMute);
volumeSlider.addEventListener('input', setVolume);

fullscreenBtn.addEventListener('click', toggleFullscreen);

document.addEventListener('fullscreenchange', () => {
    const isFullscreen = !!document.fullscreenElement;
    fullscreenOpenIcon.classList.toggle('hidden', isFullscreen);
    fullscreenCloseIcon.classList.toggle('hidden', !isFullscreen);
});

// Appliquer un style initial au slider de volume
function updateVolumeSliderBg() {
    const volume = volumeSlider.value * 100;
    volumeSlider.style.background = `linear-gradient(to right, var(--volume-thumb) ${volume}%, var(--volume-track-hover) ${volume}%)`;
}
volumeSlider.addEventListener('input', updateVolumeSliderBg);

// Initialisation
updateVolumeSliderBg();
updateVolumeIcon();
