function login() {
  const user = document.getElementById("user").value;
  const pass = document.getElementById("pass").value;

  if (user === "admin" && pass === "admin") {
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid credentials");
  }
}
