document.querySelectorAll('.contact-btn').forEach(button => {
    button.addEventListener('click', function() {
      const restaurantName = this.closest('.restaurant-info').querySelector('h3').textContent;
      alert(`Thank you for your interest in partnering with ${restaurantName}. Our team will contact you shortly!`);
    });
  });