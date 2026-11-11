/* Filtres de projets par catégorie.
   Chaque projet porte data-categorie="affiches" (ou web, logotype, edition).
   Un projet dans deux catégories : data-categorie="web logotype".
   Un projet sans data-categorie n'apparaît que dans « Tous ». */
(function () {
  var boutons = document.querySelectorAll('.filtres button');
  var grille = document.querySelector('.grille');
  var cartes = document.querySelectorAll('.grille .projet');
  if (!boutons.length || !grille || !cartes.length) return;

  function appartient(carte, choix) {
    if (choix === 'tous') return true;
    return (carte.dataset.categorie || '').split(/\s+/).indexOf(choix) !== -1;
  }

  // Message affiché quand une catégorie est vide
  var vide = document.createElement('p');
  vide.className = 'vide';
  vide.hidden = true;
  vide.textContent = 'Aucun projet dans cette catégorie pour le moment.';
  grille.parentNode.insertBefore(vide, grille.nextSibling);

  // Compteur à la fin de la barre de filtres : il suit le filtre choisi
  var compteur = document.createElement('span');
  compteur.className = 'filtres-compteur';
  compteur.setAttribute('aria-live', 'polite');
  boutons[0].parentNode.appendChild(compteur);

  function filtrer(choix) {
    var premier = true;
    var nb = 0;
    cartes.forEach(function (carte) {
      var visible = appartient(carte, choix);
      carte.hidden = !visible;
      // Le premier projet visible est celui qui s'affiche en grand
      carte.classList.toggle('premier', visible && premier);
      if (visible) { premier = false; nb++; }
    });
    compteur.innerHTML = '<strong>' + nb + '</strong> ' + (nb > 1 ? 'projets' : 'projet');
    vide.hidden = !premier; // reste vrai seulement si aucun projet n'est visible
    boutons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.filtre === choix ? 'true' : 'false');
    });
  }

  boutons.forEach(function (b) {
    b.addEventListener('click', function () { filtrer(b.dataset.filtre); });
  });

  filtrer('tous');
})();