

      hamburger=document.querySelector(".hamburger");
      hamburger.onclick =function(){
          navBar=document.querySelector(".nav-bar");
          navBar.classList.toggle("active");
      }

      window.onscroll = function() {
        var goToTop = document.getElementById("goToTop");
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
          goToTop.style.display = "block";
        } else {
          goToTop.style.display = "none";
        }
      };
      
      function scrollToTop(event) {
        event.preventDefault();
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
      }