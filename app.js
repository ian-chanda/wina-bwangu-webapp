// grabs the buttons and the sections 
const recordBtn = document.getElementById("nav-record");
const dashBtn = document.getElementById("nav-dashboard");
const recordSec = document.getElementById("record-transaction");
const dashSec = document.getElementById("dashboard");

// functions that switch the sections 
function showRecord() {
  recordSec.classList.remove("hidden");
  dashSec.classList.add("hidden");
}


function showDashboard() {
  dashSec.classList.remove("hidden");
  recordSec.classList.add("hidden");
}

// button adding function to the html elements 
recordBtn.addEventListener("click", showRecord);
dashBtn.addEventListener("click", showDashboard);



