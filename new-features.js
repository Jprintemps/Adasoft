document.addEventListener('DOMContentLoaded', function () {
      // --- Gemini API Integration ---
      const apiKey = "AIzaSyCQ_FzPsoDakD13QBnMgEtoPrnV2nbEjIA"; // This will be provided by the runtime environment

      async function callGemini(prompt, systemInstruction = "") {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        if (systemInstruction) {
            payload.systemInstruction = { parts: [{ text: systemInstruction }] };
        }
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) { throw new Error(`API call failed with status: ${response.status}`); }
            const result = await response.json();
            const candidate = result.candidates?.[0];
            if (candidate && candidate.content?.parts?.[0]?.text) {
                return candidate.content.parts[0].text;
            } else {
                console.error("Unexpected API response structure:", result);
                return "Désolé, je n'ai pas pu générer de réponse. Veuillez réessayer.";
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            return "Une erreur s'est produite lors de la communication avec l'IA.";
        }
      }
      
      async function callImagenApi(prompt) {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
        const payload = { instances: [{ prompt: prompt }], parameters: { "sampleCount": 1 } };
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
            const result = await response.json();
            if (result.predictions && result.predictions.length > 0 && result.predictions[0].bytesBase64Encoded) {
              return `data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`;
            } else {
              console.error("Unexpected image API response structure:", result);
              return null;
            }
        } catch (error) {
            console.error("Error calling Imagen API:", error);
            return null;
        }
      }

      // --- Quote Configurator ---
      const configuratorForm = document.getElementById('configurator-form');
      if (configuratorForm) {
        const quoteSummary = document.getElementById('quote-summary');
        const quoteTotal = document.getElementById('quote-total');
        const generateDescBtn = document.getElementById('generate-description');
        const aiDescOutput = document.getElementById('ai-description-output');
        const serviceOptions = document.querySelectorAll('.service-option');

        function updateQuote() {
          const selectedServices = configuratorForm.querySelectorAll('input[name="service"]:checked');
          let total = 0;
          let summaryHtml = '';
          if (selectedServices.length > 0) {
              summaryHtml += '<ul>';
              selectedServices.forEach(service => {
                  const price = parseFloat(service.value);
                  const name = service.dataset.name;
                  total += price;
                  summaryHtml += `<li><span>${name}</span><span>${price} $</span></li>`;
              });
              summaryHtml += '</ul>';
              generateDescBtn.disabled = false;
          } else {
              summaryHtml = '<p style="color: var(--color-white);">Sélectionnez des services pour commencer.</p>';
              generateDescBtn.disabled = true;
              aiDescOutput.classList.add('hidden');
          }
          quoteSummary.innerHTML = summaryHtml;
          quoteTotal.textContent = total + ' $';
        }

        serviceOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const checkbox = option.querySelector('input[type="checkbox"]');
                if (e.target.tagName !== 'INPUT') {
                  checkbox.checked = !checkbox.checked;
                }
                const isChecked = checkbox.checked;
                if(isChecked) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
                updateQuote();
            });
        });

        generateDescBtn.addEventListener('click', async () => {
          const selectedServices = Array.from(configuratorForm.querySelectorAll('input[name="service"]:checked')).map(s => s.dataset.name);
          if (selectedServices.length === 0) return;
          aiDescOutput.classList.remove('hidden');
          aiDescOutput.innerHTML = '<div class="loader" style="margin:auto;"></div>';
          generateDescBtn.disabled = true;
          const prompt = `En tant qu'expert en branding, rédige une brève description de projet (2-3 phrases percutantes) pour un client qui a sélectionné les services suivants : ${selectedServices.join(', ')}. Mets en avant la valeur ajoutée et l'impact attendu. Le ton doit être professionnel, confiant et inspirant.`;
          const description = await callGemini(prompt);
          aiDescOutput.innerHTML = `<p>${description.replace(/\n/g, '<br>')}</p>`;
          generateDescBtn.disabled = false;
        });

        updateQuote();
      }
      
      // --- AI Branding Workshop ---
      const tabs = document.querySelectorAll('.ai-tab');
      const tabContents = document.querySelectorAll('.ai-tab-content');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            tabContents.forEach(content => {
                if (content.id === `tab-${target}`) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
      });

      // --- Slogan Generator ---
      const sloganBtn = document.getElementById('slogan-btn');
      if (sloganBtn) {
        const sloganInput = document.getElementById('slogan-input');
        const sloganOutput = document.getElementById('slogan-output');
        sloganBtn.addEventListener('click', async () => {
            const businessDesc = sloganInput.value.trim();
            if (!businessDesc) {
                sloganOutput.innerHTML = '<p>Veuillez décrire votre entreprise.</p>';
                return;
            }
            sloganOutput.innerHTML = '<div class="loader" style="margin:auto;"></div>';
            sloganBtn.disabled = true;
            const prompt = `Agis en tant que copywriter expert en branding. Génère 5 slogans courts, percutants et mémorables pour l'entreprise suivante : "${businessDesc}". Varie les styles (ex: un descriptif, un poétique, un direct). Formatte la réponse comme une liste à puces.`;
            const slogans = await callGemini(prompt);
            sloganOutput.innerHTML = `<ul>${slogans.replace(/\* /g, '<li style="margin-bottom: 0.5rem;">').replace(/\n/g, '')}</ul>`;
            sloganBtn.disabled = false;
        });
      }
      
      // --- Brand Voice Analyzer ---
      const voiceBtn = document.getElementById('voice-btn');
      if (voiceBtn) {
        const voiceInput = document.getElementById('voice-input');
        const voiceOutput = document.getElementById('voice-output');
        voiceBtn.addEventListener('click', async () => {
            const textToAnalyze = voiceInput.value.trim();
            if (!textToAnalyze) {
                voiceOutput.innerHTML = '<p>Veuillez coller un texte à analyser.</p>';
                return;
            }
            voiceOutput.innerHTML = '<div class="loader" style="margin:auto;"></div>';
            voiceBtn.disabled = true;
            const prompt = `Agis en tant qu'analyste de marque expert. Analyse le texte suivant et décris son "ton de voix" (tone of voice) en 3-4 points clés (ex: 'Professionnel mais accessible', 'Inspirant et énergique'). Ensuite, donne une suggestion concrète pour l'améliorer. Le texte à analyser est : "${textToAnalyze}"`;
            const analysis = await callGemini(prompt);
            voiceOutput.innerHTML = analysis.replace(/\n/g, '<br>');
            voiceBtn.disabled = false;
        });
      }
      
      // --- Palette & Style Generator ---
      const paletteBtn = document.getElementById('palette-btn');
      if (paletteBtn) {
        const paletteInput = document.getElementById('palette-input');
        const paletteOutput = document.getElementById('palette-output');
        paletteBtn.addEventListener('click', async () => {
            const brandDescription = paletteInput.value.trim();
            if (!brandDescription) {
                paletteOutput.innerHTML = '<p>Veuillez décrire votre marque.</p>';
                return;
            }
            paletteOutput.innerHTML = '<div class="loader" style="margin:auto;"></div>';
            paletteBtn.disabled = true;

            const prompt = `Agis en tant que directeur artistique expert. Pour la description de marque suivante : "${brandDescription}", génère une identité visuelle de base. Réponds UNIQUEMENT avec un objet JSON valide sans aucun autre texte. L'objet doit avoir la structure suivante : { "colorPalette": ["#XXXXXX", "#XXXXXX", "#XXXXXX", "#XXXXXX", "#XXXXXX"], "fontPairing": { "headline": "Nom de police Google Fonts", "body": "Nom de police Google Fonts" }, "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3"] }. Assure-toi que les couleurs sont harmonieuses.`;
            
            let resultText = await callGemini(prompt);
            
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                paletteOutput.innerHTML = '<p>L\'IA a retourné une réponse invalide. Veuillez réessayer.</p>';
                paletteBtn.disabled = false;
                return;
            }
            
            try {
              const resultJson = JSON.parse(jsonMatch[0]);
              renderPalette(resultJson);
            } catch(e) {
              console.error("JSON parsing error:", e);
              paletteOutput.innerHTML = "<p>Erreur lors de l'interprétation de la réponse de l'IA.</p>";
            }
            paletteBtn.disabled = false;
        });
      }

      function renderPalette(data) {
          const paletteOutput = document.getElementById('palette-output');
          if (!paletteOutput) return;
          let html = '<div>';
          html += '<h4 style="font-weight: 700; color: var(--color-dark); margin-bottom: 0.5rem;">Palette de Couleurs</h4>';
          html += '<div class="colors">';
          data.colorPalette.forEach(color => {
              html += `<div class="color-swatch" style="background-color: ${color};"></div>`;
          });
          html += '</div>';
          html += '<h4 style="font-weight: 700; color: var(--color-dark); margin-bottom: 0.5rem;">Suggestion de Polices</h4>';
          html += `<p style="color: var(--color-text);">Titre: <span style="font-weight: 600;">${data.fontPairing.headline}</span></p>`;
          html += `<p style="color: var(--color-text); margin-bottom: 1rem;">Corps: <span style="font-weight: 600;">${data.fontPairing.body}</span></p>`;
          html += '<h4 style="font-weight: 700; color: var(--color-dark); margin-bottom: 0.5rem;">Mots-clés d\'Inspiration</h4>';
          html += '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">';
          data.keywords.forEach(keyword => {
              html += `<span style="background-color: var(--color-neutral-1); color: var(--color-dark); font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 9999px;">${keyword}</span>`;
          });
          html += '</div></div>';
          paletteOutput.innerHTML = html;
      }
      
      // --- Logo Concept Visualizer ---
      const logoBtn = document.getElementById('logo-btn');
      if (logoBtn) {
        const logoInput = document.getElementById('logo-input');
        const logoOutput = document.getElementById('logo-output');
        logoBtn.addEventListener('click', async () => {
            const brandDescription = logoInput.value.trim();
            if (!brandDescription) {
                logoOutput.innerHTML = '<p>Veuillez décrire votre marque.</p>';
                return;
            }
            logoOutput.innerHTML = '<div class="loader" style="margin:auto;"></div>';
            logoBtn.disabled = true;
            
            const prompt = `Agis en tant que directeur de création expert. Pour la description de marque suivante : '${brandDescription}', génère 3 concepts de logo distincts. Pour chaque concept, fournis un titre (ex: 'Concept Minimaliste et Naturel') et une description détaillée (prompt) qui pourrait être utilisée par une IA de génération d'images comme Midjourney ou DALL-E. La description doit être riche en détails visuels : style (ex: minimaliste, géométrique, dessiné à la main), icône ou symbole principal, typographie, couleurs et ambiance générale. Formatte ta réponse en utilisant '### ' pour le titre de chaque concept et '---' pour les séparer.`;
            
            const concepts = await callGemini(prompt);
            renderLogoConcepts(concepts);
            logoBtn.disabled = false;
        });
      }

      function renderLogoConcepts(text) {
          const logoOutput = document.getElementById('logo-output');
          if (!logoOutput) return;
          const concepts = text.split('---').filter(c => c.trim() !== '');
          let html = '<div style="display: flex; flex-direction: column; gap: 1.5rem;">';
          concepts.forEach((concept, index) => {
              const parts = concept.split('### ');
              if(parts.length < 2) return;
              const titleAndDesc = parts[1].split('\n');
              const title = titleAndDesc.shift().trim();
              const description = titleAndDesc.join(' ').trim();
              html += `<div class="logo-concept-card">
                  <div style="flex-grow: 1;">
                      <h4 style="font-weight: 700; color: var(--color-primary); margin-bottom: 0.5rem;">${title}</h4>
                      <p style="font-size: 0.875rem; color: var(--color-text); font-style: italic; margin-bottom: 0.75rem;">"${description}"</p>
                      <button class="generate-image-btn btn btn--secondary" style="font-size: 0.875rem; padding: 0.25rem 0.75rem;" data-prompt="${encodeURIComponent(description)}" data-target="logo-image-${index}"> Générer l'image du logo</button>
                  </div>
                  <div id="logo-image-${index}" class="logo-image-container">
                      Aperçu ici
                  </div>
              </div>`;
          });
          html += '</div>';
          logoOutput.innerHTML = html;
          addImageGenerationListeners();
      }

      // --- Social Post Generator ---
      const socialPostBtn = document.getElementById('social-post-btn');
      if (socialPostBtn) {
        const socialPostInput = document.getElementById('social-post-input');
        const socialPlatformSelect = document.getElementById('social-platform');
        const socialPostOutput = document.getElementById('social-post-output');
        socialPostBtn.addEventListener('click', async () => {
            const topic = socialPostInput.value.trim();
            const platform = socialPlatformSelect.value;
            if (!topic) {
                socialPostOutput.innerHTML = '<p>Veuillez entrer un sujet pour votre post.</p>';
                return;
            }
            socialPostOutput.innerHTML = '<div class="loader" style="margin:auto;"></div>';
            socialPostBtn.disabled = true;

            const prompt = `Agis en tant que social media manager expert. Pour la plateforme '${platform}', rédige un post engageant sur le sujet suivant : '${topic}'. Inclus des hashtags pertinents. Sépare clairement le texte du post et une suggestion de prompt pour une image d'accompagnement. Utilise les marqueurs suivants : "TEXTE DU POST:" et "SUGGESTION D'IMAGE:".`;
            const result = await callGemini(prompt);

            renderSocialPost(result);
            socialPostBtn.disabled = false;
        });
      }
        
      function renderSocialPost(text) {
          const socialPostOutput = document.getElementById('social-post-output');
          if (!socialPostOutput) return;
          const textMarker = "TEXTE DU POST:";
          const imageMarker = "SUGGESTION D'IMAGE:";

          const textIndex = text.indexOf(textMarker);
          const imageIndex = text.indexOf(imageMarker);
          
          let postText = "N/A";
          let imagePrompt = "N/A";

          if (textIndex !== -1 && imageIndex !== -1) {
              postText = text.substring(textIndex + textMarker.length, imageIndex).trim();
              imagePrompt = text.substring(imageIndex + imageMarker.length).trim();
          } else if (textIndex !== -1) {
              postText = text.substring(textIndex + textMarker.length).trim();
          }
          
          let html = `
              <div id="social-post-output-text">${postText}</div>
              <div id="social-post-output-image-prompt">
                  <p style="font-weight: 600; color: var(--color-dark); margin-bottom: 0.5rem;">Suggestion d'image :</p>
                  <p style="font-style: italic; color: var(--color-text); margin-bottom: 1rem;">"${imagePrompt}"</p>
                  <button class="generate-image-btn btn btn--secondary" style="font-size: 0.875rem; padding: 0.25rem 0.75rem;" data-prompt="${encodeURIComponent(imagePrompt)}" data-target="social-image-container"> Générer l'image</button>
              </div>
              <div id="social-image-container"></div>
          `;
          
          socialPostOutput.innerHTML = html;
          addImageGenerationListeners();
      }
      
      // --- NEW: Copywriting Tool ---
      const copywritingBtn = document.getElementById('copywriting-btn');
      if (copywritingBtn) {
          const objectiveSelect = document.getElementById('copy-objective-select');
          const productLabel = document.getElementById('copy-product-label');
          const productInput = document.getElementById('copy-product-input');
          const benefitLabel = document.getElementById('copy-benefit-label');
          const benefitInput = document.getElementById('copy-benefit-input');

          objectiveSelect.addEventListener('change', (e) => {
              if (e.target.value === 'Événement') {
                  productLabel.textContent = 'Nom de l\'événement :';
                  productInput.placeholder = 'Ex: Webinaire sur le branding';
                  benefitLabel.textContent = 'Objectif principal de l\'événement :';
                  benefitInput.placeholder = 'Ex: Apprendre à créer une marque forte';
              } else {
                  productLabel.textContent = 'Produit/Service :';
                  productInput.placeholder = 'Ex: coaching en nutrition';
                  benefitLabel.textContent = 'Bénéfice principal :';
                  benefitInput.placeholder = 'Ex: perdre 5kg en 2 mois';
              }
          });

          copywritingBtn.addEventListener('click', async () => {
              const objective = objectiveSelect.value;
              const product = productInput.value.trim();
              const target = document.getElementById('copy-target-input').value.trim();
              const benefit = benefitInput.value.trim();
              const tone = document.getElementById('copy-tone-select').value;
              const format = document.getElementById('copy-format-select').value;
              const outputDiv = document.getElementById('copywriting-output');

              if (!product || !target || !benefit) {
                  outputDiv.innerHTML = '<p style="color: red;">Veuillez remplir les trois premiers champs.</p>';
                  return;
              }

              outputDiv.innerHTML = '<div class="loader" style="margin:auto;"></div>';
              copywritingBtn.disabled = true;
              
              let prompt;
              if (objective === 'Vente') {
                   prompt = `Agis en tant que copywriter expert. Basé sur le brief suivant, génère des briques de texte modulaires.
- Produit/Service: ${product}
- Cible: ${target}
- Bénéfice Principal: ${benefit}
- Ton: ${tone}
- Format: ${format}

Génère les éléments suivants en utilisant des marqueurs clairs :
## Headlines
(3 accroches punchy)
## Sublines
(2 sublines qui renforcent la promesse)
## CTA
(3 appels à l’action variés)
## Mini-pitch
(Un résumé de 2-3 phrases)
## Punchlines Sociales
(2 versions courtes pour les réseaux sociaux)
## Structure Suggérée
(Propose une structure simple pour le format '${format}' en utilisant les titres des briques générées, ex: Headline -> Mini-pitch -> CTA)`;
              } else { // Event
                  prompt = `Agis en tant qu'expert en communication événementielle. Basé sur le brief suivant, génère des briques de texte modulaires pour promouvoir un événement.
- Événement: ${product}
- Cible: ${target}
- Bénéfice/Objectif: ${benefit}
- Ton: ${tone}
- Format: ${format}

Génère les éléments suivants en utilisant des marqueurs clairs :
## Titres Accrocheurs
(3 titres pour l'événement)
## Pitch de l'Événement
(Un résumé de 2-3 phrases qui donne envie de participer)
## Informations Clés
(Génère des placeholders pour la Date, l'Heure, et le Lieu)
## Appels à l'Action
(3 CTA variés pour l'inscription ou pour en savoir plus)
## Structure Suggérée
(Propose une structure simple pour le format '${format}' en utilisant les titres des briques générées, ex: Titre Accrocheur -> Pitch -> Informations Clés -> CTA)`;
              }

              const result = await callGemini(prompt);
              renderCopywritingOutput(result);
              copywritingBtn.disabled = false;
          });
      }

      function renderCopywritingOutput(text) {
        const outputDiv = document.getElementById('copywriting-output');
        const sections = text.split('## ').filter(s => s.trim() !== '');
        let html = '';

        sections.forEach(section => {
            const lines = section.split('\n').filter(l => l.trim() !== '');
            const title = lines.shift();
            html += `<h4>${title}</h4>`;
            html += '<ul>';
            lines.forEach(line => {
                html += `<li>${line.replace(/^- /, '').replace(/\* /, '')}</li>`;
            });
            html += '</ul>';
        });
        outputDiv.innerHTML = html;
      }


      function addImageGenerationListeners() {
          document.querySelectorAll('.generate-image-btn').forEach(button => {
              button.addEventListener('click', async (e) => {
                  const btn = e.target;
                  const prompt = decodeURIComponent(btn.dataset.prompt);
                  const targetContainer = document.getElementById(btn.dataset.target);
                  
                  if (!targetContainer) return;
                  
                  targetContainer.innerHTML = '<div class="loader"></div>';
                  btn.disabled = true;
                  
                  let apiPrompt = prompt;
                  if (btn.dataset.target.startsWith('logo-image')) {
                      apiPrompt = `Logo concept: ${prompt}. vector, simple, centered on a white background.`;
                  } else {
                      apiPrompt = `Photorealistic image for a social media post: ${prompt}.`;
                  }

                  const imageUrl = await callImagenApi(apiPrompt);
                  
                  if (imageUrl) {
                      targetContainer.innerHTML = `<img src="${imageUrl}" alt="Image générée par IA" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius);">`;
                  } else {
                      targetContainer.innerHTML = '<p style="color: red; font-size: 0.75rem; padding: 0.5rem;">Erreur de génération.</p>';
                  }
                  btn.disabled = false;
              });
          });
      }
      
      // --- Booking Calendar ---
      const bookingStep1 = document.getElementById('booking-step-1');
      if (bookingStep1) {
        const bookingStep2 = document.getElementById('booking-step-2');
        const bookingStep3 = document.getElementById('booking-step-3');
        const bookingSummary = document.getElementById('booking-summary');
        const bookingForm = document.getElementById('booking-form');
        const backToSlotsBtn = document.getElementById('back-to-slots');
        
        const monthYearEl = document.getElementById('month-year'), datesEl = document.getElementById('calendar-dates'), daysEl = document.getElementById('calendar-days'), slotsContainer = document.getElementById('slots-container');
        let currentDate = new Date();
        let bookingDetails = { date: null, time: null };

        function renderCalendar() {
          const month = currentDate.getMonth(), year = currentDate.getFullYear();
          monthYearEl.textContent = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate);
          datesEl.innerHTML = ''; daysEl.innerHTML = ''; ['D', 'L', 'M', 'M', 'J', 'V', 'S'].forEach(d => { daysEl.innerHTML += `<div>${d}</div>`; });
          const firstDay = new Date(year, month, 1).getDay(), lastDate = new Date(year, month + 1, 0).getDate();
          for (let i = 0; i < firstDay; i++) { datesEl.innerHTML += '<div></div>'; }
          for (let i = 1; i <= lastDate; i++) {
            const date = new Date(year, month, i); const isPast = date < new Date().setHours(0,0,0,0); const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            let classes = `calendar-date ${(isPast || isWeekend) ? "disabled" : ""}`;
            datesEl.innerHTML += `<div class="${classes}" data-date="${date.toISOString().split('T')[0]}">${i}</div>`;
          }
        }
        document.getElementById('prev-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
        document.getElementById('next-month').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
        
        datesEl.addEventListener('click', (e) => {
          if (e.target.classList.contains('calendar-date') && !e.target.classList.contains('disabled')) {
            document.querySelectorAll('.calendar-date').forEach(d => d.classList.remove('selected'));
            e.target.classList.add('selected');
            bookingDetails.date = new Date(e.target.dataset.date);
            const slots = ['11:00', '15:00', '20:00'];
            slotsContainer.innerHTML = ''; slots.forEach(slot => { slotsContainer.innerHTML += `<button class="slot-btn" data-time="${slot}">${slot}</button>`; });
          }
        });
        
        slotsContainer.addEventListener('click', (e) => {
          if(e.target.classList.contains('slot-btn')) {
              bookingDetails.time = e.target.dataset.time;
              const formattedDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' }).format(bookingDetails.date);
              bookingSummary.textContent = `Vous réservez un appel pour le ${formattedDate} à ${bookingDetails.time}.`;
              bookingStep1.classList.add('hidden');
              bookingStep2.classList.remove('hidden');
          }
        });

        backToSlotsBtn.addEventListener('click', () => {
          bookingStep2.classList.add('hidden');
          bookingStep1.classList.remove('hidden');
        });

        bookingForm.addEventListener('submit', (e) => {
          e.preventDefault();
          console.log('Booking confirmed for:', {
              name: e.target.name.value,
              email: e.target.email.value,
              project: e.target.project.value,
              ...bookingDetails
          });
          bookingStep2.classList.add('hidden');
          bookingStep3.classList.remove('hidden');
        });

        renderCalendar();
      }
      
      // --- Chatbot ---
      const chatToggle = document.getElementById('chat-toggle');
      if (chatToggle) {
        const chatWindow = document.getElementById('chat-window');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        
        chatToggle.addEventListener('click', () => { chatWindow.classList.toggle('hidden'); });

        chatForm.addEventListener('submit', async (e) => {
          e.preventDefault(); 
          const userMessage = chatInput.value.trim(); 
          if (!userMessage) return;
          appendMessage(userMessage, 'user'); 
          chatInput.value = '';
          const typingIndicator = appendMessage('...', 'ai', true);
          const systemInstruction = "Tu es un assistant virtuel pour Adasoft, une agence de design spécialisée en branding et création de logo. Ton but est de répondre aux questions des visiteurs de manière amicale, concise et professionnelle. Les services incluent le design de logo, l'identité visuelle, la création de sites web. Les tarifs commencent à 80$. Le processus de design se fait en 4 étapes : Découverte, Recherche, Design, Livraison. Pousse subtilement l'utilisateur à prendre rendez-vous ou à demander un devis pour des questions complexes.";
          const aiResponse = await callGemini(userMessage, systemInstruction);
          typingIndicator.remove();
          appendMessage(aiResponse, 'ai');
        });
      }

      function appendMessage(text, sender, isTyping = false) {
        const chatHistory = document.getElementById('chat-history');
        const msgWrapper = document.createElement('div'); msgWrapper.className = `chat-message ${sender}`;
        const msgBubble = document.createElement('span'); msgBubble.className = `bubble`;
        msgBubble.innerHTML = isTyping ? '<div class="loader" style="width:20px; height:20px; border-width: 2px;"></div>' : text;
        msgWrapper.appendChild(msgBubble); 
        chatHistory.appendChild(msgWrapper);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        return msgWrapper;
      }
    });