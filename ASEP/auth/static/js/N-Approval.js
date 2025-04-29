 // Sample data for certificate requests
        const certificateData = [
            {
                id: 1,
                volunteer: "Sarah Johnson",
                task: "Food Distribution",
                date: "2025-04-10",
                hours: "8",
                supervisor: "Mark Thompson",
                comments: "Excellent work, very dedicated and professional.",
                status: "Pending"
            },
            {
                id: 2,
                volunteer: "Michael Rodriguez",
                task: "Homeless Shelter Assistance",
                date: "2025-04-12",
                hours: "6",
                supervisor: "Lisa Carter",
                comments: "Great attitude and willingness to help others.",
                status: "Pending"
            },
            {
                id: 3,
                volunteer: "Emily Chen",
                task: "Beach Cleanup",
                date: "2025-04-14",
                hours: "4",
                supervisor: "Robert Wilson",
                comments: "Showed leadership and initiative during the cleanup.",
                status: "Pending"
            },
            {
                id: 4,
                volunteer: "David Williams",
                task: "Tree Planting",
                date: "2025-04-15",
                hours: "5",
                supervisor: "Susan Miller",
                comments: "Efficiently planted 12 trees and helped other volunteers.",
                status: "Pending"
            }
        ];
        
        // Global variables
        let currentRequestId = null;
        let isApprove = true;
        const modal = document.getElementById("certificateModal");
        const detailsModal = document.getElementById("detailsModal");
        const closeBtn = document.querySelector(".close");
        
        // Search functionality
        document.getElementById("searchInput").addEventListener("keyup", function() {
            const searchValue = this.value.toLowerCase();
            const table = document.getElementById("certificateTable");
            const rows = table.getElementsByTagName("tbody")[0].getElementsByTagName("tr");
            let anyVisible = false;
            
            for (let i = 0; i < rows.length; i++) {
                const volunteerName = rows[i].getElementsByTagName("td")[1].textContent.toLowerCase();
                const taskName = rows[i].getElementsByTagName("td")[2].textContent.toLowerCase();
                
                if (volunteerName.includes(searchValue) || taskName.includes(searchValue)) {
                    rows[i].style.display = "";
                    anyVisible = true;
                } else {
                    rows[i].style.display = "none";
                }
            }
            
            document.getElementById("emptyMessage").style.display = anyVisible ? "none" : "block";
            table.style.display = anyVisible ? "" : "none";
        });
        
        // Open modal function
        function openModal(id, approve = true) {
            currentRequestId = id;
            isApprove = approve;
            
            const request = certificateData.find(cert => cert.id === id);
            if (request) {
                document.getElementById("modalTitle").textContent = approve ? "Approve Certificate" : "Decline Certificate";
                document.getElementById("modalVolunteer").textContent = request.volunteer;
                document.getElementById("modalTask").textContent = request.task;
                document.getElementById("modalDate").textContent = request.date;
                document.getElementById("modalHours").textContent = request.hours + " hours";
                document.getElementById("modalSupervisor").textContent = request.supervisor;
                
                document.getElementById("modalMessage").innerHTML = approve 
                    ? "<p>Are you sure you want to approve this certificate request?</p>"
                    : "<p>Are you sure you want to decline this certificate request?</p><p><textarea placeholder='Reason for declining (optional)' style='width: 100%; padding: 8px;'></textarea></p>";
                
                const confirmButton = document.getElementById("confirmButton");
                confirmButton.textContent = approve ? "Approve" : "Decline";
                confirmButton.className = approve ? "btn btn-approve" : "btn btn-decline";
                
                modal.style.display = "block";
            }
        }
        
        // View certificate details
        function viewCertificate(id) {
            const request = certificateData.find(cert => cert.id === id);
            if (request) {
                document.getElementById("detailsId").textContent = request.id;
                document.getElementById("detailsVolunteer").textContent = request.volunteer;
                document.getElementById("detailsTask").textContent = request.task;
                document.getElementById("detailsDate").textContent = request.date;
                document.getElementById("detailsHours").textContent = request.hours + " hours";
                document.getElementById("detailsSupervisor").textContent = request.supervisor;
                document.getElementById("detailsComments").textContent = request.comments;
                
                detailsModal.style.display = "block";
            }
        }
        
        // Process certificate request (approve/decline)
        function processCertificateRequest() {
            const tableRow = document.querySelector(`#certificateTable tbody tr:nth-child(${currentRequestId})`);
            const statusCell = tableRow.querySelector("td:nth-child(5)");
            const actionsCell = tableRow.querySelector("td:nth-child(6)");
            
            // Update the data
            const dataIndex = certificateData.findIndex(cert => cert.id === currentRequestId);
            if (dataIndex !== -1) {
                certificateData[dataIndex].status = isApprove ? "Approved" : "Declined";
            }
            
            // Update the UI
            const statusSpan = statusCell.querySelector(".status");
            statusSpan.textContent = isApprove ? "Approved" : "Declined";
            statusSpan.className = isApprove ? "status approved" : "status declined";
            
            // Replace the action buttons with just the view button
            actionsCell.innerHTML = '<button class="btn btn-view" onclick="viewCertificate(' + currentRequestId + ')">View Details</button>';
            
            closeModal();
            
            // Show notification
            alert(isApprove ? "Certificate has been approved!" : "Certificate has been declined.");
        }
        
        // Close modal functions
        function closeModal() {
            modal.style.display = "none";
        }
        
        function closeDetailsModal() {
            detailsModal.style.display = "none";
        }
        
        // Close on clicking X or outside the modal
        closeBtn.onclick = closeModal;
        
        window.onclick = function(event) {
            if (event.target === modal) {
                closeModal();
            }
            if (event.target === detailsModal) {
                closeDetailsModal();
            }
        };
  