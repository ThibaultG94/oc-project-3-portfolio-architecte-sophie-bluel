const API_URL = "http://localhost:5678/api";

// ─── API ──────────────────────────────────────────────

async function fetchWorks() {
  try {
    const response = await fetch(`${API_URL}/works`);

    if (!response.ok) {
      throw new Error(
        `Impossible de récupérer les données. Status: ${response.status}`
      );
    }

    const works = await response.json();

    return works;
  } catch (error) {
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

    return await response.json();
  } catch (error) {
    console.error("Erreur fetchCategories: ", error);
    throw error;
  }
}

// ─── Main Gallery ───────────────────────────────

function createWorkElement(work) {
  const figure = document.createElement("figure");
  const img = document.createElement("img");
  const caption = document.createElement("figcaption");

  img.src = work.imageUrl;
  img.alt = work.title;
  caption.textContent = work.title;

  figure.appendChild(img);
  figure.appendChild(caption);

  return figure;
}

function createFilterButton(label, onClick, isActive = false) {
  const button = document.createElement("button");

  button.textContent = label;
  button.classList.add("filter-btn");

  if (isActive) button.classList.add("active");
  button.addEventListener("click", onClick);

  return button;
}

function displayWorks(works) {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = "";

  works.forEach((work) => {
    const workElement = createWorkElement(work);

    gallery.appendChild(workElement);
  });
}

function displayFilters(categories, allWorks) {
  const filtersContainer = document.querySelector(".filters");
  filtersContainer.innerHTML = "";

  const allButton = createFilterButton(
    "Tous",
    () => {
      setActiveButton(allButton);
      displayWorks(allWorks);
    },
    true
  );
  filtersContainer.appendChild(allButton);

  categories.forEach((category) => {
    const button = createFilterButton(category.name, () => {
      setActiveButton(button);
      const filtered = allWorks.filter(
        (work) => work.category.id === category.id
      );
      displayWorks(filtered);
    });

    filtersContainer.appendChild(button);
  });
}

function setActiveButton(activeBtn) {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  activeBtn.classList.add("active");
}

async function initGallery() {
  const [works, categories] = await Promise.all([
    fetchWorks(),
    fetchCategories(),
  ]);
  displayFilters(categories, works);
  displayWorks(works);
}

// ─── Edit mode ─────────────────────────────────────

function initEditMode() {
  const token = localStorage.getItem("token");
  const logoutBtn = document.getElementById("logout-btn");

  if (!token) return;

  // Bandeau mode édition
  document.getElementById("edit-banner").style.display = "flex";

  // Login → Logout
  document.getElementById("login-btn").style.display = "none";
  logoutBtn.style.display = "block";

  // Gestion du logout
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.reload();
  });

  // Masquer les filtres
  document.querySelector(".filters").style.display = "none";

  // Afficher le bouton modifier
  document.getElementById("edit-projects-btn").style.display = "flex";
}

// ─── Modal ────────────────────────────────────────────

function openModal() {
  document.getElementById("modal-overlay").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.add("hidden");
}

function showGalleryZone() {
  document.getElementById("modal-gallery").classList.remove("hidden");
  document.getElementById("modal-form").classList.add("hidden");
  document.getElementById("modal-back").style.display = "none";
}

function showFormZone() {
  document.getElementById("modal-gallery").classList.add("hidden");
  document.getElementById("modal-form").classList.remove("hidden");
  document.getElementById("modal-back").style.display = "block";
}

function initModal() {
  document
    .getElementById("edit-projects-btn")
    .addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });

  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modal-overlay")) closeModal();
  });

  document.querySelector(".modal-return").addEventListener("click", closeModal);

  document
    .getElementById("modal-app-photo-btn")
    .addEventListener("click", showFormZone);

  document
    .getElementById("modal-back")
    .addEventListener("click", showGalleryZone);
}

// ─── Init ─────────────────────────────────────────────

initEditMode();
initModal();
initGallery();
