document.addEventListener('DOMContentLoaded', () => {
    // Vérifie si l'API matchMedia est supportée par le navigateur
    if (window.matchMedia) {
        // Crée un objet MediaQueryList pour la préférence de couleur sombre
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const logo = document.getElementById('logoAdasoft');
        // Fonction pour mettre à jour le thème en fonction de la préférence système
        const updateTheme = (e) => {
            if (e.matches) {
                // Si le système est en mode sombre, ajoute la classe au body
                document.body.classList.add('dark-theme');
                logo.src = "./src/assets/Logo-dark.svg";
            } else {
                // Sinon, retire la classe (thème clair par défaut)
                document.body.classList.remove('dark-theme');
                logo.src = "./src/assets/Logo.svg";
            }
        };

        // Appelle la fonction une première fois au chargement de la page
        updateTheme(darkModeMediaQuery);

        // Ajoute un écouteur pour détecter les changements de préférence en temps réel
        darkModeMediaQuery.addEventListener('change', updateTheme);
    } else {
        // Fallback pour les navigateurs qui ne supportent pas matchMedia
        console.log("Votre navigateur ne supporte pas la détection automatique du thème.");
    }
});
