const API_URL = "http://localhost:5678/api";
let allWorks = [];
let allCategories = [];

function logoutAndReload() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  window.location.reload();
}

function logoutAndRedirectToLogin() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  window.location.href = "./pages/login.html";
}

// ─── API ──────────────────────────────────────────────

async function fetchWorks() {
  try {
    const response = await fetch(`${API_URL}/works`);

    if (!response.ok) {
      throw new Error(
        `Impossible de récupérer les données. Status: ${response.status}`
      );
    }

    // Convertit la réponse JSON en tableau JavaScript exploitable
    const works = await response.json();

    return works;
  } catch (error) {
    // Affiche l'erreur dans la console puis la renvoie à la fonction appelante
    console.error("Erreur fetchWorks: ", error);
    throw error;
  }
}

async function fetchCategories() {
  try {
    const response = await fetch(`${API_URL}/categories`);

    if (!response.ok) {
      throw new Error(`Erreur catégories: ${response.status}`);
    }

    // Retourne directement les catégories converties depuis le JSON
    return await response.json();
  } catch (error) {
    console.error("Erreur fetchCategories: ", error);
    throw error;
  }
}

async function deleteWork(id) {
  // Récupère le token JWT pour authentifier la requête
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Utilisateur non authentifié : token manquant");
  }

  try {
    const response = await fetch(`${API_URL}/works/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        logoutAndRedirectToLogin();
        throw new Error("Session expirée");
      }

      throw new Error(`Status: ${response.status}`);
    }
  } catch (error) {
    console.error("Erreur deleteWork ", error);
    throw error;
  }
}

async function addWork(formData) {
  // Récupère le token JWT pour authentifier la requête
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Utilisateur non authentifié : token manquant");
  }

  const response = await fetch(`${API_URL}/works`, {
    method: "POST",
    headers: {
      // Pas de Content-Type ici : le navigateur le génère automatiquement avec le boundary correct pour le multipart/form-data.
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      logoutAndRedirectToLogin();
      throw new Error("Session expirée");
    }

    throw new Error(`Erreur API: ${response.status}`);
  }

  // Retourne le nouveau projet créé par l'API
  return await response.json();
}

// ─── Main Gallery ───────────────────────────────

function createWorkElement(work) {
  // Crée la carte HTML d'un projet (work)
  const figure = document.createElement("figure");
  const img = document.createElement("img");
  const caption = document.createElement("figcaption");

  // Remplit l'image et sa légende avec les données du projet
  img.src = work.imageUrl;
  img.alt = work.title;
  caption.textContent = work.title;

  // Ajoute l'image puis le titre dans la balise figure
  figure.appendChild(img);
  figure.appendChild(caption);

  // Retourne l'élément prêt à être inséré dans la galerie
  return figure;
}

function createFilterButton(label, onClick, isActive = false) {
  // Crée et configure un bouton de filtre réutilisable
  const button = document.createElement("button");

  button.textContent = label;
  button.classList.add("filter-btn");

  if (isActive) button.classList.add("active");
  button.addEventListener("click", onClick);

  return button;
}

function displayWorks(works) {
  // Vérifie que les projets reçus sont bien sous forme de tableau
  if (!Array.isArray(works)) {
    // Si les données ne sont pas valides, on arrête la fonction
    return;
  }

  const gallery = document.querySelector(".gallery");

  if (!gallery) {
    return;
  }

  // Vide l'affichage précédent avant de reconstruire la galerie
  gallery.innerHTML = "";

  // Crée puis ajoute une carte HTML pour chaque projet
  works.forEach((work) => {
    const workElement = createWorkElement(work);
    gallery.appendChild(workElement);
  });
}

function displayFilters(categories, allWorks) {
  // Affiche les boutons de filtre

  const filtersContainer = document.querySelector(".filters");
  filtersContainer.innerHTML = "";

  // Crée le filtre "Tous", actif par défaut
  const allButton = createFilterButton(
    "Tous",
    () => {
      // Active le bouton puis affiche tous les projets
      setActiveButton(allButton);
      displayWorks(allWorks);
    },
    true
  );

  // Ajoute le bouton "Tous" dans le conteneur
  filtersContainer.appendChild(allButton);

  categories.forEach((category) => {
    // Crée un bouton pour la catégorie courante
    const button = createFilterButton(category.name, () => {
      // Active le bouton sélectionné
      setActiveButton(button);

      // Garde uniquement les projets de cette catégorie
      const filtered = allWorks.filter(
        (work) => work.category.id === category.id
      );

      // Met à jour la galerie avec les projets filtrés
      displayWorks(filtered);
    });

    // Ajoute le bouton de catégorie dans la liste des filtres
    filtersContainer.appendChild(button);
  });
}

function setActiveButton(activeBtn) {
  // Met à jour le bouton de filtre actif

  document.querySelectorAll(".filter-btn").forEach((btn) => {
    // Retire l'état actif de chaque bouton
    btn.classList.remove("active");
  });

  // Active uniquement le bouton sélectionné
  activeBtn.classList.add("active");
}

async function initGallery() {
  // Initialise la galerie principale
  const [works, categories] = await Promise.all([
    fetchWorks(),
    fetchCategories(),
  ]);

  // Stockage des données pour pouvoir les réutiliser après suppression
  allWorks = works;
  allCategories = categories;

  displayFilters(categories, works);
  displayWorks(works);
}

// ─── Edit mode ─────────────────────────────────────

function initEditMode() {
  // Initialise l'affichage du mode édition
  const token = localStorage.getItem("token");
  const logoutBtn = document.getElementById("logout-btn");

  // Si aucun token n'est présent, l'utilisateur reste en mode visiteur
  if (!token) return;

  // Bandeau mode édition
  document.getElementById("edit-banner").style.display = "flex";

  // Login → Logout
  document.getElementById("login-btn").style.display = "none";
  logoutBtn.style.display = "block";

  // Gestion du logout
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // Déconnecte puis recharge la page pour revenir à l'affichage visiteur
    logoutAndReload();
  });

  // Masquer les filtres et afficher le bouton "Modifier"
  document.querySelector(".filters").style.display = "none";
  document.getElementById("edit-projects-btn").style.display = "flex";
}

// ─── Modal ────────────────────────────────────────────

function openModal() {
  // Ouvre la modale et peuple la galerie avec l'état actuel
  document.getElementById("modal-overlay").classList.remove("hidden");
  displayModalWorks(allWorks);
}

function closeModal() {
  // Ferme la modale et réinitialise le formulaire
  document.getElementById("modal-overlay").classList.add("hidden");
  resetForm();
}

function showGalleryZone() {
  // Affiche la vue galerie de la modale
  document.getElementById("modal-gallery").classList.remove("hidden");

  // Cache le formulaire d'ajout
  document.getElementById("modal-form").classList.add("hidden");

  // Cache le bouton retour sur la vue principale
  document.getElementById("modal-back").style.display = "none";

  // Réinitialise le formulaire pour un usage futur
  resetForm();
}

function showFormZone() {
  // Affiche la vue formulaire de la modale
  document.getElementById("modal-gallery").classList.add("hidden");

  // Rend le formulaire visible
  document.getElementById("modal-form").classList.remove("hidden");

  // Affiche le bouton retour vers la galerie
  document.getElementById("modal-back").style.display = "block";

  // Peuple le select avec les catégories disponibles
  populateCategories();
}

function initModal() {
  // Initialise les événements de la modale
  document
    .getElementById("edit-projects-btn")
    .addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });

  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    // Ferme la modale si l'utilisateur clique sur l'arrière-plan
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });

  // Ferme la modale via le bouton de fermeture
  document.querySelector(".modal-return").addEventListener("click", closeModal);

  // Passe de la galerie au formulaire d'ajout
  document
    .getElementById("modal-app-photo-btn")
    .addEventListener("click", showFormZone);

  // Revient du formulaire vers la galerie
  document
    .getElementById("modal-back")
    .addEventListener("click", showGalleryZone);
}

// ─── Modal Gallery (mode édition) ─────────────────────

function createModalWorkElement(work) {
  // Créer une vignette avec son bouton poubelle

  const item = document.createElement("div");
  item.classList.add("modal-work-item");

  const img = document.createElement("img");
  img.src = work.imageUrl;
  img.alt = work.title;

  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-btn");
  deleteBtn.setAttribute("aria-label", `Supprimer ${work.title}`);
  deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';

  // Branche le clic du bouton sur le handler de suppression
  deleteBtn.addEventListener("click", () => handleDeleteWork(work.id));

  item.appendChild(img);
  item.appendChild(deleteBtn);

  return item;
}

function displayModalWorks(works) {
  // Remplit la grille de la modale avec les vignettes
  const grid = document.getElementById("modal-works-grid");

  if (!grid) return;

  // Vide la grille avant de la reconstruire
  grid.innerHTML = "";

  works.forEach((work) => {
    const item = createModalWorkElement(work);
    grid.appendChild(item);
  });
}

async function handleDeleteWork(workId) {
  try {
    await deleteWork(workId);

    // Met à jour l'état partagé en retirant le projet supprimé
    allWorks = allWorks.filter((work) => work.id !== workId);

    // Re-render les deux galeries pour rester synchro
    displayWorks(allWorks);
    displayModalWorks(allWorks);
  } catch (error) {
    // Si l'API a renvoyé une erreur, on prévient l'utilisateur sans toucher au DOM
    alert("Impossible de supprimer ce projet");
  }
}

// ─── Modal Form ───────────────────────────────────────
function populateCategories() {
  const select = document.getElementById("work-category");

  // Repart d'un select propre avec une option vide en premier
  select.innerHTML = '<option value=""></option>';

  allCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    select.appendChild(option);
  });
}

function resetForm() {
  // Réinitialise tous les champs du formulaire d'ajout
  document.getElementById("work-image").value = "";
  document.getElementById("work-title").value = "";
  document.getElementById("work-category").value = "";

  // Remet la zone d'upload visible et cache l'aperçu
  document.getElementById("upload-label").style.display = "flex";
  document.getElementById("upload-preview").classList.add("hidden");

  // Désactive le bouton "Valider"
  const submitBtn = document.getElementById("modal-submit-btn");
  submitBtn.disabled = true;
  submitBtn.classList.add("btn-modal--disabled");
}

function checkFormValidity() {
  // Active le bouton "Valider" uniquement si les trois champs sont remplis
  const image = document.getElementById("work-image").files[0];
  const title = document.getElementById("work-title").value.trim();
  const category = document.getElementById("work-category").value;

  const isValid = !!image && title.length > 0 && category !== "";

  const submitBtn = document.getElementById("modal-submit-btn");
  submitBtn.disabled = !isValid;
  submitBtn.classList.toggle("btn-modal--disabled", !isValid);
}

async function handleAddWork() {
  // Collecte les données du formulaire
  const imageFile = document.getElementById("work-image").files[0];
  const title = document.getElementById("work-title").value.trim();
  const category = document.getElementById("work-category").value;

  // Construit le FormData pour l'envoi multipart/form-data
  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("title", title);
  formData.append("category", category);

  try {
    const newWork = await addWork(formData);
    console.log(newWork);

    // Reconstitue l'objet category pour rester cohérent avec le reste de allWorks
    newWork.category = allCategories.find(
      (cat) => cat.id === parseInt(category)
    );

    // Ajoute le nouveau projet à l'état partagé
    allWorks.push(newWork);

    // Rafraîchit la galerie principale
    displayWorks(allWorks);

    // Retourne à la galerie de la modale (le reset est fait dans showGalleryZone)
    showGalleryZone();
    displayModalWorks(allWorks);
  } catch (error) {
    console.error("Erreur handleAddWork: ", error);
    alert("Impossible d'ajouter ce projet.");
  }
}

function initForm() {
  // Initialise tous les évènements du formulaire d'ajout

  const imageInput = document.getElementById("work-image");
  const titleInput = document.getElementById("work-title");
  const categorySelect = document.getElementById("work-category");

  // Aperçu de l'image dès qu'un fichier est sélectionné
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    const MAX_SIZE = 4 * 1024 * 1024; // 4 Mo

    if (file && file.size > MAX_SIZE) {
      alert("L'image ne doit pas dépasser 4 Mo.");
      imageInput.value = "";
    }

    if (file && file.size <= MAX_SIZE) {
      const reader = new FileReader();

      reader.onload = (e) => {
        // Affiche l'aperçu et masque la zone de drop
        const preview = document.getElementById("upload-preview");
        preview.src = e.target.result;
        preview.classList.remove("hidden");
        document.getElementById("upload-label").style.display = "none";
      };

      reader.readAsDataURL(file);
    }

    checkFormValidity();
  });

  // Validation en temps réel sur le titre et la catégorie
  titleInput.addEventListener("input", checkFormValidity);
  categorySelect.addEventListener("change", checkFormValidity);

  // Soumission du formulaire via le bouton "Valider"
  document
    .getElementById("modal-submit-btn")
    .addEventListener("click", handleAddWork);
}

// ─── Init ─────────────────────────────────────────────

async function init() {
  initEditMode();
  try {
    await initGallery();
  } catch (error) {
    console.error("Erreur d'initialisation :", error);
    alert("Impossible de charger les projets. Veuillez réessayer plus tard.");
  }
  initModal();
  initForm();
}

init();
