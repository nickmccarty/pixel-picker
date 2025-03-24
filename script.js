document.addEventListener('DOMContentLoaded', () => {
  const imageContainer = document.getElementById('image-container');
  const imageUpload = document.getElementById('image-upload');
  const coordinatesDisplay = document.getElementById('coordinates');
  const spinnerOverlay = document.querySelector('.spinner-overlay');
  const overviewThumbnail = document.getElementById('overview-thumbnail');
  const themeToggle = document.getElementById('theme-toggle');
  const uploadPlaceholder = document.getElementById('upload-placeholder');

  let imgElement = null;
  let scale = 1;
  let originX = 0;
  let originY = 0;

  // Box drawing variables
  let isDrawing = false;
  let selectionBox = null;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let markerSvg = null;

  // Guidelines
  let horizontalGuideline = null;
  let verticalGuideline = null;

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      alert(`Copied to clipboard: ${text}`);
    });
  }

  // Create guidelines
  function createGuidelines() {
    if (!horizontalGuideline) {
      horizontalGuideline = document.createElement('div');
      horizontalGuideline.className = 'guideline horizontal';
      horizontalGuideline.style.position = 'absolute';
      horizontalGuideline.style.height = '1px';
      horizontalGuideline.style.width = '100%';
      horizontalGuideline.style.borderTop = '1px dotted #aaaaaa';
      horizontalGuideline.style.pointerEvents = 'none';
      horizontalGuideline.style.zIndex = '998';
      imageContainer.appendChild(horizontalGuideline);
    }

    if (!verticalGuideline) {
      verticalGuideline = document.createElement('div');
      verticalGuideline.className = 'guideline vertical';
      verticalGuideline.style.position = 'absolute';
      verticalGuideline.style.width = '1px';
      verticalGuideline.style.height = '100%';
      verticalGuideline.style.borderLeft = '1px dotted #aaaaaa';
      verticalGuideline.style.pointerEvents = 'none';
      verticalGuideline.style.zIndex = '998';
      imageContainer.appendChild(verticalGuideline);
    }
  }

  function createBullseyeSVG() {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "currentColor");
    svg.setAttribute("class", "bi bi-bullseye");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.style.position = 'absolute';
    svg.style.zIndex = '1000';
    svg.style.pointerEvents = 'none';

    const paths = [
      "M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16",
      "M8 13A5 5 0 1 1 8 3a5 5 0 0 1 0 10m0 1A6 6 0 1 0 8 2a6 6 0 0 0 0 12",
      "M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6m0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
      "M9.5 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"
    ];

    paths.forEach(pathData => {
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("d", pathData);
      svg.appendChild(path);
    });

    return svg;
  }

  function updateGuidelines(clientX, clientY) {
    if (!horizontalGuideline || !verticalGuideline) return;

    const containerRect = imageContainer.getBoundingClientRect();
    const relativeY = clientY - containerRect.top;
    const relativeX = clientX - containerRect.left;

    horizontalGuideline.style.top = `${relativeY}px`;
    verticalGuideline.style.left = `${relativeX}px`;
  }

  function loadImage(file) {
    spinnerOverlay.style.display = 'flex';
    const reader = new FileReader();
    reader.onload = (e) => {
      if (imgElement) {
        imgElement.remove();
      }

      uploadPlaceholder.style.display = 'none';

      imgElement = document.createElement('img');
      imgElement.src = e.target.result;
      imgElement.alt = 'Uploaded Image';
      imgElement.style.position = 'absolute';
      imgElement.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;
      imgElement.addEventListener('mousemove', handleMouseMove);
      imgElement.addEventListener('contextmenu', handleRightClick);
      imgElement.addEventListener('wheel', handleZoom, { passive: false });

      imgElement.addEventListener('mousedown', startDrawingBox);
      document.addEventListener('mousemove', updateDrawingBox);
      document.addEventListener('mouseup', finishDrawingBox);

      imageContainer.appendChild(imgElement);

      overviewThumbnail.innerHTML = '';
      const thumbnailImg = document.createElement('img');
      thumbnailImg.src = e.target.result;
      thumbnailImg.alt = 'Overview Thumbnail';
      overviewThumbnail.appendChild(thumbnailImg);
      overviewThumbnail.classList.remove('d-none');

      createGuidelines();

      imgElement.focus();
      spinnerOverlay.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  function handleMouseMove(event) {
    if (!imgElement) return;

    updateGuidelines(event.clientX, event.clientY);

    const rect = imgElement.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / scale);
    const y = Math.round((event.clientY - rect.top) / scale);

    coordinatesDisplay.textContent = `Coordinates: (${x}, ${y})`;
  }

  imageContainer.addEventListener('mousemove', (event) => {
    if (!isDrawing) {
      updateGuidelines(event.clientX, event.clientY);
    }
  });

  function handleRightClick(event) {
    event.preventDefault();
    if (!imgElement) return;
    const rect = imgElement.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / scale);
    const y = Math.round((event.clientY - rect.top) / scale);
    copyToClipboard(`(${x}, ${y})`);
  }

  function handleZoom(event) {
    event.preventDefault();
    if (!imgElement) return;
    const rect = imgElement.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / scale;
    const offsetY = (event.clientY - rect.top) / scale;
    scale += event.deltaY > 0 ? -0.1 : 0.1;
    scale = Math.min(Math.max(0.1, scale), 10);
    originX = event.clientX - rect.left - offsetX * scale;
    originY = event.clientY - rect.top - offsetY * scale;
    imgElement.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;

    // Update marker if it exists
    if (markerSvg) {
      updateMarkerPosition();
    }
  }

  function startDrawingBox(event) {
    if (!imgElement) return;
    event.preventDefault();
    if (event.button !== 0) return;

    // Remove any existing marker
    if (markerSvg) {
      markerSvg.remove();
      markerSvg = null;
    }

    isDrawing = true;

    const rect = imgElement.getBoundingClientRect();
    startX = Math.round((event.clientX - rect.left) / scale);
    startY = Math.round((event.clientY - rect.top) / scale);
    currentX = startX;
    currentY = startY;

    if (selectionBox) {
      selectionBox.remove();
    }

    selectionBox = document.createElement('div');
    selectionBox.style.position = 'absolute';
    selectionBox.style.border = '2px dashed #3bbd3b';
    selectionBox.style.backgroundColor = 'rgba(59, 189, 59, 0.2)';
    selectionBox.style.pointerEvents = 'none';
    selectionBox.style.zIndex = '999';
    imageContainer.appendChild(selectionBox);

    updateSelectionBoxStyle();
  }

  function updateDrawingBox(event) {
    if (!isDrawing || !imgElement) return;

    updateGuidelines(event.clientX, event.clientY);

    const rect = imgElement.getBoundingClientRect();
    currentX = Math.round((event.clientX - rect.left) / scale);
    currentY = Math.round((event.clientY - rect.top) / scale);

    updateSelectionBoxStyle();
    updateBoxCoordinatesDisplay();
  }

  function updateSelectionBoxStyle() {
    if (!selectionBox || !imgElement) return;

    const rect = imgElement.getBoundingClientRect();

    const boxLeft = Math.min(startX, currentX) * scale + rect.left;
    const boxTop = Math.min(startY, currentY) * scale + rect.top;
    const boxWidth = Math.abs(currentX - startX) * scale;
    const boxHeight = Math.abs(currentY - startY) * scale;

    selectionBox.style.left = `${boxLeft - rect.left + parseFloat(getComputedStyle(imgElement).left)}px`;
    selectionBox.style.top = `${boxTop - rect.top + parseFloat(getComputedStyle(imgElement).top)}px`;
    selectionBox.style.width = `${boxWidth}px`;
    selectionBox.style.height = `${boxHeight}px`;
  }

  function updateBoxCoordinatesDisplay() {
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    coordinatesDisplay.innerHTML = `
      Box: (${left}, ${top}) to (${currentX}, ${currentY})<br>
      Width: ${width}, Height: ${height}
    `;
  }

  function updateMarkerPosition() {
    if (!markerSvg || !imgElement) return;

    const rect = imgElement.getBoundingClientRect();
    const centerX = (Math.min(startX, currentX) + Math.abs(currentX - startX) / 2) * scale + rect.left;
    const centerY = (Math.min(startY, currentY) + Math.abs(currentY - startY) / 2) * scale + rect.top;

    markerSvg.style.left = `${centerX - 8 - rect.left + parseFloat(getComputedStyle(imgElement).left)}px`;
    markerSvg.style.top = `${centerY - 8 - rect.top + parseFloat(getComputedStyle(imgElement).top)}px`;
  }

  function finishDrawingBox(event) {
    if (!isDrawing || !imgElement) return;

    isDrawing = false;

    const rect = imgElement.getBoundingClientRect();
    currentX = Math.round((event.clientX - rect.left) / scale);
    currentY = Math.round((event.clientY - rect.top) / scale);

    updateSelectionBoxStyle();
    updateBoxCoordinatesDisplay();

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    const cocoFormat = JSON.stringify({
      "bbox": [left, top, width, height]
    });

    copyToClipboard(cocoFormat);

    // Create and position the marker SVG
    markerSvg = createBullseyeSVG();
    imageContainer.appendChild(markerSvg);
    updateMarkerPosition();
  }

  imageContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageContainer.classList.add('bg-primary-subtle');
  });

  imageContainer.addEventListener('dragleave', () => {
    imageContainer.classList.remove('bg-primary-subtle');
  });

  imageContainer.addEventListener('mouseleave', () => {
    if (horizontalGuideline) horizontalGuideline.style.display = 'none';
    if (verticalGuideline) verticalGuideline.style.display = 'none';
  });

  imageContainer.addEventListener('mouseenter', () => {
    if (horizontalGuideline) horizontalGuideline.style.display = 'block';
    if (verticalGuideline) verticalGuideline.style.display = 'block';
  });

  imageContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    imageContainer.classList.remove('bg-primary-subtle');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImage(file);
    } else {
      alert('Please drop a valid image file.');
    }
  });

  uploadPlaceholder.addEventListener('click', () => {
    imageUpload.click();
  });

  imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      loadImage(file);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!imgElement) return;

    const PAN_STEP = 20;
    const ZOOM_STEP = 0.1;

    switch (event.key) {
      case 'ArrowUp':
        originY -= PAN_STEP / scale;
        break;
      case 'ArrowDown':
        originY += PAN_STEP / scale;
        break;
      case 'ArrowLeft':
        originX -= PAN_STEP / scale;
        break;
      case 'ArrowRight':
        originX += PAN_STEP / scale;
        break;
      case '+':
      case '=':
        scale = Math.min(scale + ZOOM_STEP, 10);
        break;
      case '-':
        scale = Math.max(scale - ZOOM_STEP, 0.1);
        break;
      case 'r':
      case 'R':
        scale = 1;
        originX = 0;
        originY = 0;
        break;
      default:
        return;
    }

    imgElement.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;
    
    // Update marker position when zooming or panning
    if (markerSvg) {
      updateMarkerPosition();
    }
    
    event.preventDefault();
  });

  themeToggle.addEventListener('click', () => {
    document.documentElement.setAttribute('data-bs-theme', document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark');
  });
});