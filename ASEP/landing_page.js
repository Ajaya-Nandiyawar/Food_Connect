const slides = document.querySelectorAll(".slide");
      const dots = document.querySelectorAll(".slider-dot");
      let currentSlide = 0;

      function showSlide(index) {
        slides.forEach((slide) => slide.classList.remove("active"));
        dots.forEach((dot) => dot.classList.remove("active"));
        slides[index].classList.add("active");
        dots[index].classList.add("active");
      }

      function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
      }

      // Add click event listeners to dots
      dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
          currentSlide = index;
          showSlide(currentSlide);
        });
      });

      // Change slide every 5 seconds
      setInterval(nextSlide, 5000);