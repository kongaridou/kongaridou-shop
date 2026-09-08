==================================================================
kongaridou.js 全文（①②③対応版）
（GitHubのkongaridou.jsの中身と丸ごと置き換えてください）
==================================================================

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

function initTocLinks(){
document.querySelectorAll('.about-toc a[data-link]').forEach(function(a){
    var key = a.getAttribute('data-link');
    var url = window.SITE_CONFIG && window.SITE_CONFIG.links && window.SITE_CONFIG.links[key];
    if(url) a.href = url;
});
}

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

function renderCardGrid(containerId, items){
var container = document.getElementById(containerId);
if(!container || !items) return;
container.innerHTML = items.map(function(html){
    return '<div class="about-card">' + html + '</div>';
}).join('');
}

function initAboutLightbox(){
if(typeof $ === 'undefined' || !$.fn.colorbox) return;
$('.about-lightbox').colorbox({ maxWidth: '90%', maxHeight: '90%' });
}

function renderSections(){
var sections = (window.SITE_CONFIG && window.SITE_CONFIG.sections) || {};
Object.keys(sections).forEach(function(key){
    var el = document.getElementById('section-' + key);
    if(el) el.innerHTML = sections[key];
});
}

// ==================================================================
// タペストリーメニュー本体（①ドラッグを画面内に固定／見た目はインラインで直接指定）
// ==================================================================
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

// ③ 副題はここでは絶対に出さない（見出しだけ描画。副題はscrollSpyが必要な時だけ追加する）
body.innerHTML = items.map(function(item){
    var key = keyOf(item);
    return '<div class="tapestry-menu__item"' + (key ? ' data-key="' + key + '"' : '') + '><a href="' + resolveLink(item) + '">' + item.label + '</a></div>';
}).join('');

// ① 画面の端でぴたりと止めるためのクランプ関数（マージン0＝完全に画面内に収める）
function clamp(left, top){
    var w = el.offsetWidth;
    var h = el.offsetHeight;
    var maxLeft = Math.max(0, window.innerWidth - w);
    var maxTop = Math.max(0, window.innerHeight - h);
    return {
    left: Math.min(Math.max(left, 0), maxLeft),
    top: Math.min(Math.max(top, 0), maxTop)
    };
}

function applyPosition(left, top){
    var pos = clamp(left, top);
    el.style.left = pos.left + 'px';
    el.style.top = pos.top + 'px';
}

function resetPosition(){
    el.style.transition = '';
    var rect = el.getBoundingClientRect();
    // 初期位置：画面中央よりやや左（220px幅の要素を、中央から少し左に）
    var targetLeft = window.innerWidth * 0.4 - el.offsetWidth / 2;
    applyPosition(targetLeft, 100);
    el.style.transform = 'none';
}

// ドラッグ操作
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
    applyPosition(initialLeft, initialTop); // 現在位置をそのままleft/topに固定してから開始（ワープ防止）
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
    applyPosition(initialLeft + dx, initialTop + dy);
}
function onUp(){
    if(!isDragging) return;
    isDragging = false;
    el.classList.remove('is-dragging');
    // 念のため、離した瞬間にもう一度クランプをかけ直す
    var rect = el.getBoundingClientRect();
    applyPosition(rect.left, rect.top);
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchend', onUp);
}
el.addEventListener('mousedown', onDown);
el.addEventListener('touchstart', onDown, { passive: true });

// ウィンドウサイズが変わって画面外に出てしまったら、位置を再クランプ
window.addEventListener('resize', function(){
    if(window.innerWidth <= 760) return;
    var rect = el.getBoundingClientRect();
    var offScreen = rect.right <= 0 || rect.left >= window.innerWidth || rect.bottom <= 0 || rect.top >= window.innerHeight;
    if(offScreen){
    resetPosition();
    }else{
    applyPosition(rect.left, rect.top);
    }
});

// 初期位置を明示的にセット（CSSのleft:40%頼みにせず、JSで確定させる）
resetPosition();

// スマホ：ハンバーガーで開閉
var toggle = document.getElementById('menuToggle');
if(toggle){
    toggle.addEventListener('click', function(){
    el.classList.toggle('is-open');
    });
}
}

// ==================================================================
// ②③ 今見ているセクションのハイライトと副題の出し入れ
// （太字・下線はCSSに頼らず、直接インラインスタイルで指定）
// ==================================================================
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

function markCurrent(link){
    link.style.fontWeight = 'bold';
    link.style.borderBottom = '5px dotted #fff';
    link.style.paddingBottom = '3px';
}
function unmarkCurrent(link){
    link.style.fontWeight = '';
    link.style.borderBottom = '';
    link.style.paddingBottom = '';
}

function setActive(id){
    Object.keys(itemMap).forEach(function(key){
    var itemEl = itemMap[key];
    var link = itemEl.querySelector('a');
    var sub = itemEl.querySelector('.tapestry-menu__sub');
    if(key === id){
        if(link) markCurrent(link);
        if(!sub && subMap[key]){
        var ul = document.createElement('ul');
        ul.className = 'tapestry-menu__sub';
        ul.style.listStyle = 'none';
        ul.style.margin = '6px 0 0';
        ul.style.paddingLeft = '12px';
        ul.style.borderLeft = '1px solid rgba(255,255,255,0.45)';
        ul.innerHTML = subMap[key].map(function(s){
            return '<li style="margin-bottom:6px;"><a href="' + (s.link || '#') + '" style="color:rgba(255,255,255,0.85);font-size:0.75rem;text-decoration:none;">' + s.label + '</a></li>';
        }).join('');
        itemEl.appendChild(ul);
        }
    }else{
        if(link) unmarkCurrent(link);
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
}else{
    // IntersectionObserver非対応ブラウザ向けの保険：何も表示しない
    setActive(null);
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
