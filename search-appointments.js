// SEARCH APPOINTMENTS BY PHONE NUMBER
async function searchAppointments() {
  const phone = document.getElementById("phoneInput").value.trim();
  const container = document.getElementById("appointmentsContainer");
  container.innerHTML = "";

  // Validate phone number: 10–15 digits only
  if (!/^\d{10,15}$/.test(phone)) {
    container.innerHTML = "<p style='color:red;'>Invalid phone number format. Enter 10–15 digits.</p>";
    return;
  }

  try {
    const snapshot = await db
      .collection("appointments")
      .where("phone", "==", phone)
      .get();

    if (snapshot.empty) {
      container.innerHTML = "<p>No appointments found for this number.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const div = document.createElement("div");
      div.className = "appointment-card";

      div.innerHTML = `
        <h3>${data.name}</h3>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        <p><strong>Service:</strong> ${data.service}</p>

        <div class="btn-group">
          <button class="btn" onclick="showModifyForm('${doc.id}', this)">Modify</button>
          <button class="btn cancel-btn" onclick="cancelAppointment('${doc.id}')">Cancel</button>
        </div>

        <form class="modify-form" onsubmit="submitModification(event, '${doc.id}')">
          <label>New Date: <input type="date" name="date" required></label>
          <label>New Time: <input type="time" name="time" required></label>
          <button type="submit" class="btn">Submit</button>
        </form>
      `;

      container.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='color:red;'>Error fetching appointments. Try again later.</p>";
  }
}

// TOGGLE MODIFY FORM
function showModifyForm(id, button) {
  const form = button.closest(".appointment-card").querySelector(".modify-form");
  form.style.display = form.style.display === "block" ? "none" : "block";
}

// SUBMIT MODIFICATION WITH BUSINESS RULE VALIDATION
async function submitModification(event, id) {
  event.preventDefault();
  const form = event.target;
  const newDate = form.date.value;
  const newTime = form.time.value;

  // Validate not in the past
  const now = new Date();
  const selectedDateTime = new Date(`${newDate}T${newTime}`);
  if (selectedDateTime < now) {
    alert("Cannot set appointment in the past.");
    return;
  }

  // Validate business hours: 09:00–20:00
  const [hour, minute] = newTime.split(":").map(Number);
  if (hour < 9 || hour > 20 || (hour === 20 && minute > 0)) {
    alert("Time must be between 09:00 and 20:00.");
    return;
  }

  // Update Firestore
  try {
    await db.collection("appointments").doc(id).update({
      date: newDate,
      time: newTime
    });
    alert("Appointment updated.");
    form.reset();
    form.style.display = "none";
    searchAppointments(); // refresh
  } catch (err) {
    console.error(err);
    alert("Error updating appointment.");
  }
}

// CANCEL APPOINTMENT
async function cancelAppointment(id) {
  if (!confirm("Are you sure you want to cancel this appointment?")) return;

  try {
    await db.collection("appointments").doc(id).delete();
    alert("Appointment canceled.");
    searchAppointments(); // refresh
  } catch (err) {
    console.error(err);
    alert("Error canceling appointment.");
  }
}
