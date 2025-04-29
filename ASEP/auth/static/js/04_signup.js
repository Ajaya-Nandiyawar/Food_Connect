document.getElementById("signupForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const successMessage = document.getElementById("successMessage");
  successMessage.style.display = "block";

  setTimeout(() => {
    window.location.href = "/login";
  }, 3000);
});
