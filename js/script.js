document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initNavbarScroll();
    initMobileMenu();
    initDropdowns();
    initReviews();
    initProductFiltering();
    initSmoothScroll();
    initBackToTop();
    initCounterAnimation();
    initLazyLoading();
    initWhatsAppBtn();
    initDesignWhatsAppInquiries();
});

// 1. Scroll Animation Observer
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve if animation should only happen once
                // observer.unobserve(entry.target);
            }
        });
    }, { 
        threshold: 0.05, 
        rootMargin: '0px 0px 50px 0px' 
    });

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// 2. Navbar Scroll Effect
function initNavbarScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Active Nav Link Highlighting (only if sections exist on the page)
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        if (sections.length > 0 && navLinks.length > 0) {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.scrollY >= (sectionTop - sectionHeight / 3)) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                const href = link.getAttribute('href');
                if (href && current && href.includes('#' + current)) {
                    link.classList.add('active');
                } else if (href && href.startsWith('#')) {
                    link.classList.remove('active');
                }
            });
        }
    });
}

// 3. Mobile Menu Toggle
function initMobileMenu() {
    const hamburger = document.querySelector('.mobile-menu-btn, .hamburger-btn');
    const mobileNav = document.querySelector('.nav-links, .mobile-menu');
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        hamburger.classList.toggle('active');
        mobileNav.classList.toggle('active');
        mobileNav.classList.toggle('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
            hamburger.classList.remove('active');
            mobileNav.classList.remove('active');
            mobileNav.classList.remove('open');
        }
    });
}

// 4. Collection Dropdown
function initDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    // For mobile click visibility
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('open');
                }
            });
        }
    });
}

// 5 & 6. Review System & Star Rating
function initReviews() {
    const reviewForm = document.getElementById('review-form');
    const reviewsContainer = document.getElementById('reviews-container');
    const stars = document.querySelectorAll('.star-rating .star-input, .star-rating-input .star');
    const hiddenRatingInput = document.getElementById('rating-value');
    const clearAllBtn = document.getElementById('clear-all-reviews-btn');
    let currentRating = 0;

    // One-time auto-clear requested for accidental review
    if (!localStorage.getItem('ruksewana_accidental_review_cleared_v1')) {
        localStorage.removeItem('ruksewana_reviews');
        localStorage.setItem('ruksewana_accidental_review_cleared_v1', 'true');
    }

    // URL parameter support to reset reviews if needed (?clear_reviews=true)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clear_reviews') === 'true') {
        localStorage.removeItem('ruksewana_reviews');
        if (window.history.replaceState) {
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
        }
    }

    // Load existing reviews from localStorage
    loadReviews();

    // Clear all reviews button
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all reviews?')) {
                localStorage.removeItem('ruksewana_reviews');
                loadReviews();
            }
        });
    }

    // Star Rating Interactivity
    if (stars.length > 0) {
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const target = e.currentTarget || e.target;
                currentRating = parseInt(target.dataset.value || target.closest('[data-value]')?.dataset.value || 0);
                if (hiddenRatingInput) hiddenRatingInput.value = currentRating;
                updateStarSelection(stars, currentRating);
            });
            star.addEventListener('mouseover', (e) => {
                const target = e.currentTarget || e.target;
                const val = parseInt(target.dataset.value || target.closest('[data-value]')?.dataset.value || 0);
                updateStarSelection(stars, val, true);
            });
            star.addEventListener('mouseout', () => {
                updateStarSelection(stars, currentRating);
            });
        });
    }

    // Review Form Submission
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('reviewer-name') || document.getElementById('review-name');
            const textInput = document.getElementById('review-text');

            if (!nameInput || !textInput || currentRating === 0) {
                alert("Please fill all fields and select a star rating (1-5 stars).");
                return;
            }

            const newReview = {
                id: Date.now(),
                name: nameInput.value.trim(),
                rating: currentRating,
                text: textInput.value.trim(),
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            };

            saveReview(newReview);
            loadReviews();

            // Reset form
            reviewForm.reset();
            currentRating = 0;
            if (hiddenRatingInput) hiddenRatingInput.value = '0';
            updateStarSelection(stars, 0);

            // Scroll slightly to the reviews section
            if (reviewsContainer) {
                reviewsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }

    function updateStarSelection(stars, rating, isHover = false) {
        stars.forEach(star => {
            const val = parseInt(star.dataset.value);
            if (val <= rating) {
                star.classList.add('selected');
            } else {
                star.classList.remove('selected');
            }
        });
    }

    function saveReview(review) {
        let reviews = JSON.parse(localStorage.getItem('ruksewana_reviews')) || [];
        reviews.push(review);
        localStorage.setItem('ruksewana_reviews', JSON.stringify(reviews));
    }

    function deleteReview(id) {
        let reviews = JSON.parse(localStorage.getItem('ruksewana_reviews')) || [];
        reviews = reviews.filter(r => String(r.id) !== String(id));
        localStorage.setItem('ruksewana_reviews', JSON.stringify(reviews));
        loadReviews();
    }

    function loadReviews() {
        if (!reviewsContainer) return;
        let reviews = JSON.parse(localStorage.getItem('ruksewana_reviews')) || [];
        reviewsContainer.innerHTML = '';

        const actionsContainer = document.getElementById('reviews-actions');

        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p class="no-reviews-msg" style="text-align: center; color: var(--text-light); grid-column: 1 / -1; padding: 25px 0; font-style: italic;">No reviews yet. Be the first to share your experience!</p>';
            if (actionsContainer) actionsContainer.style.display = 'none';
            return;
        }

        if (actionsContainer) actionsContainer.style.display = 'block';
        reviews.forEach(review => renderReview(review));
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderReview(review) {
        if (!reviewsContainer) return;
        
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            starsHtml += i <= review.rating ? '<i class="star filled">&#9733;</i>' : '<i class="star empty">&#9734;</i>';
        }

        const reviewEl = document.createElement('div');
        reviewEl.className = 'review-card';
        reviewEl.innerHTML = `
            <div class="review-header">
                <div>
                    <h4 class="review-name">${escapeHtml(review.name)}</h4>
                    <div class="review-stars">${starsHtml}</div>
                </div>
                <button type="button" class="delete-review-btn" data-id="${review.id}" title="Delete this review" aria-label="Delete review">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
            <p class="review-text">${escapeHtml(review.text)}</p>
            <span class="review-date">${escapeHtml(review.date)}</span>
        `;

        const deleteBtn = reviewEl.querySelector('.delete-review-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this review?')) {
                    deleteReview(review.id);
                }
            });
        }

        // Prepend to show newest first
        reviewsContainer.prepend(reviewEl);
    }
}

// 7. Product Filtering
function initProductFiltering() {
    const filterSelect = document.getElementById('product-filter') || document.getElementById('sort-select');
    const productsGrid = document.querySelector('.products-grid');
    
    if (!filterSelect || !productsGrid) return;

    filterSelect.addEventListener('change', (e) => {
        const sortType = e.target.value;
        const products = Array.from(productsGrid.querySelectorAll('.product-card'));
        
        products.sort((a, b) => {
            const priceA = parseFloat(a.dataset.price || 0);
            const priceB = parseFloat(b.dataset.price || 0);
            const ratingA = parseFloat(a.dataset.rating || 0);
            const ratingB = parseFloat(b.dataset.rating || 0);

            switch(sortType) {
                case 'price-low': return priceA - priceB;
                case 'price-high': return priceB - priceA;
                case 'rating-low': return ratingA - ratingB;
                case 'rating-high': return ratingB - ratingA;
                default: return 0; // Default order
            }
        });

        // Re-append elements in new order
        products.forEach(product => productsGrid.appendChild(product));
    });
}

// 8. Smooth Scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open when clicking a link
                const mobileNav = document.querySelector('.nav-links, .mobile-menu');
                const hamburger = document.querySelector('.mobile-menu-btn, .hamburger-btn');
                if (mobileNav && (mobileNav.classList.contains('open') || mobileNav.classList.contains('active'))) {
                    mobileNav.classList.remove('open');
                    mobileNav.classList.remove('active');
                    if (hamburger) hamburger.classList.remove('active');
                }
            }
        });
    });
}

// 9. Back to Top Button
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 10. Counter Animation
function initCounterAnimation() {
    const counters = document.querySelectorAll('.counter-value');
    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.target || 0);
                animateValue(entry.target, 0, target, 2000);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end;
            }
        };
        window.requestAnimationFrame(step);
    }
}

// 11. Image Lazy Loading
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('img.lazy');
    if (lazyImages.length === 0) return;

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) img.src = img.dataset.src;
                    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for older browsers
        lazyImages.forEach(img => {
            if (img.dataset.src) img.src = img.dataset.src;
            if (img.dataset.srcset) img.srcset = img.dataset.srcset;
            img.classList.remove('lazy');
        });
    }
}

// 12. WhatsApp Click
function initWhatsAppBtn() {
    const whatsappBtns = document.querySelectorAll('.whatsapp-btn');
    whatsappBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.open('https://wa.me/94779275498', '_blank');
        });
    });
}

// 13. Enhanced WhatsApp Design Inquiries with Guaranteed Image Delivery
function initDesignWhatsAppInquiries() {
    const inquireBtns = document.querySelectorAll('.pantry-inquire-btn, .product-card a[href*="wa.me"]');

    inquireBtns.forEach(btn => {
        // Prevent duplicate listener attachments
        if (btn.dataset.waInquiryBound) return;
        btn.dataset.waInquiryBound = 'true';

        btn.addEventListener('click', async (e) => {
            // ALWAYS prevent default immediately to maintain full async control
            e.preventDefault();

            const card = btn.closest('.pantry-gallery-card, .product-card');
            
            // 1. Resolve image element & source
            let imgEl = card ? card.querySelector('img') : null;
            let imgSrc = btn.dataset.imageSrc || (imgEl ? (imgEl.currentSrc || imgEl.src) : null);

            if (!imgSrc && card) {
                const imgHolder = card.querySelector('.product-image, .category-placeholder');
                if (imgHolder && imgHolder.style.backgroundImage) {
                    const match = imgHolder.style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
                    if (match) imgSrc = match[1];
                }
            }

            if (!imgSrc) {
                // Fallback: if no image found, navigate to original href
                window.open(btn.href, '_blank');
                return;
            }

            // 2. Resolve filename & design title
            let rawFilename = btn.dataset.imageName || imgSrc.split('/').pop().split('#')[0].split('?')[0] || 'design.jpg';
            try { rawFilename = decodeURIComponent(rawFilename); } catch (err) {}
            const filename = rawFilename;

            const cardTitle = btn.dataset.designTitle || (card && card.querySelector('h3, .product-name')
                ? card.querySelector('h3, .product-name').innerText.trim()
                : (imgEl && imgEl.alt ? imgEl.alt : 'Design'));

            // 3. Construct WhatsApp message text
            let inquiryText = `Hi, I'm interested in ${cardTitle} (Photo Ref: ${filename}). I'm sending the design image with this message for pricing.`;

            // If hosted on HTTP/HTTPS, append live image URL for automatic WhatsApp link preview
            if (window.location.protocol.startsWith('http')) {
                const fullImgUrl = new URL(imgSrc, window.location.href).href;
                if (!inquiryText.includes(fullImgUrl)) {
                    inquiryText += `\n\n📷 Design Photo:\n${fullImgUrl}`;
                }
            }

            const targetWaUrl = 'https://wa.me/94779275498?text=' + encodeURIComponent(inquiryText);

            // 4. Device detection
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            // --- MOBILE FLOW: Native Web Share API with File Attachment ---
            if (isMobile && navigator.share) {
                try {
                    const blob = await fetchImageBlob(imgEl, imgSrc);
                    if (blob) {
                        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                title: 'Ruksewana Furniture - ' + cardTitle,
                                text: inquiryText,
                                files: [file]
                            });
                            return; // Shared directly with attached file!
                        }
                    }
                } catch (shareErr) {
                    if (shareErr.name === 'AbortError') return; // User closed share menu
                    console.log('Mobile share fallback:', shareErr);
                }
            }

            // --- DESKTOP / FALLBACK FLOW ---
            // A. Copy photo to clipboard (so customer can simply Ctrl + V into WhatsApp)
            let isCopied = false;
            if (navigator.clipboard && window.ClipboardItem && imgEl) {
                isCopied = await copyImageElementToClipboard(imgEl, imgSrc);
            }

            // B. Show dedicated WhatsApp guidance modal
            showWhatsAppModal({
                imgSrc: imgSrc,
                filename: filename,
                title: cardTitle,
                inquiryText: inquiryText,
                targetWaUrl: targetWaUrl,
                copied: isCopied
            });
        });
    });
}

// Helper: Fetch image as blob with canvas fallback
async function fetchImageBlob(imgEl, imgSrc) {
    try {
        const res = await fetch(imgSrc);
        if (res.ok) {
            return await res.blob();
        }
    } catch (e) {
        // Fallback to canvas conversion
    }

    if (imgEl && imgEl.complete) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = imgEl.naturalWidth || imgEl.width || 500;
            canvas.height = imgEl.naturalHeight || imgEl.height || 500;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgEl, 0, 0);
            return await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        } catch (e) {}
    }
    return null;
}

// Helper: Copy image to clipboard using ClipboardItem Promise (preserves user gesture)
async function copyImageElementToClipboard(imgEl, imgSrc) {
    if (!navigator.clipboard || !window.ClipboardItem) return false;

    try {
        const pngPromise = new Promise(async (resolve, reject) => {
            try {
                // If image already loaded in DOM, draw to canvas
                if (imgEl && imgEl.complete) {
                    const canvas = document.createElement('canvas');
                    canvas.width = imgEl.naturalWidth || imgEl.width || 600;
                    canvas.height = imgEl.naturalHeight || imgEl.height || 600;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(imgEl, 0, 0);
                    canvas.toBlob(blob => {
                        if (blob) resolve(blob);
                        else reject(new Error('Canvas blob failed'));
                    }, 'image/png');
                    return;
                }

                // Otherwise fetch
                const res = await fetch(imgSrc);
                const blob = await res.blob();
                resolve(blob);
            } catch (err) {
                reject(err);
            }
        });

        const item = new ClipboardItem({ 'image/png': pngPromise });
        await navigator.clipboard.write([item]);
        return true;
    } catch (err) {
        console.warn('Clipboard write fallback:', err);
        return false;
    }
}

// Helper: Render interactive WhatsApp modal
function showWhatsAppModal({ imgSrc, filename, title, inquiryText, targetWaUrl, copied }) {
    let overlay = document.getElementById('wa-design-modal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'wa-design-modal';
        overlay.className = 'wa-modal-overlay';
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div class="wa-modal-card">
            <div class="wa-modal-header">
                <div class="wa-modal-title">
                    <i class="fa-brands fa-whatsapp"></i>
                    <span>Send Design to WhatsApp</span>
                </div>
                <button class="wa-modal-close" aria-label="Close modal">&times;</button>
            </div>
            <div class="wa-modal-body">
                <div class="wa-modal-thumb-box">
                    <img src="${imgSrc}" alt="${title}">
                </div>
                <div class="wa-modal-details">
                    <h4>${title}</h4>
                    <p class="wa-modal-filename">Photo Ref: <code>${filename}</code></p>
                    <div class="wa-modal-badge ${copied ? 'copied' : ''}">
                        <i class="fa-solid ${copied ? 'fa-circle-check' : 'fa-camera'}"></i>
                        <span>${copied ? 'Design photo copied to clipboard!' : 'Ready to send on WhatsApp'}</span>
                    </div>
                    <p class="wa-modal-hint">
                        ${copied 
                            ? 'When WhatsApp opens, simply press <b>Ctrl + V</b> (or Right Click &rarr; Paste) to attach and send the photo!' 
                            : 'Send this design to us on WhatsApp for pricing and custom sizes!'}
                    </p>
                </div>
            </div>
            <div class="wa-modal-footer">
                <a href="${targetWaUrl}" target="_blank" class="wa-modal-btn-open" id="wa-modal-open-btn">
                    <i class="fa-brands fa-whatsapp"></i> Open WhatsApp Chat
                </a>
                <a href="${imgSrc}" download="${filename}" class="wa-modal-btn-dl" title="Save image to your computer">
                    <i class="fa-solid fa-download"></i> Save Photo
                </a>
            </div>
        </div>
    `;

    overlay.classList.add('active');

    // Close on click outside or close button
    const closeBtn = overlay.querySelector('.wa-modal-close');
    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });

    // Auto-open WhatsApp chat after a short pause so user sees the modal confirmation
    const openBtn = overlay.querySelector('#wa-modal-open-btn');
    openBtn.addEventListener('click', () => {
        setTimeout(() => overlay.classList.remove('active'), 1000);
    });

    // Also automatically open WhatsApp after 900ms for seamless 1-click experience
    setTimeout(() => {
        if (overlay.classList.contains('active')) {
            window.open(targetWaUrl, '_blank');
        }
    }, 900);
}

