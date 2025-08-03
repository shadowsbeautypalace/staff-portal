// Initialize logout button
document.getElementById("logout-btn").addEventListener("click", () => {
  window.location.href = "index.html";
});

const container = document.getElementById("appointmentsContainer");
const datePicker = document.getElementById("datePicker");

// When date is selected
datePicker.addEventListener("change", async () => {
  const selectedDate = datePicker.value;
  container.innerHTML = "<p>Loading...</p>";

  if (!selectedDate) {
    container.innerHTML = "<p>Please select a date.</p>";
    return;
  }

  try {
    const snapshot = await db.collection("appointments")
      .where("date", "==", selectedDate)
      .orderBy("time")
      .get();

    if (snapshot.empty) {
      container.innerHTML = `<p>No appointments found for ${selectedDate}.</p>`;
      return;
    }

    container.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      const docId = doc.id;

      const createdAt = data.created_at?.toDate();
      const createdAtStr = createdAt
        ? `${createdAt.toLocaleDateString()} ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : "Not available";

      const div = document.createElement("div");
      div.classList.add("appointment-card");

      div.innerHTML = `
        <h3>${data.service}</h3>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        <p><strong>Created At:</strong> ${createdAtStr}</p>

        <div class="btn-group">
          <button class="btn" onclick="cancelAppointment('${docId}', this)">Cancel</button>
          <button class="btn" onclick="showModifyForm('${docId}')">Modify</button>
        </div>

        <div id="modify-${docId}" class="modify-form">
          <label>New Date: <input type="date" id="newDate-${docId}"></label>
          <label>New Time: <input type="time" id="newTime-${docId}"></label>
          <button class="btn" onclick="saveChanges('${docId}')">Save</button>
        </div>
      `;

      container.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading appointments:", error);
    container.innerHTML = `<p style="color:red;">❌ Error fetching appointments.</p>`;
  }
});

// Cancel an appointment
async function cancelAppointment(docId, btn) {
  const confirmed = confirm("Cancel this appointment?");
  if (!confirmed) return;

  btn.disabled = true;
  btn.textContent = "Cancelling...";

  try {
    await db.collection("appointments").doc(docId).delete();
    btn.closest(".appointment-card").remove();
    alert("✅ Appointment cancelled.");
  } catch (err) {
    console.error("Error:", err);
    alert("❌ Failed to cancel.");
    btn.disabled = false;
    btn.textContent = "Cancel";
  }
}

// Show modify form
function showModifyForm(docId) {
  const section = document.getElementById(`modify-${docId}`);
  section.style.display = section.style.display === "none" ? "block" : "none";
}

// Save modifications
async function saveChanges(docId) {
  const newDate = document.getElementById(`newDate-${docId}`).value;
  const newTime = document.getElementById(`newTime-${docId}`).value;

  if (!newDate || !newTime) {
    alert("⚠️ Enter both date and time.");
    return;
  }

  // Check for valid time range
  const hour = parseInt(newTime.split(":")[0]);
  if (hour < 9 || hour >= 20) {
    alert("❌ Time must be between 9 AM and 8 PM.");
    return;
  }

  // Check if new date/time is not in the past
  const selectedDateTime = new Date(`${newDate}T${newTime}`);
  const now = new Date();
  if (selectedDateTime < now) {
    alert("❌ Cannot book in the past.");
    return;
  }

  try {
    await db.collection("appointments").doc(docId).update({
      date: newDate,
      time: newTime
    });

    alert("✅ Appointment updated.");
    document.getElementById(`modify-${docId}`).style.display = "none";
    datePicker.dispatchEvent(new Event("change")); // Refresh
  } catch (err) {
    console.error("Error updating:", err);
    alert("❌ Update failed.");
  }
}
