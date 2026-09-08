$(function(){
// ヘッダーの出現制御
var $header = $('.site-header');
var revealThreshold = $(window).height() * 0.5;
function onScroll(){
    if($(window).scrollTop() > revealThreshold){
    $header.addClass('is-visible');
    }else{
    $header.removeClass('is-visible');
    }
}
$(window).on('scroll', onScroll);
onScroll();

// フェードインセクションの出現制御
if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
        if(entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll('.n-reveal, .n-reveal-inner').forEach(function(el){ io.observe(el); });
}else{
    document.querySelectorAll('.n-reveal, .n-reveal-inner').forEach(function(el){ el.classList.add('is-visible'); });
}
});

function initRevealLinks(){
var sections = document.querySelectorAll('.n-reveal-section[data-link]');
sections.forEach(function(sec){
    var key = sec.getAttribute('data-link');
    var url = window.SITE_CONFIG && window.SITE_CONFIG.links && window.SITE_CONFIG.links[key];
    if(url){
    sec.addEventListener('click', function(){
        window.location.href = url;
    });
    }
});
}

// 目次(about-toc)の中の data-link 属性から、実際のリンク先をセットする
function initTocLinks(){
document.querySelectorAll('.about-toc a[data-link]').forEach(function(a){
    var key = a.getAttribute('data-link');
    var url = window.SITE_CONFIG && window.SITE_CONFIG.links && window.SITE_CONFIG.links[key];
    if(url) a.href = url;
});
}

// 「背景は普通にスクロール、中身だけゆっくり遅れる」パラレックス
function initSlowFollow(selector, speedFactor){
var els = document.querySelectorAll(selector);
if(els.length === 0) return;
var baseTops = [];
var ticking = false;

function measure(){
    baseTops = Array.prototype.map.call(els, function(el){
    var prevTransform = el.style.transform;
    el.style.transform = 'none';
    var top = el.getBoundingClientRect().top + window.scrollY;
    el.style.transform = prevTransform;
    return top;
    });
}

function update(){
    var scrollY = window.scrollY;
    els.forEach(function(el, i){
    var naturalTop = baseTops[i] - scrollY;
    var move = -naturalTop * (1 - speedFactor);
    el.style.transform = 'translateY(' + move + 'px)';
    });
    ticking = false;
}

measure();
update();

window.addEventListener('scroll', function(){
    if(!ticking){
    window.requestAnimationFrame(update);
    ticking = true;
    }
}, { passive: true });

window.addEventListener('resize', function(){
    measure();
    update();
});
}

function initNewsCarousel(){
    var items = (window.SITE_CONFIG && window.SITE_CONFIG.news) || [];
    var wrapper = document.getElementById('newsSwiperWrapper');
    if(!wrapper || items.length === 0 || typeof Swiper === 'undefined') return;

    var minSlides = 8;
    var loopItems = items.slice();
    while(loopItems.length < minSlides){
        loopItems = loopItems.concat(items);
    }

    wrapper.innerHTML = loopItems.map(function(item){
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

// グッズの種類・布の種類など、「1枚ずつ自由なHTML」の配列を
// カードとして並べる汎用の関数。
function renderCardGrid(containerId, items){
var container = document.getElementById(containerId);
if(!container || !items) return;
container.innerHTML = items.map(function(html){
    return '<div class="about-card">' + html + '</div>';
}).join('');
}

// カード内の画像をクリックで拡大表示できるようにする（BASE標準のColorboxを使用）
function initAboutLightbox(){
if(typeof $ === 'undefined' || !$.fn.colorbox) return;
$('.about-lightbox').colorbox({ maxWidth: '90%', maxHeight: '90%' });
}

// ABOUTページの各セクション本文(SITE_CONFIG.sections)を、
// 対応する id="section-◯◯" の入れ物に流し込む
function renderSections(){
var sections = (window.SITE_CONFIG && window.SITE_CONFIG.sections) || {};
Object.keys(sections).forEach(function(key){
    var el = document.getElementById('section-' + key);
    if(el) el.innerHTML = sections[key];
});
}

// タペストリーメニュー本体の描画とドラッグ操作
function initTapestryMenu(){
var el = document.getElementById('tapestryMenu');
var body = document.getElementById('tapestryMenuBody');
if(!el || !body) return;

var items = (window.SITE_CONFIG && window.SITE_CONFIG.menu) || [];
var links = (window.SITE_CONFIG && window.SITE_CONFIG.links) || {};

function resolveLink(item){
    if(item.linkKey) return links[item.linkKey] || '#';
    return item.link || '#';
}
function keyOf(item){
    var href = resolveLink(item);
    return href.indexOf('#') === 0 ? href.slice(1) : null;
}

// 副題はここでは出さない。今見ているセクションの分だけ initTapestryScrollSpy が出し入れする
body.innerHTML = items.map(function(item){
    var key = keyOf(item);
    return '<div class="tapestry-menu__item"' + (key ? ' data-key="' + key + '"' : '') + '><a href="' + resolveLink(item) + '">' + item.label + '</a></div>';
}).join('');

function resetPosition(withAnim){
    el.style.transition = withAnim ? '' : 'none';
    el.style.left = '40%';
    el.style.top = '100px';
    el.style.transform = 'translateX(-50%)';
}

// ドラッグで自由に移動（PCのみ）。画面外へは出せない
var isDragging = false, startX, startY, initialLeft, initialTop;

function onDown(e){
    if(window.innerWidth <= 760) return;
    isDragging = true;
    var point = e.touches ? e.touches[0] : e;
    startX = point.clientX;
    startY = point.clientY;
    var rect = el.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;
    el.style.transition = 'none';
    el.style.transform = 'none';
    el.classList.add('is-dragging');
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchend', onUp);
}
function onMove(e){
    if(!isDragging) return;
    if(e.cancelable) e.preventDefault();
    var point = e.touches ? e.touches[0] : e;
    var dx = point.clientX - startX;
    var dy = point.clientY - startY;
    var maxLeft = window.innerWidth - el.offsetWidth;
    var maxTop = window.innerHeight - el.offsetHeight;
    var newLeft = Math.max(0, Math.min(initialLeft + dx, maxLeft));
    var newTop = Math.max(0, Math.min(initialTop + dy, maxTop));
    el.style.left = newLeft + 'px';
    el.style.top = newTop + 'px';
}
function onUp(){
    isDragging = false;
    el.classList.remove('is-dragging');
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchend', onUp);
}
el.addEventListener('mousedown', onDown);
el.addEventListener('touchstart', onDown, { passive: true });

// ウィンドウサイズが変わって画面外に出てしまったら、上から出し直す
window.addEventListener('resize', function(){
    if(window.innerWidth <= 760) return;
    var rect = el.getBoundingClientRect();
    var offScreen = rect.right < 40 || rect.left > window.innerWidth - 40 || rect.bottom < 40 || rect.top > window.innerHeight - 40;
    if(offScreen){
    resetPosition(false);
    }
});

// スマホ：ハンバーガーで開閉
var toggle = document.getElementById('menuToggle');
if(toggle){
    toggle.addEventListener('click', function(){
    el.classList.toggle('is-open');
    });
}
}

// 今スクロールして見ているセクションをタペストリーでハイライトし、
// そのセクションの副題だけをタペストリーに出す
function initTapestryScrollSpy(){
var sections = document.querySelectorAll('.about-block[id]');
var menuItems = document.querySelectorAll('.tapestry-menu__item[data-key]');
if(sections.length === 0 || menuItems.length === 0) return;

var itemMap = {};
menuItems.forEach(function(el){ itemMap[el.getAttribute('data-key')] = el; });

var menuConfig = (window.SITE_CONFIG && window.SITE_CONFIG.menu) || [];
var links = (window.SITE_CONFIG && window.SITE_CONFIG.links) || {};
var subMap = {};
menuConfig.forEach(function(item){
    var href = item.linkKey ? (links[item.linkKey] || '') : (item.link || '');
    var key = href.indexOf('#') === 0 ? href.slice(1) : null;
    if(key && item.sub) subMap[key] = item.sub;
});

function setActive(id){
    Object.keys(itemMap).forEach(function(key){
    var itemEl = itemMap[key];
    var link = itemEl.querySelector('a');
    var sub = itemEl.querySelector('.tapestry-menu__sub');
    if(key === id){
        if(link) link.classList.add('is-current');
        if(!sub && subMap[key]){
        var ul = document.createElement('ul');
        ul.className = 'tapestry-menu__sub';
        ul.innerHTML = subMap[key].map(function(s){
            return '<li><a href="' + (s.link || '#') + '">' + s.label + '</a></li>';
        }).join('');
        itemEl.appendChild(ul);
        window.requestAnimationFrame(function(){ ul.classList.add('is-visible'); });
        }
    }else{
        if(link) link.classList.remove('is-current');
        if(sub) sub.remove();
    }
    });
}

if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
        if(entry.isIntersecting){
        setActive(entry.target.id);
        }
    });
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });

    sections.forEach(function(sec){ io.observe(sec); });
}
}

$(document).ready(function() {
    initNewsCarousel();
    initRevealLinks();
    initTocLinks();
    initSlowFollow('.n-reveal-follow', 0.68);
    renderSections();
    renderCardGrid('goodsTypesGrid', window.SITE_CONFIG.goodsTypes);
    renderCardGrid('fabricTypesGrid', window.SITE_CONFIG.fabricTypes);
    initAboutLightbox();
    initTapestryMenu();
    initTapestryScrollSpy();
});
