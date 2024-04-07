class Sentence {
  constructor(id, sentence, audio_src) {
    this.id = id;
    this.text = sentence;
    this.audio_src = audio_src;
  }
}

async function load_shtooka_files(files) {
  let text = await files?.item(0)?.text() || "";
  let lines = text.trim().split("\n")
  let sentences = new Map();
  if (lines.length > 0) {
    lines.forEach(line => {
      let [id, line_text] = line.split("-");
      add_sentence_row(document.querySelector(".sentence-table-body"), id, line_text.trim())
      sentences.set(id, line_text.trim());
    })
  }

  return sentences;
}

function record_sentence(id, row) {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("> getUserMedia supported");
    navigator.mediaDevices
      .getUserMedia({audio: true})
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);

        let chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };

        // This should named and removed when invoked multiple times on 
        // the same stop button
        let stop_btn = row.querySelector(".stop-btn");
        stop_btn.addEventListener("click", e => {
          mediaRecorder.stop();
          console.log(`Recording stopped for: #${id}`)
          row.classList.remove("recording-active");
          console.log(mediaRecorder.state);
        });

        mediaRecorder.onstop = (e) => {
          let audio = row.querySelector("audio");
          const blob = new Blob(chunks, { type: "audio/ogg; codecs=flac" })
          audio.src = window.URL.createObjectURL(blob);
          row.querySelector(".export-toggle").checked = true;
          set_sentence_download_link(row);
        };

        mediaRecorder.start()
        row.classList.add("recording-active");
        console.log(mediaRecorder.state);
      })
      .catch((err) => {
        console.error(`> The following getUserMedia error occurred: ${err}`);
      })
  } else {
    console.log("> getUserMedia is not supported in this browser")
  }
}

function set_download_all_link(href) {
  download_ele = document.querySelector(".download-link");
  download_ele.href = href;
}

function set_download_link(row, href) {
  download_anchor = row.querySelector(".download-btn-anchor");
  download_anchor.href = href;
}

function set_sentence_download_link(row) {
  // console.log(row);
  let s = new Sentence(
    id=row.querySelector("span.data-id"),
    text=row.querySelector(".sentence").textContent.trim(),
    audio_src=row.querySelector("audio").src,
  );

  console.log(s.audio_src);
  set_download_link(row, s.audio_src);
}

async function handle_export() {
  console.log("Exporting audio clips...");
  let rows = Array.from(document.querySelectorAll(".sentence-table-body tr")).filter(row => row.querySelector(".export-toggle")?.checked);
  let sentences = rows.map(row => new Sentence(
    id=row.querySelector("span.data-id"),
    text=row.querySelector(".sentence").textContent.trim(),
    audio_src=row.querySelector("audio").src,
  ));
  for (let sentence of sentences) {
    console.log(sentence.audio_src);
    // set_download_link(sentence.audio_src);
    // let file = await fetch(sentence.audio_src)
    //   .then(r => r.blob())
    //   .then(blob => new File([blob], `${id} - ${sentence.text}.flac`, { type: "audio/ogg"}))
    // console.log(file);
  }
}

function wrap_td(cell) {
  let td = document.createElement("td");
  td.appendChild(cell);
  return td;
}

function add_sentence_row(parent_table, id, sentence_text) {
  let audio_ele = document.createElement("audio");
  audio_ele.setAttribute("controls", true);

  // Sentence ID
  let sentence_id_ele = document.createElement("span");
  sentence_id_ele.textContent = id;
  sentence_id_ele.dataset["id"] = id;

  // Sentence text
  let sentence_text_ele = document.createElement("span");
  sentence_text_ele.classList.add("sentence");
  sentence_text_ele.textContent = sentence_text;

  // Stop button
  let stop_btn = document.createElement("img");
  stop_btn.setAttribute("src", "img/stop.svg");
  stop_btn.classList.add("btn");
  stop_btn.classList.add("stop-btn");

  // Record button
  let record_img = document.createElement("img");
  record_img.setAttribute("src", "img/record.svg");
  record_img.classList.add("btn");
  record_img.classList.add("record-btn");

  // Export toggle
  let export_toggle = document.createElement("input");
  export_toggle.setAttribute("type", "checkbox");
  export_toggle.classList.add("export-toggle");

  // Download button
  // let download_btn = document.createElement("img");
  // download_btn.setAttribute("src", "img/download.svg");
  // download_btn.classList.add("btn");
  // download_btn.classList.add("download-btn");
  let download_anchor = document.createElement("a");
  download_anchor.setAttribute("download", `${sentence_text}.flac`)
  download_anchor.setAttribute("target", "_blank")
  download_anchor.classList.add("download-btn-anchor");
  download_anchor.textContent = "Download";
  // download_btn.appendChild(download_anchor);

  // Construct sentence row
  let row_ele = document.createElement("tr");
  row_ele.appendChild(wrap_td(sentence_id_ele));
  row_ele.appendChild(wrap_td(sentence_text_ele));
  row_ele.appendChild(wrap_td(audio_ele));
  row_ele.appendChild(wrap_td(record_img));
  row_ele.appendChild(wrap_td(stop_btn));
  row_ele.appendChild(wrap_td(export_toggle));
  row_ele.appendChild(wrap_td(download_anchor));
  row_ele.classList.add("sentence-comp");

  parent_table.appendChild(row_ele);

  record_img.addEventListener("click", e => {
    console.log(`Recording sentence: #${id}`)
    record_sentence(id, row_ele);
  });
}

document.addEventListener("DOMContentLoaded", (e) => {
  // Load button
  let load_btn = document.querySelector(".load-btn");
  load_btn?.addEventListener("click", async e => {
    console.log("Loading sentences...");
    let files = document.querySelector("#shtooka-file")?.files
    if (files.length > 0) {
      let sentences = await load_shtooka_files(files);
      console.table(sentences);
      console.log("Sentences loaded!");
    } else {
      console.log("No sentence file found. Please upload one and try again.");
    }
  })

  // Export button
  let export_btn = document.querySelector(".export-btn");
  export_btn?.addEventListener("click", handle_export);
});

