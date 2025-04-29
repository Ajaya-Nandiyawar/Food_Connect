document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  
  const initProfile = () => {
    // Badge hover effects
    const badgeCards = document.querySelectorAll('.badge-card');
    badgeCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        if (!card.classList.contains('disabled')) {
          card.style.transform = 'scale(1.03)';
        }
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'scale(1)';
      });
    });

    const rankCards = document.querySelectorAll('.rank-card');
    rankCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'scale(1.03)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'scale(1)';
      });
    });

    // Dynamic stats counter
    const statValues = document.querySelectorAll('.stat-card h3');
    if (window.innerWidth > 768) {
      statValues.forEach(stat => {
        const target = +stat.textContent;
        let current = 0;
        const increment = target / 20;
        
        const timer = setInterval(() => {
          current += increment;
          stat.textContent = Math.ceil(current);
          if (current >= target) {
            stat.textContent = target;
            clearInterval(timer);
          }
        }, 50);
      });
    }

    // About section functionality
    const aboutText = document.getElementById('about-text');
    const editBtn = document.getElementById('edit-about-btn');
    const saveBtn = document.getElementById('save-about-btn');

    // Load saved about text
    const savedAbout = localStorage.getItem('aboutText');
    if (savedAbout) {
      aboutText.textContent = savedAbout;
    }

    editBtn.addEventListener('click', () => {
      aboutText.setAttribute('contenteditable', 'true');
      aboutText.focus();
      editBtn.style.display = 'none';
      saveBtn.style.display = 'inline-block';
    });

    saveBtn.addEventListener('click', () => {
      aboutText.setAttribute('contenteditable', 'false');
      localStorage.setItem('aboutText', aboutText.textContent);
      editBtn.style.display = 'inline-block';
      saveBtn.style.display = 'none';
    });

    // Location fetching
    const locationElement = document.getElementById('user-location');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            const data = await response.json();
            const location = data.address.city || data.address.town || data.address.village || 'Unknown location';
            locationElement.textContent = `Location: ${location}`;
          } catch (error) {
            locationElement.textContent = 'Unable to fetch location';
          }
        },
        () => {
          locationElement.textContent = 'Location access denied';
        }
      );
    } else {
      locationElement.textContent = 'Geolocation not supported';
    }
  };

  // Initialize when sidebar state is ready
  const checkSidebarReady = setInterval(() => {
    if (document.querySelector('.sidebar')) {
      clearInterval(checkSidebarReady);
      initProfile();
    }
  }, 100);
});

document.addEventListener("DOMContentLoaded", () => {
  const editBtn = document.getElementById("edit-contacts-btn");
  const saveBtn = document.getElementById("save-contacts-btn");
  const emailField = document.getElementById("user-email");
  const phoneField = document.getElementById("user-phone");
  const addressField = document.getElementById("user-address");

  // Load saved data from localStorage
  const savedEmail = localStorage.getItem("userEmail");
  const savedPhone = localStorage.getItem("userPhone");
  const savedAddress = localStorage.getItem("userAddress");

  if (savedEmail) emailField.value = savedEmail;
  if (savedPhone) phoneField.value = savedPhone;
  if (savedAddress) addressField.value = savedAddress;

  editBtn.addEventListener("click", () => {
    emailField.removeAttribute("readonly");
    phoneField.removeAttribute("readonly");
    addressField.removeAttribute("readonly");
    phoneField.focus();
    editBtn.style.display = "none";
    saveBtn.style.display = "inline-block";
  });

  saveBtn.addEventListener("click", () => {
    const phoneValue = phoneField.value.trim();

    // Validate phone number length and numeric input
    if (!/^\d{10}$/.test(phoneValue)) {
      alert("Phone number must be exactly 10 digits.");
      phoneField.focus();
      return;
    }

    emailField.setAttribute("readonly", "true");
    phoneField.setAttribute("readonly", "true");
    addressField.setAttribute("readonly", "true");
    editBtn.style.display = "inline-block";
    saveBtn.style.display = "none";

    // Save updated data to localStorage
    localStorage.setItem("userEmail", emailField.value.trim());
    localStorage.setItem("userPhone", phoneValue);
    localStorage.setItem("userAddress", addressField.value.trim());

    console.log("Updated Contact Information:", {
      email: emailField.value.trim(),
      phone: phoneValue,
      address: addressField.value.trim(),
    });
  });
});