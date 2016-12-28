var zkSlides = {};

window.addEventListener('load', function(){
	var slides = document.querySelectorAll('.zkslide');
	for(var i in slides){
		if(!slides.hasOwnProperty(i)) continue;

		var k = 0;
		while(typeof zkSlides[k]!='undefined')
			k++;

		var options = {
			'width': null,
			'height': null,
			'type': 'slide',
			'direction': 'o',
			'force-width': 'true',
			'force-height': 'true',
			'visible': 1
		};

		for(var opt in options){
			if(!options.hasOwnProperty(opt)) continue;
			if(slides[i].getAttribute('data-'+opt))
				options[opt] = slides[i].getAttribute('data-'+opt);
		}

		var subslides = [];
		while(typeof slides[i].children[0]!='undefined'){
			subslides.push(slides[i].removeChild(slides[i].children[0]));
		}

		switch(options['type']){
			case 'slide':
				var cont = document.createElement('div');
				switch(options['direction']){
					case 'o':
						cont.className = 'zkslide-inner horizontal';
						break;
					case 'v':
						cont.className = 'zkslide-inner vertical';
						break;
				}
				cont.setAttribute('data-default-class', cont.className);
				cont.style.top = '0px';
				cont.style.left = '0px';
				cont = slides[i].appendChild(cont);
				break;
			case 'fade':
				var cont = slides[i];
				break;
		}
		if(options['width']!==null)
			slides[i].style.width = options['width'];
		if(options['height']!==null)
			slides[i].style.height = options['height'];

		zkSlides[k] = {
			'mainCont': slides[i],
			'cont': cont,
			'options': options,
			'slides': subslides,
			'current': 1,
			'queue': [],
			'moving': false
		};

		slides[i].style.display = 'inline-block';

		zkFillStaticSlide(k, zkSlides[k].current);
	}
});

function zkMoveSlide(k, n) {
	if (typeof zkSlides[k] == 'undefined')
		return false;
	zkSlides[k].queue.push(n);
	zkCheckMoveQueue();
}

function zkActualMoveSlide(k, n){
	if(typeof n=='number' && n<0)
		n = n.toString();
	var forceType = false;
	if(typeof n=='string'){
		var current = zkSlides[k].current;
		if(n.charAt(0)=='-'){
			forceType = '-';
			var moveBy = parseInt(n.substr(1));
			if(isNaN(moveBy))
				return false;
			current -= moveBy;
		}else if(n.charAt(0)=='+'){
			forceType = '+';
			var moveBy = parseInt(n.substr(1));
			if(isNaN(moveBy))
				return false;
			current += moveBy;
		}else{
			return false;
		}

		n = current;
	}

	n = zkNormalizeN(k, n);
	if(n==zkSlides[k].current)
		return true;

	switch(zkSlides[k].options['type']){
		case 'slide':
			switch(zkSlides[k].options['direction']){
				case 'o':
					if(forceType==='+') var type = 'right';
					else if(forceType==='-') var type = 'left';
					else if(n<zkSlides[k].current) var type = 'left';
					else var type = 'right';
					break;
				case 'v':
					if(forceType==='+') var type = 'down';
					else if(forceType==='-') var type = 'up';
					else if(n<zkSlides[k].current) var type = 'up';
					else var type = 'down';
					break;
				default:
					return false;
					break;
			}
			break;
		case 'fade':
			var type = 'fade';
			break;
		default:
			return false;
			break;
	}

	zkSlides[k].moving = true;
	var prep = zkPrepareToMove(k, n, type);
	switch(type){
		case 'fade':
			for(var i in prep){
				if(!prep.hasOwnProperty(i)) continue;
				prep[i].style.opacity = 1;
			}

			var currents = zkSlides[k].mainCont.querySelectorAll('[data-zkslide-'+k+'-current]');
			for(var i in currents){
				if(!currents.hasOwnProperty(i)) continue;
				currents[i].style.opacity = 0;
			}

			var forResize = prep;
			break;
		case 'right':
			zkSlides[k].cont.className = zkSlides[k].cont.getAttribute('data-default-class')+' animate';
			var w = 0, c = 0, forResize = [];
			for(var i in zkSlides[k].cont.children){
				if(!zkSlides[k].cont.children.hasOwnProperty(i)) continue;
				c++;
				if(c<prep){
					w += zkSlides[k].cont.children[i].offsetWidth;
				}
				if(c>=prep){
					forResize.push(zkSlides[k].cont.children[i]);
				}
			}
			zkSlides[k].cont.style.left = (-w)+'px';
			break;
	}

	zkSlideResize(k, forResize);

	setTimeout((function(k, n){
		return function(){
			zkFillStaticSlide(k, n);
			zkSlides[k].cont.className = zkSlides[k].cont.getAttribute('data-default-class');
			zkSlides[k].cont.style.left = '0px';
			zkSlides[k].moving = false;
			zkCheckMoveQueue();
		};
	})(k, n), 700);
}

function zkCheckMoveQueue(){
	for(var k in zkSlides){
		if(!zkSlides.hasOwnProperty(k)) continue;
		if(zkSlides[k].moving) continue;
		if(zkSlides[k].queue.length>0){
			var n = zkSlides[k].queue.shift();
			zkActualMoveSlide(k, n);
		}
	}
}

function zkFillStaticSlide(k, from){
	if(typeof zkSlides[k]=='undefined')
		return false;

	var divsForResize = [];

	var offset = 0;
	zkSlides[k].cont.innerHTML = '';

	var min = Math.min(parseInt(zkSlides[k].options['visible']), zkSlides[k].slides.length);
	for(i=0;i<min;i++){
		var n = zkNormalizeN(k, from+i);
		var div = zkGetSlideDiv(k, n, offset);
		div = zkSlides[k].cont.appendChild(div);
		div.setAttribute('data-zkslide-'+k+'-current', i);
		div.setAttribute('data-zkslide-'+k+'-n', n);
		divsForResize.push(div);
		offset += div.offsetWidth;
	}

	zkSlideResize(k, divsForResize);

	if(zkSlides[k].options['type']=='fade'){
		for(var i in divsForResize){
			if(!divsForResize.hasOwnProperty(i)) continue;
			div.style.position = 'absolute';
		}
	}

	zkSlides[k].current = from;
}

function zkSlideResize(k, divs){
	if(typeof zkSlides[k]=='undefined')
		return false;

	var w = zkSlides[k].options['width'], h = zkSlides[k].options['height'], totalW = 0, totalH = 0, maxW = 0, maxH = 0;

	for(var i in divs){
		if(!divs.hasOwnProperty(i)) continue;
		totalW += divs[i].offsetWidth;
		totalH += divs[i].offsetHeight;
		maxW = Math.max(maxW, divs[i].offsetWidth);
		maxH = Math.max(maxH, divs[i].offsetHeight);
	}

	if(w===null){
		if(zkSlides[k].options['type']=='fade' || zkSlides[k].options['direction']=='o'){
			var width = totalW+'px';
		}else{
			var width = maxW+'px';
		}
	}else{
		var width = w;
	}

	if(h===null){
		if(zkSlides[k].options['type']=='fade' || zkSlides[k].options['direction']=='o'){
			var height = maxH+'px';
		}else{
			var height = totalH+'px';
		}
	}else{
		var height = h;
	}

	zkSlides[k].mainCont.style.width = width;
	zkSlides[k].mainCont.style.height = height;
	if(zkSlides[k].options['type']=='slide'){
		zkSlides[k].cont.style.minWidth = width;
		zkSlides[k].cont.style.minHeight = height;
	}
}

function zkGetSlideDiv(k, n, offset){
	if(typeof zkSlides[k]=='undefined')
		return false;
	if(typeof zkSlides[k].slides[n-1]=='undefined')
		return false;
	if(typeof offset=='undefined')
		offset = 0;
	var div = document.createElement('div');
	div.className = 'zkslide-single';
	div.innerHTML = zkSlides[k].slides[n-1].innerHTML;
	if(zkSlides[k].options['type']=='fade'){
		div.style.top = '0px';
		div.style.left = offset+'px';
		div.style.opacity = 1;
	}

	var dimension = zkGetSingleSlideDimension(k);
	if(dimension.w!==null)
		div.style.width = dimension.w;
	if(dimension.h!==null)
		div.style.height = dimension.h;

	return div;
}

function zkPrepareToMove(k, from, type){
	if(typeof zkSlides[k]=='undefined')
		return false;

	switch(type){
		case 'fade':
			var offset = 0, divs = [];
			for(i=0;i<parseInt(zkSlides[k].options['visible']);i++){
				var n = zkNormalizeN(k, from+i);
				var div = zkGetSlideDiv(k, n, offset);
				div.style.zIndex = -1;
				div.style.opacity = 0;
				div = zkSlides[k].cont.appendChild(div);
				div.style.position = 'absolute';
				divs.push(div);
				offset += div.offsetWidth;
			}
			return divs;
			break;
		case 'right':
			var end_vis = zkNormalizeN(k, zkSlides[k].current+parseInt(zkSlides[k].options['visible'])-1), n = from, scrollTo = 1;
			if(n<=end_vis){
				var temp = zkSlides[k].current;
				while(temp!=n){
					temp = zkNormalizeN(k, temp+1);
					scrollTo++;
				}

				var showed = 0;
				while(showed<parseInt(zkSlides[k].options['visible'])){
					if(!zkSlides[k].cont.querySelector('[data-zkslide-'+k+'-n="'+n+'"]')) {
						var div = zkGetSlideDiv(k, n);
						div = zkSlides[k].cont.appendChild(div);
					}
					showed++;
					n = zkNormalizeN(k, n+1);
				}
			}else{
				var n = zkNormalizeN(k, zkSlides[k].current+parseInt(zkSlides[k].options['visible'])), end = zkNormalizeN(k, from+parseInt(zkSlides[k].options['visible'])-1), found = false;
				scrollTo = parseInt(zkSlides[k].options['visible']);
				while(true){
					var div = zkGetSlideDiv(k, n);
					div = zkSlides[k].cont.appendChild(div);
					if(!found)
						scrollTo++;
					if(n==end)
						break;
					if(n==from)
						found = true;
					n = zkNormalizeN(k, n+1);
				}
			}
			return scrollTo;
			break;
	}
}

function zkNormalizeN(k, n){
	if(typeof zkSlides[k]=='undefined')
		return false;

	while(n<1)
		n += zkSlides[k].slides.length;
	while(n>zkSlides[k].slides.length)
		n -= zkSlides[k].slides.length;
	return n;
}

function zkGetSingleSlideDimension(k){
	if(typeof zkSlides[k]=='undefined')
		return false;

	if(zkSlides[k].options['force-width']=='true' && zkSlides[k].options['width']!==null){
		var w = Math.floor(zkSlides[k].mainCont.offsetWidth/parseInt(zkSlides[k].options['visible']))+'px';
	}else{
		var w = null;
	}

	if(zkSlides[k].options['force-height']=='true' && zkSlides[k].options['height']!==null){
		var h = Math.floor(zkSlides[k].mainCont.offsetHeight/parseInt(zkSlides[k].options['visible']))+'px';
	}else{
		var h = null;
	}

	return {'w':w, 'h':h};
}