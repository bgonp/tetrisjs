/**
 * Clase que crea objetos que representan cada uno de los tableros y métodos
 * y propiedades estáticos para operar en ellos.
 */
class Board {

	/**
	 * Crea un objeto que representa uno de los tableros en los que se juega.
	 */
	constructor(current = false) {
		this.element = $('<div/>').addClass('board');
		this.cells = new Array(COLS);
		this.element.css(current ? Board.style.current : Board.style.normal);
		this.reset();
		Board.container.append(this.element);
	}

	/**
	 * Inicializa el array bidimensional de posiciones ocupadas a false.
	 */
	reset() {
		this.element.removeClass('combo');
		for (let i = 0; i < COLS; i++)
			this.cells[i] = new Array(ROWS).fill(false);
	}

	/**
	 * Método estático que inicializa las propiedades del juego y crea los tableros.
	 */
	static init() {
		Board.style = {
			current: { top: 0, right: 0, bottom: 0, left: 0 },
			normal: { top: 0, right: (COLS+1)*4+'rem', bottom: '50%', left: '-'+(COLS/2+1)*4+'rem' }
		}
		Board.container = $('#container');
		Board.container.css({ height: ROWS*4+'rem', width: COLS*4+'rem' });
		Board.current = 0;
		Board.scoreboard = Board.container.find('.scoreboard');
		Board.levelboard = Board.container.find('.levelboard');
		Board.predictor = Board.container.find('.predictor');
		Board.paused = false;
		Board.playing = false;
		Board.boards = [new Board(true), new Board()];
		Main.message('TETRIS SWITCH');
	}

	/**
	 * Comienza el juego, eliminando los posibles restos de una partida anterior
	 */
	static start() {
		Board.finish();
		Board.state = 0;
		Board.delay = 1000;
		Board.level = 0;
		Board.score = 0;
		Board.multiplier = 1;
		Board.lastCleared = null;
		Board.playing = true;
		Board.container.find('.block').remove();
		Board.updateScore();
		Board.updateLevel();
		for (let board of Board.boards) board.reset();
		Main.message();
		Board.next = new Tetrimino(Board.delay);
		Board.add();
		Main.clear();
		Main.accordion(false);
		Main.startButton.text('FINISH');
	}


	/**
	 * Pausa el juego, deteniendo el movimiento de los bloques y ocultándolos.
	 */
	static pause() {
		if (!Board.playing) return;
		Board.paused = Board.tetrimino.pause();
		Board.container.find('.block').finish().fadeToggle(ANIMATION_TIME);
		Main.message(Board.paused ? 'PAUSED' : false);
		Main.pauseButton.text(Board.paused ? 'RESUME' : 'PAUSE');
		Main.accordion(Board.paused);
	}

	/**
	 * Llama a la acción de mover del tetriminó en juego y lo almacena si es necesario.
	 */
	static move(direction) {
		if (!Board.paused && Board.playing) {
			let moved = Board.tetrimino.move(direction);
			if (direction === BOTTOM) {
				Board.score += Math.floor(moved/2);
				Board.updateScore();
				Board.tetrimino.finish();
				Board.stack();
			}
		}
	}

	/**
	 * Llama a la acción de rotar del tetramino en juego.ç
	 */
	static rotate() {
		if (!Board.paused && Board.playing)
			Board.tetrimino.rotate();
	}

	/**
	 * Intercambia los tableros en juego.
	 */
	static switch() {
		if (Board.paused || !Board.playing) return;
		let canSwitch;
		let previous = Board.current;
		for (let i = 0; i < Board.boards.length; i++) {
			Board.current = (Board.current+1) % Board.boards.length;
			if (Board.current !== previous) {
				for (let block of Board.tetrimino.blocks) {
					canSwitch = true;
					if (Board.isFilled(block.position)) {
						canSwitch = false;
						break;
					}
				}
				if (canSwitch) break;
			}
		}
		if (canSwitch) {
			for (let i = 0; i < Board.boards.length; i++) {
				if (i === Board.current)
					Board.boards[i].element.animate(Board.style.current, ANIMATION_TIME*2);
				else
					Board.boards[i].element.animate(Board.style.normal, ANIMATION_TIME*2);
			}
			Board.tetrimino.project();
			Board.tetrimino.setTimeout();
			return true;
		}
		Board.current = previous;
		return false;
	}

	/**
	 * Añade un nuevo tetraminó y lo pone en juego. También actualiza el siguiente
	 * que entrará en juego.
	 */
	static add() {
		Board.updateDelay();
		Board.tetrimino = Board.next;
		Board.predict();
		for (let block of Board.tetrimino.blocks) {
			block.element.css({
				height: 100/ROWS+'%',
				width: 100/COLS+'%',
				left: (block.position.col*100/COLS)+'%',
				top: (block.position.row*100/ROWS)+'%'
			});
			Board.container.append(block.element);
		}
		for (let block of Board.tetrimino.blocks)
			if (Board.isFilled(block.position) && (autoSwitch || !Board.switch()))
				Board.finish();
		if (Board.playing) {
			Board.tetrimino.start();
			for (let block of Board.tetrimino.projection)
				Board.container.append(block.element);
		}
	}

	/**
	 * Calcula y actualiza el delay con el que se moverá la siguiente pieza en juego.
	 * Cada vez que se ejecuta se decrementa el tiempo del intervalo en un 3%.
	 */
	static updateDelay() {
		if (Board.delay > 10) {
			Board.delay = Math.floor(Board.delay*0.97);
			if (Board.delay <= Math.pow(10-Board.level, 4)/10) {
				Board.level++;
				Main.message('LEVEL '+Board.level, 2000);
				Board.updateLevel();
			} else if (Board.delay <= 10) {
				Board.delay = 10;
				Main.message('MAX SPEED!', 2000);
			}
		}
	}

	/**
	 * Actualiza la predicción de tetriminó. Esto es la pieza que se pondrá en juego
	 * una vez finalice la actual.
	 */
	static predict() {
		Board.next = new Tetrimino(Board.delay);
		Board.predictor.find('.block').remove();
		for (let block of Board.next.blocks) {
			block.element.css({
				height: '2rem',
				width: '2rem',
				left: (block.position.col*2+3)+'rem',
				top: (block.position.row*2+2)+'rem'
			});
			Board.predictor.append(block.element);
		}
	}

	/**
	 * Fija la pieza actual al tablero en juego, impidiendo que se ejecuten nuevas
	 * acciones sobre ella, excepto cuando se elimina una fila completa. Además,
	 * llama a la puesta en marcha del siguiente tetriminó.
	 */
	static stack() {
		let cleared;
		let lines = 0;
		let rows = [];
		Board.tetrimino.finish();
		for (let block of Board.tetrimino.blocks) {
			Board.getBoard().append(block.element);
			Board.getCells()[block.position.col][block.position.row] = block;
			if (!rows.includes(block.position.row)) rows.push(block.position.row);
		}
		rows.sort((a, b) => a - b);
		for (let row of rows) {
			cleared = true;
			for (let col = 0; col < COLS && cleared; col++)
				if (Board.getCells()[col][row] === false)
					cleared = false;
			if (cleared) {
				lines++;
				Board.clearRow(row);
			}
		}
		if (lines > 0) {
			if (!autoSwitch) {
				if (Board.current === Board.lastCleared || Board.lastCleared === null)
					Board.multiplier = 1;
				else
					Board.multiplier += 0.25;
				for (let i = 0; i < Board.boards.length; i++)
					if (i === Board.current)
						Board.boards[i].element.removeClass('combo');
					else
						Board.boards[i].element.addClass('combo');
			}
			let points = 100*(Math.pow(lines, 3));
			let message = '+'+points+(Board.multiplier > 1 ? ' (x'+Board.multiplier+')':'');
			Main.message(message, 2000);
			points *= Math.floor(Board.multiplier);
			Board.score += points;
			Board.updateScore();
			Board.lastCleared = Board.current;
		}
		Board.add();
		if (autoSwitch && lines > 0) Board.switch();
	}

	/**
	 * Llama a la acción de deshacer del tetriminó en juego.
	 */
	static undo() {
		if (Board.tetrimino) Board.tetrimino.undo();
	}

	/**
	 * Devuelve la matriz bidimensional de posiciones ocupadas del tablero.
	 */
	static getCells() {
		return Board.boards[Board.current].cells;
	}

	/**
	 * Devuelve el objeto Board correspondiente al tablero en juego.
	 */
	static getBoard() {
		return Board.boards[Board.current].element;
	}

	/**
	 * Devuelve true si la posición pasada como parámetro ya está ocupada en el tablero
	 * en juego por otro bloque, o es fuera de los límites.
	 */
	static isFilled(position) {
		return position.col < 0 || position.col >= COLS || position.row >= ROWS ||
			(position.row >= 0 && Board.getCells()[position.col][position.row] !== false);
	}

	/**
	 * Elimina todos los bloques de la fila indicada como parámetro y hace descender a
	 * todos los bloques superiores.
	 */
	static clearRow(row) {
		for (let col = 0; col < COLS; col++) {
			Board.getCells()[col][row].remove();
			Board.getCells()[col][row] = false;
		}
		while (--row >= 0) {
			for (let col = 0; col < COLS; col++) {
				if (Board.getCells()[col][row] instanceof Block)
					Board.getCells()[col][row].move(DOWN);
				Board.getCells()[col][row+1] = Board.getCells()[col][row];
				Board.getCells()[col][row] = false;
			}
		}
	}

	/**
	 * Actualiza el marcador de puntos con una animación hasta que se iguale con los
	 * puntos reales actuales. También indica el multiplicador actual si existe.
	 */
	static updateScore() {
		let score = parseInt(Board.scoreboard.text()) + 5;
		let mult = Board.multiplier > 1 ? '<span>x'+Board.multiplier.toFixed(2)+'</span>':'';
		if (score > Board.score) {
			Board.scoreboard.finish().html(Board.score+mult);
		} else {
			Board.scoreboard.dequeue().html(score+mult).delay(15).queue(Board.updateScore);
		}
	}

	/**
	 * Actualiza el marcador de nivel con el nivel actual.
	 */
	static updateLevel() {
		Board.levelboard.text('LEVEL '+Board.level);
	}

	/**
	 * Finaliza el juego.
	 */
	static finish() {
		if (!Board.playing) return;
		if (Board.paused) Board.pause();
		Board.tetrimino.finish();
		Board.playing = false;
		Board.container.find('.combo').removeClass('combo');
		Main.message('GAME OVER');
		Main.accordion(true);
		Main.startButton.text('NEW GAME');
	}

}
