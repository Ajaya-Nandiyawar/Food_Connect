document.addEventListener("DOMContentLoaded", function () {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      tabContents.forEach((content) => {
        content.classList.remove("active");
        if (content.id === tabId) content.classList.add("active");
      });
      document.getElementById("resultsSection").style.display = "none";
    });
  });

  const spoilageForm = document.getElementById("spoilageForm");
  const fileInput = document.getElementById("fileInput");
  const uploadedImage = document.getElementById("uploadedImage");
  const analyzeImageBtn = document.getElementById("analyzeImageBtn");

  spoilageForm.addEventListener("submit", function (e) {
    e.preventDefault();
    analyzeFoodForm();
  });

  document
    .getElementById("dropzone")
    .addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", function (e) {
    if (e.target.files.length) {
      const reader = new FileReader();
      reader.onload = function (event) {
        uploadedImage.src = event.target.result;
        uploadedImage.style.display = "block";
        analyzeImageBtn.disabled = false;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  analyzeImageBtn.addEventListener("click", analyzeImage);

  document.getElementById("newAnalysis").addEventListener("click", function () {
    document.getElementById("resultsSection").style.display = "none";
    spoilageForm.reset();
    fileInput.value = "";
    uploadedImage.src = "";
    uploadedImage.style.display = "none";
    analyzeImageBtn.disabled = true;
  });

  async function analyzeFoodForm() {
    const foodType = document.getElementById("foodType").value;
    const temperature = document.getElementById("temperature").value;
    const humidity = document.getElementById("humidity").value;
    const storageType = document.getElementById("storageType").value;
    const storageDate = document.getElementById("storageDate").value;
    const storageTime = document.getElementById("storageTime").value;

    const prepDateTime = new Date(`${storageDate}T${storageTime}`);
    const currentDateTime = new Date();
    const hoursSincePrep = Math.round(
      (currentDateTime - prepDateTime) / (1000 * 60 * 60)
    );

    if (hoursSincePrep < 0) {
      showWarning("Error: Preparation date/time cannot be in the future.");
      return;
    }

    const payload = {
      food_type: foodType,
      temperature,
      humidity,
      storage_type: storageType,
      time_since_preparation: hoursSincePrep,
    };

    const csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");
    if (!csrfToken) return alert("Missing CSRF token");

    const response = await fetch("/predict_spoilage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify(payload),
    });

    const reportData = {
      food_type: foodType,
      temperature,
      humidity,
      storage_type: storageType,
      hours: hoursSincePrep,
      date: currentDateTime.toLocaleString(),
    };

    await handleResponse(response, reportData, csrfToken);
  }

  async function analyzeImage() {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    formData.append("hours", 0);
    formData.append("date", new Date().toLocaleString());

    const csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");
    if (!csrfToken) return alert("Missing CSRF token");

    const response = await fetch("/predict_spoilage_image", {
      method: "POST",
      headers: { "X-CSRF-Token": csrfToken },
      body: formData,
    });

    const reportData = {
      food_type: "unknown",
      temperature: "N/A",
      humidity: "N/A",
      storage_type: "N/A",
      hours: 0,
      date: new Date().toLocaleString(),
    };

    await handleResponse(response, reportData, csrfToken);
  }

  async function handleResponse(response, reportData, csrfToken) {
    if (!response.ok) return showWarning("Error: Unable to process request.");

    const result = await response.json();
    if (result.error) {
      showWarning("Prediction failed: " + result.error);
      return;
    }
    const probability = Number(result.probability);
    if (isNaN(probability)) {
      showWarning("Prediction failed: Invalid probability value.");
      return;
    }
    updateResults(
      reportData.food_type,
      reportData.date,
      result.category,
      probability * 100,
      result.recommendation,
      result.storage_tip
    );

    document.getElementById("resultsSection").style.display = "block";

    document.getElementById("downloadReport").onclick = function () {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/download_report";

      Object.entries({
        ...reportData,
        category: result.category,
        probability: result.probability * 100,
        recommendation: result.recommendation,
        storage_tip: result.storage_tip,
      }).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      const csrfInput = document.createElement("input");
      csrfInput.type = "hidden";
      csrfInput.name = "csrf_token";
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);

      document.body.appendChild(form);
      form.submit();
    };
  }

  function updateResults(
    foodType,
    dateTime,
    category,
    probability,
    recommendation,
    storageTip
  ) {
    document.getElementById("resultFoodType").textContent =
      foodType.charAt(0).toUpperCase() + foodType.slice(1);
    document.getElementById("resultDateTime").textContent = dateTime;
    document.getElementById("statusText").textContent = category;
    document.getElementById(
      "probabilityText"
    ).textContent = `Spoilage Probability: ${probability.toFixed(1)}%`;
    document.getElementById("recommendationText").textContent = recommendation;
    document.getElementById("storageTipText").textContent = storageTip;

    const fill = document.getElementById("probabilityFill");
    fill.style.width = `${probability}%`;

    if (probability < 30) {
      fill.style.backgroundColor = "#8BC34A";
      showMessage("safe", "This food appears to be safe to eat");
    } else if (probability < 70) {
      fill.style.backgroundColor = "#FF9800";
      showMessage("warning", "This food may be nearing spoilage");
    } else {
      fill.style.backgroundColor = "#F44336";
      showMessage("danger", "This food may be spoiled and unsafe to eat");
    }
  }

  function showWarning(message) {
    document.getElementById("safetyWarning").innerHTML = `
      <div class="danger-message"><i class="fas fa-exclamation-circle"></i> ${message}</div>
    `;
    document.getElementById("resultsSection").style.display = "block";
  }

  function showMessage(type, message) {
    const icons = {
      safe: "fas fa-check-circle",
      warning: "fas fa-exclamation-triangle",
      danger: "fas fa-skull-crossbones",
    };
    const classes = {
      safe: "safe-message",
      warning: "warning-message",
      danger: "danger-message",
    };
    document.getElementById("safetyWarning").innerHTML = `
      <div class="${classes[type]}"><i class="${icons[type]}"></i> ${message}</div>
    `;
  }
});
