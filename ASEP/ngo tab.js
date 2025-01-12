document.querySelectorAll('.partner-btn').forEach(button => {
    button.addEventListener('click', function() {
      const ngoName = this.closest('.ngo-info').querySelector('h3').textContent;
      alert(`Thank you for your interest in partnering with ${ngoName}. Our team will contact you shortly to discuss collaboration opportunities!`);
    });
  });