document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type = "success") {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const activities = await response.json();

      renderActivities(activities);
      populateActivityOptions(activities);
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function renderActivities(activities) {
    activitiesList.innerHTML = "";

    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card participant-card";

      const title = document.createElement("h4");
      title.textContent = name;

      const description = document.createElement("p");
      description.textContent = details.description;

      const schedule = document.createElement("p");
      schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

      const spotsLeft = details.max_participants - details.participants.length;
      const availability = document.createElement("p");
      availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

      const participantsSection = document.createElement("div");
      participantsSection.className = "participants-section";

      const participantsTitle = document.createElement("h5");
      participantsTitle.textContent = `Participants (${details.participants.length})`;

      const participantsList = document.createElement("ul");
      participantsList.className = "participants-list";

      if (details.participants.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "participant-empty";
        emptyItem.textContent = "No participants yet.";
        participantsList.appendChild(emptyItem);
      } else {
        details.participants.forEach((email) => {
          const participantItem = document.createElement("li");
          participantItem.className = "participant-item";

          const participantEmail = document.createElement("span");
          participantEmail.className = "participant-email";
          participantEmail.textContent = email;

          const unregisterButton = document.createElement("button");
          unregisterButton.type = "button";
          unregisterButton.className = "unregister-button";
          unregisterButton.title = `Unregister ${email}`;
          unregisterButton.setAttribute("aria-label", `Unregister ${email}`);
          unregisterButton.textContent = "🗑️";

          unregisterButton.addEventListener("click", () => {
            unregisterParticipant(name, email);
          });

          participantItem.appendChild(participantEmail);
          participantItem.appendChild(unregisterButton);
          participantsList.appendChild(participantItem);
        });
      }

      participantsSection.appendChild(participantsTitle);
      participantsSection.appendChild(participantsList);

      activityCard.appendChild(title);
      activityCard.appendChild(description);
      activityCard.appendChild(schedule);
      activityCard.appendChild(availability);
      activityCard.appendChild(participantsSection);

      activitiesList.appendChild(activityCard);
    });
  }

  function populateActivityOptions(activities) {
    const selectedActivity = activitySelect.value;

    activitySelect.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "-- Select an activity --";
    activitySelect.appendChild(defaultOption);

    Object.keys(activities).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    if (selectedActivity && activities[selectedActivity]) {
      activitySelect.value = selectedActivity;
    }
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Failed to unregister participant", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    }
  }

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
        showMessage(result.message, "success");
        signupForm.reset();

        // Fix Step 3 bug: update cards immediately after registration
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  fetchActivities();
});