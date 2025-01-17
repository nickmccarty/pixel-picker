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
  
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        alert(`Copied to clipboard: ${text}`);
      });
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
        imageContainer.innerHTML = '';
        imageContainer.appendChild(imgElement);
  
        overviewThumbnail.innerHTML = '';
        const thumbnailImg = document.createElement('img');
        thumbnailImg.src = e.target.result;
        thumbnailImg.alt = 'Overview Thumbnail';
        overviewThumbnail.appendChild(thumbnailImg);
        overviewThumbnail.classList.remove('d-none');
  
        imgElement.focus();
        spinnerOverlay.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  
    function handleMouseMove(event) {
      if (!imgElement) return;
      const rect = imgElement.getBoundingClientRect();
      const x = Math.round((event.clientX - rect.left) / scale);
      const y = Math.round((event.clientY - rect.top) / scale);
      coordinatesDisplay.textContent = `Coordinates: (${x}, ${y})`;
    }
  
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
  
    imageContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      imageContainer.classList.add('bg-primary-subtle');
    });
  
    imageContainer.addEventListener('dragleave', () => {
      imageContainer.classList.remove('bg-primary-subtle');
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
  