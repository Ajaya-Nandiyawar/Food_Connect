document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("donationForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = {
        food_type: document.getElementById("foodType").value,
        quantity: document.getElementById("quantity").value,
        unit: document.getElementById("unit").value,
        expiry_date: document.getElementById("expiryDate").value,
        pickup_time: document.getElementById("pickupTime").value,
        special_instructions: document.getElementById("instructions").value,
      };

      fetch("http://127.0.0.1:5000/Restaurant/donation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": document.querySelector('meta[name="csrf-token"]')
            .content,
        },
        body: JSON.stringify(formData),
      })
        .then((response) => {
          if (!response.ok)
            throw new Error(`HTTP error! Status: ${response.status}`);
          return response.json();
        })
        .then((data) => {
          alert(data.message);
          if (data.status === "success") window.location.reload();
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Failed to submit donation. Check console for details.");
        });
    });
});
