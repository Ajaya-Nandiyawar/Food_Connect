function openSidebar() {
    if (sidebar.classList.contains('collapsed')) {
        sidebar.classList.remove('collapsed');
        toggleBtn.style.display = 'block';
    }
}

const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleBtn');
const iconBtn = document.getElementById('iconBtn');

toggleBtn.addEventListener('click', () => {
  sidebar.classList.add('collapsed');
  toggleBtn.style.display = 'none';
});

iconBtn.addEventListener('click', () => {
  openSidebar();
});

const tabs = document.querySelectorAll('.tab');
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    if (!sidebar.classList.contains('collapsed')) {
      console.log('Tab clicked:', tab.textContent);
    }
  });
});