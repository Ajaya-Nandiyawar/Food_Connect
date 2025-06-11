document.addEventListener("DOMContentLoaded", function () {
  // Tab Navigation
  const tabs = document.querySelectorAll(".tab");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      tabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      tabPanes.forEach((pane) => pane.classList.remove("active"));
      const tabId = this.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });

  // Elements
  const volunteerId =
    document.body.dataset.volunteerId || sessionStorage.getItem("user_id"); // Fallback to session storage
  const certificateTable = document.getElementById("certificatesTable");
  const tableBody = certificateTable.getElementsByTagName("tbody")[0];
  const searchInput = document.getElementById("searchInput");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const emptyCertificates = document.getElementById("emptyCertificates");
  const modal = document.getElementById("certificateModal");
  const closeBtn = document.querySelector(".close");
  const certId = document.getElementById("certId");
  const certTask = document.getElementById("certTask");
  const certDate = document.getElementById("certDate");
  const certHours = document.getElementById("certHours");
  const certStatus = document.getElementById("certStatus");
  const certSupervisor = document.getElementById("certSupervisor");
  const declineReason = document.getElementById("declineReason");
  const certDeclineReason = document.getElementById("certDeclineReason");
  const certificatePreview = document.getElementById("certificatePreview");
  const modalDownloadBtn = document.getElementById("modalDownloadBtn");
  const notification = document.getElementById("notification");

  let applications = [];
  let currentApplicationId = null;

  // Define allApplications and currentFilter to maintain state
  let allApplications = [];
  let currentFilter = "all"; // Default filter

  // CSRF Token
  const csrfToken =
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") || "";

  // Fetch applications dynamically
  async function fetchApplications() {
    try {
      const response = await fetch(`/Volunteer/applications/${volunteerId}`, {
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const fetchedApplications = await response.json();
      applications = fetchedApplications; // Update the applications array
      allApplications = fetchedApplications; // Store in allApplications for consistency
      updateStats(applications);
      renderApplications(applications); // Use renderApplications instead of filterApplications
    } catch (error) {
      console.error("Error fetching applications:", error);
      tableBody.innerHTML = `<tr><td colspan="6">Failed to load applications: ${error.message}</td></tr>`;
      emptyCertificates.style.display = "block";
    }
  }

  // Define updateStats function
  function updateStats(applications) {
    document.getElementById("totalCertificates").textContent =
      applications.length;
    document.getElementById("pendingCertificates").textContent =
      applications.filter((app) => app.status === "Pending").length;
    document.getElementById("approvedCertificates").textContent =
      applications.filter(
        (app) => app.status === "Approved" || app.status === "Completed"
      ).length;
  }

  // Render applications
  function renderApplications(data) {
    const activeFilter = document
      .querySelector(".filter-btn.active")
      .getAttribute("data-filter");
    const searchValue = searchInput.value.toLowerCase();
    const filteredData = data.filter((app) => {
      const matchesSearch = app.event.toLowerCase().includes(searchValue);
      const matchesFilter =
        activeFilter === "all" || app.status.toLowerCase() === activeFilter;
      return matchesSearch && matchesFilter;
    });

    tableBody.innerHTML = "";
    emptyCertificates.style.display =
      filteredData.length === 0 ? "block" : "none";
    certificateTable.style.display = filteredData.length === 0 ? "none" : "";

    filteredData.forEach((app) => {
      const row = document.createElement("tr");
      row.setAttribute("data-status", app.status.toLowerCase());
      let actions = "";
      let certificateId = `CERT-${String(app.id).padStart(3, "0")}`; // Generate CERT-ID based on application ID

      if (app.status === "Completed") {
        actions = `
          <button class="download-btn" data-id="${app.id}">Download</button>
          <button class="view-btn" data-id="${app.id}">Preview</button>
        `;
      } else if (app.status === "Rejected" || app.status === "Declined") {
        actions = `<button class="view-btn" data-id="${app.id}">View Details</button>`;
      } else {
        actions = `<button class="view-btn" data-id="${app.id}">View</button>`;
      }

      row.innerHTML = `
        <td>${certificateId}</td>
        <td>${app.event}</td>
        <td>${app.event_date}</td>
        <td>${app.hours || "N/A"} hours</td>
        <td><span class="status ${app.status.toLowerCase()}">${
        app.status
      }</span></td>
        <td>${actions}</td>
      `;
      tableBody.appendChild(row);

      // Add event listeners for buttons
      row.querySelectorAll(".view-btn").forEach((btn) => {
        btn.addEventListener("click", () => viewApplication(app.id));
      });

      row.querySelectorAll(".download-btn").forEach((btn) => {
        btn.addEventListener("click", () => downloadCertificate(app.id));
      });
    });
  }

  // View application details
  function viewApplication(id) {
    currentApplicationId = id;
    const app = applications.find((a) => a.id === id);

    if (app) {
      certId.textContent = `CERT-${String(app.id).padStart(3, "0")}`;
      certTask.textContent = app.event;
      certDate.textContent = app.event_date;
      certHours.textContent = app.hours ? `${app.hours} hours` : "N/A";
      certStatus.textContent = app.status;
      certSupervisor.textContent = "N/A"; // Supervisor not available in data; update if added later

      // Handle decline reason (not in data; placeholder logic)
      if (
        (app.status === "Rejected" || app.status === "Declined") &&
        app.declineReason
      ) {
        declineReason.style.display = "block";
        certDeclineReason.textContent = app.declineReason;
      } else {
        declineReason.style.display = "none";
      }

      // Show certificate preview for completed applications
      if (app.status === "Completed") {
        certificatePreview.style.display = "block";
        // Clear any existing content in certificatePreview
        certificatePreview.innerHTML = "";

        // Generate the certificate HTML
        const certificateHtml = `
          <div class="certificate-inner">
            <h2 class="certificate-title">Certificate of Completion</h2>
            <div class="certificate-content">
              <p>This certifies that</p>
              <h3>${app.volunteer_name || "Volunteer"}</h3>
              <p>has successfully completed</p>
              <h4>${app.event}</h4>
              <p>on</p>
              <p>${app.event_date}</p>
              <p>with a total of</p>
              <p>${app.hours || "N/A"} hours</p>
            </div>
            <div class="certificate-signature">
              <div class="line"></div>
              <p>Authorized Signature</p>
            </div>
          </div>
        `;
        certificatePreview.innerHTML = certificateHtml;

        // Show the download button
        modalDownloadBtn.style.display = "inline-block";
        modalDownloadBtn.dataset.certificateId = app.id;
      } else {
        certificatePreview.style.display = "none";
        modalDownloadBtn.style.display = "none";
      }

      modal.style.display = "block";
    }
  }

  // Download certificate
  function downloadCertificate(id) {
    const app = applications.find((a) => a.id === id);
    if (app && app.status === "Completed") {
      // Use html2pdf.js to convert the certificatePreview to PDF
      const element = document.getElementById("certificatePreview");
      const opt = {
        margin: 0.5,
        filename: `certificate-${app.id}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };

      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          showNotification("Certificate downloaded successfully!");
        })
        .catch((error) => {
          console.error("Error generating PDF:", error);
          showNotification("Failed to download certificate. Please try again.");
        });
    }
  }

  // Download from modal
  function downloadFromModal() {
    if (currentApplicationId) {
      downloadCertificate(currentApplicationId);
      closeModal();
    }
  }

  // Show notification
  function showNotification(message) {
    notification.textContent = message;
    notification.style.display = "block";
    setTimeout(() => {
      notification.style.display = "none";
    }, 3000);
  }

  // Close modal
  function closeModal() {
    modal.style.display = "none";
    currentApplicationId = null;
    certificatePreview.innerHTML = ""; // Clear the preview when closing
  }

  // Filter and search
  searchInput.addEventListener("keyup", () => renderApplications(applications));

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      renderApplications(applications);
    });
  });

  // Close modal on clicking X or outside
  closeBtn.onclick = closeModal;
  window.onclick = function (event) {
    if (event.target === modal) {
      closeModal();
    }
  };

  modalDownloadBtn.onclick = downloadFromModal;

  // Set default active tab and filter
  document
    .querySelector('.tab[data-tab="certificates"]')
    .classList.add("active");
  document.getElementById("certificates").classList.add("active");
  document
    .querySelector('.filter-btn[data-filter="all"]')
    .classList.add("active");

  // Fetch applications on load
  fetchApplications();

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

  // Sidebar menu item click
  const menuItems = document.querySelectorAll(".menu-item");
  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      menuItems.forEach((mi) => mi.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Badge functionality (unchanged)
  const badgesData = [
    {
      id: 1,
      name: "First Responder",
      image: "/static/img/First_Responder.png",
      reason: "Completed your first donation event successfully.",
      status: "earned",
    },
    {
      id: 2,
      name: "Food Safety",
      image: "/static/img/food_safety.png",
      reason: "Passed the food safety training course.",
      status: "earned",
    },
    {
      id: 3,
      name: "Bronze Volunteer",
      image: "/static/img/bronze_volunteer.png",
      reason: "Volunteered for 10 hours in community service.",
      status: "earned",
    },
    {
      id: 4,
      name: "Team Leader",
      requirement: "Complete 5 team events to unlock this badge.",
      status: "disabled",
      image: "https://via.placeholder.com/250?text=Locked",
    },
    {
      id: 5,
      name: "Inventory Pro",
      requirement: "Manage inventory for 3 events to unlock this badge.",
      status: "disabled",
      image: "https://via.placeholder.com/250?text=Locked",
    },
    {
      id: 6,
      name: "Community Builder",
      requirement: "Organize a community event to unlock this badge.",
      status: "disabled",
      image: "https://via.placeholder.com/250?text=Locked",
    },
    {
      id: 7,
      name: "Silver Supporter",
      requirement: "Complete 50 hours of volunteering to unlock this badge.",
      status: "disabled",
      image: "https://via.placeholder.com/250?text=Locked",
    },
    {
      id: 8,
      name: "Gold Guide",
      requirement: "Complete 100 hours of volunteering to unlock this badge.",
      status: "disabled",
      image: "https://via.placeholder.com/250?text=Locked",
    },
    {
      id: 9,
      name: "Golden Champion",
      requirement: "Outstanding service in the community.",
      status: "disabled",
      image: "https://via.placeholder.com/250?text=Locked",
    },
  ];

  const badgeModal = document.getElementById("badgeModal");
  const badgeCloseBtn = document.querySelector("#badgeModal .close");
  let currentBadgeId = null;

  window.viewBadge = function (id) {
    currentBadgeId = id;
    const badge = badgesData.find((b) => b.id === id);

    if (badge) {
      document.getElementById("badgeName").textContent = badge.name;
      const imageContainer = document.getElementById("badgeImageContainer");
      imageContainer.innerHTML = "";

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

      badgeModal.style.display = "block";
    }
  };

  window.closeBadgeModal = function () {
    badgeModal.style.display = "none";
    currentBadgeId = null;
  };

  if (badgeCloseBtn) {
    badgeCloseBtn.onclick = closeBadgeModal;
  }

  window.addEventListener("click", function (event) {
    if (event.target === badgeModal) {
      closeBadgeModal();
    }
  });
});
