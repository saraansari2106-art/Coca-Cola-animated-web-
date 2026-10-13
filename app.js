/**
 * Coca-Cola 300-Frame Scrollytelling Experience
 * High-performance canvas renderer, lerped scroll scrubber, 
 * immersive cinematic storytelling and video exporter.
 */

(function () {
  'use strict';

  // --- CONFIGURATION ---
  const TOTAL_FRAMES = 300;
  const FRAME_PREFIX = 'frames/ezgif-frame-';
  const FRAME_EXT = '.jpg';

  // --- DOM ELEMENTS ---
  const loaderScreen = document.getElementById('loader-screen');
  const loaderProgressBar = document.getElementById('loader-progress-bar');
  const loaderPercentage = document.getElementById('loader-percentage');

  const experienceTrack = document.getElementById('experience');
  const mainCanvas = document.getElementById('animation-canvas');
  const mainCtx = mainCanvas.getContext('2d', { alpha: false });

  const storyCards = document.querySelectorAll('.story-card');
  const scrollHint = document.getElementById('scroll-hint');
  const heroMainTitle = document.getElementById('hero-main-title');
  const heroSubtitle = document.getElementById('hero-subtitle');

  // Video Export Modal Elements
  const footerExportTrigger = document.getElementById('footer-export-trigger');
  const videoModal = document.getElementById('video-modal');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const recordingProgressContainer = document.getElementById('recording-progress-container');
  const recordProgressBar = document.getElementById('record-progress-fill');
  const recordPercentage = document.getElementById('record-percentage');
  const videoPreviewContainer = document.getElementById('video-preview-container');
  const exportedVideo = document.getElementById('exported-video');
  const downloadVideoBtn = document.getElementById('download-video-btn');
  const copyVideoLinkBtn = document.getElementById('copy-video-link-btn');

  // --- STATE ---
  const images = new Array(TOTAL_FRAMES);
  let loadedCount = 0;
  let currentTargetFrame = 0;
  let displayedFrame = 0;
  let isAutoPlaying = false;
  let playSpeed = 1;
  let autoPlayFrameAcc = 0;
  let lastTimestamp = 0;

  // --- FORMAT FRAME FILENAME ---
  function getFrameUrl(index) {
    const padded = String(index + 1).padStart(3, '0');
    return `${FRAME_PREFIX}${padded}${FRAME_EXT}`;
  }

  // --- PRELOAD FRAMES ---
  function preloadFrames() {
    let initialRenderTriggered = false;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      
      img.onload = () => {
        images[i] = img;
        loadedCount++;
        
        const pct = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        if (loaderProgressBar) loaderProgressBar.style.width = `${pct}%`;
        if (loaderPercentage) loaderPercentage.textContent = `${pct}%`;

        // Render first frame as soon as frame 0 loads
        if (i === 0 && !initialRenderTriggered) {
          initialRenderTriggered = true;
          renderFrame(0);
          updateHeroTitles(0);
        }

        if (loadedCount === TOTAL_FRAMES) {
          setTimeout(onAllFramesLoaded, 300);
        }
      };

      img.onerror = () => {
        console.warn(`Frame failed to load: ${img.src}`);
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          onAllFramesLoaded();
        }
      };
    }
  }

  function onAllFramesLoaded() {
    if (loaderScreen) loaderScreen.classList.add('hidden');
    renderFrame(0);
    updateHeroTitles(0);
  }

  // --- HIGH-DPI CANVAS RESIZING & CENTERING ---
  function resizeCanvas(canvas, ctx) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
  }

  function drawImageProp(ctx, img, canvas) {
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Aspect contain: showcases full can and liquid splashes crisply
    const hRatio = cw / iw;
    const vRatio = ch / ih;
    const ratio = Math.min(hRatio, vRatio);

    const nw = iw * ratio;
    const nh = ih * ratio;
    const nx = (cw - nw) / 2;
    const ny = (ch - nh) / 2;

    ctx.fillStyle = '#080203';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, iw, ih, nx, ny, nw, nh);
  }

  // --- RENDER MAIN FRAME ---
  function renderFrame(frameIndex) {
    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frameIndex)));
    const img = images[idx];
    if (img && img.complete) {
      resizeCanvas(mainCanvas, mainCtx);
      drawImageProp(mainCtx, img, mainCanvas);
    }
  }

  // --- CHAPTER STORYTELLING OVERLAYS ---
  function updateStoryCard(frameIdx) {
    let activeChapter = 1;
    if (frameIdx < 60) {
      activeChapter = 1;
    } else if (frameIdx < 135) {
      activeChapter = 2;
    } else if (frameIdx < 215) {
      activeChapter = 3;
    } else {
      activeChapter = 4;
    }

    storyCards.forEach(card => {
      const chapter = parseInt(card.getAttribute('data-story'), 10);
      if (chapter === activeChapter) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
  }

  // --- HERO TOP TITLES SCROLL-FADE ---
  function updateHeroTitles(progress) {
    if (!heroMainTitle && !heroSubtitle) return;

    // Subheading: Smoothly fade out completely when scroll progress reaches 30% (0.30)
    if (heroSubtitle) {
      const subProgress = Math.min(Math.max(progress / 0.30, 0), 1);
      const subOpacity = Math.max(0, 1 - subProgress);
      heroSubtitle.style.opacity = subOpacity.toFixed(3);
      heroSubtitle.style.transform = `translateY(${-subProgress * 24}px)`;
      heroSubtitle.style.visibility = subOpacity <= 0.005 ? 'hidden' : 'visible';
    }

    // Main heading: Fades out gradually as the animation progresses (reaches 0 by 50% scroll progress)
    if (heroMainTitle) {
      const mainProgress = Math.min(Math.max(progress / 0.50, 0), 1);
      const mainOpacity = Math.max(0, 1 - mainProgress);
      heroMainTitle.style.opacity = mainOpacity.toFixed(3);
      heroMainTitle.style.transform = `translateY(${-mainProgress * 36}px) scale(${1 - mainProgress * 0.05})`;
      heroMainTitle.style.visibility = mainOpacity <= 0.005 ? 'hidden' : 'visible';
    }
  }

  // --- SCROLL PROGRESS COMPUTATION ---
  function handleScroll() {
    if (isAutoPlaying) return;

    const trackRect = experienceTrack.getBoundingClientRect();
    const scrollDistance = experienceTrack.offsetHeight - window.innerHeight;
    const scrolled = -trackRect.top;

    if (scrollHint) {
      if (scrolled > 50) {
        scrollHint.classList.add('faded');
      } else {
        scrollHint.classList.remove('faded');
      }
    }

    if (scrollDistance > 0) {
      const progress = Math.min(Math.max(scrolled / scrollDistance, 0), 1);
      currentTargetFrame = Math.floor(progress * (TOTAL_FRAMES - 1));
    }
  }

  // --- SMOOTH RENDER LOOP (LERPING) ---
  function animationLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (isAutoPlaying) {
      autoPlayFrameAcc += delta * 30 * playSpeed;
      if (autoPlayFrameAcc >= 1) {
        const step = Math.floor(autoPlayFrameAcc);
        currentTargetFrame = (currentTargetFrame + step) % TOTAL_FRAMES;
        autoPlayFrameAcc -= step;
      }
    }

    // Lerp towards target frame for fluid weighted scrubbing
    const diff = currentTargetFrame - displayedFrame;
    if (Math.abs(diff) > 0.01) {
      displayedFrame += diff * 0.16;
      const rounded = Math.round(displayedFrame);
      renderFrame(rounded);
      updateStoryCard(rounded);
      updateHeroTitles(displayedFrame / (TOTAL_FRAMES - 1));
    }

    requestAnimationFrame(animationLoop);
  }

  // Optional Spacebar shortcut for hands-free preview
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      isAutoPlaying = !isAutoPlaying;
    }
  });

  // --- VIDEO EXPORT MODAL & GENERATOR ---
  let generatedVideoBlobUrl = null;

  async function exportAnimationVideo() {
    if (!videoModal) return;
    videoModal.classList.remove('hidden');
    if (recordingProgressContainer) recordingProgressContainer.classList.remove('hidden');
    if (videoPreviewContainer) videoPreviewContainer.classList.add('hidden');
    if (recordProgressBar) recordProgressBar.style.width = '0%';
    if (recordPercentage) recordPercentage.textContent = '0%';

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1920;
    exportCanvas.height = 1080;
    const exportCtx = exportCanvas.getContext('2d');

    const stream = exportCanvas.captureStream(30);
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecond: 8000000
    });

    const recordedChunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      if (generatedVideoBlobUrl) URL.revokeObjectURL(generatedVideoBlobUrl);
      generatedVideoBlobUrl = URL.createObjectURL(blob);

      if (exportedVideo) exportedVideo.src = generatedVideoBlobUrl;
      if (downloadVideoBtn) downloadVideoBtn.href = generatedVideoBlobUrl;

      if (recordingProgressContainer) recordingProgressContainer.classList.add('hidden');
      if (videoPreviewContainer) videoPreviewContainer.classList.remove('hidden');
    };

    recorder.start();

    const delayPerFrame = 1000 / 30;
    for (let f = 0; f < TOTAL_FRAMES; f++) {
      const img = images[f];
      if (img && img.complete) {
        exportCtx.fillStyle = '#080203';
        exportCtx.fillRect(0, 0, 1920, 1080);
        exportCtx.drawImage(img, 0, 0, 1920, 1080);
      }
      const pct = Math.floor(((f + 1) / TOTAL_FRAMES) * 100);
      if (recordProgressBar) recordProgressBar.style.width = `${pct}%`;
      if (recordPercentage) recordPercentage.textContent = `${pct}%`;

      await new Promise(r => setTimeout(r, delayPerFrame));
    }

    setTimeout(() => {
      recorder.stop();
    }, 200);
  }

  if (footerExportTrigger) {
    footerExportTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      exportAnimationVideo();
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      videoModal.classList.add('hidden');
      if (exportedVideo) exportedVideo.pause();
    });
  }

  if (copyVideoLinkBtn) {
    copyVideoLinkBtn.addEventListener('click', () => {
      const videoUrl = window.location.origin + '/coca_animation.mp4';
      navigator.clipboard.writeText(videoUrl).then(() => {
        const label = copyVideoLinkBtn.querySelector('span');
        const origText = label.textContent;
        label.textContent = 'MP4 Link Copied!';
        setTimeout(() => {
          label.textContent = origText;
        }, 2000);
      }).catch(() => {
        prompt('Copy video link:', videoUrl);
      });
    });
  }

  // --- NAVIGATION BAR & SCROLL-SPY ---
  const mainNav = document.getElementById('main-nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  const allNavLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  const targetSections = [
    document.getElementById('experience'),
    document.getElementById('story'),
    document.getElementById('collection'),
    document.getElementById('campaign'),
    document.getElementById('moments'),
    document.getElementById('contact')
  ].filter(Boolean);

  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
  const menuIcon = document.getElementById('menu-icon');
  const contactForm = document.getElementById('contact-form');
  const contactStatusMsg = document.getElementById('contact-status-msg');

  function updateNavbar() {
    const scrollY = window.scrollY;

    // Subtle glass backdrop becomes deeper on scroll
    if (mainNav) {
      if (scrollY > 40) {
        mainNav.classList.add('nav-scrolled');
      } else {
        mainNav.classList.remove('nav-scrolled');
      }
    }

    // Scroll spy for active menu item
    const scrollMarker = scrollY + 180;
    let currentId = 'experience';

    for (let i = 0; i < targetSections.length; i++) {
      const sec = targetSections[i];
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollMarker >= top && scrollMarker < top + height) {
        currentId = sec.id;
        break;
      }
    }

    allNavLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${currentId}`) {
        link.classList.add('active-nav');
      } else {
        link.classList.remove('active-nav');
      }
    });
  }

  // Mobile menu toggle
  if (mobileMenuToggle && mobileMenuDrawer) {
    mobileMenuToggle.addEventListener('click', () => {
      const isHidden = mobileMenuDrawer.classList.contains('hidden');
      if (isHidden) {
        mobileMenuDrawer.classList.remove('hidden');
        if (menuIcon) menuIcon.textContent = 'close';
      } else {
        mobileMenuDrawer.classList.add('hidden');
        if (menuIcon) menuIcon.textContent = 'menu';
      }
    });

    mobileNavLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuDrawer.classList.add('hidden');
        if (menuIcon) menuIcon.textContent = 'menu';
      });
    });
  }

  // --- TOPIC DROPDOWN CONTROLLER ---
  const topicDropdownWrapper = document.getElementById('topic-dropdown-wrapper');
  const topicDropdownBtn = document.getElementById('topic-dropdown-btn');
  const topicDropdownMenu = document.getElementById('topic-dropdown-menu');
  const topicSelectedLabel = document.getElementById('topic-selected-label');
  const contactSubjectSelect = document.getElementById('contact-subject');
  const topicOptions = document.querySelectorAll('.topic-option');

  function openTopicDropdown() {
    if (!topicDropdownMenu || !topicDropdownBtn) return;
    topicDropdownMenu.classList.remove('hidden');
    topicDropdownBtn.setAttribute('aria-expanded', 'true');
    const selectedOption = topicDropdownMenu.querySelector('.topic-option.is-selected');
    if (selectedOption) {
      selectedOption.scrollIntoView({ block: 'nearest' });
    }
  }

  function closeTopicDropdown() {
    if (!topicDropdownMenu || !topicDropdownBtn) return;
    topicDropdownMenu.classList.add('hidden');
    topicDropdownBtn.setAttribute('aria-expanded', 'false');
  }

  function selectTopic(val) {
    if (!val) return;

    // Update label text
    if (topicSelectedLabel) {
      topicSelectedLabel.textContent = val;
    }

    // Keep hidden native select in sync
    if (contactSubjectSelect) {
      contactSubjectSelect.value = val;
      contactSubjectSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Update option highlights and checkmarks
    topicOptions.forEach(opt => {
      const isSelected = opt.getAttribute('data-value') === val;
      opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      const checkIcon = opt.querySelector('.checkmark-icon');

      if (isSelected) {
        opt.classList.add('is-selected', 'bg-crimson', 'text-white', 'font-semibold');
        opt.classList.remove('text-neutral-300', 'hover:bg-crimson/20');
        if (checkIcon) checkIcon.classList.remove('hidden');
      } else {
        opt.classList.remove('is-selected', 'bg-crimson', 'text-white', 'font-semibold');
        opt.classList.add('text-neutral-300', 'hover:bg-crimson/20');
        if (checkIcon) checkIcon.classList.add('hidden');
      }
    });

    closeTopicDropdown();
  }

  if (topicDropdownBtn && topicDropdownMenu) {
    topicDropdownBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = !topicDropdownMenu.classList.contains('hidden');
      if (isOpen) {
        closeTopicDropdown();
      } else {
        openTopicDropdown();
      }
    });

    topicOptions.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.getAttribute('data-value');
        selectTopic(val);
      });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (topicDropdownWrapper && !topicDropdownWrapper.contains(e.target)) {
        closeTopicDropdown();
      }
    });

    // Keyboard navigation
    topicDropdownBtn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openTopicDropdown();
      } else if (e.key === 'Escape') {
        closeTopicDropdown();
      }
    });

    topicDropdownMenu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeTopicDropdown();
        topicDropdownBtn.focus();
      }
    });
  }

  // Contact form submission
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (contactStatusMsg) {
        contactStatusMsg.classList.remove('hidden');
        contactForm.reset();
        selectTopic('General Inquiry');
        setTimeout(() => {
          contactStatusMsg.classList.add('hidden');
        }, 5000);
      }
    });
  }

  // --- EVENT LISTENERS ---
  window.addEventListener('scroll', () => {
    handleScroll();
    updateNavbar();
  }, { passive: true });

  window.addEventListener('resize', () => {
    renderFrame(displayedFrame);
  });

  // Initialize
  preloadFrames();
  updateNavbar();
  requestAnimationFrame(animationLoop);

})();
