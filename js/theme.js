(function($) {
    'use strict';
	//Header Search
	if($('.search-box-outer').length) {
		$('.search-box-outer').on('click', function() {
			$('body').addClass('search-active');
		});
		$('.close-search').on('click', function() {
			$('body').removeClass('search-active');
		});
	}
	

	
    /* Portfolio Isotope  */
    $('.image_load').imagesLoaded(function() {

        if ($.fn.isotope) {

            var $portfolio = $('.image_load');

            $portfolio.isotope({

                itemSelector: '.grid-item',

                filter: '*',

                resizesContainer: true,

                layoutMode: 'masonry',

                transitionDuration: '0.8s'

            });
            $('.menu-filtering li').on('click', function() {

                $('.menu-filtering li').removeClass('current_menu_item');

                $(this).addClass('current_menu_item');

                var selector = $(this).attr('data-filter');

                $portfolio.isotope({

                    filter: selector,

                });

            });

        };

    });
	
		    // Venubox

    $('.venobox').venobox({

        numeratio: true,

        infinigall: true

    });
	
	        // to wow Jquery
        new WOW().init();


// Loder  
    $(function () {
      $('body').addClass('loaded');
    });



    // slider Active
    $('.testi_list').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        dots: true,
        dotsEach: true,
        nav: false,
        navText: ["<i class='fa fa-long-arrow-left''></i>", "<i class='fa fa-long-arrow-right''></i>"],
        responsive: {
            0: {
                items:1 
            },
            600: {
                items: 1
            },
            768: {
                items: 1
            },
            992: {
                items: 1
            }
        
        }
    }) 


    // slider Active
    $('.blog_list').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        dots: true,
        dotsEach: false,
        nav: false,
        navText: ["<i class='fa fa-long-arrow-left''></i>", "<i class='fa fa-long-arrow-right''></i>"],
        responsive: {
            0: {
                items:1 
            },
            600: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            }
        
        }
    })


    $(document).ready(function(){
    $('#bar1').barfiller({ duration: 3000 });
    $('#bar2').barfiller({ duration: 2000 });
    $('#bar3').barfiller({ duration: 4000 });
    $('#bar4').barfiller({ duration: 1000 });
    $('#bar5').barfiller({ duration: 2000 });
    $('#bar6').barfiller({ duration: 4000 });
    $('#bar7').barfiller({ duration: 3000 });
    $('#bar8').barfiller({ duration: 2000 });
    });




$(document).ready(function(){ 
// sticky menu===================
        var wind = $(window);
        var sticky = $('#sticky-header');
        wind.on('scroll', function () {
            var scroll = wind.scrollTop();
            if (scroll <100) {
                sticky.removeClass('sticky-nav');
            } else {
                sticky.addClass('sticky-nav');
            }
        });
});


    // Mobile Menu
    $('.mobile-menu nav').meanmenu({
        meanScreenWidth: "991",
        meanMenuContainer: ".mobile-menu",
        onePage: false,
    }); 

// Skills Bars
$('.skill-percent').each(function(){
  $(this).animate({
    width:$(this).attr('data-percent')},"fast");
  });

// scroll strat============================

         $(window).on('scroll', function () {
        var scrolled = $(window).scrollTop();
        if (scrolled > 300) $('.go-top').addClass('active');
        if (scrolled < 300) $('.go-top').removeClass('active');
    });

    $('.go-top').on('click', function () {
        $("html, body").animate({
            scrollTop: "0"
        }, 1200);
    });





$.scrollUp({
    scrollName: 'scrollUp', // Element ID
    topDistance: '300', // Distance from top before showing element (px)
    topSpeed: 300, // Speed back to top (ms)
    animation: 'fade', // Fade, slide, none
    animationInSpeed: 200, // Animation in speed (ms)
    animationOutSpeed: 200, // Animation out speed (ms)
    scrollText: '<i class="fas fa-angle-double-up"></i>', // Text for element
    activeOverlay: false, // Set CSS color to display scrollUp active point, e.g '#00FFFF'
  });


    //======< scrollcue js >======
    $(function(){
        scrollCue.init({
        duration : 1000,
        interval : -0.7,
        percentage : 0.90,
        smartSpeed: 600 
        
        })
    });
    

    
	/*--------------------------
     scrollUp
    ---------------------------- */
    $.scrollUp({
        scrollText: '<i class="fa fa-angle-up"></i>',
        easingType: 'linear',
        scrollSpeed: 900,
        animation: 'fade'
    })
})(jQuery);




