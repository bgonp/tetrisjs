const COLS = 10;
const ROWS = 20;
const DELAY = 750;
const RIGHT = 'R';
const LEFT = 'L';
const DOWN = 'D';
const BOTTOM = 'B';

var shapes = [15, 78, 102, 108, 198, 226, 232];
var colors = ['#FFD836','#f58d41','#b565f3','#f54c95','#427EFF','#7ce634','#4ceae7'];
var autoSwitch = false;

class Main {

	static run() {
		let win = $(window);
		if (win.innerWidth() < 690 || win.innerHeight() < 600) {
			alert('Minimum screen resolution to play this game: 690x600');
			return;
		} else if (win.innerWidth() < 970 || win.innerHeight() < 850) {
			$('html').css('font-size', '7px');
		}

		Main.pressing = null;
		Main.repeating = null;
		Main.interval = 0;
		Main.timeout = 0;
		Main.blocked = false;

		Board.init();
		Main.initSettings();
		Main.initAlert();

		$('#container .buttons').accordion({
			active: false,
			collapsible: true,
			icons: null
		});

		$('#container .start').click((e) => {
			e.preventDefault();
			if (Board.playing) {
				Main.alert('This will end your current game. Are you sure?', () => {
					Board.finish();
					Main.clear();
					Board.start();
				});
			} else if (!Board.playing) {
				Main.clear();
				Board.start();
			}
		});

		win.keydown((e) => {
			if (Main.blocked) return;
			if (!Board.playing) {
				if (e.key === 's') {
					Main.clear();
					Board.start();
				}
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
				default: return;
			}
			e.preventDefault();
		});

		win.keyup((e) => {
			if (Main.repeating === e.key) Main.clear();
			if (Main.pressing === e.key) Main.pressing = null;
		});
	}

	static accordion(enable = true) {
		$('#container .buttons').accordion('option', 'active', enable);
		$('#container .buttons').accordion('option', 'disabled', !enable);
	}

	static clear() {
		Main.pressing = null;
		Main.repeating = null;
		clearInterval(Main.interval);
		clearTimeout(Main.timeout);
	}

	static action(key, callback, param, repeat = false) {
		if (repeat) {
			if (Main.repeating !== key) {
				Main.repeating = key;
				callback.bind(Board)(param);
				clearInterval(Main.interval);
				clearTimeout(Main.timeout);
				Main.timeout = setTimeout(() => Main.interval = setInterval(callback.bind(Board, param), 35), 70);
			}
		} else if (Main.pressing !== key){
			Main.pressing = key;
			callback(param);
		}
	}

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
		$('#container .settings-content .tetromino').each(function() {
			let tetromino = $(this);
			let index = tetromino.data('index');
			let value = shapes[index].toString(2).padStart(8, '0');
			tetromino.find('a').each(function(){
				let block = $(this);
				if (value[block.data('position')] === '1')
					block.addClass('selected');
				block.click(function(e) {
					let block = $(this);
					e.preventDefault();
					if (Board.playing) {
						Main.alert(message);
					} else if (!block.hasClass('selected') || block.parent().find('.selected').length > 2) {
						let index = block.parent().data('index');
						let position = block.data('position');
						shapes[index] += (block.hasClass('selected')?-1:1)*Math.pow(2, 7-position);
						block.toggleClass('selected');
					}
				});
			});
		});
	}

	static initAlert() {
		Main.alertBox = $('#container .alert');
		Main.alertBox.find('.close, .cancel, .ok').click(() => {
			Main.alertBox.fadeOut(50);
			Main.blocked = false;
		});
		Main.alertBox.find('.ok').click(() => Main.confirmed());
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
	
}

$(document).ready(Main.run);
