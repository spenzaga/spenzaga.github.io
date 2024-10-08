const form = document.getElementById("prompt-form");
const grade = document.getElementById("grade");
const subject = document.getElementById("subject");
const task = document.getElementById("task");
const descriptions = document.getElementById("descriptions");
const performanceLevels = document.getElementById("performanceLevels");
const errorMsg = document.getElementById("errorMsg");
const copyPromptButton = document.getElementById("copy-prompt-button");
const aiCriteria = document.getElementById("aiCriteria");
const userCriteria = document.getElementById("userCriteria");
const criteriaInput = document.getElementById("criteriaInput");
const promptDisplay = document.getElementById("aiPrompt");

//Unhide criteria input
aiCriteria.addEventListener("change", () => {
  if (aiCriteria.checked) {
    criteriaInput.classList.add("hidden");
  }
});

userCriteria.addEventListener("change", () => {
  if (userCriteria.checked) {
    criteriaInput.classList.remove("hidden");
  }
});

// Typewriter animation set up
let timerId;

function typeWriter(txt) {
  let i = 0;
  const speed = 10;

  // Clear the prompt and any ongoing animation
  promptDisplay.innerHTML = "";

  function type() {
    if (i < txt.length) {
      promptDisplay.innerHTML += txt.charAt(i);
      i++;
      timerId = setTimeout(type, speed);
    } else {
      clearTimeout(timerId);
    }
  }
  type();
}

function handleSubmit(event) {
  event.preventDefault();

  // Stop any ongoing typing animation before starting a new one
  clearTimeout(timerId);

  // Check if all required fields are filled out
  if (
    grade.value === "" ||
    subject.value === "" ||
    performanceLevels.value === "" ||
    (userCriteria.checked && descriptions.value === "")
  ) {
    errorMsg.classList.remove("hidden");
    return;
  }

  let criteriaDescription;
  if (userCriteria.checked) {
    criteriaDescription = `Kriterianya harus mencakup: ${descriptions.value.split(";").join(", ")}.`;
  } else {
    criteriaDescription = `Mohon berikan kriteria yang sesuai untuk rubrik ini`;
  }

  // Generate the prompt
  const prompt = `Saya memerlukan rubrik penilaian untuk kelas ${grade.value} SMP mata pelajaran ${subject.value} tugas ${task.value}. Rubrik memuat ${performanceLevels.value} level kinerja. ${criteriaDescription} Deskripsikan setiap tingkat kinerja untuk setiap kriteria dan berikan perbedaan yang jelas antara setiap tingkatan. Terakhir, format rubrik sebagai tabel.`;

  // Enable the copy prompt button and remove error message if necessary
  copyPromptButton.disabled = false;
  copyPromptButton.classList.remove("copy-disabled");
  copyPromptButton.classList.add("enabled");
  copyPromptButton.classList.add("hover");
  copyPromptButton.classList.add("active");
  errorMsg.classList.add("hidden");

  // Display the prompt with the typewriter animation
  typeWriter(prompt);
}

function copyPrompt() {
  // Get the text field
  var copyText = document.getElementById("aiPrompt");

  // Select the text field
  var range = document.createRange();
  range.selectNode(copyText);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  // Copy and alert
  document.execCommand("copy");
  alert("Copied the prompt");

  // Open a link to chat.openai.com
  window.open("http://chat.openai.com", "_blank");
}

form.addEventListener("submit", handleSubmit);
copyPromptButton.addEventListener("click", copyPrompt);
