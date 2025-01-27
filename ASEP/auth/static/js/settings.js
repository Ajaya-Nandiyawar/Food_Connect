function messageUs() {
    alert('Message functionality will be implemented here');
}

function scheduleCall() {
    alert('Call scheduling functionality will be implemented here');
}

let originalAboutUsContent = ""; // To store the original content

// Load saved content from localStorage on page load
document.addEventListener("DOMContentLoaded", () => {
    const savedContent = localStorage.getItem("aboutUsContent");
    const content = document.getElementById("aboutUsContent");

    if (savedContent) {
        content.innerText = savedContent; // Load saved content if it exists
    } else {
        originalAboutUsContent = content.innerText; // Set the original content
    }
});

function toggleEditAboutUs() {
    const content = document.getElementById("aboutUsContent");
    const editBtn = document.getElementById("editBtn");
    const saveBtn = document.getElementById("saveBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    if (content.isContentEditable) {
        content.contentEditable = "false";
        editBtn.style.display = "block";
        saveBtn.style.display = "none";
        cancelBtn.style.display = "none";
    } else {
        originalAboutUsContent = content.innerText; // Save the original content before editing
        content.contentEditable = "true";
        content.focus();
        editBtn.style.display = "none";
        saveBtn.style.display = "block";
        cancelBtn.style.display = "block";
    }
}

function saveAboutUs() {
    const content = document.getElementById("aboutUsContent");
    const editBtn = document.getElementById("editBtn");
    const saveBtn = document.getElementById("saveBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    const updatedContent = content.innerText;

    // Save content to localStorage
    localStorage.setItem("aboutUsContent", updatedContent);

    // Exit edit mode
    content.contentEditable = "false";
    editBtn.style.display = "block";
    saveBtn.style.display = "none";
    cancelBtn.style.display = "none";

    
}

function cancelEditAboutUs() {
    const content = document.getElementById("aboutUsContent");
    const editBtn = document.getElementById("editBtn");
    const saveBtn = document.getElementById("saveBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    // Revert content to the original value and exit edit mode
    content.innerText = originalAboutUsContent;
    content.contentEditable = "false";

    editBtn.style.display = "block";
    saveBtn.style.display = "none";
    cancelBtn.style.display = "none";

    
}