function updateData() {
  document.getElementById("temp").innerText = (20 + Math.random() * 5).toFixed(2) + " °C";
  document.getElementById("ph").innerText = (7 + Math.random()).toFixed(2);
  document.getElementById("turb").innerText = (10 + Math.random() * 3).toFixed(2) + " NTU";
}

setInterval(updateData, 2000);
updateData();
