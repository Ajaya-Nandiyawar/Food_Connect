// Show loader immediately for demo
document.addEventListener("DOMContentLoaded", function () {
  const loader = document.getElementById("loaderContainer");
  loader.classList.add("active");

  // Auto-hide loader after 5 seconds with fade-out effect
  setTimeout(() => {
    loader.classList.add("hidden"); // Add the hidden class to fade out
    setTimeout(() => {
      loader.classList.remove("active"); // Remove active class after fade-out
    }, 500); // Match the CSS transition duration (0.5s)
  }, 5000);
});
