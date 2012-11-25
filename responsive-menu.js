/*
 * Responsive (Dropdown) menu using jQuery
 * Compatible for mouse & touch behavior
 */
;
(function($) {

	var responsiveMenu = function(menu, options) {
		var self = this;
		self.$menu = $(menu);
		$window = $(window);

		options = options || {};
		self.menuClass = options.menuClass || 'menuDropDown';
		self.timeoutOpen = options.timeoutOpen || options.timeout || 400;
		self.timeoutClose = options.timeoutClose || options.timeout || 400;
		self.timeoutSwitch = options.timeoutSwitch || options.timeout || 10;
		self.animate = options.animate || true;
		self.animateOpen = options.animateOpen || 'fast';
		self.animateClose = options.animateClose || 'fast';
		self.animateScroll = options.animateScroll || options.animate || false;
		self.open = options.open || function() {
			// this is the $(ul) animated
			this.show(self.animate && self.animateOpen ? self.animateOpen : 0, function(){
				var $this = $(this)
					.removeClass('animated')
					// fix jquery animation overflow
					.css('overflow', 'visible');

				// scroll to parent element, if menu is not visible
				if ($window.scrollTop() > $this.offset().top) {
					if (self.animate && self.animateScroll) {
						$(document.body).animate({scrollTop: $this.parent().offset().top}, self.animateScroll);
					}
					else {
						$(document.body).scrollTop($this.parent().offset().top);
					}
				}
			});
		};
		self.close = options.close || function() {
			// this is the $(ul) animated
			this.hide(self.animate && self.animateClose ? self.animateClose : 0, function() {
				$(this)
					.removeClass('open animated')
					// fix jquery animation overflow
					.css('overflow', 'visible');
			});
		};
		self.duplicateParentInSubmenu = options.duplicateParentInSubmenu || true;
		self.duplicateTextAltAttr = options.duplicateTextAltAttr || 'title';
		self.duplicateClass = options.duplicateClass || 'duplicate';
		self.longClickStillOpenParentMenuLink = options.longClickStillOpenParentMenuLink || 600;

		self.change = options.change || self.close;

		self.$menu.addClass(self.menuClass);

		var $getChildMenu = function($li) {
			if (!$li.data('responsiveMenu.childElement')) {
				$li.data('responsiveMenu.childElement', $('> ul', $li));
			}

			return $li.data('responsiveMenu.childElement');
		};

		// mouseenter/leave work for touchbased device
		$('li', self.$menu)
			// open & mouse over/get focus
			.on('mouseenter focusin', function(e) {
				var $this = $(this);
				if ($this.data('responsiveMenu.preventOpening')) {
					$this.data('responsiveMenu.preventOpening', false);
				}
				else {
					$this.stopTime();
					$this.addClass('focused');
					if (!$getChildMenu($this).hasClass('animated')) {
						$this.oneTime(self.timeoutOpen, self._open);
					}
				}
			})
			// close on mouse/focus lose
			.on('mouseleave focusout', function(e) {
				var $this = $(this);
				$this.removeClass('focused');
				//if (!$getChildMenu($this).hasClass('animated')) {
					$this.stopTime();
					$this.oneTime(self.timeoutClose, self._close);
				//}
			})
			// if touched & already open, we close it
			.on('touchend', function(e) {
				var $this = $(this);
				$this.stopTime();
				// normal behavior apply if element not focus
				// if already focused, if touch occurs, we toggle opening/close
				if ($this.hasClass('focused')) {
					if ($getChildMenu($this).hasClass('open')) {
						$this.oneTime(self.timeoutClose, self._close);
						$this.find('li').oneTime(self.timeoutClose, self._close); // close child too
					}
					else {
						$this.oneTime(self.timeoutOpen, self._open);
					}
				}
				e.stopPropagation();
			});

		$('> ul a', self.$menu)
			// cancel click on parent sub menu link
			.on('touchstart', function(e) {
				$(this).data('click-start', new Date().getTime());
			})
			.on('click', function(e) {
				var $this = $(this);

				// for touch screen, prevent click opening for short click to allow sub menu to be open
				if ($getChildMenu($this.parent()).length && $this.data('click-start') && self.longClickStillOpenParentMenuLink) {
					if ((new Date().getTime() - $this.data('click-start')) < self.longClickStillOpenParentMenuLink) {
						e.preventDefault();
					}
					// if the link is supposed to work normaly, we cancel the sub menu opening
					else {
						$this.parent().data('responsiveMenu.preventOpening', true);
					}
				}
			})
			;

		self._open = function() {
			var $this = $(this);
			$this.addClass('open-child');
			self.open.apply($getChildMenu($this).addClass('open animated'));
			if (self.timeoutOpen < self.timeoutClose) {
				self.change.apply($this.parent().find('ul').not($getChildMenu($this)));
			}
		};

		self._close = function() {
			var $this = $(this);
			$this.removeClass('open-child');
			// close all childs (including sub childs)
			self.close.apply($this.find('ul.open'));
		};

		// if activated, we duplicate each parent menu link as the first item of the sub menu.
		// This is a nice behavior for touch screen navigation (click on item just show the sub menu,
		// so for a better ux, we readd it as a child if not already present)
		if (self.duplicateParentInSubmenu) {
			$('ul', self.$menu).each(function() {
				var $ul = $(this);
				// if the first child is the same link as the parent element, we do not add the duplicate
				var $parentLink = $ul.parent().find('>a');
				if ($ul.children(":first > a").attr('href') != $parentLink.attr('href')) {
					var $li = $parentLink.parent().clone().find('ul').remove().end();
					if (self.duplicateTextAltAttr) {
						$li.children(':first').html($parentLink.attr(self.duplicateTextAltAttr));
					}
					$ul.prepend($li);
				}
			})
		}
	};

	$.fn.responsiveMenu = function(options) {
		$(this).each(function() {
			$(this).data('responsiveMenu', new responsiveMenu(this, options));
		});
		return this;
	};
})(jQuery);