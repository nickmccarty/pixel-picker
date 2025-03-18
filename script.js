document.addEventListener('DOMContentLoaded', () => {
  const imageContainer = document.getElementById('image-container');
  const imageUpload = document.getElementById('image-upload');
  const coordinatesDisplay = document.getElementById('coordinates');
  const spinnerOverlay = document.querySelector('.spinner-overlay');
  const overviewThumbnail = document.getElementById('overview-thumbnail');
  const themeToggle = document.getElementById('theme-toggle');

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
    // Create horizontal guideline if it doesn't exist
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
    
    // Create vertical guideline if it doesn't exist
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
  
  // Update guidelines position
  function updateGuidelines(clientX, clientY) {
    if (!horizontalGuideline || !verticalGuideline) return;
    
    const containerRect = imageContainer.getBoundingClientRect();
    
    // Position relative to container
    const relativeY = clientY - containerRect.top;
    const relativeX = clientX - containerRect.left;
    
    // Update guidelines position
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
      imgElement = document.createElement('img');
      imgElement.src = e.target.result;
      imgElement.alt = 'Uploaded Image';
      imgElement.style.position = 'absolute';
      imgElement.style.transform = `scale(${scale}) translate(${originX}px, ${originY}px)`;
      imgElement.addEventListener('mousemove', handleMouseMove);
      imgElement.addEventListener('contextmenu', handleRightClick);
      imgElement.addEventListener('wheel', handleZoom, { passive: false });
      
      // Add box drawing event listeners
      imgElement.addEventListener('mousedown', startDrawingBox);
      imgElement.addEventListener('mouseup', finishDrawingBox);
      
      imageContainer.innerHTML = '';
      imageContainer.appendChild(imgElement);

      overviewThumbnail.innerHTML = '';
      const thumbnailImg = document.createElement('img');
      thumbnailImg.src = e.target.result;
      thumbnailImg.alt = 'Overview Thumbnail';
      overviewThumbnail.appendChild(thumbnailImg);
      overviewThumbnail.classList.remove('d-none');
      
      // Create guidelines after image is loaded
      createGuidelines();

      imgElement.focus();
      spinnerOverlay.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  function handleMouseMove(event) {
    if (!imgElement) return;
    
    // Update guidelines position
    updateGuidelines(event.clientX, event.clientY);
    
    const rect = imgElement.getBoundingClientRect();
    const x = Math.round((event.clientX - rect.left) / scale);
    const y = Math.round((event.clientY - rect.top) / scale);
    
    if (!isDrawing) {
      coordinatesDisplay.textContent = `Coordinates: (${x}, ${y})`;
    } else {
      // Update box dimensions while drawing
      updateDrawingBox(event);
    }
  }
  
  // Add event listener for image container to handle cursor guidelines
  // even when cursor is outside the image but inside the container
  imageContainer.addEventListener('mousemove', (event) => {
    // Only update guidelines when we're not drawing
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
  }
  
  // New function to start drawing box
  function startDrawingBox(event) {
    if (!imgElement) return;
    
    event.preventDefault();
    
    // Only proceed with left button click
    if (event.button !== 0) return;
    
    const rect = imgElement.getBoundingClientRect();
    startX = Math.round((event.clientX - rect.left) / scale);
    startY = Math.round((event.clientY - rect.top) / scale);
    currentX = startX;
    currentY = startY;
    
    // Create selection box element if it doesn't exist
    if (!selectionBox) {
      selectionBox = document.createElement('div');
      selectionBox.style.position = 'absolute';
      selectionBox.style.border = '2px dashed #3bbd3b';
      selectionBox.style.backgroundColor = 'rgba(59, 189, 59, 0.2)';
      selectionBox.style.pointerEvents = 'none'; // So it doesn't interfere with mouse events
      selectionBox.style.zIndex = '999';
      imageContainer.appendChild(selectionBox);
    }
    
    // Set initial position and size
    updateSelectionBoxStyle();
    
    isDrawing = true;
    
    // Update display with starting coordinates
    updateBoxCoordinatesDisplay();
  }
  
  // New function to update box while drawing
  function updateDrawingBox(event) {
    if (!isDrawing || !imgElement) return;
    
    // Update guidelines while drawing too
    updateGuidelines(event.clientX, event.clientY);
    
    const rect = imgElement.getBoundingClientRect();
    currentX = Math.round((event.clientX - rect.left) / scale);
    currentY = Math.round((event.clientY - rect.top) / scale);
    
    updateSelectionBoxStyle();
    updateBoxCoordinatesDisplay();
  }
  
  // New function to update selection box visual style
  function updateSelectionBoxStyle() {
    if (!selectionBox || !imgElement) return;
    
    const rect = imgElement.getBoundingClientRect();
    
    // Calculate top-left and width/height for the box
    const boxLeft = Math.min(startX, currentX) * scale + rect.left;
    const boxTop = Math.min(startY, currentY) * scale + rect.top;
    const boxWidth = Math.abs(currentX - startX) * scale;
    const boxHeight = Math.abs(currentY - startY) * scale;
    
    // Update box position and size
    selectionBox.style.left = `${boxLeft - rect.left + parseFloat(getComputedStyle(imgElement).left)}px`;
    selectionBox.style.top = `${boxTop - rect.top + parseFloat(getComputedStyle(imgElement).top)}px`;
    selectionBox.style.width = `${boxWidth}px`;
    selectionBox.style.height = `${boxHeight}px`;
  }
  
  // New function to display box coordinates
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
  
  // New function to finish drawing box
  function finishDrawingBox(event) {
    if (!isDrawing || !imgElement) return;
    
    const rect = imgElement.getBoundingClientRect();
    currentX = Math.round((event.clientX - rect.left) / scale);
    currentY = Math.round((event.clientY - rect.top) / scale);
    
    isDrawing = false;
    
    // Get final box coordinates
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    
    // Format in COCO style (x, y, width, height)
    const cocoFormat = JSON.stringify({
      "bbox": [left, top, width, height]
    });
    
    copyToClipboard(cocoFormat);
    
    // Clean up selection box
    if (selectionBox) {
      selectionBox.remove();
      selectionBox = null;
    }
  }

  imageContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageContainer.classList.add('bg-primary-subtle');
  });

  imageContainer.addEventListener('dragleave', () => {
    imageContainer.classList.remove('bg-primary-subtle');
  });
  
  // Handle mouse leaving the container
  imageContainer.addEventListener('mouseleave', () => {
    // Hide guidelines when cursor leaves the container
    if (horizontalGuideline) horizontalGuideline.style.display = 'none';
    if (verticalGuideline) verticalGuideline.style.display = 'none';
  });
  
  // Show guidelines when cursor enters the container
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

  imageContainer.addEventListener('click', () => {
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
    event.preventDefault();
  });

  themeToggle.addEventListener('click', () => {
    document.documentElement.setAttribute('data-bs-theme', 
      document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark'
    );
  });
});