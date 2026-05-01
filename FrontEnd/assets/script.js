const API_URL = "http://localhost:5678/api";

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

function displayWorks(works) {
  const gallery = document.querySelector(".gallery");
  gallery.innerHTML = "";

  works.forEach((work) => {
    const workElement = createWorkElement(work);

    gallery.appendChild(workElement);
  });
}

async function initGallery() {
  const works = await fetchWorks();
  displayWorks(works);
}

initGallery();
