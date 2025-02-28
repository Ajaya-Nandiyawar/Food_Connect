

      hamburger=document.querySelector(".hamburger");
      hamburger.onclick =function(){
          navBar=document.querySelector(".nav-bar");
          navBar.classList.toggle("active");
      }

      
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.slide1');
    const sliderNav = document.querySelector('.slider-nav');
    let currentSlide = 0;
    let slideInterval;
  
    // Create navigation dots
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.classList.add('slider-dot');
      if (index === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
      dot.addEventListener('click', () => goToSlide(index));
      sliderNav.appendChild(dot);
    });
  
    const dots = document.querySelectorAll('.slider-dot');
  
    function goToSlide(index) {
      // Remove active classes
      slides[currentSlide].classList.remove('active');
      dots[currentSlide].classList.remove('active');
      
      // Set new slide
      currentSlide = index;
      
      // Add active classes
      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
    }
  
    function nextSlide() {
      const next = (currentSlide + 1) % slides.length;
      goToSlide(next);
    }
  
    // Start automatic slideshow
    function startSlideshow() {
      slideInterval = setInterval(nextSlide, 5000);
    }
  
    // Pause slideshow when user interacts with navigation
    sliderNav.addEventListener('mouseenter', () => {
      clearInterval(slideInterval);
    });
  
    // Resume slideshow when user leaves navigation
    sliderNav.addEventListener('mouseleave', startSlideshow);
  
    // Start the slideshow
    startSlideshow();
  });

  // Get the button element
const scrollToTopButton = document.querySelector('.scroll-to-top-button');

// Show/hide button based on scroll position
window.addEventListener('scroll', () => {
  if (window.scrollY > 100) { // Show button after scrolling 100px
    scrollToTopButton.style.display = 'flex';
  } else {
    scrollToTopButton.style.display = 'none';
  }
});

// Smooth scroll to top when button is clicked
scrollToTopButton.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});