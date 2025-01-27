// Form handling
document.getElementById("donationForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = {
    date: document.getElementById("pickupDate").value,
    time: document.getElementById("pickupTime").value,
    // Add other form fields here
  };
  console.log("Form submitted:", formData);
});

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("pickupDate").min = today;
});
