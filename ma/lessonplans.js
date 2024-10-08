//pulling form values for prompt generation
const form = document.getElementById("prompt-form");
const grade = document.getElementById("grade");
const subject = document.getElementById("subject");
const standard = document.getElementById("standard");
const objective = document.getElementById("objective");
const topic = document.getElementById("topic");
const time = document.getElementById("time");
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

  // Check if all required fields are filled out
  if (
    grade.value === "" ||
    subject.value === "" ||
    standard.value === "" ||
    objective.value === "" ||
    topic.value === "" ||
    time.value === ""
  ) {
    errorMsg.classList.remove("hidden");
    return;
  }

  // Generate the prompt
  const prompt = `Buatkan modul ajar untuk siswa kelas ${grade.value} mata pelajaran ${subject.value} dengan topik ${topic.value}, dengan materi pokok "${standard.value}". Modul ajar untuk waktu ${time.value} menit dan siswa diharapkan mampu untuk mencapai tujuan pembelajaran untuk ${objective.value}.

  Harap sertakan unsur-unsur berikut dalam modul ajar:
  1. Pendahuluan: Jelaskan cara melibatkan siswa dan memperkenalkan topik, menghubungkannya dengan capaian tujuan pembelajaran.
  2. Kegiatan Utama: Jelaskan kegiatan inti pembelajaran yang akan membantu siswa mengembangkan pemahaman topik dan mencapai tujuan pembelajaran.
  3. Penilaian: Sarankan berbagai metode penilaian untuk mengukur tingkat penguasaan siswa.
  4. Kegiatan Remedial dan Pengayaan: Memberikan kemungkinan kegiatan intervensi bagi siswa yang memerlukan dukungan ekstra dan kesempatan penyuluhan atau PBL bagi siswa yang telah menunjukkan penguasaan.
  5. Penutup: Rincikan cara mengakhiri pelajaran dan memperkuat kesimpulan-kesimpulan penting.
  6. Kiat atau Tip: Berikan nasihat yang bermanfaat bagi guru dan peringatkan mereka tentang potensi tantangan apa pun yang mungkin mereka hadapi selama pelajaran.`;

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
