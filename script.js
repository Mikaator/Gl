document.addEventListener('DOMContentLoaded', () => {
    // Haupt-Variablen
    let glowUps = [];
    let currentIndex = 0;
    let ratings = {};

    // DOM-Elemente
    const galleryContainer = document.getElementById('gallery-container');
    const resultsContainer = document.getElementById('results-container');
    const currentGlowUpElement = document.getElementById('current-glowup');
    const progressElement = document.getElementById('progress');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const likeBtn = document.getElementById('like-btn');
    const superlikeBtn = document.getElementById('superlike-btn');
    const goldenBuzzerBtn = document.getElementById('goldenbuzzer-btn');
    const restartBtn = document.getElementById('restart-btn');

    // Ergebnis-Container
    const likeResults = document.getElementById('like-results');
    const superlikeResults = document.getElementById('superlike-results');
    const goldenBuzzerResults = document.getElementById('golden-buzzer-results');

    // Lade zunächst die vorhandenen Bewertungen aus dem localStorage
    function loadRatings() {
        const savedRatings = localStorage.getItem('glowUpRatings');
        if (savedRatings) {
            ratings = JSON.parse(savedRatings);
        }
    }

    // Lade die Glow-Up-Daten aus der JSON-Datei
    async function loadGlowUps() {
        try {
            const response = await fetch('glowups.json');
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Daten');
            }
            
            glowUps = await response.json();
            
            if (glowUps.length > 0) {
                updateProgress();
                displayCurrentGlowUp();
            } else {
                alert('Keine Glow-Ups gefunden!');
            }
        } catch (error) {
            console.error('Fehler beim Laden der Glow-Ups:', error);
            
            // Fallback: Verwende Beispieldaten, wenn die JSON-Datei nicht geladen werden kann
            console.log('Verwende Beispieldaten als Fallback...');
            glowUps = getSampleGlowUps();
            
            if (glowUps.length > 0) {
                updateProgress();
                displayCurrentGlowUp();
            } else {
                alert('Fehler beim Laden der Daten. Bitte später erneut versuchen.');
            }
        }
    }

    // Fallback: Beispieldaten für die Glow-Ups
    function getSampleGlowUps() {
        return [
            {
                id: 1,
                name: 'Mia',
                age: 17,
                beforeImage: 'GlowUp/mia..v_17.jpg',
                afterImage: 'GlowUp/mia..n_17.jpg'
            },
            {
                id: 2,
                name: 'Leon',
                age: 22,
                beforeImage: 'GlowUp/leon..v_22.jpg',
                afterImage: 'GlowUp/leon..n_22.jpg'
            },
            {
                id: 3,
                name: 'Sophia',
                age: 19,
                beforeImage: 'GlowUp/sophia..v_19.jpg',
                afterImage: 'GlowUp/sophia..n_19.jpg'
            }
        ];
    }

    // Aktualisiere die Fortschrittsanzeige
    function updateProgress() {
        progressElement.textContent = `${currentIndex + 1} / ${glowUps.length}`;
        
        // Aktiviere/deaktiviere Navigationsbuttons
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex === glowUps.length - 1;
        
        // Zeige "Ergebnisse anzeigen" Button als letzten Schritt an
        if (currentIndex === glowUps.length - 1) {
            nextBtn.textContent = 'Ergebnisse anzeigen';
        } else {
            nextBtn.textContent = 'Weiter';
        }
    }

    // Zeige das aktuelle Glow-Up an
    function displayCurrentGlowUp() {
        const glowUp = glowUps[currentIndex];
        
        // Setze den Container zurück
        currentGlowUpElement.innerHTML = '';
        
        // Deaktiviere ausgewählte Buttons
        clearSelectedRatingButtons();
        
        // Erstelle das Vorher-Bild (standardmäßig mit Blur-Effekt)
        const imageElement = document.createElement('img');
        imageElement.src = glowUp.beforeImage;
        imageElement.alt = `${glowUp.name} vorher`;
        imageElement.classList.add('glowup-image', 'blurred');
        imageElement.dataset.state = 'before-blurred';
        
        // Erstelle das Info-Element mit Name und Alter
        const infoElement = document.createElement('div');
        infoElement.classList.add('person-info');
        infoElement.innerHTML = `
            <h2>${glowUp.name}</h2>
            <p>${glowUp.age} Jahre</p>
        `;
        
        // Füge die Elemente zum Container hinzu
        currentGlowUpElement.appendChild(imageElement);
        currentGlowUpElement.appendChild(infoElement);
        
        // Füge einen Klick-Event-Listener zum Bild hinzu
        imageElement.addEventListener('click', handleImageClick);
        
        // Stelle die Bewertung wieder her, falls vorhanden
        restoreRating();
    }

    // Behandelt das Klicken auf das Bild
    function handleImageClick(event) {
        const glowUp = glowUps[currentIndex];
        const imageElement = event.target;
        const currentState = imageElement.dataset.state;
        
        if (currentState === 'before-blurred') {
            // Entferne den Blur-Effekt
            imageElement.classList.remove('blurred');
            imageElement.dataset.state = 'before-clear';
        } else if (currentState === 'before-clear') {
            // Wechsle zum Nachher-Bild mit Animation
            imageElement.style.opacity = 0;
            
            setTimeout(() => {
                imageElement.src = glowUp.afterImage;
                imageElement.alt = `${glowUp.name} nachher`;
                imageElement.dataset.state = 'after';
                imageElement.style.opacity = 1;
            }, 300);
        }
    }

    // Event-Listener für die Bewertungsbuttons
    function setupRatingButtons() {
        likeBtn.addEventListener('click', () => setRating('like'));
        superlikeBtn.addEventListener('click', () => setRating('superlike'));
        goldenBuzzerBtn.addEventListener('click', () => setRating('goldenbuzzer'));
    }

    // Setze eine Bewertung
    function setRating(ratingType) {
        const glowUpId = glowUps[currentIndex].id;
        
        // Entferne bisherige Auswahl
        clearSelectedRatingButtons();
        
        // Markiere den ausgewählten Button
        switch (ratingType) {
            case 'like':
                likeBtn.classList.add('selected');
                break;
            case 'superlike':
                superlikeBtn.classList.add('selected');
                break;
            case 'goldenbuzzer':
                goldenBuzzerBtn.classList.add('selected');
                break;
        }
        
        // Speichere die Bewertung
        ratings[glowUpId] = ratingType;
        localStorage.setItem('glowUpRatings', JSON.stringify(ratings));
    }

    // Entferne die Auswahl aller Bewertungsbuttons
    function clearSelectedRatingButtons() {
        likeBtn.classList.remove('selected');
        superlikeBtn.classList.remove('selected');
        goldenBuzzerBtn.classList.remove('selected');
    }

    // Stelle eine vorherige Bewertung wieder her
    function restoreRating() {
        const glowUpId = glowUps[currentIndex].id;
        const rating = ratings[glowUpId];
        
        if (rating) {
            switch (rating) {
                case 'like':
                    likeBtn.classList.add('selected');
                    break;
                case 'superlike':
                    superlikeBtn.classList.add('selected');
                    break;
                case 'goldenbuzzer':
                    goldenBuzzerBtn.classList.add('selected');
                    break;
            }
        }
    }

    // Event-Listener für die Navigationsbuttons
    function setupNavigationButtons() {
        prevBtn.addEventListener('click', goToPreviousGlowUp);
        nextBtn.addEventListener('click', goToNextGlowUp);
    }

    // Gehe zum vorherigen Glow-Up
    function goToPreviousGlowUp() {
        if (currentIndex > 0) {
            currentIndex--;
            updateProgress();
            displayCurrentGlowUp();
        }
    }

    // Gehe zum nächsten Glow-Up oder zeige Ergebnisse an
    function goToNextGlowUp() {
        const currentGlowUpId = glowUps[currentIndex].id;
        
        // Überprüfe, ob das aktuelle Glow-Up bewertet wurde
        if (!ratings[currentGlowUpId]) {
            const confirmation = confirm('Du hast dieses Glow-Up noch nicht bewertet. Möchtest du trotzdem fortfahren?');
            if (!confirmation) {
                return;
            }
        }
        
        // Wenn wir beim letzten Glow-Up sind, zeige die Ergebnisse an
        if (currentIndex === glowUps.length - 1) {
            showResults();
            return;
        }
        
        // Sonst gehe zum nächsten Glow-Up
        currentIndex++;
        updateProgress();
        displayCurrentGlowUp();
    }

    // Zeige die Ergebnisse an
    function showResults() {
        // Verstecke die Galerie und zeige die Ergebnisse an
        galleryContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        
        // Leere alle Ergebnis-Container
        likeResults.innerHTML = '';
        superlikeResults.innerHTML = '';
        goldenBuzzerResults.innerHTML = '';
        
        // Fülle die Ergebnis-Container mit den bewerteten Glow-Ups
        glowUps.forEach(glowUp => {
            const rating = ratings[glowUp.id];
            if (rating) {
                const resultItemHTML = createResultItemHTML(glowUp);
                
                switch (rating) {
                    case 'like':
                        likeResults.innerHTML += resultItemHTML;
                        break;
                    case 'superlike':
                        superlikeResults.innerHTML += resultItemHTML;
                        break;
                    case 'goldenbuzzer':
                        goldenBuzzerResults.innerHTML += resultItemHTML;
                        break;
                }
            }
        });
        
        // Füge eine Nachricht hinzu, wenn eine Kategorie leer ist
        if (likeResults.innerHTML === '') {
            likeResults.innerHTML = '<p>Keine Likes vergeben</p>';
        }
        if (superlikeResults.innerHTML === '') {
            superlikeResults.innerHTML = '<p>Keine Superlikes vergeben</p>';
        }
        if (goldenBuzzerResults.innerHTML === '') {
            goldenBuzzerResults.innerHTML = '<p>Keine Golden Buzzer vergeben</p>';
        }
    }

    // Erstelle das HTML für ein Ergebnis-Element
    function createResultItemHTML(glowUp) {
        return `
            <div class="result-item slide-in">
                <div class="result-images">
                    <img src="${glowUp.beforeImage}" alt="${glowUp.name} vorher">
                    <img src="${glowUp.afterImage}" alt="${glowUp.name} nachher">
                </div>
                <div class="result-info">
                    <h4>${glowUp.name}</h4>
                    <p>${glowUp.age} Jahre</p>
                </div>
            </div>
        `;
    }

    // Neustart der Anwendung
    function setupRestartButton() {
        restartBtn.addEventListener('click', () => {
            currentIndex = 0;
            galleryContainer.classList.remove('hidden');
            resultsContainer.classList.add('hidden');
            updateProgress();
            displayCurrentGlowUp();
        });
    }

    // Funktion zum Parsen der Dateinamen nach dem Muster: name..v_alter.erweiterung
    function parseFileName(fileName) {
        const regex = /^(.+)\.\.([vn])(?:_(\d+))?\.([a-zA-Z]+)$/;
        const match = fileName.match(regex);
        
        if (match) {
            return {
                name: match[1],
                type: match[2] === 'v' ? 'before' : 'after',
                age: match[3] ? parseInt(match[3]) : null,
                extension: match[4]
            };
        }
        
        return null;
    }

    // Initialisierung
    function init() {
        loadRatings();
        loadGlowUps();
        setupRatingButtons();
        setupNavigationButtons();
        setupRestartButton();
    }

    // Starte die Anwendung
    init();
}); 