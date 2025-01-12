      // Previous click handlers remain
      
      // Add filtering functionality
      const filterButtons = document.querySelectorAll('.filter-btn');
      const ngoCards = document.querySelectorAll('.ngo-card');
      
      filterButtons.forEach(button => {
        button.addEventListener('click', () => {
          const filter = button.dataset.filter;
          
          // Update active button
          filterButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          
          // Filter cards
          ngoCards.forEach(card => {
            if (filter === 'all' || card.dataset.category === filter) {
              card.style.display = 'block';
              setTimeout(() => card.style.opacity = '1', 0);
            } else {
              card.style.opacity = '0';
              setTimeout(() => card.style.display = 'none', 500);
            }
          });
        });
      });
      
      // Add scroll reveal animation
      const cards = document.querySelectorAll('.ngo-card, .stat-card');
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }
          });
        },
        { threshold: 0.1 }
      );
      
      cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        observer.observe(card);
      });