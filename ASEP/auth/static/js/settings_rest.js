document.addEventListener("DOMContentLoaded", function () {
  // Tab Navigation
  const tabs = document.querySelectorAll(".tab");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      tabs.forEach((t) => t.classList.remove("active"));

      // Add active class to clicked tab
      this.classList.add("active");

      // Hide all tab panes
      tabPanes.forEach((pane) => pane.classList.remove("active"));

      // Show the corresponding tab pane
      const tabId = this.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });

  // Filter Buttons
  const filterButtons = document.querySelectorAll(".filter-btn");
  const tableRows = document.querySelectorAll("tbody tr");

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all filter buttons
      filterButtons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to clicked button
      this.classList.add("active");

      const filter = this.getAttribute("data-filter");

      // Show/hide table rows based on filter
      tableRows.forEach((row) => {
        const status = row.querySelector(".status");

        if (filter === "all") {
          row.style.display = "";
        } else if (
          filter === "pending" &&
          status.classList.contains("pending")
        ) {
          row.style.display = "";
        } else if (
          filter === "approved" &&
          status.classList.contains("approved")
        ) {
          row.style.display = "";
        } else if (
          filter === "declined" &&
          status.classList.contains("declined")
        ) {
          row.style.display = "";
        } else {
          row.style.display = "none";
        }
      });
    });
  });

  // Set default active tab
  document
    .querySelector('.tab[data-tab="settings"]')
    .classList.add("active");
  document.getElementById("settings").classList.add("active");

  // Sidebar menu item click
  const menuItems = document.querySelectorAll(".menu-item");

  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      menuItems.forEach((mi) => mi.classList.remove("active"));
      this.classList.add("active");
    });
  });
});


// Location fetching
const locationElement = document.getElementById("user-location");
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        const location =
          data.address.city ||
          data.address.town ||
          data.address.village ||
          "Unknown location";
        locationElement.textContent = `Location: ${location}`;
      } catch (error) {
        locationElement.textContent = "Unable to fetch location";
      }
    },
    () => {
      locationElement.textContent = "Location access denied";
    }
  );
} else {
  locationElement.textContent = "Geolocation not supported";
}

// Badge functionality starts here
// Sample data for badges
const badgesData = [
    {
        id: 1,
        name: "First Feeder",
        image: "/static/img/badge1.png",
        reason: "Completed your first donation successfully.",
        status: "earned",
    },
    {
        id: 2,
        name: "Bronze Feeder",
        image: "/static/img/bronze.png",
        reason: "Completed 10 donations successfully.",
        status: "earned",
    },
    {
        id: 3,
        name: "Zero Waste Warrior",
        image: "/static/img/Zero_waste.png",
        reason: "Completed 20 donations successfully.",
        status: "earned",
    },
    {
        id: 4,
        name: "Silver Feeder",
        requirement: "Complete 50 donations to unlock this badge.",
        status: "disabled",
        image: "https://via.placeholder.com/250?text=Locked",
    },
    {
        id: 5,
        name: "Golden Feeder",
        requirement: "Complete 100 donations to unlock this badge.",
        status: "disabled",
        image: "https://via.placeholder.com/250?text=Locked",
    },
    {
        id: 6,
        name: "Variety Donor",
        requirement: "Donate a variety of food items to unlock this badge.",
        status: "disabled",
        image: "https://via.placeholder.com/250?text=Locked",
    },
    {
        id: 7,
        name: "Rapid Responder",
        requirement: "Donate Food within 2 hrs of surplus alert to unlock this badge.",
        status: "disabled",
        image: "https://via.placeholder.com/250?text=Locked",
    },
    {
        id: 8,
        name: "Platinum Patron",
        requirement: "Complete 250+ donations to unlock this badge.",
        status: "disabled",
        image: "https://via.placeholder.com/250?text=Locked",
    },
    {
        id: 9,
        name: "Golden Champion",
        requirement: "Complete 500+ donations to unlock this badge.",
        status: "disabled",
        image: "https://via.placeholder.com/250?text=Locked",
    },
];

// Badge modal elements
const badgeModal = document.getElementById("badgeModal");
const badgeCloseBtn = document.querySelector("#badgeModal .close");
let currentBadgeId = null;

// View badge details
window.viewBadge = function (id) {
  currentBadgeId = id;
  const badge = badgesData.find((b) => b.id === id);

  if (badge) {
    // Populate modal
    document.getElementById("badgeName").textContent = badge.name;
    const imageContainer = document.getElementById("badgeImageContainer");
    imageContainer.innerHTML = ""; // Clear previous content

    if (badge.status === "earned") {
      const img = document.createElement("img");
      img.src = badge.image;
      img.alt = badge.name;
      imageContainer.appendChild(img);
      document.getElementById("badgeReason").textContent = badge.reason;
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "hexagon-placeholder";
      placeholder.textContent = badge.requirement;
      imageContainer.appendChild(placeholder);
      document.getElementById("badgeReason").textContent = badge.requirement;
    }

    // Show modal
    badgeModal.style.display = "block";
  }
};

// Close badge modal
window.closeBadgeModal = function () {
  badgeModal.style.display = "none";
  currentBadgeId = null;
};


// Close badge modal on clicking outside
window.addEventListener("click", function (event) {
  if (event.target === badgeModal) {
    closeBadgeModal();
  }
});

function toggleEdit(fieldId) {
    const field = document.getElementById(fieldId);
    const editButton = field.nextElementSibling; // Edit button
    const saveButton = editButton.nextElementSibling; // Save button

    if (field.disabled || field.readOnly) {
        // Enable editing
        field.disabled = false;
        field.readOnly = false;
        editButton.style.display = "none";
        saveButton.style.display = "inline-block";
    }
}

function saveDetails(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) {
        console.error(`Field with id "${fieldId}" not found.`);
        return;
    }

    const editButton = field.nextElementSibling; // Edit button
    const saveButton = editButton.nextElementSibling; // Save button

    // Save the value to localStorage
    console.log(`Saving ${fieldId}: ${field.value}`);
    localStorage.setItem(fieldId, field.value);

    // Disable editing
    field.disabled = true;
    field.readOnly = true;
    editButton.style.display = "inline-block";
    saveButton.style.display = "none";
}

document.addEventListener('DOMContentLoaded', () => {
    const about = localStorage.getItem('about');
    const email = localStorage.getItem('email');
    const phone = localStorage.getItem('phone');

    console.log('Loaded from localStorage:', { about, email, phone });

    if (about) document.getElementById('about').value = about;
    if (email) document.getElementById('email').value = email;
    if (phone) document.getElementById('phone').value = phone;
});
