const API_URL = "http://localhost:5678/api";

const form = document.querySelector("#login form");
const errorMessage = document.querySelector("#login .error-message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      showError("Erreur dans l'identifiant ou le mot de passe");
      return;
    }

    const data = await response.json();

    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);

    window.location.href = "../index.html";
  } catch (error) {
    console.error("Erreur login :", error);
    showError("Erreur dans l'identifiant ou le mot de passe");
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}
