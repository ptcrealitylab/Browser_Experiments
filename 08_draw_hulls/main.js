const width = 320 * 2;
const height = 180 * 2;

const layer1 = setupLayer('layer1', false);
const layer2 = setupLayer('layer2', true);
const layer3 = setupLayer('layer3', true);

function setupLayer(layerId, addMask) {
  let layer = {};
  layer.elt = document.getElementById(layerId);
  layer.elt.style.width = `${width}px`;
  layer.elt.style.height = `${height}px`;
  layer.canvas = document.createElement('canvas');
  layer.canvas.width = width;
  layer.canvas.height = height;
  layer.gfx = layer.canvas.getContext('2d');
  layer.mask = null;
  layer.maskGfx = null;
  if (addMask) {
    layer.mask = document.createElement('canvas');
    layer.mask.id = `mask-${layerId}`;
    layer.mask.width = width;
    layer.mask.height = height;
    layer.mask.style.background = '#333333';
    layer.maskGfx = layer.mask.getContext('2d');
  }
  layer.updated = false;
  return layer;
}

document.body.appendChild(layer2.mask);
document.body.appendChild(layer3.mask);
document.body.appendChild(layer1.canvas);
document.body.appendChild(layer2.canvas);
document.body.appendChild(layer3.canvas);

function drawDataURI(dataURI, layer) {
  let context = layer.gfx;
  return new Promise(function(resolve, reject) {
    let image = new Image();
    image.src = dataURI;
    image.onload = function() {
      context.clearRect(0, 0, width, height);
      context.drawImage(this, 0, 0);
      layer.updated = true;
      resolve();
    };
    image.onerror  = function(e) {
      reject(e);
    };
  });
}

window.addEventListener('message', async function(e) {
  if (e.data.id === 1) {
    drawDataURI(e.data.mask, layer1)
  } else if (e.data.id === 2) {
    drawDataURI(e.data.mask, layer2);
  } else if (e.data.id === 3) {
    drawDataURI(e.data.mask, layer3);
  }
});

const drawBorders = initBorders();

window.requestAnimationFrame(function murderPerformance() {
  if (layer1.updated && layer2.updated && layer3.updated) {
    drawBorders([layer1, layer2, layer3]);
    maskStarRemasque();
    layer1.updated = false;
    layer2.updated = false;
    layer3.updated = false;
  }
  window.requestAnimationFrame(murderPerformance);
});

function maskStarRemasque() {
  let id1 = layer1.gfx.getImageData(0, 0, width, height);
  let id2 = layer2.gfx.getImageData(0, 0, width, height);
  let id3 = layer3.gfx.getImageData(0, 0, width, height);
  let idM2 = layer2.maskGfx.getImageData(0, 0, width, height);
  let idM3 = layer3.maskGfx.getImageData(0, 0, width, height);

  for (let i = 0; i < width * height; i++) {
    const id1i = id1.data[i * 4];
    const id2i = id2.data[i * 4];
    const id3i = id3.data[i * 4];

    if (id2i > id1i) {
      idM2.data[i * 4 + 3] = 255;
    } else {
      idM2.data[i * 4 + 3] = 255 - id1.data[i * 4 + 3];
    }

    if (id3i > id1i && id3i > id2i) {
      idM3.data[i * 4 + 3] = 255;
    } else {
      // Blend based on alpha of all layers that are "in front" of this one
      let alpha = id3.data[i * 4 + 3] / 255;
      if (id3i < id1i) {
        alpha *= (255 - id1.data[i * 4 + 3]) / 255;
      }
      if (id3i < id2i) {
        alpha *= (255 - id2.data[i * 4 + 3]) / 255;
      }
      idM3.data[i * 4 + 3] = Math.floor(alpha * 255);
    }
  }
  layer2.maskGfx.putImageData(idM2, 0, 0);
  layer3.maskGfx.putImageData(idM3, 0, 0);
  // layer2.style.webkitMaskImage = `url(${maskCanvas.toDataURL('image/png')})`;
}

// layer2.style.webkitMaskImage = 'element(#mask-canvas)';
layer2.elt.style.maskImage = '-moz-element(#mask-layer2)';
layer3.elt.style.maskImage = '-moz-element(#mask-layer3)';

let apart = false;
document.addEventListener('keypress', function(event) {
  console.log(event);
  if (event.key === 'h') {
    document.querySelector('.borders').classList.toggle('hidden');
    return;
  }

  apart = !apart;
  if (apart) {
    layer2.elt.contentWindow.postMessage({state: 'apart'});
    layer1.elt.contentWindow.postMessage({state: 'apart'});
  } else {
    layer2.elt.contentWindow.postMessage({state: 'together'});
    layer1.elt.contentWindow.postMessage({state: 'together'});
  }
});
