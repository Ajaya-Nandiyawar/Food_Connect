document.addEventListener('DOMContentLoaded', () => {
  const volunteerFormContainer = document.getElementById('volunteerFormContainer');
  const volunteerForm = document.getElementById('volunteerForm');
  const mainContent = document.getElementById('mainContent');
  const closeBtn = document.getElementById('closeFormBtn');
  const joinButtons = document.querySelectorAll('.partner-btn');

  joinButtons.forEach(button => {
    button.addEventListener('click', () => {
      volunteerFormContainer.classList.add('active');
      mainContent.classList.add('blur');
      document.body.style.overflow = 'hidden';
    });
  });

  closeBtn.addEventListener('click', () => {
    volunteerFormContainer.classList.remove('active');
    mainContent.classList.remove('blur');
    document.body.style.overflow = '';
  });

  document.addEventListener('click', (e) => {
    if (volunteerFormContainer.classList.contains('active') &&
        !volunteerForm.contains(e.target) &&
        !e.target.classList.contains('partner-btn')) {
      volunteerFormContainer.classList.remove('active');
      mainContent.classList.remove('blur');
      document.body.style.overflow = '';
    }
  });
});