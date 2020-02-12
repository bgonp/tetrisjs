// Constantes con los valores a utilizar durante la ejecución del juego.
const COLS = 10;
const ROWS = 20;
const DELAY = 750;
const CONTROL_DELAY = 70;
const CONTROL_REPEAT = 35;
const ANIMATION_TIME = 80;
const COYOTE_TIME = 20;
const RIGHT = 'R';
const LEFT = 'L';
const DOWN = 'D';
const BOTTOM = 'B';
const SHAPES = [15, 78, 102, 108, 198, 226, 232];
const COLORS = ['#FFD836','#f58d41','#b565f3','#f54c95','#427EFF','#7ce634','#4ceae7'];

// Indica si el modo de juego actual es switch manual o automático.
var autoSwitch = true;

/**
 * Clase principal que se encarga de la ejecución principal del programa y controlar
 * los distintos elementos.
 */
class Main {

	/**
	 * Método principal a llamar al inicio y que inicializa todo el programa.
	 */
	static run() {
		Board.init();
		Main.initControls();
		Main.initAccordion();
		Main.initSettings();
		Main.initSize();
		Main.initMessage();
		Main.initAlert();
	}

	/**
	 * Inicializa los conroles de juego y sus listeners.
	 */
	static initControls() {
		Main.pressing = null;
		Main.repeating = null;
		Main.interval = 0;
		Main.timeout = 0;
		Main.blocked = false;
		Main.startButton = $('#container .start');
		Main.pauseButton = $('#container .pause');
		Main.controls = $('#controls');
		var message = 'This will end your current game. Are you sure?';
		Main.startButton.click((e) => {
			e.preventDefault();
			if (!Board.playing) Board.start();
			else Main.alert(message, Board.finish);
		});
		Main.pauseButton.click((e) => {
			e.preventDefault();
			Board.pause();
		});
		Main.controls.find('a').on('touchstart', function(e) {
			if (Main.blocked || !Board.playing || Board.paused)	return;
			let key = $(this).data('action');
			switch (key) {
				case 'left': Main.action(key, Board.move, LEFT, true); break;
				case 'switch': if (!autoSwitch) Main.action(key, Board.switch); break;
				case 'right': Main.action(key, Board.move, RIGHT, true); break;
				case 'down': Main.action(key, Board.move, DOWN, true); break;
				case 'bottom': Main.action(key, Board.move, BOTTOM); break;
				case 'rotate': Main.action(key, Board.rotate); break;
				default: return;
			}
			e.preventDefault();
		});
		Main.controls.find('a').on('touchend', function(e) {
			let key = $(this).data('action');
			if (Main.repeating === key) Main.clear();
			if (Main.pressing === key) Main.pressing = null;
		});
		Main.window.keydown((e) => {
			if (Main.blocked) return;
			if (!Board.playing) {
				if (e.key === 's') Main.action(e.key, Board.start);
				return;
			}
			switch (e.key) {
				case 'c': if (!autoSwitch) Main.action(e.key, Board.switch); break;
				case 'ArrowLeft': Main.action(e.key, Board.move, LEFT, true); break;
				case 'ArrowRight': Main.action(e.key, Board.move, RIGHT, true); break;
				case 'ArrowDown': Main.action(e.key, Board.move, DOWN, true); break;
				case ' ': Main.action(e.key, Board.move, BOTTOM); break;
				case 'ArrowUp': Main.action(e.key, Board.rotate); break;
				case 'p': case 'Escape': Main.action(e.key, Board.pause); break;
				case 's': Main.action(e.key, Main.alert.bind(undefined, message, Board.start)); break;
				default: return;
			}
			e.preventDefault();
		});
		Main.window.keyup((e) => {
			if (Main.repeating === e.key) {
				Main.clear();
				Board.undo();
			}
			if (Main.pressing === e.key)
				Main.pressing = null;
		});
	}

	/**
	 * Inicializa el acordeón de ayuda, controles y opciones.
	 */
	static initAccordion() {
		Main.accordionButtons = $('#container .buttons');
		Main.accordionButtons.accordion({
			active: false,
			collapsible: true,
			icons: null
		});
	}

	/**
	 * Inicializa las opciones de juego (tetriminós personalizados y manual mode) y
	 * crea los listeners para el cambio de las mismas.
	 */
	static initSettings() {
		var message = 'You will can change settings once your current game has been finished';
		$('#container .settings-content .auto-switch a').click(function(e) {
			e.preventDefault();
			if (Board.playing) {
				Main.alert(message);
			} else {
				autoSwitch = !autoSwitch;
				$(this).toggleClass('selected');
			}
		});
		SHAPES.forEach((shape, index) => {
			let element = $('<div/>').addClass('tetromino').data('index',index);
			let value = shape.toString(2).padStart(8, '0');
			for (let i = 0; i < 8; i++) {
				let block = $('<a href="#"/>').data('position', i);
				if (value[i] === '1') block.addClass('selected');
				block.click(function(e) {
					e.preventDefault();
					let block = $(this);
					if (Board.playing) {
						Main.alert(message);
					} else if (!block.hasClass('selected') || block.parent().find('.selected').length > 2) {
						let index = block.parent().data('index');
						let position = block.data('position');
						SHAPES[index] += (block.hasClass('selected')?-1:1)*Math.pow(2, 7-position);
						block.toggleClass('selected');
					}
				});
				element.append(block);
			}
			$('#container .settings-content').append(element);
		});
	}

	/**
	 * Crea el listener que llama a resize cada vez que la ventana cambia de tamaño
	 * y pone el tamaño inicial.
	 */
	static initSize() {
		Main.window = $(window);
		Main.resize();
		Main.window.resize(Main.resize);
	}

	/**
	 * Inicializa el contenedor donde aparecen los mensajes de juego.
	 */
	static initMessage() {
		Main.messageBox = $('#container .modal');
	}

	/**
	 * Inicializa la caja de alertas y los listeners de sus botones.
	 */
	static initAlert() {
		Main.alertBox = $('#container .alert');
		Main.alertBox.find('.close, .cancel, .ok').click((e) => {
			e.preventDefault();
			Main.alertBox.fadeOut(50);
			Main.blocked = false;
		});
		Main.alertBox.find('.ok').click(() => Main.confirmed());
	}

	/**
	 * Actualiza el tamaño base para que se actualicen todos los elementos y quepan
	 * en el tamaño de la pantalla. Muestra los controles móviles si la pantalla es
	 * suficientemente alargada.
	 */
	static resize() {
		let windowWidth = Main.window.innerWidth();
		let windowHeight = Main.window.innerHeight();
		let gameWidth = Math.max(COLS*2+30, COLS*4+6)*2;
		let gameHeight = ROWS*4+4;
		let controlsHeight = 40;
		for (var base = 12; base >= 4; base-=1)
			if (gameHeight*base < height && gameWidth*base < width)
				break;
		if (height - gameHeight*base > controlsHeight*base)
			Main.controls.show();
		else
			Main.controls.hide();
		$('html').css('font-size', base+'px');
	}

	/**
	 * Activa o desactiva el acordeón de ayuda, controles y opciones.
	 */
	static accordion(enable = true) {
		Main.accordionButtons.accordion('option', 'active', enable);
		Main.accordionButtons.accordion('option', 'disabled', !enable);
	}

	/**
	 * Gestiona las acciones de los controles: qué se tiene que ejecutar y si se
	 * ejecuta una sola vez, o se sigue ejecutando mientras la tecla este pulsada
	 * y con qué frecuencia.
	 */
	static action(key, callback, param, repeat = false) {
		if (repeat) {
			if (Main.repeating !== key) {
				Main.repeating = key;
				callback.bind(Board)(param);
				clearInterval(Main.interval);
				clearTimeout(Main.timeout);
				Main.timeout = setTimeout(() =>
					Main.interval = setInterval(callback.bind(undefined, param), CONTROL_REPEAT),
				CONTROL_DELAY);
			}
		} else if (Main.pressing !== key){
			Main.pressing = key;
			callback(param);
		}
	}

	/**
	 * Limpia los interval y timeout de controles que puedan existir y quita los
	 * valores de las teclas pulsadas almacenadas.
	 */
	static clear() {
		Main.pressing = null;
		Main.repeating = null;
		clearInterval(Main.interval);
		clearTimeout(Main.timeout);
	}

	static alert(message, callback = false) {
		Main.blocked = true;
		if (Board.playing && !Board.paused) Board.pause();
		Main.alertBox.fadeIn(50).find('.text').text(message);
		if (!callback) {
			Main.alertBox.removeClass('confirmable');
		} else {
			Main.confirmed = callback;
			Main.alertBox.addClass('confirmable');
		}
	}

	/**
	 * Muestra con una animación el mensaje pasado como parámetro en la caja de mensajes.
	 */
	static message(text = '', timeout = 0) {
		Main.messageBox.finish();
		if (timeout)
			Main.messageBox.delay(timeout).queue(() => {
				Main.message();
				Main.messageBox.dequeue();
			});
		Main.messageBox.find('.letter').stop(true).remove();
		if (text.length > 0) {
			let letter;
			for (let i = text.length-1; i >= 0; i--) {
				letter = $('<span/>').text(text[i]).addClass('letter').css({
					opacity: 0,
					marginTop: '-1.5rem'
				});
				Main.messageBox.prepend(letter);
			}
			if (letter) Main.showLetter(letter);
		}
	}

	/**
	 * Método auxiliar que lanza el método message y que va llamando recursivamente a
	 * las siguientes letras para animarlas escalonádamente.
	 */
	static showLetter(letter) {
		letter.delay(20).queue(() => {
			letter.animate({ opacity: 1, marginTop: 0 }, 80).dequeue();
			Main.showLetter(letter.next());
		});
	}
	
}

$(document).ready(Main.run);
