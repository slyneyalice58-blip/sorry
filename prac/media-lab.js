const tabs = document.querySelectorAll('.tab');
const stages = {
  image: document.getElementById('image-stage'),
  video: document.getElementById('video-stage')
};
const controlsPanels = {
  image: document.getElementById('image-controls'),
  video: document.getElementById('video-controls')
};
const presetPanels = {
  image: document.getElementById('image-presets'),
  video: document.getElementById('video-presets')
};

const fileInput = document.getElementById('file-input');
const resetBtn = document.getElementById('reset-btn');
const downloadBtn = document.getElementById('download-btn');

const canvas = document.getElementById('image-canvas');
const ctx = canvas.getContext('2d');
const imageHint = document.getElementById('image-hint');
const videoHint = document.getElementById('video-hint');
const video = document.getElementById('video-preview');

let activeMode = 'image';
let loadedImage = null;
let videoURL = null;

const imageState = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  hue: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  rotate: 0
};

const videoState = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  blur: 0,
  hue: 0,
  grayscale: 0,
  sepia: 0,
  invert: 0,
  speed: 1
};

const imageControlDefs = [
  ['brightness', 'Brightness', 0, 200, 1, '%'],
  ['contrast', 'Contrast', 0, 200, 1, '%'],
  ['saturate', 'Saturation', 0, 200, 1, '%'],
  ['blur', 'Blur', 0, 20, 0.1, 'px'],
  ['hue', 'Hue', 0, 360, 1, 'deg'],
  ['grayscale', 'Grayscale', 0, 100, 1, '%'],
  ['sepia', 'Sepia', 0, 100, 1, '%'],
  ['invert', 'Invert', 0, 100, 1, '%'],
  ['rotate', 'Rotate', 0, 360, 1, 'deg']
];

const videoControlDefs = [
  ['brightness', 'Brightness', 0, 200, 1, '%'],
  ['contrast', 'Contrast', 0, 200, 1, '%'],
  ['saturate', 'Saturation', 0, 200, 1, '%'],
  ['blur', 'Blur', 0, 20, 0.1, 'px'],
  ['hue', 'Hue', 0, 360, 1, 'deg'],
  ['grayscale', 'Grayscale', 0, 100, 1, '%'],
  ['sepia', 'Sepia', 0, 100, 1, '%'],
  ['invert', 'Invert', 0, 100, 1, '%'],
  ['speed', 'Playback Speed', 0.25, 2, 0.05, 'x']
];

const imagePresets = [
  {
    label: 'Neon Pop',
    values: { brightness: 112, contrast: 140, saturate: 170, hue: 18, blur: 0, grayscale: 0, sepia: 8, invert: 0, rotate: 0 }
  },
  {
    label: 'Vintage',
    values: { brightness: 98, contrast: 88, saturate: 82, hue: 0, blur: 0, grayscale: 0, sepia: 55, invert: 0, rotate: 0 }
  },
  {
    label: 'Noir',
    values: { brightness: 102, contrast: 136, saturate: 30, hue: 0, blur: 0, grayscale: 95, sepia: 0, invert: 0, rotate: 0 }
  },
  {
    label: 'Dream',
    values: { brightness: 110, contrast: 92, saturate: 118, hue: 28, blur: 1.2, grayscale: 0, sepia: 16, invert: 0, rotate: 0 }
  },
  {
    label: 'Random',
    randomize: true
  }
];

const videoPresets = [
  {
    label: 'Cinematic',
    values: { brightness: 94, contrast: 132, saturate: 110, blur: 0, hue: 6, grayscale: 0, sepia: 14, invert: 0, speed: 1 }
  },
  {
    label: 'Retro Tape',
    values: { brightness: 98, contrast: 88, saturate: 90, blur: 0.8, hue: 0, grayscale: 8, sepia: 34, invert: 0, speed: 0.95 }
  },
  {
    label: 'Cyber',
    values: { brightness: 110, contrast: 145, saturate: 165, blur: 0, hue: 36, grayscale: 0, sepia: 0, invert: 0, speed: 1.05 }
  },
  {
    label: 'Muted',
    values: { brightness: 100, contrast: 108, saturate: 52, blur: 0.2, hue: 0, grayscale: 14, sepia: 0, invert: 0, speed: 1 }
  },
  {
    label: 'Random',
    randomize: true
  }
];

function renderControls(panel, defs, state, onChange) {
  panel.innerHTML = '';

  defs.forEach(([key, label, min, max, step, unit]) => {
    const row = document.createElement('div');
    row.className = 'slider-row';

    const title = document.createElement('label');
    const value = document.createElement('span');
    value.textContent = `${state[key]}${unit}`;
    title.textContent = label;
    title.appendChild(value);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = state[key];

    input.addEventListener('input', () => {
      state[key] = Number(input.value);
      value.textContent = `${state[key]}${unit}`;
      onChange();
    });

    row.appendChild(title);
    row.appendChild(input);
    panel.appendChild(row);
  });
}

function randomInRange(min, max, step = 1) {
  const steps = Math.round((max - min) / step);
  const pick = Math.floor(Math.random() * (steps + 1));
  return Number((min + pick * step).toFixed(2));
}

function randomizeFromDefs(defs, state) {
  defs.forEach(([key, , min, max, step]) => {
    state[key] = randomInRange(min, max, step);
  });
}

function applyPreset(state, values) {
  Object.keys(values).forEach((key) => {
    state[key] = values[key];
  });
}

function renderPresets(panel, presets, state, defs, rerenderControls, onChange) {
  panel.innerHTML = '';

  const title = document.createElement('p');
  title.className = 'preset-title';
  title.textContent = 'Quick Effects';
  panel.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'preset-grid';

  presets.forEach((preset) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.textContent = preset.label;

    btn.addEventListener('click', () => {
      if (preset.randomize) {
        randomizeFromDefs(defs, state);
      } else {
        applyPreset(state, preset.values);
      }
      rerenderControls();
      onChange();
    });

    grid.appendChild(btn);
  });

  panel.appendChild(grid);
}

function buildImageFilter() {
  return [
    `brightness(${imageState.brightness}%)`,
    `contrast(${imageState.contrast}%)`,
    `saturate(${imageState.saturate}%)`,
    `blur(${imageState.blur}px)`,
    `hue-rotate(${imageState.hue}deg)`,
    `grayscale(${imageState.grayscale}%)`,
    `sepia(${imageState.sepia}%)`,
    `invert(${imageState.invert}%)`
  ].join(' ');
}

function buildVideoFilter() {
  return [
    `brightness(${videoState.brightness}%)`,
    `contrast(${videoState.contrast}%)`,
    `saturate(${videoState.saturate}%)`,
    `blur(${videoState.blur}px)`,
    `hue-rotate(${videoState.hue}deg)`,
    `grayscale(${videoState.grayscale}%)`,
    `sepia(${videoState.sepia}%)`,
    `invert(${videoState.invert}%)`
  ].join(' ');
}

function drawImage() {
  if (!loadedImage) {
    return;
  }

  const cW = canvas.width;
  const cH = canvas.height;
  ctx.clearRect(0, 0, cW, cH);

  const ratio = Math.min(cW / loadedImage.width, cH / loadedImage.height);
  const drawW = loadedImage.width * ratio;
  const drawH = loadedImage.height * ratio;

  ctx.save();
  ctx.translate(cW / 2, cH / 2);
  ctx.rotate((imageState.rotate * Math.PI) / 180);
  ctx.filter = buildImageFilter();
  ctx.drawImage(loadedImage, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function applyVideoEffects() {
  video.style.filter = buildVideoFilter();
  video.playbackRate = videoState.speed;
}

function setMode(mode) {
  activeMode = mode;

  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.mode === mode);
  });

  Object.keys(stages).forEach((key) => {
    stages[key].classList.toggle('active', key === mode);
    controlsPanels[key].classList.toggle('active', key === mode);
    presetPanels[key].classList.toggle('active', key === mode);
  });

  downloadBtn.disabled = mode !== 'image';
}

function resetImage() {
  Object.assign(imageState, {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    blur: 0,
    hue: 0,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    rotate: 0
  });
  renderControls(controlsPanels.image, imageControlDefs, imageState, drawImage);
  drawImage();
}

function resetVideo() {
  Object.assign(videoState, {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    blur: 0,
    hue: 0,
    grayscale: 0,
    sepia: 0,
    invert: 0,
    speed: 1
  });
  renderControls(controlsPanels.video, videoControlDefs, videoState, applyVideoEffects);
  applyVideoEffects();
}

function handleImage(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      loadedImage = img;
      imageHint.style.display = 'none';
      setMode('image');
      drawImage();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function handleVideo(file) {
  if (videoURL) {
    URL.revokeObjectURL(videoURL);
  }
  videoURL = URL.createObjectURL(file);
  video.src = videoURL;
  videoHint.style.display = 'none';
  setMode('video');
  applyVideoEffects();
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
});

fileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (file.type.startsWith('image/')) {
    handleImage(file);
  } else if (file.type.startsWith('video/')) {
    handleVideo(file);
  }
});

resetBtn.addEventListener('click', () => {
  if (activeMode === 'image') {
    resetImage();
  } else {
    resetVideo();
  }
});

downloadBtn.addEventListener('click', () => {
  if (!loadedImage) {
    return;
  }

  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.download = `edited-image-${Date.now()}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
});

renderControls(controlsPanels.image, imageControlDefs, imageState, drawImage);
renderControls(controlsPanels.video, videoControlDefs, videoState, applyVideoEffects);
renderPresets(
  presetPanels.image,
  imagePresets,
  imageState,
  imageControlDefs,
  () => renderControls(controlsPanels.image, imageControlDefs, imageState, drawImage),
  drawImage
);
renderPresets(
  presetPanels.video,
  videoPresets,
  videoState,
  videoControlDefs,
  () => renderControls(controlsPanels.video, videoControlDefs, videoState, applyVideoEffects),
  applyVideoEffects
);
applyVideoEffects();
setMode('image');
