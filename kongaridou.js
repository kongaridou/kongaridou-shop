// ------------------------------------------------------------------
// ヘッダーの出現制御／フェードインセクションの出現制御
// ------------------------------------------------------------------
$(function () {
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


// ------------------------------------------------------------------
// ページ内リンク(#で始まるa)をクリックした時、加減速しながらスクロールする
// ------------------------------------------------------------------
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
        var headerOffset = 100;
        var targetY = target.getBoundingClientRect().top + window.scrollY - headerOffset;
        smoothScrollTo(targetY, 900);
    });
}


// ------------------------------------------------------------------
// 目次(about-toc)を SITE_CONFIG.menu から自動生成する
// ------------------------------------------------------------------
function renderAboutToc() {
    var list = document.getElementById('aboutTocList');
    if (!list) return;

    var items = (window.SITE_CONFIG && window.SITE_CONFIG.menu) || [];

    function resolveLink(item) {
        return item.link || '#';
    }

    list.innerHTML = items.map(function (item) {
        return '<li><a href="' + resolveLink(item) + '">' + item.label + '</a></li>';
    }).join('');
}

// ------------------------------------------------------------------
// トップページ reveal セクションのクリックリンク
// （ページをまたぐ移動なので aboutPageURL + #id をその場で組み立てる）
// ------------------------------------------------------------------
function initRevealLinks() {
    var sections = document.querySelectorAll('.n-reveal-section[data-link]');
    var base = (window.SITE_CONFIG && window.SITE_CONFIG.aboutPageURL) || '';
    sections.forEach(function (sec) {
        var key = sec.getAttribute('data-link');
        if (key) {
            sec.addEventListener('click', function () {
                window.location.href = base + '#' + key;
            });
        }
    });
}


// ------------------------------------------------------------------
// 「背景は普通にスクロール、中身だけゆっくり遅れる」パラレックス
// ------------------------------------------------------------------

function initSlowFollow(selector, speedFactor) {
    var els = document.querySelectorAll(selector);
    if (els.length === 0) return;

    var baseTops = [];
    var ticking = false;
    var mobileBreakpoint = 760;

    function isMobile() {
        return window.innerWidth <= mobileBreakpoint;
    }

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
        if (isMobile()) {
            els.forEach(function (el) {
                el.style.transform = 'none';
            });
            ticking = false;
            return;
        }
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
// NEWSカルーセル（Swiper.js／カバーフローエフェクト）
// ------------------------------------------------------------------

function initNewsCarousel() {
    var items = (window.SITE_CONFIG && window.SITE_CONFIG.news) || [];
    var wrapper = document.getElementById('newsSwiperWrapper');
    if (!wrapper || items.length === 0 || typeof Swiper === 'undefined') return;

    var uniqueCount = items.length;
    var minSlides = 8; 
    var paddedItems = items.slice();
    while (paddedItems.length < minSlides) {
        paddedItems = paddedItems.concat(items);
    }

    wrapper.innerHTML = paddedItems.map(function (item) {
        var img = '<img src="' + item.image + '" alt="">';
        var inner = item.link
            ? '<a class="n-news__link" href="' + item.link + '">' + img + '</a>'
            : img;
        return '<div class="swiper-slide n-news__banner">' + inner + '</div>';
    }).join('');

    var swiper = new Swiper('.n-news-swiper', {
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        loop: true,
        coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 90,
            modifier: 1,
            slideShadows: false
        },
        navigation: {
            nextEl: '.n-news__next',
            prevEl: '.n-news__prev'
        },
        autoplay: {
            delay: 3500,
            disableOnInteraction: false
        }
    });

    // 〇は「水増しした枚数」ではなく「本当の件数」ぶんだけ作る
    var pagEl = document.querySelector('.n-news__pagination');
    if (pagEl) {
        pagEl.innerHTML = items.map(function (item, i) {
            return '<span class="n-news__dot" data-index="' + i + '"></span>';
        }).join('');

        var dots = pagEl.querySelectorAll('.n-news__dot');

        function setActiveDot() {
            var current = swiper.realIndex % uniqueCount;
            dots.forEach(function (dot, i) {
                dot.classList.toggle('is-active', i === current);
            });
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                var idx = parseInt(dot.getAttribute('data-index'), 10);
                swiper.slideToLoop(idx);
            });
        });

        swiper.on('slideChange', setActiveDot);
        setActiveDot();
    }
}

// ------------------------------------------------------------------
// グッズの種類・布の種類のカードを並べる
// ------------------------------------------------------------------
function renderCardGrid(containerId, items) {
    var container = document.getElementById(containerId);
    if (!container || !items) return;

    container.innerHTML = items.map(function (html) {
        return '<div class="about-card">' + html + '</div>';
    }).join('');
}


// ------------------------------------------------------------------
// カード内の画像を拡大表示（BASE標準のColorboxを使用）
// ------------------------------------------------------------------
function initAboutLightbox() {
    if (typeof $ === 'undefined' || !$.fn.colorbox) return;
    $('.about-lightbox').colorbox({ maxWidth: '90%', maxHeight: '90%' });
}


// ------------------------------------------------------------------
// ABOUTページ各セクション本文(SITE_CONFIG.sections)の描画
// ------------------------------------------------------------------
function renderSections() {
    var sections = (window.SITE_CONFIG && window.SITE_CONFIG.sections) || {};
    Object.keys(sections).forEach(function (key) {
        var el = document.getElementById('section-' + key);
        if (el) el.innerHTML = sections[key];
    });
}


// ------------------------------------------------------------------
// タペストリーメニュー本体
// ・SITE_CONFIG.menu から中身を描画
// ・ドラッグで移動（画面外には出せない）
// ・ウィンドウリサイズで画面外に出たら位置を戻す
// ------------------------------------------------------------------
function initTapestryMenu() {
    var el = document.getElementById('tapestryMenu');
    var body = document.getElementById('tapestryMenuBody');
    var toggle = document.getElementById('menuToggle');

    if (!el || !body) {
        // このページにはタペストリーが無いので、赤いボタン自体を隠す
        if (toggle) toggle.style.display = 'none';
        return;
    }

    var items = (window.SITE_CONFIG && window.SITE_CONFIG.menu) || [];

    function resolveLink(item) {
        var link = item.link || '#';
        if (link.indexOf('#') === 0) {
            var isAboutPage = document.querySelector('.about-block[id]') !== null;
            if (!isAboutPage) {
                var base = (window.SITE_CONFIG && window.SITE_CONFIG.aboutPageURL) || '';
                return base + link;
            }
        }
        return link;
    }

    function keyOf(item) {
        var href = item.link || '#';
        return href.indexOf('#') === 0 ? href.slice(1) : null;
    }

    body.innerHTML = items.map(function (item) {
        var key = keyOf(item);
        return '<div class="tapestry-menu__item"' + (key ? ' data-key="' + key + '"' : '') + '>' +
            '<a href="' + resolveLink(item) + '">' + item.label + '</a>' +
            '</div>';
    }).join('');


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
        var contentWidth = 960; // サイト本体の幅
        var gap = 20; // 本体との隙間
        var contentLeftEdge = (window.innerWidth - contentWidth) / 2;
        var targetLeft = contentLeftEdge - el.offsetWidth - gap;
        applyPosition(targetLeft, 80);
        el.style.transform = 'none';
    }

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
        applyPosition(initialLeft, initialTop);
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
        applyPosition(rect.left, rect.top);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchend', onUp);
    }

    el.addEventListener('mousedown', onDown);
    el.addEventListener('touchstart', onDown, { passive: true });

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

    // スマホでは位置をJSで計算しない（CSSの「下からせり出す」指定に任せる）
    if (window.innerWidth > 760) {
        resetPosition();
    }

    if (toggle) {
        toggle.addEventListener('click', function () {
            el.classList.toggle('is-open');
        });
    }
}


// ------------------------------------------------------------------
// タペストリーメニュー：今見ているセクションのハイライトと副題の出し入れ
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


    function extractSubItems(sectionId) {
        var section = document.getElementById(sectionId);
        if (!section) return [];

        var headings = section.querySelectorAll('h2, h3, h4');
        return Array.prototype.map.call(headings, function (h, index) {
            if (!h.id) {
                h.id = sectionId + '-sub' + index;
            }
            return { label: h.textContent, link: '#' + h.id, level: h.tagName.toLowerCase() };
        });
    }

    var subMap = {};
    menuConfig.forEach(function (item) {
        var key = (item.link && item.link.indexOf('#') === 0) ? item.link.slice(1) : null;
        if (!key) return;

        var items = item.sub || (item.autoSub ? extractSubItems(key) : null);
        if (items && items.length) {
            subMap[key] = items;
        }
    });

function markCurrent(link) {
        if (link._isCurrent) return; // すでにアクティブなら何もしない（ここが今回の本命）
        link._isCurrent = true;

        if (link._unmarkTimer) {
            clearTimeout(link._unmarkTimer);
            link._unmarkTimer = null;
        }
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
        if (!link._isCurrent) return; // すでに非アクティブなら何もしない
        link._isCurrent = false;

        link.style.transition = 'border-bottom-color 0.35s ease';
        link.style.borderBottomColor = 'rgba(255,255,255,0)';
        link._unmarkTimer = setTimeout(function () {
            link.style.fontWeight = '';
            link.style.borderBottom = '';
            link.style.paddingBottom = '';
            link.style.transition = '';
            link._unmarkTimer = null;
        }, 350);
    }

    function buildSubList(key) {
        var ul = document.createElement('ul');
        ul.className = 'tapestry-menu__sub';
        ul.style.listStyle = 'none';
        ul.style.margin = '6px 0 0';
        ul.style.paddingLeft = '0';
        ul.style.overflow = 'hidden';
        ul.style.opacity = '0';
        ul.style.maxHeight = '0px';
        ul.style.transition = 'opacity 0.35s ease, max-height 0.35s ease';
        ul.innerHTML = subMap[key].map(function (s) {
            var isH2 = s.level === 'h2';
            var liStyle = isH2
                ? 'margin-bottom:6px; padding-left:0;'
                : 'margin-bottom:6px; padding-left:12px; border-left:1px solid rgba(255,255,255,0.45);';
            var linkStyle = 'color:rgba(255,255,255,0.85);font-size:0.75rem;text-decoration:none;font-family:var(--font-sub);'
                + (isH2 ? 'font-weight:bold;' : '');
            return '<li style="' + liStyle + '">' +
                '<a href="' + (s.link || '#') + '" style="' + linkStyle + '">' +
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
                if (!sub && subMap[key] && subMap[key].length) {
                    var newSub = buildSubList(key);
                    itemEl.appendChild(newSub);
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

    // 現在「交差している」全セクションを覚えておき、
    // その中から画面中央に一番近いものを毎回選び直す
    var ticking = false;
    var currentActiveId = null;

    function updateActive() {
        var viewportCenter = window.innerHeight / 2;
        var bestId = null;

        // セクション自体の中心ではなく、「画面中央の高さに、今実際に
        // 重なっているセクションはどれか」を直接調べる方式に変更。
        // 背の高いセクション・低いセクションが混在していても正確に判定できる。
        sections.forEach(function (sec) {
            var rect = sec.getBoundingClientRect();
            if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
                bestId = sec.id;
            }
        });

        if (bestId && bestId !== currentActiveId) {
            currentActiveId = bestId;
            setActive(bestId);
        }
        ticking = false;
    }


    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(updateActive);
            ticking = true;
        }
    }, { passive: true });

    updateActive();
}

function initLogoRandomImage(){
  var images = (window.SITE_CONFIG && window.SITE_CONFIG.logoRandomImages) || [];
  var img = document.getElementById('logoRandomImg');
  if(!img || images.length === 0) return;
  var idx = Math.floor(Math.random() * images.length);
  img.src = images[idx];
}

// ------------------------------------------------------------------
// ブログ記事：ページ内検索
// ・本文に「【検索】」と書いた行があるときだけ動きます
// ・その行を検索欄に置き換えます（【検索】のあとに書いた文字は、入力欄の説明文になります）
// ・太字の質問から、次の太字の質問の手前までを「1組」として、入力した言葉で絞り込みます
// ------------------------------------------------------------------
function initBlogSearch() {
    var MARK = '【検索】';
    var bodies = document.querySelectorAll('.blog_body');
    if (bodies.length === 0) return;

    // 全角・半角、大文字・小文字、カタカナ・ひらがなの違いを無視して比べる
    function norm(s) {
        return (s || '').normalize('NFKC').toLowerCase().replace(/\s+/g, '')
            .replace(/[\u30a1-\u30f6]/g, function (c) {
                return String.fromCharCode(c.charCodeAt(0) - 0x60);
            });
    }

    var BLOCK = /^(P|DIV|H[1-6]|UL|OL|HR|TABLE|BLOCKQUOTE|FIGURE|IMG)$/;

    function skipBlank(node, dir) {
        var n = node[dir];
        while (n && n.nodeType === 3 && !n.nodeValue.trim()) n = n[dir];
        return n;
    }
    function isLineEdge(n) {
        return !n || n.nodeName === 'BR' || (n.nodeType === 1 && BLOCK.test(n.nodeName));
    }

    // 「質問の行」かどうか（行まるごとが太字・見出しのもの）
    function isQuestion(n) {
        if (n.nodeType !== 1) return false;
        var text = n.textContent.replace(/\s+/g, '');
        if (!text) return false;
        if (/^(B|STRONG)$/.test(n.nodeName)) {
            return isLineEdge(skipBlank(n, 'previousSibling')) && isLineEdge(skipBlank(n, 'nextSibling'));
        }
        if (/^H[2-6]$/.test(n.nodeName)) return true;
        if (/^(P|DIV|SPAN)$/.test(n.nodeName)) {
            var b = n.querySelector('b, strong, h2, h3, h4, h5, h6');
            return !!b && b.textContent.replace(/\s+/g, '') === text;
        }
        return false;
    }

    function findMarker(body) {
        var walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
        var n;
        while ((n = walker.nextNode())) {
            if (n.nodeValue.indexOf(MARK) !== -1) return n;
        }
        return null;
    }

    Array.prototype.forEach.call(bodies, function (body) {
        var textNode = findMarker(body);
        if (!textNode) return;

        var value = textNode.nodeValue;
        var label = value.slice(value.indexOf(MARK) + MARK.length).trim();

        // 【検索】の「行」を決める（短いp・divなら、その要素ごと。そうでなければ文字だけ）
        var line = textNode;
        while (line.parentNode && line.parentNode !== body &&
               line.parentNode.textContent.replace(/\s/g, '').length <= 80) {
            line = line.parentNode;
        }
        var container = line.parentNode;

        // 検索欄をつくる
        var box = document.createElement('div');
        box.className = 'kd-search';
        box.innerHTML =
            '<div class="kd-search__inner">' +
              '<input type="text" class="kd-search__input" inputmode="search" enterkeyhint="search" ' +
                     'autocomplete="off" aria-label="このページ内を検索">' +
              '<button type="button" class="kd-search__clear" aria-label="入力を消す" hidden>×</button>' +
            '</div>' +
            '<p class="kd-search__count" aria-live="polite"></p>';
        var input = box.querySelector('.kd-search__input');
        var clear = box.querySelector('.kd-search__clear');
        var count = box.querySelector('.kd-search__count');
        input.placeholder = label || '気になる言葉を入力してください';

        // 置き換え（直後の<br>も消す）
        var after = line.nextSibling;
        container.insertBefore(box, line);
        if (after && after.nodeName === 'BR') container.removeChild(after);
        container.removeChild(line);

        // 質問ごとの「1組」をつくる
        var nodes = Array.prototype.slice.call(container.childNodes, Array.prototype.indexOf.call(container.childNodes, box) + 1);
        var groups = [];
        var current = null;
        var flags = nodes.map(isQuestion);
        nodes.forEach(function (n, i) {
            if (flags[i]) {
                current = document.createElement('div');
                current.className = 'kd-qa-item';
                container.insertBefore(current, n);
                groups.push(current);
            }
            if (current) current.appendChild(n);
        });
        if (groups.length === 0) return;

        var texts = groups.map(function (g) { return norm(g.textContent); });

        function apply() {
            var terms = input.value.normalize('NFKC').split(/\s+/).map(norm).filter(Boolean);
            var shown = 0;
            groups.forEach(function (g, i) {
                var ok = terms.every(function (t) { return texts[i].indexOf(t) !== -1; });
                g.classList.toggle('kd-qa-hidden', !ok);
                if (ok) shown++;
            });
            clear.hidden = input.value === '';
            if (terms.length === 0) {
                count.textContent = '';
            } else if (shown === 0) {
                count.textContent = '見つかりませんでした。別の言葉でお試しください。';
            } else {
                count.textContent = shown + '件見つかりました';
            }
        }

        input.addEventListener('input', apply);
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') input.blur();
        });
        clear.addEventListener('click', function () {
            input.value = '';
            apply();
            input.focus();
        });

        // 固定ヘッダーが出ているときは、その下にくっつける
        var header = document.querySelector('.site-header');
        function placeBox() {
            var h = (header && header.classList.contains('is-visible')) ? header.offsetHeight : 0;
            box.style.top = h + 'px';
        }
        if (header && window.MutationObserver) {
            new MutationObserver(placeBox).observe(header, { attributes: true, attributeFilter: ['class'] });
        }
        window.addEventListener('resize', placeBox);
        placeBox();
    });
}

// ------------------------------------------------------------------
// ブログ記事：《言葉》を、自動でリンクにする
// ------------------------------------------------------------------
function initBlogAutoLinks() {
    var links = (window.SITE_CONFIG && window.SITE_CONFIG.autoLinks) || {};
    var bodies = document.querySelectorAll('.blog_body');
    if (bodies.length === 0) return;

    var PATTERN = /《([^《》|｜]+?)(?:[|｜]([^《》]+?))?》/g;
    var SKIP = /^(A|SCRIPT|STYLE|TEXTAREA|BUTTON|INPUT)$/;

    function resolve(key) {
        key = key.trim();
        return Object.prototype.hasOwnProperty.call(links, key) ? links[key] : null;
    }

    Array.prototype.forEach.call(bodies, function (body) {
        // 先に対象の文字を集めてから書き換える（歩きながら書き換えないため）
        var walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
            acceptNode: function (n) {
                if (n.nodeValue.indexOf('《') === -1) return NodeFilter.FILTER_REJECT;
                for (var p = n.parentNode; p && p !== body; p = p.parentNode) {
                    if (SKIP.test(p.nodeName)) return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        var targets = [];
        var n;
        while ((n = walker.nextNode())) targets.push(n);

        targets.forEach(function (node) {
            var text = node.nodeValue;
            var frag = document.createDocumentFragment();
            var last = 0;
            var changed = false;
            var m;
            PATTERN.lastIndex = 0;
            while ((m = PATTERN.exec(text))) {
                // 《表示する文字|登録名》 のときは、右側が登録名
                var label = m[1].trim();
                var key = m[2] ? m[2] : m[1];
                var url = resolve(key);
                if (!url) continue;
                frag.appendChild(document.createTextNode(text.slice(last, m.index)));
                var a = document.createElement('a');
                a.href = url;
                a.textContent = label;
                frag.appendChild(a);
                last = m.index + m[0].length;
                changed = true;
            }
            if (!changed) return;
            frag.appendChild(document.createTextNode(text.slice(last)));
            node.parentNode.replaceChild(frag, node);
        });
    });
}


// ------------------------------------------------------------------
// ページ読み込み完了後に、上記の初期化関数をすべて実行
// ------------------------------------------------------------------
$(document).ready(function () {    
    initLogoRandomImage();
    initBlogAutoLinks();
    initBlogSearch();
    initNewsCarousel();
    renderSections();
    renderCardGrid('goodsTypesGrid', window.SITE_CONFIG.goodsTypes);
    renderCardGrid('fabricTypesGrid', window.SITE_CONFIG.fabricTypes);
    renderAboutToc();
    initRevealLinks();
    initSmoothAnchors();
    initSlowFollow('.n-reveal-follow', 0.68);
    initAboutLightbox();
    initTapestryMenu();
    initTapestryScrollSpy();
});
