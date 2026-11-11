/* Visionneuse PDF : affiche un PDF page par page, avec flèches, clavier et balayage tactile.
   Utilisation : <div class="pdf-viewer" data-pdf="pdf/mon-fichier.pdf"></div>
   Options : data-hauteur="160" règle la hauteur (en % de l'écran, 110 par défaut)
             data-largeur="1200" règle la largeur maximale en px (1100 par défaut). */
(function () {
  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  var boites = document.querySelectorAll('.pdf-viewer');
  if (!boites.length) return;

  function chargerPdfJs() {
    return new Promise(function (ok, ko) {
      if (window.pdfjsLib) return ok();
      var s = document.createElement('script');
      s.src = CDN + 'pdf.min.js';
      s.onload = function () {
        pdfjsLib.GlobalWorkerOptions.workerSrc = CDN + 'pdf.worker.min.js';
        ok();
      };
      s.onerror = ko;
      document.head.appendChild(s);
    });
  }

  function initialiser(boite) {
    var url = boite.dataset.pdf;
    boite.innerHTML =
      '<div class="pdf-scene" tabindex="0" aria-label="Visionneuse de PDF : flèches gauche et droite pour changer de page">' +
        '<canvas></canvas>' +
        '<button type="button" class="pdf-fleche pdf-prec" aria-label="Page précédente">&#8249;</button>' +
        '<button type="button" class="pdf-fleche pdf-suiv" aria-label="Page suivante">&#8250;</button>' +
      '</div>' +
      '<div class="pdf-barre"><span class="pdf-compteur" aria-live="polite"></span>' +
      '<a class="pdf-lien" download>Télécharger le PDF</a></div>';

    var scene = boite.querySelector('.pdf-scene');
    var canvas = boite.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var prec = boite.querySelector('.pdf-prec');
    var suiv = boite.querySelector('.pdf-suiv');
    var compteur = boite.querySelector('.pdf-compteur');
    var barre = boite.querySelector('.pdf-barre');
    boite.querySelector('.pdf-lien').href = url;

    var doc = null, numero = 1, enCours = false, enAttente = false;

    function afficher() {
      if (!doc) return;
      if (enCours) { enAttente = true; return; }
      enCours = true;
      doc.getPage(numero).then(function (page) {
        var base = page.getViewport({ scale: 1 });
        var dpr = window.devicePixelRatio || 1;
        var part = (parseFloat(boite.dataset.hauteur) || 85) / 100;
        // Largeur dispo : 96 % de l'écran, 1100 px maximum (réglable avec data-largeur)
        var largeur = Math.min(window.innerWidth * 0.96, parseFloat(boite.dataset.largeur) || 1100);
        // La visionneuse se centre et déborde de la colonne de texte, sans dépendre du CSS
        boite.style.maxWidth = 'none';
        boite.style.width = largeur + 'px';
        boite.style.position = 'relative';
        boite.style.left = '50%';
        boite.style.transform = 'translateX(-50%)';
        // La page entre dans la largeur dispo ET dans la part voulue de la hauteur d'écran
        var echelle = Math.min(largeur / base.width, (window.innerHeight * part) / base.height);
        var vp = page.getViewport({ scale: echelle * dpr });
        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.width = (vp.width / dpr) + 'px';
        canvas.style.height = (vp.height / dpr) + 'px';
        barre.style.width = canvas.style.width;
        return page.render({ canvasContext: ctx, viewport: vp }).promise;
      }).then(function () {
        compteur.textContent = 'Page ' + numero + ' / ' + doc.numPages;
        prec.disabled = numero <= 1;
        suiv.disabled = numero >= doc.numPages;
      }).catch(erreur).then(function () {
        enCours = false;
        if (enAttente) { enAttente = false; afficher(); }
      });
    }

    function aller(delta) {
      var n = numero + delta;
      if (n < 1 || n > doc.numPages) return;
      numero = n;
      afficher();
    }

    function erreur() {
      boite.classList.add('pdf-erreur');
      compteur.textContent = 'Le PDF ne peut pas s\u2019afficher ici. Utilise le lien pour le télécharger.';
    }

    prec.addEventListener('click', function () { aller(-1); });
    suiv.addEventListener('click', function () { aller(1); });
    scene.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); aller(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); aller(1); }
    });

    // Balayage au doigt sur mobile
    var departX = null;
    scene.addEventListener('touchstart', function (e) { departX = e.touches[0].clientX; }, { passive: true });
    scene.addEventListener('touchend', function (e) {
      if (departX === null) return;
      var dx = e.changedTouches[0].clientX - departX;
      if (Math.abs(dx) > 50) aller(dx < 0 ? 1 : -1);
      departX = null;
    }, { passive: true });

    // Réaffiche nettement si la fenêtre change de taille
    var minuteur;
    window.addEventListener('resize', function () {
      clearTimeout(minuteur);
      minuteur = setTimeout(afficher, 200);
    });

    compteur.textContent = 'Chargement…';
    pdfjsLib.getDocument(url).promise.then(function (pdf) {
      doc = pdf;
      afficher();
    }).catch(erreur);
  }

  chargerPdfJs().then(function () {
    boites.forEach(initialiser);
  }).catch(function () {
    boites.forEach(function (b) {
      b.innerHTML = '<a class="pdf-lien" href="' + b.dataset.pdf + '">Ouvrir le PDF</a>';
    });
  });
})();