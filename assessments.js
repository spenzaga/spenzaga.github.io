// Pull inputs from the form for prompt generation
const form = document.getElementById("prompt-form");
const grade = document.getElementById("grade");
const subject = document.getElementById("subject");
const topic = document.getElementById("topic");
const learningObjectives = document.getElementById("objective");
const timeLimit = document.getElementById("time");
const quantity = document.getElementById("quantity");
const promptDisplay = document.getElementById("aiPrompt");
const copyPromptButton = document.getElementById("copy-prompt-button");

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

  // Get the selected question types from checkboxes
  const questionTypes = [];
  const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
  for (const checkbox of checkboxes) {
    questionTypes.push(checkbox.value);
  }

  // Get the selected difficulty from radio
  const difficulty = document.querySelector('input[type="radio"]:checked')?.value;

  // Check if all required fields are filled out and reveal error message if not
  if (
    grade.value === "" ||
    subject.value === "" ||
    topic.value === "" ||
    questionTypes.length === 0 ||
    difficulty === "" ||
    quantity.value === "" ||
    learningObjectives.value === ""
  ) {
    errorMsg.classList.remove("hidden");
    return;
  }

  // Generate the prompt
  const prompt = `Kamu adalah seorang guru Bahasa Inggris di SMP akan menilai siswa kelas ${grade.value} untuk pelajaran ${subject.value} pada topik ${
    topic.value
  }. Tujuan pembelajaran untuk penilaian ini adalah: ${learningObjectives.value}. Buatkan ${
    quantity.value
  } pertanyaan untuk mengembangkan kemampuan literasi dan numerasi. Sertakan berbagai jenis pertanyaan ini: ${questionTypes.join(
    ", "
  )}. Pastikan pertanyaannya sesuai untuk ${
    grade.value
  } menilai siswa dan menyelaraskan dengan tingkat kesulitan yang dipilih: ${difficulty} sesuai taksonomi bloom. Berikan penjelasan solusi yang tepat pada setiap permasalahan untuk membantu siswa yang mengalami kesulitan. ${
    timeLimit.value ? `Rancang penilaian agar sesuai dengan batas waktu ${timeLimit.value} menit.` : ""
  } Terakhir, sarankan hal yang relevan dengan topik bagi siswa yang menunjukkan penguasaan dan rencana tindak lanjut yang relevan dengan topik bagi siswa yang tidak menunjukkan penguasaan.`;

  // Enable the copy prompt button and hide error message
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
  const copyText = document.getElementById("aiPrompt");

  // Select the text field
  const range = document.createRange();
  range.selectNode(copyText);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  // Copy and alert
  document.execCommand("copy");
  alert("Copied the prompt");

  // Open a link
  window.open("http://chat.openai.com", "_blank");
}

form.addEventListener("submit", handleSubmit);
copyPromptButton.addEventListener("click", copyPrompt);
