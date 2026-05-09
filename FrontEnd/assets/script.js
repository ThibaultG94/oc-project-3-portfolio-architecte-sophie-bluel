const API_URL = "http://localhost:5678/api";

// ─── API ──────────────────────────────────────────────

async function fetchWorks() {
  try {
    // Récupère tous les projets.
    const response = await fetch(`${API_URL}/works`);

    // Stoppe la fonction si l'API renvoie une erreur.
    if (!response.ok) {
      throw new Error(
        `Impossible de récupérer les données. Status: ${response.status}`
      );
    }

    // Convertit la réponse JSON en tableau JavaScript exploitable.
    const works = await response.json();

    return works;
  } catch (error) {
    // Affiche l'erreur dans la console puis la renvoie à la fonction appelante.
    console.error("Erreur fetchWorks: ", error);
    throw error;
  }
}

async function fetchCategories() {
  try {
    // Récupère toutes les catégories.
    const response = await fetch(`${API_URL}/categories`);

    // Stoppe la fonction si la récupération échoue.
    if (!response.ok) {
      throw new Error(`Erreur catégories: ${response.status}`);
    }

    // Retourne directement les catégories converties depuis le JSON.
    return await response.json();
  } catch (error) {
    // Affiche l'erreur dans la console puis la renvoie à la fonction appelante.
    console.error("Erreur fetchCategories: ", error);
    throw error;
  }
}

// ─── Main Gallery ───────────────────────────────

function createWorkElement(work) {
  // Crée la carte HTML d'un projet (work).
  const figure = document.createElement("figure");
  const img = document.createElement("img");
  const caption = document.createElement("figcaption");

  // Remplit l'image et sa légende avec les données du projet.
  img.src = work.imageUrl;
  img.alt = work.title;
  caption.textContent = work.title;

  // Ajoute l'image puis le titre dans la balise figure.
  figure.appendChild(img);
  figure.appendChild(caption);

  // Retourne l'élément prêt à être inséré dans la galerie.
  return figure;
}

function createFilterButton(label, onClick, isActive = false) {
  // Crée et configure un bouton de filtre réutilisable.
  const button = document.createElement("button");

  button.textContent = label;
  button.classList.add("filter-btn");

  if (isActive) button.classList.add("active");
  button.addEventListener("click", onClick);

  return button;
}

function displayWorks(works) {
  // Affiche une liste de projets dans la galerie.

  // Vérifie que les projets reçus sont bien sous forme de tableau.
  if (!Array.isArray(works)) {
    // Si les données ne sont pas valides, on arrête la fonction.
    return;
  }

  const gallery = document.querySelector(".gallery");

  if (!gallery) {
    return;
  }

  // Vide l'affichage précédent avant de reconstruire la galerie.
  gallery.innerHTML = "";

  // Crée puis ajoute une carte HTML pour chaque projet.
  works.forEach((work) => {
    const workElement = createWorkElement(work);
    gallery.appendChild(workElement);
  });
}

function displayFilters(categories, allWorks) {
  // Affiche les boutons de filtre.

  const filtersContainer = document.querySelector(".filters");

  // Nettoie les anciens filtres avant de les recréer.
  filtersContainer.innerHTML = "";

  // Crée le filtre "Tous", actif par défaut.
  const allButton = createFilterButton(
    "Tous",
    () => {
      // Active le bouton puis affiche tous les projets.
      setActiveButton(allButton);
      displayWorks(allWorks);
    },
    true
  );

  // Ajoute le bouton "Tous" dans le conteneur.
  filtersContainer.appendChild(allButton);

  categories.forEach((category) => {
    // Crée un bouton pour la catégorie courante.
    const button = createFilterButton(category.name, () => {
      // Active le bouton sélectionné.
      setActiveButton(button);

      // Garde uniquement les projets de cette catégorie.
      const filtered = allWorks.filter(
        (work) => work.category.id === category.id
      );

      // Met à jour la galerie avec les projets filtrés.
      displayWorks(filtered);
    });

    // Ajoute le bouton de catégorie dans la liste des filtres.
    filtersContainer.appendChild(button);
  });
}

function setActiveButton(activeBtn) {
  // Met à jour le bouton de filtre actif.

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    // Retire l'état actif de chaque bouton.
    btn.classList.remove("active");
  });

  // Active uniquement le bouton sélectionné.
  activeBtn.classList.add("active");
}

async function initGallery() {
  // Initialise la galerie principale.
  const [works, categories] = await Promise.all([
    fetchWorks(),
    fetchCategories(),
  ]);

  // Crée les filtres à partir des catégories récupérées.
  displayFilters(categories, works);

  // Affiche tous les projets au chargement.
  displayWorks(works);
}

// ─── Edit mode ─────────────────────────────────────

function initEditMode() {
  // Initialise l'affichage du mode édition.
  const token = localStorage.getItem("token");
  const logoutBtn = document.getElementById("logout-btn");

  // Si aucun token n'est présent, l'utilisateur reste en mode visiteur.
  if (!token) return;

  // Bandeau mode édition
  document.getElementById("edit-banner").style.display = "flex";

  // Login → Logout
  document.getElementById("login-btn").style.display = "none";
  logoutBtn.style.display = "block";

  // Gestion du logout
  logoutBtn.addEventListener("click", (e) => {
    // Empêche le comportement par défaut du lien.
    e.preventDefault();

    // Supprime les informations de connexion.
    localStorage.removeItem("token");
    localStorage.removeItem("userId");

    // Recharge la page pour revenir à l'affichage visiteur.
    window.location.reload();
  });

  // Masquer les filtres
  document.querySelector(".filters").style.display = "none";

  // Afficher le bouton modifier
  document.getElementById("edit-projects-btn").style.display = "flex";
}

// ─── Modal ────────────────────────────────────────────

function openModal() {
  // Ouvre la modale.
  document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeModal() {
  // Ferme la modale.
  document.getElementById("modal-overlay").classList.add("hidden");
}

function showGalleryZone() {
  // Affiche la vue galerie de la modale.
  document.getElementById("modal-gallery").classList.remove("hidden");

  // Cache le formulaire d'ajout.
  document.getElementById("modal-form").classList.add("hidden");

  // Cache le bouton retour sur la vue principale.
  document.getElementById("modal-back").style.display = "none";
}

function showFormZone() {
  // Affiche la vue formulaire de la modale.
  document.getElementById("modal-gallery").classList.add("hidden");

  // Rend le formulaire visible.
  document.getElementById("modal-form").classList.remove("hidden");

  // Affiche le bouton retour vers la galerie.
  document.getElementById("modal-back").style.display = "block";
}

function initModal() {
  // Initialise les événements de la modale.
  document
    .getElementById("edit-projects-btn")
    .addEventListener("click", (e) => {
      // Empêche le comportement par défaut puis ouvre la modale.
      e.preventDefault();
      openModal();
    });

  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    // Ferme la modale uniquement si l'utilisateur clique sur l'arrière-plan.
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });

  // Ferme la modale via le bouton de fermeture.
  document.querySelector(".modal-return").addEventListener("click", closeModal);

  // Passe de la galerie au formulaire d'ajout.
  document
    .getElementById("modal-app-photo-btn")
    .addEventListener("click", showFormZone);

  // Revient du formulaire vers la galerie.
  document
    .getElementById("modal-back")
    .addEventListener("click", showGalleryZone);
}

// ─── Init ─────────────────────────────────────────────

initEditMode();
initModal();
initGallery();
