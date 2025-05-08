// Fetch volunteer data from the backend
async function fetchVolunteers() {
  try {
    const response = await fetch("/api/volunteers"); // Replace with your API endpoint
    const volunteers = await response.json();

    const select = document.getElementById("vol-fullname");
    volunteers.forEach((volunteer) => {
      const option = document.createElement("option");
      option.value = volunteer.id; // Use a unique identifier
      option.textContent = `${volunteer.first_name} ${volunteer.last_name}`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error fetching volunteers:", error);
  }
}

// Auto-fill form fields based on selected volunteer
document
  .getElementById("vol-fullname")
  .addEventListener("change", async function () {
    const volunteerId = this.value;

    try {
      const response = await fetch(`/api/volunteers/${volunteerId}`); // Replace with your API endpoint
      const volunteer = await response.json();

      // Auto-fill fields
      document.getElementById("vol-task").value = volunteer.task;
      document.getElementById("vol-date").value = volunteer.date_of_completion;
      document.getElementById("vol-hours").value = volunteer.hours_served;
      document.getElementById("vol-supervisor").value =
        volunteer.supervisor_name;
      document.getElementById("vol-role").value = volunteer.supervisor_title;
      document.getElementById("vol-org").value = volunteer.organization_name;
    } catch (error) {
      console.error("Error fetching volunteer details:", error);
    }
  });

// Call fetchVolunteers on page load
document.addEventListener("DOMContentLoaded", fetchVolunteers);


// Form submission handler

// Check if the site is opened on a mobile device
function isMobileDevice() {
  return (
    typeof window.orientation !== "undefined" ||
    navigator.userAgent.indexOf("IEMobile") !== -1
  );
}

// Show alert if the site is opened on a mobile device
if (isMobileDevice()) {
  document.getElementById("vol-mobile-alert").style.display = "block";
}

// Generate random certificate number
function generateCertificateNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${year}${month}${day}${random}`;
}

// Format date to readable format
function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
}

// Get current date
function getCurrentDate() {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date().toLocaleDateString("en-US", options);
}

// Generate certificate based on form input
document
  .getElementById("vol-cert-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    // Get form values
    const firstName = document.getElementById("vol-fname").value;
    const lastName = document.getElementById("vol-lname").value;
    const task = document.getElementById("vol-task").value;
    const date = document.getElementById("vol-date").value;
    const hours = document.getElementById("vol-hours").value;
    const supervisor = document.getElementById("vol-supervisor").value;
    const role = document.getElementById("vol-role").value;
    const org = document.getElementById("vol-org").value;

    // Update certificate
    document.getElementById(
      "vol-volunteer-name"
    ).textContent = `${firstName} ${lastName}`;
    document.getElementById("vol-service-name").textContent = task;
    document.getElementById("vol-completion-date").textContent =
      formatDate(date);
    document.getElementById("vol-service-hours").textContent = `${hours} hours`;
    document.getElementById("vol-supervisor-name").textContent = supervisor;
    document.getElementById("vol-supervisor-title").textContent = role;
    document.getElementById("vol-org-name").textContent = org;

    // Set certificate details
    const certNo = generateCertificateNumber();
    document.getElementById("vol-cert-no").textContent = certNo;
    document.getElementById(
      "vol-cert-url"
    ).textContent = `ngo.org/verify/${certNo}`;
    document.getElementById("vol-issue-date").textContent = getCurrentDate();

    // Scroll to certificate
    document
      .getElementById("vol-cert-document")
      .scrollIntoView({ behavior: "smooth" });
  });

// Download certificate as PDF
document
  .getElementById("vol-cert-download")
  .addEventListener("click", function () {
    const element = document.getElementById("vol-cert-document");
    const options = {
      margin: 0,
      filename: "volunteer_certificate.pdf",
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    };

    html2pdf().set(options).from(element).save();
  });
