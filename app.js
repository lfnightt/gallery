const API_URL = 'http://localhost:3000';
const PASSWORD = 'fire123';

const lockScreen = document.getElementById('lockScreen');
const lockForm = document.getElementById('lockForm');
const passwordInput = document.getElementById('passwordInput');
const lockError = document.getElementById('lockError');
const app = document.getElementById('app');
const fileInput = document.getElementById('fileInput');
const gallery = document.getElementById('gallery');
const emptyState = document.getElementById('emptyState');
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');
const lbCounter = document.getElementById('lbCounter');
const lockBtn = document.getElementById('lockBtn');
const dropHint = document.getElementById('dropHint');
const toast = document.getElementById('toast');
const fireCanvas = document.getElementById('fireCanvas');

let images = [];
let currentIndex = 0;
let toastTimeout = null;

function showToast(message, isError = false) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function renderGallery() {
  gallery.innerHTML = '';
  if (images.length === 0) {
    emptyState.style.display = 'block';
    gallery.style.display = 'none';
    return;
  }
  emptyState.style.display = 'none';
  gallery.style.display = 'grid';
  images.forEach((img, index) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    const image = document.createElement('img');
    image.src = img.url;
    image.alt = img.name;
    image.loading = 'lazy';
    item.appendChild(image);
    item.addEventListener('click', () => openLightbox(index));
    gallery.appendChild(item);
  });
}

async function loadImages() {
  try {
    const response = await fetch(`${API_URL}/images`);
    const data = await response.json();
    images = data.images.map(url => ({
      url,
      name: url.split('/').pop()
    }));
    renderGallery();
  } catch (e) {
    showToast('Failed to load images', true);
  }
}

async function uploadFiles(files) {
  const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
  if (imageFiles.length === 0) {
    showToast('No valid images selected', true);
    return;
  }

  const formData = new FormData();
  imageFiles.forEach(file => {
    formData.append('images', file);
  });

  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    await loadImages();
    showToast(`${imageFiles.length} image(s) added`);
  } catch (e) {
    showToast(e.message || 'Upload failed', true);
  }
}

function openLightbox(index) {
  currentIndex = index;
  lbImg.src = images[currentIndex].url;
  lbCounter.textContent = `${currentIndex + 1} / ${images.length}`;
  lightbox.classList.add('active');
}

function closeLightbox() {
  lightbox.classList.remove('active');
}

function showNext() {
  if (images.length === 0) return;
  currentIndex = (currentIndex + 1) % images.length;
  lbImg.src = images[currentIndex].url;
  lbCounter.textContent = `${currentIndex + 1} / ${images.length}`;
}

function showPrev() {
  if (images.length === 0) return;
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  lbImg.src = images[currentIndex].url;
  lbCounter.textContent = `${currentIndex + 1} / ${images.length}`;
}

function unlock() {
  lockScreen.style.display = 'none';
  app.style.display = 'flex';
  loadImages();
}

function lockApp() {
  window.location.reload();
}

lockForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (passwordInput.value === PASSWORD) {
    lockError.textContent = '';
    unlock();
  } else {
    lockError.textContent = 'Incorrect password. Try again.';
    passwordInput.value = '';
    passwordInput.focus();
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    uploadFiles(e.target.files);
    fileInput.value = '';
  }
});

lockBtn.addEventListener('click', lockApp);

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

lbClose.addEventListener('click', closeLightbox);
lbNext.addEventListener('click', showNext);
lbPrev.addEventListener('click', showPrev);

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') showNext();
  if (e.key === 'ArrowLeft') showPrev();
});

let dragCounter = 0;

document.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragCounter++;
  if (e.dataTransfer.types.includes('Files')) {
    dropHint.classList.add('visible');
  }
});

document.addEventListener('dragover', (e) => {
  e.preventDefault();
});

document.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter === 0) {
    dropHint.classList.remove('visible');
  }
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  dragCounter = 0;
  dropHint.classList.remove('visible');
  if (e.dataTransfer.files.length > 0) {
    uploadFiles(e.dataTransfer.files);
  }
});

const canvas = fireCanvas;
const ctx = canvas.getContext('2d');
let particles = [];
let animationId = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function spawnEmber() {
  const x = Math.random() * canvas.width;
  const y = canvas.height + 10;
  const size = Math.random() * 2.5 + 1;
  const speedY = -(Math.random() * 1.5 + 0.5);
  const speedX = (Math.random() - 0.5) * 0.6;
  const maxLife = Math.random() * 120 + 80;
  const hue = Math.random() * 30 + 10;
  particles.push({ x, y, size, speedY, speedX, life: 0, maxLife, hue });
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.speedX;
    p.y += p.speedY;
    p.life++;
    p.speedY *= 0.995;
    if (p.life >= p.maxLife || p.y < -20) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'lighter';
  particles.forEach(p => {
    const lifeRatio = p.life / p.maxLife;
    const alpha = lifeRatio < 0.8 ? 1 - lifeRatio / 0.8 : (1 - (lifeRatio - 0.8) / 0.2) * 0.3;
    const radius = p.size * (1 + lifeRatio * 0.5);
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 4);
    gradient.addColorStop(0, `hsla(${p.hue}, 100%, 60%, ${alpha})`);
    gradient.addColorStop(0.4, `hsla(${p.hue}, 100%, 45%, ${alpha * 0.6})`);
    gradient.addColorStop(1, `hsla(${p.hue}, 100%, 30%, 0)`);
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * 4, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  });
  ctx.globalCompositeOperation = 'source-over';
}

function animateFire() {
  if (Math.random() < 0.35) {
    spawnEmber();
    if (Math.random() < 0.1) spawnEmber();
  }
  updateParticles();
  drawParticles();
  animationId = requestAnimationFrame(animateFire);
}

function initFire() {
  resizeCanvas();
  if (animationId) cancelAnimationFrame(animationId);
  particles = [];
  animateFire();
}

window.addEventListener('resize', resizeCanvas);

initFire();