async function load_shtooka_files(files) {
  let text = await files?.item(0)?.text() || "";
  let lines = text.trim().split("\n")
  if (lines.length > 0) {
    lines.forEach(line => {
      console.log(line);
      let [id, text] = line.split("-");
      add_sentence_row(document.querySelector(".sentence-table-body"), id, text)
    })
  }
}

function record_sentence() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("> getUserMedia supported");
    navigator.mediaDevices
      .getUserMedia({audio: true})
      .then((stream) => {

      })
      .catch((err) => {
        console.error(`> The following getUserMedia error occurred: ${err}`);
      })
  } else {
    console.log("> getUserMedia is not supported in this browser")
  }
}

function record_sentence() {

}

function wrap_td(cell) {
  let td = document.createElement("td");
  td.appendChild(cell);
  return td;
}

function add_sentence_row(parent_table, id, sentence) {
  let audio_ele = document.createElement("audio");
  audio_ele.setAttribute("controls", true);

  let sentence_id_ele = document.createElement("span");
  sentence_id_ele.textContent = id;

  let sentence_text_ele = document.createElement("span");
  sentence_text_ele.classList.add("sentence");
  sentence_text_ele.textContent = sentence;

  let record_img = document.createElement("img");
  record_img.setAttribute("src", "img/record.svg");
  record_img.classList.add("btn");

  let export_toggle = document.createElement("input");
  export_toggle.setAttribute("type", "checkbox");



  let row_ele = document.createElement("tr");
  row_ele.appendChild(wrap_td(sentence_id_ele));
  row_ele.appendChild(wrap_td(sentence_text_ele));
  row_ele.appendChild(wrap_td(audio_ele));
  row_ele.appendChild(wrap_td(record_img));
  row_ele.appendChild(wrap_td(export_toggle));
  row_ele.classList.add("sentence-comp");
  parent_table.appendChild(row_ele);
}

document.addEventListener("DOMContentLoaded", (e) => {
  let load_btn = document.querySelector(".load-btn");
  load_btn?.addEventListener("click", e => {
    console.log("Loading sentences...");
    let files = document.querySelector("#shtooka-file")?.files
    if (files.length > 0) {
      load_shtooka_files(files);
      console.log("Sentences loaded!");
    } else {
      console.log("No sentence file found. Please upload one and try again.");
    }
  })
});

