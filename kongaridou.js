// ------------------------------------------------------------------
// 1. ヘッダーの出現制御／フェードインセクションの出現制御
// ------------------------------------------------------------------
$(function () {
    // ヘッダーの出現制御
    var $header = $('.site-header');
    var revealThreshold = $(window).height() * 0.5;

    function onScroll() {
        if ($(window).scrollTop() > revealThreshold) {
            $header.addClass('is-visible');
        } else {
            $header.removeClass('is-visible');
        }
    }
    $(window).on('scroll', onScroll);
    onScroll();

    // フェードインセクションの出現制御
    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        document.querySelectorAll('.n-reveal, .n-reveal-inner').forEach(function (el) {
            io.observe(el);
        });
    } else {
        document.querySelectorAll('.n-reveal, .n-reveal-inner').forEach(function (el) {
            el.classList.add('is-visible');
        });
    }
});


// ページ内リンク(#で始まるa)をクリックした時、加減速しながらスクロールする
function smoothScrollTo(targetY, duration) {
    var startY = window.scrollY;
    var diff = targetY - startY;
    var startTime = performance.now();

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(currentTime) {
        var elapsed = currentTime - startTime;
        var progress = Math.min(elapsed / duration, 1);
        window.scrollTo(0, startY + diff * easeInOutCubic(progress));
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    }
    requestAnimationFrame(step);
}

function initSmoothAnchors() {
    document.addEventListener('click', function (e) {
        var a = e.target.closest('a[href^="#"]');
        if (!a) return;
        var id = a.getAttribute('href').slice(1);
        if (!id) return;
        var target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();
        var headerOffset = 100; // 固定ヘッダー分の余白
        var targetY = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        smoothScrollTo(targetY, 900); // 900ミリ秒かけて移動
    });
}

// ------------------------------------------------------------------
// 目次(about-toc)を SITE_CONFIG.menu から自動生成する
// ------------------------------------------------------------------
function renderAboutToc() {
    var list = document.getElementById('aboutTocList');
    if (!list) return;

    var items = (window.SITE_CONFIG && window.SITE_CONFIG.menu) || [];
    var links = (window.SITE_CONFIG && window.SITE_CONFIG.links) || {};

    function resolveLink(item) {
        if (item.linkKey) return links[item.linkKey] || '#';
        return item.link || '#';
    }

    list.innerHTML = items.map(function (item) {
        return '<li><a href="' + resolveLink(item) + '">' + item.label + '</a></li>';
    }).join('');
}
// ------------------------------------------------------------------
// 2. トップページ reveal セクションのクリックリンク
// ------------------------------------------------------------------
function initRevealLinks() {
    var sections = document.querySelectorAll('.n-reveal-section[data-link]');
    sections.forEach(function (sec) {
        var key = sec.getAttribute('data-link');
        var url = window.SITE_CONFIG && window.SITE_CONFIG.links && window.SITE_CONFIG.links[key];
        if (url) {
            sec.addEventListener('click', function () {
                window.location.href = url;
            });
        }
    });
}


// ------------------------------------------------------------------
// 3. ABOUTページ 目次(about-toc)の外部リンク設定
// ------------------------------------------------------------------
function initTocLinks() {
    document.querySelectorAll('.about-toc a[data-link]').forEach(function (a) {
        var key = a.getAttribute('data-link');
        var url = window.SITE_CONFIG && window.SITE_CONFIG.links && window.SITE_CONFIG.links[key];
        if (url) a.href = url;
    });
}


// ------------------------------------------------------------------
// 4. 「背景は普通にスクロール、中身だけゆっくり遅れる」パラレックス
// ------------------------------------------------------------------
function initSlowFollow(selector, speedFactor) {
    var els = document.querySelectorAll(selector);
    if (els.length === 0) return;

    var baseTops = [];
    var ticking = false;

    function measure() {
        baseTops = Array.prototype.map.call(els, function (el) {
            var prevTransform = el.style.transform;
            el.style.transform = 'none';
            var top = el.getBoundingClientRect().top + window.scrollY;
            el.style.transform = prevTransform;
            return top;
        });
    }

    function update() {
        var scrollY = window.scrollY;
        els.forEach(function (el, i) {
            var naturalTop = baseTops[i] - scrollY;
            var move = -naturalTop * (1 - speedFactor);
            el.style.transform = 'translateY(' + move + 'px)';
        });
        ticking = false;
    }

    measure();
    update();

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    window.addEventListener('resize', function () {
        measure();
        update();
    });
}


// ------------------------------------------------------------------
// 5. NEWSカルーセル（Swiper.js／カバーフローエフェクト）
// ------------------------------------------------------------------
function initNewsCarousel() {
    var items = (window.SITE_CONFIG && window.SITE_CONFIG.news) || [];
    var wrapper = document.getElementById('newsSwiperWrapper');
    if (!wrapper || items.length === 0 || typeof Swiper === 'undefined') return;

    // バナーが少なくても自然にループするよう、必要な分だけ仮想的に複製する
    var minSlides = 8;
    var loopItems = items.slice();
    while (loopItems.length < minSlides) {
        loopItems = loopItems.concat(items);
    }

    wrapper.innerHTML = loopItems.map(function (item) {
        var img = '<img src="' + item.image + '" alt="">';
        var inner = item.link
            ? '<a class="n-news__link" href="' + item.link + '">' + img + '</a>'
            : img;
        return '<div class="swiper-slide n-news__banner">' + inner + '</div>';
    }).join('');

    new Swiper('.n-news-swiper', {
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        loop: true,
        coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 150,
            modifier: 1,
            slideShadows: false
        },
        navigation: {
            nextEl: '.n-news__next',
            prevEl: '.n-news__prev'
        }
    });
}


// ------------------------------------------------------------------
// 6. グッズの種類・布の種類のカードを並べる
// ------------------------------------------------------------------
function renderCardGrid(containerId, items) {
    var container = document.getElementById(containerId);
    if (!container || !items) return;

    container.innerHTML = items.map(function (html) {
        return '<div class="about-card">' + html + '</div>';
    }).join('');
}


// ------------------------------------------------------------------
// 7. カード内の画像を拡大表示（BASE標準のColorboxを使用）
// ------------------------------------------------------------------
function initAboutLightbox() {
    if (typeof $ === 'undefined' || !$.fn.colorbox) return;
    $('.about-lightbox').colorbox({ maxWidth: '90%', maxHeight: '90%' });
}


// ------------------------------------------------------------------
// 8. ABOUTページ各セクション本文(SITE_CONFIG.sections)の描画
// ------------------------------------------------------------------
function renderSections() {
    var sections = (window.SITE_CONFIG && window.SITE_CONFIG.sections) || {};
    Object.keys(sections).forEach(function (key) {
        var el = document.getElementById('section-' + key);
        if (el) el.innerHTML = sections[key];
    });
}


// ------------------------------------------------------------------
// 9. タペストリーメニュー本体
//    ・SITE_CONFIG.menu から中身を描画
//    ・ドラッグで移動（画面外には出せない）
//    ・ウィンドウリサイズで画面外に出たら位置を戻す
// ------------------------------------------------------------------
function initTapestryMenu() {
    var el = document.getElementById('tapestryMenu');
    var body = document.getElementById('tapestryMenuBody');
    if (!el || !body) return;

    var items = (window.SITE_CONFIG && window.SITE_CONFIG.menu) || [];
    var links = (window.SITE_CONFIG && window.SITE_CONFIG.links) || {};

    function resolveLink(item) {
        if (item.linkKey) return links[item.linkKey] || '#';
        return item.link || '#';
    }

    function keyOf(item) {
        var href = resolveLink(item);
        return href.indexOf('#') === 0 ? href.slice(1) : null;
    }

    // 副題はここでは出さない。今見ているセクションの分だけ initTapestryScrollSpy が出し入れする
    body.innerHTML = items.map(function (item) {
        var key = keyOf(item);
        return '<div class="tapestry-menu__item"' + (key ? ' data-key="' + key + '"' : '') + '>' +
            '<a href="' + resolveLink(item) + '">' + item.label + '</a>' +
            '</div>';
    }).join('');

    // ---- ドラッグ移動を画面内に収めるための位置計算 ----
    function clamp(left, top) {
        var w = el.offsetWidth;
        var h = el.offsetHeight;
        var maxLeft = Math.max(0, window.innerWidth - w);
        var maxTop = Math.max(0, window.innerHeight - h);
        return {
            left: Math.min(Math.max(left, 0), maxLeft),
            top: Math.min(Math.max(top, 0), maxTop)
        };
    }

    function applyPosition(left, top) {
        var pos = clamp(left, top);
        el.style.left = pos.left + 'px';
        el.style.top = pos.top + 'px';
    }

    function resetPosition() {
        el.style.transition = '';
        // 初期位置：画面中央よりやや左
        var targetLeft = window.innerWidth * 0.4 - el.offsetWidth / 2;
        applyPosition(targetLeft, 100);
        el.style.transform = 'none';
    }

    // ---- ドラッグ操作 ----
    var isDragging = false, startX, startY, initialLeft, initialTop;

    function onDown(e) {
        if (window.innerWidth <= 760) return;
        isDragging = true;
        var point = e.touches ? e.touches[0] : e;
        startX = point.clientX;
        startY = point.clientY;
        var rect = el.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        el.style.transition = 'none';
        el.style.transform = 'none';
        applyPosition(initialLeft, initialTop); // ワープ防止：現在位置をそのままleft/topに固定してから開始
        el.classList.add('is-dragging');
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchend', onUp);
    }

    function onMove(e) {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();
        var point = e.touches ? e.touches[0] : e;
        var dx = point.clientX - startX;
        var dy = point.clientY - startY;
        applyPosition(initialLeft + dx, initialTop + dy);
    }

    function onUp() {
        if (!isDragging) return;
        isDragging = false;
        el.classList.remove('is-dragging');
        var rect = el.getBoundingClientRect();
        applyPosition(rect.left, rect.top); // 離した瞬間にもう一度クランプをかけ直す
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchend', onUp);
    }

    el.addEventListener('mousedown', onDown);
    el.addEventListener('touchstart', onDown, { passive: true });

    // ---- リサイズで画面外に出たら戻す ----
    window.addEventListener('resize', function () {
        if (window.innerWidth <= 760) return;
        var rect = el.getBoundingClientRect();
        var offScreen = rect.right <= 0 || rect.left >= window.innerWidth ||
            rect.bottom <= 0 || rect.top >= window.innerHeight;
        if (offScreen) {
            resetPosition();
        } else {
            applyPosition(rect.left, rect.top);
        }
    });

    // 初期位置を確定
    resetPosition();

    // ---- スマホ：ハンバーガーで開閉 ----
    var toggle = document.getElementById('menuToggle');
    if (toggle) {
        toggle.addEventListener('click', function () {
            el.classList.toggle('is-open');
        });
    }
}


// ------------------------------------------------------------------
// 10. タペストリーメニュー：今見ているセクションのハイライトと副題の出し入れ
//     ・太字／下線／副題の見た目は、CSSに頼らずインラインスタイルで直接指定
// ------------------------------------------------------------------
function initTapestryScrollSpy() {
    var sections = document.querySelectorAll('.about-block[id]');
    var menuItems = document.querySelectorAll('.tapestry-menu__item[data-key]');
    if (sections.length === 0 || menuItems.length === 0) return;

    var itemMap = {};
    menuItems.forEach(function (el) {
        itemMap[el.getAttribute('data-key')] = el;
    });

    var menuConfig = (window.SITE_CONFIG && window.SITE_CONFIG.menu) || [];
    var links = (window.SITE_CONFIG && window.SITE_CONFIG.links) || {};
    var subMap = {};
    menuConfig.forEach(function (item) {
        var href = item.linkKey ? (links[item.linkKey] || '') : (item.link || '');
        var key = href.indexOf('#') === 0 ? href.slice(1) : null;
        if (key && item.sub) subMap[key] = item.sub;
    });

    function markCurrent(link) {
        link.style.fontWeight = 'bold';
        link.style.paddingBottom = '3px';
        link.style.borderBottom = '5px dotted rgba(255,255,255,0)';
        link.style.transition = 'border-bottom-color 0.35s ease';
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                link.style.borderBottomColor = 'rgba(255,255,255,1)';
            });
        });
    }

    function unmarkCurrent(link) {
        link.style.transition = 'border-bottom-color 0.35s ease';
        link.style.borderBottomColor = 'rgba(255,255,255,0)';
        setTimeout(function () {
            link.style.fontWeight = '';
            link.style.borderBottom = '';
            link.style.paddingBottom = '';
            link.style.transition = '';
        }, 350);
    }

    function buildSubList(key) {
        var ul = document.createElement('ul');
        ul.className = 'tapestry-menu__sub';
        ul.style.listStyle = 'none';
        ul.style.margin = '6px 0 0';
        ul.style.paddingLeft = '12px';
        ul.style.borderLeft = '1px solid rgba(255,255,255,0.45)';
        ul.style.overflow = 'hidden';
        // 最初は透明・高さ0にしておき、直後にふわっと表示させる
        ul.style.opacity = '0';
        ul.style.maxHeight = '0px';
        ul.style.transition = 'opacity 0.35s ease, max-height 0.35s ease';
        ul.innerHTML = subMap[key].map(function (s) {
            return '<li style="margin-bottom:6px;">' +
                '<a href="' + (s.link || '#') + '" style="color:rgba(255,255,255,0.85);font-size:0.75rem;text-decoration:none;">' +
                s.label + '</a></li>';
        }).join('');
        return ul;
    }

    function setActive(id) {
        Object.keys(itemMap).forEach(function (key) {
            var itemEl = itemMap[key];
            var link = itemEl.querySelector('a');
            var sub = itemEl.querySelector('.tapestry-menu__sub');

            if (key === id) {
                if (link) markCurrent(link);
                if (!sub && subMap[key]) {
                    var newSub = buildSubList(key);
                    itemEl.appendChild(newSub);
                    // 1フレーム後に数値を変えることで、ふわっと伸びるアニメーションを発火させる
                    requestAnimationFrame(function () {
                        requestAnimationFrame(function () {
                            newSub.style.opacity = '1';
                            newSub.style.maxHeight = '300px';
                        });
                    });
                }
            } else {
                if (link) unmarkCurrent(link);
                if (sub) sub.remove();
            }
        });
    }

    if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    setActive(entry.target.id);
                }
            });
        }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });

        sections.forEach(function (sec) {
            io.observe(sec);
        });
    }
}


// ------------------------------------------------------------------
// 11. ページ読み込み完了後に、上記の初期化関数をすべて実行
// ------------------------------------------------------------------
$(document).ready(function () {
    initNewsCarousel();
    renderAboutToc();
    initRevealLinks();
    initSmoothAnchors();
    initSlowFollow('.n-reveal-follow', 0.68);
    renderSections();
    renderCardGrid('goodsTypesGrid', window.SITE_CONFIG.goodsTypes);
    renderCardGrid('fabricTypesGrid', window.SITE_CONFIG.fabricTypes);
    initAboutLightbox();
    initTapestryMenu();
    initTapestryScrollSpy();
});
