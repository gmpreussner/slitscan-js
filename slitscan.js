window.onload = function() {
  // cache DOM elements
  var autoheight = document.getElementById('autoheight');
  var calculate = document.getElementById('calculate');
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var filepicker = document.getElementById('filepicker');
  var fps = document.getElementById('fps');
  var gizmo = document.getElementById('gizmo');
  var outheight = document.getElementById('outheight');
  var outwidth = document.getElementById('outwidth');
  var slide = document.getElementById('slide');
  var slider = document.getElementById('slider');
  var slit = document.getElementById('slit');
  var stretch = document.getElementById('stretch');
  var video = document.getElementById('video');
  var url = window.URL || window.webkitURL;

  // global variables
  var column = 0;
  var pos = slider.value;
  var time = -1;

  updateGizmo();

  autoheight.onchange = function(e) {
    // calculate output image height
    outheight.disabled = autoheight.checked;
    if (autoheight.checked) {
      canvas.height = video.videoHeight;
    } else {
      canvas.height = parseInt(outheight.value);
    }
  };

  calculate.onclick = function(e) {
    // calculate output image width from frame rate
    if (fps.value) {
      outwidth.value = Math.ceil(video.duration * parseFloat(fps.value));
      outwidth.onchange();
    } else {
      alert('Please enter the frame rate (FPS) of the video!');
    }
  };

  canvas.onclick = function(e) {
    // click on canvas to seek in video
    if ((video.ended || video.paused) && video.currentSrc) {
      var offset = e.layerX / canvas.clientWidth;
      video.currentTime = offset * video.duration;
      column = offset * canvas.width;
    }
  };

  filepicker.onchange = function(e) {
    // load new video file
    var file = filepicker.files[0];
    if (video.canPlayType(file.type)) {
      video.src = url.createObjectURL(file);
    } else {
      alert("Sorry, the file type " + file.type + " cannot be played in your browser.");
    }
  };

  outheight.onchange = function(e) {
    // override output image height
    if (video.ended) {
      canvas.height = parseInt(outheight.value);
    }
  };

  outwidth.onchange = function(e) {
    // override output image width
    if (video.ended) {
      canvas.width = parseInt(outwidth.value);
    }
    stretch.setAttribute("max", outwidth.value);
    stretch.value = Math.min(stretch.value, stretch.max);
    stretchLabel.textContent = stretch.value;
    // hack to update knob in WebKit browsers
    stretch.value++; stretch.value--;
  };

  slide.onchange = function(e) {
    // set initial slider value
    if (video.ended || (video.currentTime == 0)) {
      if (slide.checked) {
        slider.value = 0;
      } else {
        slider.value = 0.5;
      }
      updateGizmo();
    }
  };

  slider.onmousedown = function(e) {
    slide.checked = false;
  }

  slider.onmousemove = function(e) {
    // override slit position
    pos = slider.value;
    updateGizmo();
  };

  slit.onmousemove = function(e) {
    // set slit width (in input)
    slitLabel.textContent = slit.value;
    updateGizmo();
  };

  stretch.onmousemove = function(e) {
    // set slit stretch (in output)
    stretchLabel.textContent = stretch.value;
  };

  video.onloadeddata = function(e) {
    // initialize from video properties
    autoheight.disabled = false;
    slit.setAttribute("max", video.videoWidth);
    stretch.setAttribute("max", outwidth.value);
    column = 0;
    updateGizmo();
  };

  video.onended = function(e) {
    // re-enable options
    autoheight.disabled = fps.disabled = outwidth.disabled = false;
    outheight.disabled = autoheight.checked;
  };

  video.onplay = function(e) {
    // initialize tools
    if (column == 0) {
      if (slide.checked) {
        pos = 0;
        slider.value = 0;
      } else {
        pos = slider.value;
      }
      canvas.width = parseInt(outwidth.value);
      context.fillStyle = "rgba(0, 0, 0, 0)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      time = -1;
    }

    // disable options
    autoheight.disabled = fps.disabled = outheight.disabled = outwidth.disabled = true;

    // start rendering
    draw();
  };

  window.onresize = function(e) {
    // handle window resizing
    updateGizmo();
  };

  // check file picker support
  if (!url) {
    filepicker.parentNode.replaceChild(filepicker, createTextNode("Your browser does not support playing local files."));
  }

  function draw() {
    // render slit-scan frame
    var stretchValue = parseInt(stretch.value);
    if (time !== video.currentTime) {
      while (video.currentTime / video.duration >= (column + 0.5 * stretchValue) / canvas.width) {
        context.drawImage(video, ((video.videoWidth - slit.value) * pos), 0, slit.value, video.videoHeight, column, 0, stretchValue, canvas.height);
        column += stretchValue;
      }

      time = video.currentTime;
    }
    // update sliding slit position
    if (slide.checked) {
      pos = column / canvas.width;
      slider.value = pos;
      updateGizmo();
    }
    // proceed to next frame or finish
    if (column + stretchValue <= canvas.width) {
      requestAnimationFrame(draw);
    }
    else {
      time = video.duration;
      column = 0;
    }
  }

  function updateGizmo() {
    // update slit gizmo position
    var gizmoWidth = 1;
    if (video.videoWidth > 0) {
      gizmoWidth =  Math.max(1, slit.value * (video.offsetWidth / video.videoWidth));
    }
    gizmo.style.left = ((video.offsetWidth - gizmoWidth) * slider.value) + 'px';
    gizmo.style.height = video.offsetHeight + 'px';
    gizmo.style.width = gizmoWidth + 'px';
  }
}
