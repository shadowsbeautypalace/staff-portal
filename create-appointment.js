const form = document.getElementById('createForm');
const message = document.getElementById('message');
const serviceSelect = document.getElementById('service');

// Load all services (no categories)
async function loadServices() {
  try {
    serviceSelect.innerHTML = '<option value="">-- Select a Service --</option>';
    const snapshot = await db.collection("services").get();

    if (snapshot.empty) {
      serviceSelect.innerHTML = '<option value="">No services found</option>';
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.name) {
        const option = document.createElement("option");
        option.value = data.name;
        option.textContent = data.name;
        serviceSelect.appendChild(option);
      }
    });
  } catch (error) {
    console.error("Error loading services:", error);
    serviceSelect.innerHTML = '<option value="">Failed to load services</option>';
  }
}

window.addEventListener('DOMContentLoaded', loadServices);

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const service = serviceSelect.value;

  const selectedDateTime = new Date(`${date}T${time}`);
  const now = new Date();

  // ✅ Validation
  if (!/^\d{10,15}$/.test(phone)) {
    message.textContent = "Phone number must be 10–15 digits (digits only).";
    message.style.color = "red";
    return;
  }

  if (!/^[A-Za-z\s]+$/.test(name)) {
    message.textContent = "Name must contain letters and spaces only.";
    message.style.color = "red";
    return;
  }

  if (!date || !time) {
    message.textContent = "Please select a valid date and time.";
    message.style.color = "red";
    return;
  }

  if (selectedDateTime < now) {
    message.textContent = "You cannot book an appointment in the past.";
    message.style.color = "red";
    return;
  }

  const selectedHour = selectedDateTime.getHours();
  if (selectedHour < 9 || selectedHour >= 20) {
    message.textContent = "Appointments can only be booked between 9:00 AM and 8:00 PM.";
    message.style.color = "red";
    return;
  }

  // ✅ Check for phone number limit (max 2 appointments)
  try {
    const existingSnapshot = await db.collection('appointments')
      .where('phone', '==', phone)
      .get();

    const futureAppointments = existingSnapshot.docs.filter(doc => {
      const docDate = doc.data().date;
      const docTime = doc.data().time;
      if (!docDate || !docTime) return false;

      const appointmentDateTime = new Date(`${docDate}T${docTime}`);
      return appointmentDateTime >= now;
    });

    if (futureAppointments.length >= 2) {
      message.textContent = "This phone number already has 2 upcoming appointments.";
      message.style.color = "red";
      return;
    }

    // ✅ Save appointment
    await db.collection('appointments').add({
      name,
      phone,
      date,
      time,
      service,
      createdBy: 'staff',
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });

    message.textContent = "Appointment created successfully!";
    message.style.color = "green";
    form.reset();
  } catch (error) {
    console.error("Error saving appointment:", error);
    message.textContent = "Failed to create appointment.";
    message.style.color = "red";
  }
});

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  window.location.href = "index.html";
});
