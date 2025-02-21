document.addEventListener('DOMContentLoaded', () => {
    // Navigation active state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            navItems.forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    // Donation form handling
    const donationForm = document.getElementById('donationForm');
    donationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const foodType = document.getElementById('foodType').value;
        const quantity = document.getElementById('quantity').value;
        const unit = document.getElementById('unit').value;
        const expiryDate = document.getElementById('expiryDate').value;
        const pickupTime = document.getElementById('pickupTime').value;
        const instructions = document.getElementById('instructions').value;

        // Create new donation entry
        const donationId = `#DON${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        const newRow = createDonationRow(donationId, foodType, quantity, unit, pickupTime);
        
        // Add to table
        const tbody = document.getElementById('activeDonationsTable');
        tbody.insertBefore(newRow, tbody.firstChild);

        // Clear form
        clearForm();

        // Show success message
        alert('Donation created successfully!');
    });
});

function createDonationRow(id, foodType, quantity, unit, pickupTime) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${id}</td>
        <td>${foodType}</td>
        <td>${quantity} ${unit}</td>
        <td>${pickupTime}</td>
        <td><span class="status pending">Pending Pickup</span></td>
        <td class="actions">
            <a href="#" class="action-link edit">Edit</a>
            <a href="#" class="action-link cancel">Cancel</a>
        </td>
    `;
    return tr;
}

function clearForm() {
    document.getElementById('donationForm').reset();
}

// Handle action links
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('action-link')) {
        e.preventDefault();
        const action = e.target.textContent;
        const row = e.target.closest('tr');
        const donationId = row.cells[0].textContent;

        switch(action) {
            case 'Edit':
                alert(`Edit donation ${donationId}`);
                break;
            case 'Cancel':
                if (confirm(`Are you sure you want to cancel donation ${donationId}?`)) {
                    row.remove();
                }
                break;
            case 'View':
                alert(`View donation ${donationId}`);
                break;
            case 'Complete':
                if (confirm(`Mark donation ${donationId} as complete?`)) {
                    row.remove();
                }
                break;
        }
    }
});