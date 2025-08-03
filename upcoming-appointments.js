const container = document.getElementById("appointmentsContainer");

window.addEventListener("DOMContentLoaded", fetchUpcomingAppointments);

async function fetchUpcomingAppointments() {
  container.innerHTML = "";

  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + 14);

  try {
    const snapshot = await db.collection("appointments").get();
    const appointments = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const appointmentDateTime = new Date(`${data.date}T${data.time}`);

      if (appointmentDateTime >= today && appointmentDateTime <= endDate) {
        appointments.push({
          id: doc.id,
          ...data,
          appointmentDateTime,
          createdAt: data.created_at?.toDate() || new Date(0)
        });
      }
    });

    // Sort by appointment date/time then created_at
    appointments.sort((a, b) => {
      const diffDate = a.appointmentDateTime - b.appointmentDateTime;
      if (diffDate !== 0) return diffDate;
      return a.createdAt - b.createdAt;
    });

    if (appointments.length === 0) {
      container.innerHTML = "<p>No upcoming appointments found in the next 2 weeks.</p>";
      return;
    }

    let currentGroupDate = "";

    appointments.forEach(data => {
      const appointmentDateStr = data.appointmentDateTime.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // If the date group changes, add a new header
      if (appointmentDateStr !== currentGroupDate) {
        currentGroupDate = appointmentDateStr;
        const header = document.createElement("h2");
        header.className = "date-header";
        header.textContent = appointmentDateStr;
        container.appendChild(header);
      }

      const createdAtStr = data.createdAt
        ? `${data.createdAt.toLocaleDateString()} ${data.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : "Not available";

      const div = document.createElement("div");
      div.className = "appointment-card";
      div.innerHTML = `
        <h3>${data.name}</h3>
        <p><strong>Phone:</strong> ${data.phone}</p>
        <p><strong>Date:</strong> ${data.date}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        <p><strong>Service:</strong> ${data.service}</p>
        <p><strong>Created At:</strong> ${createdAtStr}</p>

        <div class="btn-group">
          <button class="btn" onclick="showModifyForm('${data.id}', this)">Modify</button>
          <button class="btn" onclick="cancelAppointment('${data.id}', this)">Cancel</button>
        </div>

        <form class="modify-form" onsubmit="submitModification(event, '${data.id}')">
          <label>New Date: <input type="date" name="date" required></label>
          <label>New Time: <input type="time" name="time" required></label>
          <button type="submit" class="btn">Submit</button>
        </form>
      `;
      container.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    container.innerHTML = "<p style='color:red;'>Error fetching appointments.</p>";
  }
}

function showModifyForm(id, btn) {
  const form = btn.closest(".appointment-card").querySelector(".modify-form");
  form.style.display = form.style.display === "block" ? "none" : "block";
}

async function submitModification(event, id) {
  event.preventDefault();
  const form = event.target;
  const newDate = form.date.value;
  const newTime = form.time.value;

  const selectedDateTime = new Date(`${newDate}T${newTime}`);
  const now = new Date();

  if (selectedDateTime < now) {
    alert("Cannot set an appointment to a past date/time.");
    return;
  }

  const hour = selectedDateTime.getHours();
  if (hour < 9 || hour >= 20) {
    alert("Appointments must be between 9:00 AM and 8:00 PM.");
    return;
  }

  try {
    await db.collection("appointments").doc(id).update({
      date: newDate,
      time: newTime,
    });
    alert("Appointment updated!");
    form.reset();
    form.style.display = "none";
    fetchUpcomingAppointments(); // Refresh
  } catch (err) {
    console.error(err);
    alert("Error updating appointment.");
  }
}

async function cancelAppointment(id) {
  if (!confirm("Are you sure you want to cancel this appointment?")) return;

  try {
    await db.collection("appointments").doc(id).delete();
    alert("Appointment deleted.");
    fetchUpcomingAppointments(); // Refresh
  } catch (err) {
    console.error(err);
    alert("Error deleting appointment.");
  }
}
