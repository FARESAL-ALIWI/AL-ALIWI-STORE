document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const rightSidebar = document.getElementById('right-sidebar');
    const closeMenu = document.getElementById('close-menu');
    const cartToggle = document.getElementById('cart-toggle');
    const leftSidebar = document.getElementById('left-sidebar');
    const closeCart = document.getElementById('close-cart');
    const overlay = document.getElementById('overlay');
    const cartContent = document.getElementById("cart-preview-content");
    const cartTotal = document.getElementById("cart-preview-total");
    const cartBadge = document.querySelector(".cart-badge");
    function openSidebar(sidebar) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeSidebars() {
        rightSidebar.classList.remove('active');
        leftSidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    menuToggle?.addEventListener('click', () => openSidebar(rightSidebar));
    cartToggle?.addEventListener('click', () => openSidebar(leftSidebar));
    closeMenu?.addEventListener('click', closeSidebars);
    closeCart?.addEventListener('click', closeSidebars);
    overlay?.addEventListener('click', closeSidebars);

    document.body.addEventListener('click', function(e){
        const btn = e.target.closest('.add-to-cart-btn');
        if(!btn) return;

        e.preventDefault();

        const card = btn.closest('.card') || btn.closest('.Acard');
        if(!card) return;

        const productId = card.getAttribute('data-id');
        const name = card.getAttribute('data-name') || card.querySelector('h3')?.textContent?.trim();
        const price = parseFloat(card.getAttribute('data-price') || card.querySelector('p')?.textContent?.replace('$','').trim() || 0);
        const image = card.getAttribute('data-image') || card.querySelector('img')?.getAttribute('src')?.split('/').pop();

        // Try server add when CSRF token is available
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        if (csrfMeta && csrfMeta.getAttribute('content')) {
            fetch('/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfMeta.getAttribute('content'),
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ id: productId, qty: 1 })
            })
            .then(res => {
                if (!res.ok) throw new Error(res.status);
                return res.json();
            })
            .then(data => {
                if(data.success){
                    updateCartPreview(data.cart);
                    openSidebar(leftSidebar);
                }
            })
            .catch(err => {
                console.error('Fetch error:', err);
                // fallback to local cart
                addToLocalCart(productId, name, price, image);
                openSidebar(leftSidebar);
            });
        } else {
            // No CSRF token — use localStorage cart fallback
            addToLocalCart(productId, name, price, image);
            openSidebar(leftSidebar);
        }
    });

    function addToLocalCart(id, name, price, image) {
        if (!id) id = 'local_' + Date.now();
        const raw = localStorage.getItem('local_cart');
        let cart = raw ? JSON.parse(raw) : {};

        if (!cart[id]) {
            cart[id] = { id, name: name || 'Product', price: price || 0, qty: 1, image: image || '' };
        } else {
            cart[id].qty = (cart[id].qty || 0) + 1;
        }

        localStorage.setItem('local_cart', JSON.stringify(cart));
        updateCartPreview(cart);
    }


    // Function to update cart preview
    function updateCartPreview(cart) {
        if (!cartContent) return;

        if (cart && Object.keys(cart).length > 0) {
            cartContent.innerHTML = '';
            let total = 0;
            let itemCount = 0;

            Object.values(cart).forEach(item => {
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <img src="/images/products/${item.image || 'default.png'}" width="50" style="margin-right:8px;">
                    <span class="item-name">${item.name} (x${item.qty})</span>
                    <span class="item-price">${item.price * item.qty}</span>
                `;
                cartContent.appendChild(div);
                total += item.price * item.qty;
                itemCount++;
            });

            if (cartTotal) cartTotal.textContent = total + '$';
            if (cartBadge) cartBadge.textContent = itemCount;
        }
    }


    // Initialize sliders scoped to their container to avoid mixing multiple sliders on the page
    function initScopedSlider(container) {
        const slides = container.querySelectorAll('.slide');
        const dots = container.querySelectorAll('.dot');
        const prevBtn = container.querySelector('.prev-btn');
        const nextBtn = container.querySelector('.next-btn');
        let current = 0;
        let interval;

        function show(n) {
            slides.forEach(s => s.classList.remove('active'));
            dots.forEach(d => d.classList.remove('active'));
            if (slides.length === 0) return;
            current = (n + slides.length) % slides.length;
            if (slides[current]) slides[current].classList.add('active');
            if (dots[current]) dots[current].classList.add('active');
        }

        function change(n) { show(current + n); reset(); }
        function to(n) { show(n); reset(); }

        function start() { interval = setInterval(() => change(1), 5000); }
        function reset() { clearInterval(interval); start(); }

        if (nextBtn) nextBtn.addEventListener('click', () => change(1));
        if (prevBtn) prevBtn.addEventListener('click', () => change(-1));
        dots.forEach((dot, i) => dot.addEventListener('click', () => to(i)));

        if (slides.length > 0) { show(0); start(); }
    }

    // Find each slider section and initialize independently
    const sliderContainers = document.querySelectorAll('.slider-container, .New-slider');
    sliderContainers.forEach(container => initScopedSlider(container));
});
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    let currentSlide = 0;
    let slideInterval;

    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        if (n >= slides.length) {
            currentSlide = 0;
        } else if (n < 0) {
            currentSlide = slides.length - 1;
        } else {
            currentSlide = n;
        }

        if (slides[currentSlide]) slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }

    function changeSlide(n) {
        showSlide(currentSlide + n);
        resetInterval();
    }

    function currentDot(n) {
        showSlide(n);
        resetInterval();
    }

    function startInterval() {
        slideInterval = setInterval(() => {
            changeSlide(1);
        }, 5000);
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }

    if (nextBtn) nextBtn.addEventListener('click', () => changeSlide(1));
    if (prevBtn) prevBtn.addEventListener('click', () => changeSlide(-1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => currentDot(index)));

    if (slides.length > 0) {
        showSlide(currentSlide);
        startInterval();
    }

//swiper
    document.addEventListener('DOMContentLoaded', function () {
        const swiper = new Swiper('.testimonials-slider', {
            // الإعدادات الأساسية
            loop: true, // يجعل السلايدر يلف بشكل لا نهائي

            // الحركة التلقائية
            autoplay: {
                delay: 3000, // الوقت بالمللي ثانية (3 ثواني)
                disableOnInteraction: false, // لا يوقف الحركة التلقائية عند تفاعل المستخدم
            },

            // عدد البطاقات المعروضة (Responsive)
            slidesPerView: 1, // عرض بطاقة واحدة في الشاشات الصغيرة جدًا
            spaceBetween: 20, // المسافة بين البطاقات

            breakpoints: {
                // عندما يكون عرض الشاشة 576px أو أكثر
                576: {
                    slidesPerView: 2,
                    spaceBetween: 20
                },
                // عندما يكون عرض الشاشة 768px أو أكثر
                768: {
                    slidesPerView: 2,
                    spaceBetween: 30,
                },
                // عندما يكون عرض الشاشة 992px أو أكثر
                992: {
                    slidesPerView: 2,
                    spaceBetween: 30
                },
                // عندما يكون عرض الشاشة 1200px أو أكثر (لتحقيق طلبك بـ 6 بطاقات)
                1200: {
                    slidesPerView: 3,
                    spaceBetween: 20
                }
            },

            // (اختياري) تفعيل أزرار ونقاط التنقل
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
        });
    });

