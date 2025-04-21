document.addEventListener('DOMContentLoaded', function() {
    // Tab Navigation
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab panes
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Show the corresponding tab pane
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Filter Buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    const tableRows = document.querySelectorAll('tbody tr');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all filter buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            // Show/hide table rows based on filter
            tableRows.forEach(row => {
                const status = row.querySelector('.status');
                
                if (filter === 'all') {
                    row.style.display = '';
                } else if (filter === 'pending' && status.classList.contains('pending')) {
                    row.style.display = '';
                } else if (filter === 'approved' && status.classList.contains('approved')) {
                    row.style.display = '';
                } else if (filter === 'declined' && status.classList.contains('declined')) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });
    
    // Set default active tab
    document.querySelector('.tab[data-tab="certificates"]').classList.add('active');
    document.getElementById('certificates').classList.add('active');
    
    // Sidebar menu item click
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');
        });
    });
});

     // Sample data for certificates
     const certificatesData = [
        {
            id: 1,
            certId: "CERT-001",
            task: "Community Garden Volunteer",
            date: "2025-03-10",
            hours: "8",
            status: "Approved",
            supervisor: "Maria Garcia",
            declineReason: ""
        },
        {
            id: 2,
            certId: "CERT-002",
            task: "Food Bank Assistant",
            date: "2025-03-22",
            hours: "6",
            status: "Approved",
            supervisor: "David Chen",
            declineReason: ""
        },
        {
            id: 3,
            certId: "CERT-003",
            task: "City Park Cleanup",
            date: "2025-04-05",
            hours: "4",
            status: "Pending",
            supervisor: "Sarah Johnson",
            declineReason: ""
        },
        {
            id: 4,
            certId: "CERT-004",
            task: "Senior Center Helper",
            date: "2025-04-08",
            hours: "3",
            status: "Declined",
            supervisor: "Michael Brown",
            declineReason: "Insufficient attendance documentation. Please resubmit with completed attendance log."
        },
        {
            id: 5,
            certId: "CERT-005",
            task: "Homeless Shelter Volunteer",
            date: "2025-04-12",
            hours: "5",
            status: "Approved",
            supervisor: "Robert Wilson",
            declineReason: ""
        },
        {
            id: 6,
            certId: "CERT-006",
            task: "Animal Shelter Assistant",
            date: "2025-04-17",
            hours: "7",
            status: "Pending",
            supervisor: "Jennifer Lee",
            declineReason: ""
        }
    ];

    // Elements
    const modal = document.getElementById("certificateModal");
    const closeBtn = document.querySelector(".close");
    const certificateTable = document.getElementById("certificatesTable");
    const searchInput = document.getElementById("searchInput");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const emptyCertificates = document.getElementById("emptyCertificates");

    // Current selected certificate
    let currentCertificateId = null;

    // Initialize counters
    function updateCounters() {
        document.getElementById("totalCertificates").textContent = certificatesData.length;
        document.getElementById("pendingCertificates").textContent = 
            certificatesData.filter(cert => cert.status === "Pending").length;
        document.getElementById("approvedCertificates").textContent = 
            certificatesData.filter(cert => cert.status === "Approved").length;
    }
    
    // Initialize
    updateCounters();
    
    // Search functionality
    searchInput.addEventListener("keyup", filterCertificates);
    
    // Filter button click events
    filterButtons.forEach(button => {
        button.addEventListener("click", function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove("active"));
            // Add active class to clicked button
            this.classList.add("active");
            // Apply filter
            filterCertificates();
        });
    });
    
    // Combined filter and search function
    function filterCertificates() {
        const searchValue = searchInput.value.toLowerCase();
        const activeFilter = document.querySelector(".filter-btn.active").getAttribute("data-filter");
        
        const rows = certificateTable.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
        let visibleCount = 0;
        
        for (let i = 0; i < rows.length; i++) {
            const taskName = rows[i].getElementsByTagName("td")[1].textContent.toLowerCase();
            const status = rows[i].getAttribute("data-status");
            
            const matchesSearch = taskName.includes(searchValue);
            const matchesFilter = activeFilter === "all" || status === activeFilter;
            
            if (matchesSearch && matchesFilter) {
                rows[i].style.display = "";
                visibleCount++;
            } else {
                rows[i].style.display = "none";
            }
        }
        
        // Toggle empty state message
        emptyCertificates.style.display = visibleCount === 0 ? "block" : "none";
        certificateTable.style.display = visibleCount === 0 ? "none" : "";
    }
    
    // View certificate details
    function viewCertificate(id) {
        currentCertificateId = id;
        const certificate = certificatesData.find(cert => cert.id === id);
        
        if (certificate) {
            document.getElementById("certId").textContent = certificate.certId;
            document.getElementById("certTask").textContent = certificate.task;
            document.getElementById("certDate").textContent = certificate.date;
            document.getElementById("certHours").textContent = certificate.hours + " hours";
            document.getElementById("certStatus").textContent = certificate.status;
            document.getElementById("certSupervisor").textContent = certificate.supervisor;
            
            // Handle decline reason if present
            if (certificate.status === "Declined" && certificate.declineReason) {
                document.getElementById("declineReason").style.display = "block";
                document.getElementById("certDeclineReason").textContent = certificate.declineReason;
            } else {
                document.getElementById("declineReason").style.display = "none";
            }
            
            // Show certificate preview only for approved certificates
            if (certificate.status === "Approved") {
                document.getElementById("certificatePreview").style.display = "block";
                document.getElementById("previewHours").textContent = certificate.hours;
                document.getElementById("previewTask").textContent = certificate.task;
                document.getElementById("previewDate").textContent = certificate.date;
                document.getElementById("modalDownloadBtn").style.display = "inline-block";
            } else {
                document.getElementById("certificatePreview").style.display = "none";
                document.getElementById("modalDownloadBtn").style.display = "none";
            }
            
            modal.style.display = "block";
        }
    }
    
    // Download certificate
    function downloadCertificate(id) {
        // In a real application, this would generate and download a PDF
        // For demo purposes, we'll just show a notification
        const certificate = certificatesData.find(cert => cert.id === id);
        
        if (certificate && certificate.status === "Approved") {
            showNotification("Certificate download started!");
        }
    }
    
    // Download from modal
    function downloadFromModal() {
        if (currentCertificateId) {
            downloadCertificate(currentCertificateId);
            closeModal();
        }
    }
    
    // Show notification
    function showNotification(message) {
        const notification = document.getElementById("notification");
        notification.textContent = message;
        notification.style.display = "block";
        
        setTimeout(() => {
            notification.style.display = "none";
        }, 3000);
    }
    
    // Close modal
    function closeModal() {
        modal.style.display = "none";
    }
    
    // Close on clicking X or outside the modal
    closeBtn.onclick = closeModal;
    
    window.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
      }


        // Location fetching
        const locationElement = document.getElementById('user-location');
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                );
                const data = await response.json();
                const location = data.address.city || data.address.town || data.address.village || 'Unknown location';
                locationElement.textContent = `Location: ${location}`;
              } catch (error) {
                locationElement.textContent = 'Unable to fetch location';
              }
            },
            () => {
              locationElement.textContent = 'Location access denied';
            }
          );
        } else {
          locationElement.textContent = 'Geolocation not supported';
        }
     