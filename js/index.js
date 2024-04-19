class Sentence {
  constructor(id, sentence, audio_src) {
    this.id = id;
    this.text = sentence;
    this.audio_src = audio_src;
  }
}

async function load_shtooka_files(files) {
  let sentences = new Map();
  try {
    let text = await files?.item(0)?.text() || "";
    let lines = text.trim().split("\n")
    if (lines.length > 0) {
      lines.forEach(line => {
        let [id, line_text] = line.split("-");
        add_sentence_row(document.querySelector(".sentence-table-body"), id, line_text.trim())
        sentences.set(id, line_text.trim());
      })
    }
  } catch(e) {
    alert(`Unable to load file: "${files?.item(0)?.name}". It may have an invalid format. Please try again with a properly formatted file.`)
  }

  return sentences;
}

function record_sentence(id, row) {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("> getUserMedia supported");
    navigator.mediaDevices
      .getUserMedia({audio: true})
      .then((stream) => {
        /*
         *  # AUDIO RECORDING AND PROCESSING
         *  1. Setup Audio Context
         *  2. Setup MediaRecorder
         *  3. Link nodes
         *  4. Process sound (volume -> cut silence before -> cut silence after)
         */
        let gain = document.querySelector("#audio-gain")?.value || 0.5;

        const ctx = new AudioContext();
        const source = ctx.createMediaStreamSource(stream);
        const dest = ctx.createMediaStreamDestination();
        const mediaRecorder = new MediaRecorder(dest.stream, { mimeType: "audio/webm;codecs=opus"});
        const gainNode = new GainNode(ctx, {
          gain: gain,
        });
        const delayNode = new DelayNode(ctx, {
          delayTime: 0,
          maxDelayTime: 1,
        })

        source.connect(gainNode);
        gainNode.connect(delayNode);
        delayNode.connect(dest);

        // Configure MediaRecorder
        let chunks = [];
        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };

        // This should be named and removed when invoked multiple times on 
        // the same stop button
        mediaRecorder.onstop = (e) => {
          let audio = row.querySelector("audio");
          const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" })
          audio.src = window.URL.createObjectURL(blob);
          row.querySelector(".export-toggle").checked = true;
          set_sentence_download_link(row);
        };

        let stop_btn = row.querySelector(".stop-btn");
        stop_btn.addEventListener("click", e => {
          mediaRecorder.stop();
          console.log(`Recording stopped for: #${id}`)
          row.classList.remove("recording-active");
        });

        mediaRecorder.start()
        row.classList.add("recording-active");
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
  download_anchor.textContent = "Download";
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

  // Construct archive (.zip) of recorded sentences
  for (let sentence of sentences) {
    console.log(sentence.audio_src);
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
  let download_anchor = document.createElement("a");
  download_anchor.setAttribute("download", `${sentence_text}.webm`)
  download_anchor.setAttribute("target", "_blank")
  download_anchor.classList.add("download-btn-anchor");

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

/*
Initialization after page load
- Setup primary button interactions (load sentences, export all, )
- TODO: Setup AudioContext and audio processing nodes
*/
document.addEventListener("DOMContentLoaded", (e) => {
  // Load sentences button
  let load_btn = document.querySelector(".load-btn");
  let load_file_input = document.querySelector("#shtooka-file");
  load_file_input?.addEventListener("input", async e => {
    console.log("Loading sentences...");
    let files = load_file_input?.files
    if (files.length > 0) {
      let sentences = await load_shtooka_files(files);
      console.table(sentences);
      console.log("Sentences loaded!");
    } else {
      console.log("No sentence file found. Please upload one and try again.");
    }
  })

  // Volume slider
  let gain_slider = document.querySelector("#audio-gain");
  gain_slider.onchange = (e) => {
    console.log(`GAIN: ${gain_slider.value}`);
    gain = gain_slider.value;
  };

  // Export button
  let export_btn = document.querySelector(".export-btn");
  export_btn?.addEventListener("click", handle_export);
});
