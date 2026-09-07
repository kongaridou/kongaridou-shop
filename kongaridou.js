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

                                function initTocLinks(){
                                document.querySelectorAll('.about-toc a[data-link]').forEach(function(a){
                                    var key = a.getAttribute('data-link');
                                    var url = window.SITE_CONFIG && window.SITE_CONFIG.links && window.SITE_CONFIG.links[key];
                                    if(url) a.href = url;
                                });
                                }

                                function initTapestryScrollSpy(){
                                var sections = document.querySelectorAll('.about-block[id]');
                                var menuLinks = document.querySelectorAll('.tapestry-menu__item > a');
                                if(sections.length === 0 || menuLinks.length === 0) return;

                                var map = {};
                                menuLinks.forEach(function(a){
                                    var href = a.getAttribute('href');
                                    if(href && href.indexOf('#') === 0){
                                    map[href.slice(1)] = a;
                                    }
                                });

                                function setActive(id){
                                    menuLinks.forEach(function(a){ a.classList.remove('is-current'); });
                                    if(map[id]) map[id].classList.add('is-current');
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

                                    body.innerHTML = items.map(function(item){
                                        var subHtml = '';
                                        if(item.sub && item.sub.length){
                                        subHtml = '<ul class="tapestry-menu__sub">' + item.sub.map(function(s){
                                            return '<li><a href="' + (s.link || '#') + '">' + s.label + '</a></li>';
                                        }).join('') + '</ul>';
                                        }
                                        return '<div class="tapestry-menu__item"><a href="' + resolveLink(item) + '">' + item.label + '</a>' + subHtml + '</div>';
                                    }).join('');

                                    // ドラッグで自由に移動（PCのみ。スマホはハンバーガー開閉のみ）
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
                                        el.style.left = (initialLeft + dx) + 'px';
                                        el.style.top = (initialTop + dy) + 'px';
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

                                    // スマホ：ハンバーガーで開閉
                                    var toggle = document.getElementById('menuToggle');
                                    if(toggle){
                                        toggle.addEventListener('click', function(){
                                        el.classList.toggle('is-open');
                                        });
                                    }
                                    }


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

 

                                // 「背景は普通にスクロール、中身だけゆっくり遅れる」パラレックス
                                //   selector    : 対象にするCSSセレクタ（中身側の要素）
                                //   speedFactor : 背景に対する速さの比率。1に近いほど背景と同じ速さ、
                                //                 0に近いほどよく遅れる（0.6〜0.8あたりが目安）
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

                                    // バナーが少ない場合でも自然にループして見えるよう、必要な分だけ仮想的に複製する
                                    // （実際のバナーが8枚以上ある場合は複製されません）
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

                                $(document).ready(function() {
                                    initNewsCarousel();
                                    initRevealLinks();
                                    initTapestryMenu();
                                    initSlowFollow('.n-reveal-follow', 0.68);
                                    renderCardGrid('goodsTypesGrid', window.SITE_CONFIG.goodsTypes);
                                    renderCardGrid('fabricTypesGrid', window.SITE_CONFIG.fabricTypes);
                                    initAboutLightbox();
                                    initTocLinks();
                                    initTapestryScrollSpy();
                                });

                                
