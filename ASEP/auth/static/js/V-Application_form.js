const form = document.getElementById('volunteerForm');
const successMsg = document.getElementById('successMsg');

form.addEventListener('submit', function (e) {
  e.preventDefault();

  if (form.checkValidity()) {
    successMsg.style.display = 'block';
    form.reset();

    setTimeout(() => {
      successMsg.style.display = 'none';
    }, 5000);
  }
});

function initAutocomplete() {
    const input = document.getElementById('autocomplete');
    const options = {
    types: ['(cities)'],
    componentRestrictions: { country: 'in' } // Optional: restrict to India
    };
    new google.maps.places.Autocomplete(input, options);
}
