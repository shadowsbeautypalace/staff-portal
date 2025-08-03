const bcrypt = dcodeIO.bcrypt;

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = "";

  try {
    const doc = await db.collection("staff").doc(username).get();

    if (!doc.exists) {
      errorMessage.textContent = "❌ Invalid username or password.";
      return;
    }

    const data = doc.data();
    const hashedPassword = data.password;

    const match = bcrypt.compareSync(password, hashedPassword); // ✅ bcryptjs sync version

    if (match) {
      window.location.href = "dashboard.html"; // ✅ Success
    } else {
      errorMessage.textContent = "❌ Invalid username or password.";
    }
  } catch (error) {
    console.error("Login error:", error);
    errorMessage.textContent = "❌ An error occurred. Please try again.";
  }
});
