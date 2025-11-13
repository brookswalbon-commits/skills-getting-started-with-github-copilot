document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const signoutBtn = document.getElementById("signout-btn");
  const participantsList = document.getElementById("participants-list");
  let allActivities = {};

  // Handle sign out
  signoutBtn.addEventListener("click", () => {
    // Clear user session data
    sessionStorage.clear();
    localStorage.clear();
    
    // Reset form
    signupForm.reset();
    messageDiv.classList.add("hidden");
    
    // Show confirmation
    alert("You have been signed out.");
  });

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(allActivities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle activity selection change
  activitySelect.addEventListener("change", () => {
    const selectedActivity = activitySelect.value;
    
    if (!selectedActivity) {
      participantsList.innerHTML = '<p class="placeholder-text">Select an activity to view participants</p>';
      return;
    }

    const activity = allActivities[selectedActivity];
    if (!activity) {
      participantsList.innerHTML = '<p>Activity not found</p>';
      return;
    }

    // Display participants
    if (activity.participants.length === 0) {
      participantsList.innerHTML = '<p class="placeholder-text">No participants yet</p>';
    } else {
      participantsList.innerHTML = '';
      const participantHeader = document.createElement("p");
      participantHeader.innerHTML = `<strong>${activity.participants.length} participant${activity.participants.length !== 1 ? 's' : ''}</strong>`;
      participantsList.appendChild(participantHeader);

      const participantList = document.createElement("ul");
      participantList.className = "participant-list";
      activity.participants.forEach((email) => {
        const listItem = document.createElement("li");
        listItem.textContent = email;
        participantList.appendChild(listItem);
      });
      participantsList.appendChild(participantList);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        
        // Refresh participants list
        await fetchActivities();
        if (activity) {
          activitySelect.value = activity;
          activitySelect.dispatchEvent(new Event("change"));
        }
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
