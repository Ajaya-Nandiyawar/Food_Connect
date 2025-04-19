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
  const badges = document.querySelectorAll(".badge-card");
  const rankBadges = document.querySelectorAll(".rank-card");
  const modal = document.getElementById("badge-modal");
  const badgeImage = document.getElementById("badge-image");
  const badgeMessage = document.getElementById("badge-message");
  const closeModal = document.querySelector(".close-btn");
  const mainWrapper = document.querySelector(".main-wrapper"); // Select the main wrapper

  const badgeDetails = {
    "First Donation": "Awarded for making your first donation.",
    "Food Safety": "Awarded for completing food safety training.",
    "Quick Response": "Awarded for responding quickly to a request.",
    "Team Leader": "Awarded for leading a team successfully.",
    "Inventory Pro": "Awarded for managing inventory efficiently.",
    "Community Builder": "Awarded for building strong community connections."
  };

  const rankDetails = {
    "Bronze": "Achieved for contributing 50+ hours of volunteering.",
    "Silver": "Achieved for contributing 100+ hours of volunteering.",
    "Gold": "Achieved for contributing 200+ hours of volunteering."
  };

  const openModal = (title, imgSrc, details) => {
    badgeImage.src = imgSrc;
    badgeMessage.innerText = details[title] || "No details available.";
    modal.style.display = "flex";

    // Add blur effect to the main wrapper
    mainWrapper.classList.add("modal-active");
  };

  badges.forEach((badge) => {
    badge.addEventListener("click", () => {
      const badgeTitle = badge.querySelector("h3").innerText;
      const badgeImgSrc = badge.querySelector("img").src;
      openModal(badgeTitle, badgeImgSrc, badgeDetails);
    });
  });

  rankBadges.forEach((rankBadge) => {
    rankBadge.addEventListener("click", () => {
      const rankTitle = rankBadge.querySelector("h3").innerText;
      const rankImgSrc = rankBadge.querySelector("img").src;
      openModal(rankTitle, rankImgSrc, rankDetails);
    });
  });

  closeModal.addEventListener("click", () => {
    modal.style.display = "none";

    // Remove blur effect from the main wrapper
    mainWrapper.classList.remove("modal-active");
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";

      // Remove blur effect from the main wrapper
      mainWrapper.classList.remove("modal-active");
    }
  });
});