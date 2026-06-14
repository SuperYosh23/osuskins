let skinsData = { items: [] };
const API_URL = '/api/skins';

// Load skins on page load
document.addEventListener('DOMContentLoaded', loadSkins);

// Modal elements
const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.close');
const addBtn = document.getElementById('addBtn');
const cancelBtn = document.getElementById('cancelBtn');
const skinForm = document.getElementById('skinForm');

// Event listeners
addBtn.addEventListener('click', () => openModal());
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

skinForm.addEventListener('submit', handleFormSubmit);

// File upload event listeners
document.getElementById('skinFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await uploadFile(file, 'skin');
  }
});

document.getElementById('imageFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    await uploadFile(file, 'image');
  }
});

document.getElementById('imageFiles').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) {
    await uploadMultipleFiles(files, 'images');
  }
});

document.getElementById('loadImagesBtn').addEventListener('click', loadImagesIntoManager);

async function loadSkins() {
  try {
    const response = await fetch(API_URL);
    skinsData = await response.json();
    renderSkins();
  } catch (error) {
    console.error('Error loading skins:', error);
    document.getElementById('skinList').innerHTML = '<div class="error">Failed to load skins. Make sure the server is running.</div>';
  }
}

function renderSkins() {
  const skinList = document.getElementById('skinList');
  
  if (!skinsData.items || skinsData.items.length === 0) {
    skinList.innerHTML = '<div class="loading">No skins found. Click "Add New Skin" to get started.</div>';
    return;
  }

  skinList.innerHTML = `
    <div class="reorder-controls">
      <button class="btn btn-secondary" onclick="moveSkin(-1)">↑ Move Up</button>
      <button class="btn btn-secondary" onclick="moveSkin(1)">↓ Move Down</button>
      <span style="color: #888; font-size: 0.85rem; align-self: center;">Select a skin to reorder</span>
    </div>
  ` + skinsData.items.map((skin, index) => `
    <div class="skin-card" data-index="${index}" draggable="true">
      <div class="reorder-handle">⋮⋮</div>
      <h3>${escapeHtml(skin.title)}</h3>
      <div class="meta">
        <span class="badge badge-version">${escapeHtml(skin.version)}</span>
        <span class="badge badge-type">${Array.isArray(skin.type) ? skin.type.join(', ') : skin.type}</span>
      </div>
      <p class="desc">${escapeHtml(skin.desc)}</p>
      ${skin.tags ? `
        <div class="tags">
          ${skin.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : ''}
      <div class="actions">
        <button class="btn btn-edit" onclick="editSkin(${index})">Edit</button>
        <button class="btn btn-danger" onclick="deleteSkin(${index})">Delete</button>
      </div>
    </div>
  `).join('');

  // Add drag and drop event listeners
  addDragAndDropListeners();
}

function openModal(editIndex = -1) {
  modal.classList.add('show');
  document.getElementById('editIndex').value = editIndex;
  document.getElementById('modalTitle').textContent = editIndex >= 0 ? 'Edit Skin' : 'Add New Skin';

  if (editIndex >= 0) {
    const skin = skinsData.items[editIndex];
    document.getElementById('id').value = skin.id || '';
    document.getElementById('title').value = skin.title || '';
    document.getElementById('version').value = skin.version || 'lazer';
    
    // Handle type field (can be array or string)
    const typeSelect = document.getElementById('type');
    Array.from(typeSelect.options).forEach(option => {
      option.selected = false;
    });
    if (Array.isArray(skin.type)) {
      skin.type.forEach(t => {
        const option = Array.from(typeSelect.options).find(opt => opt.value === t);
        if (option) option.selected = true;
      });
    } else if (skin.type) {
      const option = Array.from(typeSelect.options).find(opt => opt.value === skin.type);
      if (option) option.selected = true;
    }
    
    document.getElementById('desc').value = skin.desc || '';
    document.getElementById('longDesc').value = skin.longDesc || '';
    document.getElementById('tags').value = skin.tags ? skin.tags.join(', ') : '';
    document.getElementById('link').value = skin.link || '';
    document.getElementById('btnText').value = skin.btnText || 'Download';
    document.getElementById('image').value = skin.image || '';
    document.getElementById('images').value = skin.images ? JSON.stringify(skin.images, null, 2) : '';
  } else {
    skinForm.reset();
    document.getElementById('btnText').value = 'Download';
    // Reset type selection
    const typeSelect = document.getElementById('type');
    Array.from(typeSelect.options).forEach(option => {
      option.selected = false;
    });
  }
}

function closeModal() {
  modal.classList.remove('show');
  skinForm.reset();
}

async function handleFormSubmit(e) {
  e.preventDefault();
  
  const editIndex = parseInt(document.getElementById('editIndex').value);
  const tagsInput = document.getElementById('tags').value;
  const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];
  
  // Handle multi-select type field
  const typeSelect = document.getElementById('type');
  const selectedTypes = Array.from(typeSelect.selectedOptions).map(option => option.value);
  if (selectedTypes.length === 0) {
    alert('Please select at least one type');
    return;
  }
  
  const imagesInput = document.getElementById('images').value;
  let images = null;
  if (imagesInput.trim()) {
    try {
      images = JSON.parse(imagesInput);
    } catch (err) {
      alert('Invalid JSON in images field. Please check the format.');
      return;
    }
  }

  const skinData = {
    id: document.getElementById('id').value,
    title: document.getElementById('title').value,
    version: document.getElementById('version').value,
    type: selectedTypes,
    desc: document.getElementById('desc').value,
    longDesc: document.getElementById('longDesc').value || undefined,
    tags: tags,
    link: document.getElementById('link').value,
    btnText: document.getElementById('btnText').value,
  };

  const imageInput = document.getElementById('image').value;
  if (imageInput.trim()) {
    skinData.image = imageInput;
  }
  if (images) {
    skinData.images = images;
  }

  if (editIndex >= 0) {
    skinsData.items[editIndex] = skinData;
  } else {
    skinsData.items.push(skinData);
  }

  await saveSkins();
  closeModal();
  renderSkins();
}

window.editSkin = function(index) {
  openModal(index);
};

window.deleteSkin = function(index) {
  if (confirm('Are you sure you want to delete this skin?')) {
    skinsData.items.splice(index, 1);
    saveSkins().then(() => renderSkins());
  }
};

async function saveSkins() {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(skinsData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save skins');
    }
  } catch (error) {
    console.error('Error saving skins:', error);
    alert('Failed to save skins. Please try again.');
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function uploadFile(file, type) {
  const formData = new FormData();
  formData.append(type, file);

  const endpoint = type === 'skin' ? '/api/upload/skin' : '/api/upload/image';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();

    if (type === 'skin') {
      // Auto-fill the link with GitHub raw URL
      const githubUrl = `https://github.com/SuperYosh23/osuskins/raw/refs/heads/main/${result.filename}`;
      document.getElementById('link').value = githubUrl;
      alert(`Skin file uploaded successfully! Link auto-filled: ${result.filename}`);
    } else if (type === 'image') {
      document.getElementById('image').value = result.filename;
      alert(`Image uploaded successfully: ${result.filename}`);
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    alert('Failed to upload file. Please try again.');
  }
}

async function uploadMultipleFiles(files, type) {
  const formData = new FormData();
  files.forEach(file => {
    formData.append(type, file);
  });

  try {
    const response = await fetch('/api/upload/images', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();

    // Create images array with first image as primary
    const imagesArray = result.filenames.map((filename, index) => ({
      src: filename,
      primary: index === 0
    }));

    document.getElementById('images').value = JSON.stringify(imagesArray, null, 2);
    loadImagesIntoManager();
    alert(`${result.filenames.length} images uploaded successfully!`);
  } catch (error) {
    console.error('Error uploading files:', error);
    alert('Failed to upload files. Please try again.');
  }
}

function loadImagesIntoManager() {
  const imagesTextarea = document.getElementById('images');
  const imageManager = document.getElementById('imageManager');
  
  let images = [];
  try {
    const imagesText = imagesTextarea.value.trim();
    if (imagesText) {
      images = JSON.parse(imagesText);
    }
  } catch (err) {
    console.error('Error parsing images:', err);
  }

  if (!images || images.length === 0) {
    imageManager.innerHTML = '<p class="no-images">No images added yet. Upload images or add manually above.</p>';
    return;
  }

  imageManager.innerHTML = images.map((img, index) => `
    <div class="image-item ${img.primary ? 'primary' : ''}" data-index="${index}">
      <img src="${img.src}" alt="${img.src}" class="image-preview" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><rect fill=%22%23333%22 width=%2260%22 height=%2260%22/><text fill=%22%23666%22 font-size=%2212%22 x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22>No img</text></svg>'">
      <div class="image-info">
        <div class="filename">${escapeHtml(img.src)}</div>
        ${img.primary ? '<span class="badge">Primary</span>' : ''}
      </div>
      <div class="image-actions">
        <button class="btn btn-secondary" onclick="moveImage(${index}, -1)" title="Move Up">↑</button>
        <button class="btn btn-secondary" onclick="moveImage(${index}, 1)" title="Move Down">↓</button>
        <button class="btn btn-secondary" onclick="setPrimaryImage(${index})" title="Set as Primary">★</button>
        <button class="btn btn-danger" onclick="deleteImage(${index})" title="Delete">×</button>
      </div>
    </div>
  `).join('');
}

window.moveImage = function(index, direction) {
  const imagesTextarea = document.getElementById('images');
  let images = [];
  try {
    images = JSON.parse(imagesTextarea.value.trim());
  } catch (err) {
    return;
  }

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= images.length) return;

  // Swap images
  [images[index], images[newIndex]] = [images[newIndex], images[index]];
  
  imagesTextarea.value = JSON.stringify(images, null, 2);
  loadImagesIntoManager();
};

window.setPrimaryImage = function(index) {
  const imagesTextarea = document.getElementById('images');
  let images = [];
  try {
    images = JSON.parse(imagesTextarea.value.trim());
  } catch (err) {
    return;
  }

  // Set all to false, then set selected to true
  images.forEach(img => img.primary = false);
  images[index].primary = true;
  
  imagesTextarea.value = JSON.stringify(images, null, 2);
  loadImagesIntoManager();
};

window.deleteImage = function(index) {
  if (!confirm('Delete this image?')) return;
  
  const imagesTextarea = document.getElementById('images');
  let images = [];
  try {
    images = JSON.parse(imagesTextarea.value.trim());
  } catch (err) {
    return;
  }

  images.splice(index, 1);
  
  // If we deleted the primary, set the first one as primary
  if (images.length > 0 && !images.some(img => img.primary)) {
    images[0].primary = true;
  }
  
  imagesTextarea.value = images.length > 0 ? JSON.stringify(images, null, 2) : '';
  loadImagesIntoManager();
};

window.moveSkin = function(direction) {
  const selectedCard = document.querySelector('.skin-card.selected');
  if (!selectedCard) {
    alert('Please select a skin first by clicking on it');
    return;
  }
  
  const index = parseInt(selectedCard.dataset.index);
  const newIndex = index + direction;
  
  if (newIndex < 0 || newIndex >= skinsData.items.length) return;
  
  // Swap items
  [skinsData.items[index], skinsData.items[newIndex]] = [skinsData.items[newIndex], skinsData.items[index]];
  
  saveSkins().then(() => renderSkins());
};

function addDragAndDropListeners() {
  const cards = document.querySelectorAll('.skin-card');
  
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.actions')) {
        // Remove selected class from all cards
        document.querySelectorAll('.skin-card').forEach(c => c.classList.remove('selected'));
        // Add selected class to clicked card
        card.classList.add('selected');
      }
    });
    
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.dataset.index);
    });
    
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      document.querySelectorAll('.skin-card').forEach(c => c.classList.remove('drag-over'));
    });
    
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      card.classList.add('drag-over');
    });
    
    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over');
    });
    
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      card.classList.remove('drag-over');
      
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex = parseInt(card.dataset.index);
      
      if (fromIndex === toIndex) return;
      
      // Move item
      const item = skinsData.items.splice(fromIndex, 1)[0];
      skinsData.items.splice(toIndex, 0, item);
      
      saveSkins().then(() => renderSkins());
    });
  });
}
