// HTML Dom Ready
var toastNum = 0;
$(async () => {
  loadFiles()
  var logged = await $.get('/isLogged') === true;
  console.log(logged)
  if (logged) {
    $("#upload")[0].style.display = "block";
  }
  $('#confirmUpload').on('click', () => {
    var toast = toastNum
    $("#toasts").append(`<div class="toast show toast-fixed fade" id="toast${toast}" role="alert" aria-live="assertive" aria-atomic="true" data-mdb-autohide="false" data-mdb-position="top-right" data-mdb-append-to-body="true" data-mdb-stacking="false" data-mdb-width="350px" data-mdb-color="info"> <div class="toast-header text-white bg-primary"> <strong class="me-auto">Upload in corso...</strong> <button type="button" onclick="$('#toast${toast}').toast('hide');" class="btn-close btn-close-white" data-mdb-dismiss="toast${toast}" aria-label="Close"></button> </div> <div class="toast-body"> <div class="progress"> <div id="toastProgress${toast}" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">25%</div> </div> </div> </div>`);
    $.ajax({
      // Your server script to process the upload
      url: `/upload`,
      type: 'POST',
      
      // Form data
      data: new FormData($('form')[0]),
      
      // Tell jQuery not to process data or worry about content-type
      // You *must* include these options!
      cache: false,
      contentType: false,
      processData: false,
      
      // Custom XMLHttpRequest
      xhr: () => {
        var myXhr = $.ajaxSettings.xhr();
        if (myXhr.upload) {
          // For handling the progress of the upload
          myXhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              var tot = Math.floor((e.loaded / e.total) * 100)
              console.log(toast)
              $(`#toastProgress${toast}`)[0].innerText = `${tot}%`
              $(`#toastProgress${toast}`)[0].style.width = `${tot}%`
              if (tot==100) {
                $('#uploadModal').modal('hide');
                var head = $(`#toast${toast} > div.toast-header`)[0]
                head.classList.value = head.classList.value.replace("bg-primary", "bg-success")
                head = $(`#toast${toast} > div.toast-header > strong.me-auto`)[0]
                head.innerText = head.innerText.replace("Upload in corso...", "Upload completato")
                $("#row > *").remove()
                loadFiles()
              }
            }
          }, false);
        }
        return myXhr;
      }
    });
    toastNum++;     
  });
})

function handleClick(html) {
    var btn = $(html)[0]
    var win = window.open(`http://${window.location.host}/files/`+ btn.id, '_blank');
    if (win) {
        win.focus()
    } else {
        alert('Abilita i popup sul tuo browser!\nAllow popup on your browser!')
    }
}

async function loadFiles() {
  var row = $("#row")
    var data;
    await $.get('/files', (_data, err) => {
        if (err) console.log(err)
        data = _data;
    })
    for (let i=0;i<data.length;i++) {
        var file = data[i]
        var tags = file.config.tags.split(',')
        var badges = "";
        for (let j=0;j<tags.length;j++) {
            badges += `<span class="badge rounded-pill bg-primary">${tags[j]}</span>`
        }
        row.append(`<div class="col-sm-6"><div class="card" style="width: 18rem;"> <div class="card-imgs">${file.config.logo!==null ? `<img src="/logo/${file.config.logo}" class="card-img-top"></div> <div class="card-body">` : ""} <h5 class="card-title">${file.config.name}</h5></div><ul class="list-group list-group-flush"><li class="list-group-item"><p class="card-text">${file.config.desc}</p></li><li class="list-group-item">Versione: <span class="badge rounded-pill bg-success">${file.config.version}</span></li> <li class="list-group-item">${badges}</li> </ul>  <div class="card-body"> <button id="${file.file}" onclick="handleClick(this);" class="btn btn-primary">Download</button </div> </div></div>`)
    }
}