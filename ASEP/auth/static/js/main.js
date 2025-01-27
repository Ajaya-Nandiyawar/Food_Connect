// Sample data
const statsData = {
  totalFood: {
    value: "2,450 kg",
    change: "↑ 12% from last week",
  },
  activeDonors: {
    value: "128",
    change: "↑ 4 new today",
  },
  pendingPickups: {
    value: "15",
    change: "Within 24 hours",
  },
  criticalItems: {
    value: "8",
    change: "Expiring soon",
  },
};

// Update stats
function updateStats() {
  Object.keys(statsData).forEach((key) => {
    const stat = statsData[key];
    const card = document.querySelector(`[data-stat="${key}"]`);
    if (card) {
      card.querySelector(".stat-value").textContent = stat.value;
      card.querySelector(".stat-change").textContent = stat.change;
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  updateStats();
});

// Handle sidebar navigation
const navLinks = document.querySelectorAll(".sidebar nav a");
navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
  });
});

// Handle category selection
const categorySelect = document.querySelector(".food-items-section select");
if (categorySelect) {
  categorySelect.addEventListener("change", (e) => {
    // Handle category filtering here
    console.log("Selected category:", e.target.value);
  });
}
