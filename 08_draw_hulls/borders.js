function initBorders() {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.classList.add('borders');
  const gfx = canvas.getContext('2d');

  const cellSize = 20;
  const cellCount = width * height / (cellSize * cellSize);
  const cellWidth = width / cellSize;
  const cellHeight = height / cellSize;

  const allCells = [];
  const colors = [
    '#00a4ff',
    '#ffa400',
    '#00ffa4',
  ];

  function drawBorders(layers) {
    for (let i = 0; i < layers.length; i++) {
      if (i >= allCells.length) {
        allCells.push(new Array(cellCount));
      }

      const id = layers[i].gfx.getImageData(0, 0, width, height);
      for (let c = 0; c < cellCount; c++) {
        const startX = (c % cellWidth) * cellSize;
        const startY = Math.floor(c / cellWidth) * cellSize;
        let cellFilled = false;
        for (let dy = 0; dy < cellSize; dy++) {
          for (let dx = 0; dx < cellSize; dx++) {
            const pixel = id.data[4 * ((startY + dy) * width + startX + dx) + 0];
            if (pixel > 0) {
              cellFilled = true;
              break;
            }
          }
          if (cellFilled) {
            break;
          }
        }
        allCells[i][c] = cellFilled;
      }
    }

    gfx.clearRect(0, 0, width, height);
    gfx.lineWidth = 2;
    for (let i = 0; i < layers.length; i++) {
      for (let c = 0; c < cellCount; c++) {
        const startX = (c % cellWidth) * cellSize;
        const startY = Math.floor(c / cellWidth) * cellSize;
        const cellFilled = allCells[i][c];
        if (cellFilled) {
          gfx.fillStyle = colors[i] + '40';
          gfx.fillRect(startX, startY, cellSize, cellSize);
          continue;
        }
        let up = false;
        let down = false;
        let left = false;
        let right = false;
        if (c > cellWidth) {
          up = allCells[i][c - cellWidth];
        }
        if (c < cellCount - cellWidth) {
          down = allCells[i][c + cellWidth];
        }
        if (c % cellWidth > 0) {
          left = allCells[i][c - 1];
        }
        if (c % cellWidth < cellWidth - 1) {
          right = allCells[i][c + 1];
        }

        gfx.strokeStyle = colors[i];
        gfx.beginPath();
        if (up) {
          gfx.moveTo(startX, startY);
          gfx.lineTo(startX + cellSize, startY);
        }
        if (down) {
          gfx.moveTo(startX, startY + cellSize);
          gfx.lineTo(startX + cellSize, startY + cellSize);
        }
        if (left) {
          gfx.moveTo(startX, startY);
          gfx.lineTo(startX, startY + cellSize);
        }
        if (right) {
          gfx.moveTo(startX + cellSize, startY);
          gfx.lineTo(startX + cellSize, startY + cellSize);
        }
        gfx.stroke();
      }
    }
  }

  document.body.appendChild(canvas);

  return drawBorders;
}
