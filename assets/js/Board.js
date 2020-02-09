class Board {

	constructor(current = false) {
		this.element = $('<div/>').addClass('board');
		this.cells = new Array(COLS);
		this.element.css(current ? Board.style.current : Board.style.normal);
		this.reset();
		Board.container.append(this.element);
	}

	reset() {
		this.element.removeClass('combo');
		for (let i = 0; i < COLS; i++)
			this.cells[i] = new Array(ROWS).fill(false);
	}

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
		Board.modal = Board.container.find('.modal');
		Board.playing = false;
		Board.boards = [new Board(true), new Board()];
		Board.message('TETRIS SWITCH');
	}

	static start() {
		if (!Board.playing) {
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
			Board.message();
			Board.next = new Tetromino(Board.delay);
			Board.add();
			Main.clear();
			Main.accordion(false);
			Main.startButton.text('FINISH');
		}
	}

	static pause() {
		if (!Board.playing) return;
		Board.paused = Board.tetromino.pause();
		Board.container.find('.block').fadeToggle(0);
		Board.message(Board.paused ? 'PAUSED' : false);
		Main.accordion(Board.paused);
	}

	static move(direction) {
		if (!Board.paused && Board.playing) {
			let moved = Board.tetromino.move(direction);
			if (direction === BOTTOM) {
				Board.score += Math.floor(moved/2);
				Board.updateScore();
				Board.tetromino.finish();
				Board.stack();
			}
		}
	}

	static rotate() {
		if (!Board.paused && Board.playing)
			Board.tetromino.rotate();
	}

	static switch() {
		if (Board.paused || !Board.playing) return;
		let canSwitch;
		let previous = Board.current;
		for (let i = 0; i < Board.boards.length; i++) {
			Board.current = (Board.current+1) % Board.boards.length;
			if (Board.current !== previous) {
				for (let block of Board.tetromino.blocks) {
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
					Board.boards[i].element.animate(Board.style.current, 80);
				else
					Board.boards[i].element.animate(Board.style.normal, 80);
			}
			Board.tetromino.project();
			Board.tetromino.setTimeout();
			return true;
		}
		Board.current = previous;
		return false;
	}

	static add() {
		Board.updateDelay();
		Board.tetromino = Board.next;
		Board.predict();
		for (let block of Board.tetromino.blocks) {
			block.element.css({
				height: 100/ROWS+'%',
				width: 100/COLS+'%',
				left: (block.position.col*100/COLS)+'%',
				top: (block.position.row*100/ROWS)+'%'
			});
			Board.container.append(block.element);
		}
		for (let block of Board.tetromino.blocks)
			if (Board.isFilled(block.position) && (autoSwitch || !Board.switch()))
				Board.finish();
		if (Board.playing) {
			for (let block of Board.tetromino.projection)
				Board.container.append(block.element);
			Board.tetromino.start();
		}
	}

	static updateDelay() {
		if (Board.delay > 10) {
			Board.delay = Math.floor(Board.delay*0.97);
			if (Board.delay <= Math.pow(10-Board.level, 4)/10) {
				Board.level++;
				Board.message('LEVEL '+Board.level, 2000);
				Board.updateLevel();
			} else if (Board.delay <= 10) {
				Board.delay = 10;
				Board.message('MAX SPEED!', 2000);
			}
		}
	}

	static predict() {
		Board.next = new Tetromino(Board.delay);
		Board.predictor.find('.block').remove();
		for (let block of Board.next.blocks) {
			block.element.css({
				height: '2rem',
				width: '2rem',
				left: (block.position.col*2+2)+'rem',
				top: (block.position.row*2+2)+'rem'
			});
			Board.predictor.append(block.element);
		}
	}

	static stack() {
		let cleared;
		let lines = 0;
		let rows = [];
		Board.tetromino.finish();
		for (let block of Board.tetromino.blocks) {
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
			Board.message(message, 2000);
			points *= Math.floor(Board.multiplier);
			Board.score += points;
			Board.updateScore();
			Board.lastCleared = Board.current;
		}
		Board.add();
		if (autoSwitch && lines > 0) Board.switch();
	}

	static getLeft(col) {
		return (col*100/COLS)+'%';
	}

	static getTop(row) {
		return (row*100/ROWS)+'%';
	}

	static getCells() {
		return Board.boards[Board.current].cells;
	}

	static getBoard() {
		return Board.boards[Board.current].element;
	}

	static isFilled(position) {
		return position.col < 0 || position.col >= COLS || position.row >= ROWS ||
			(position.row >= 0 && Board.getCells()[position.col][position.row] !== false);
	}

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

	static updateScore() {
		let score = parseInt(Board.scoreboard.text()) + 5;
		let mult = Board.multiplier > 1 ? '<span>x'+Board.multiplier.toFixed(2)+'</span>':'';
		if (score > Board.score) {
			Board.scoreboard.finish().html(Board.score+mult);
		} else {
			Board.scoreboard.dequeue().html(score+mult).delay(15).queue(Board.updateScore);
		}
	}

	static updateLevel() {
		Board.levelboard.text('LEVEL '+Board.level);
	}

	static finish() {
		if (Board.paused) Board.pause();
		Board.tetromino.finish();
		Board.playing = false;
		Board.container.find('.combo').removeClass('combo');
		Board.message('GAME OVER :(');
		Main.accordion(true);
		Main.startButton.text('NEW GAME');
	}

	static message(text = '', timeout = 0) {
		Board.modal.finish();
		if (timeout)
			Board.modal.delay(timeout).queue(() => {
				Board.message();
				Board.modal.dequeue();
			});
		Board.modal.find('.letter').stop(true).remove();
		if (text.length > 0) {
			let letter;
			for (let i = text.length-1; i >= 0; i--) {
				letter = $('<span/>').text(text[i]).addClass('letter').css({ opacity: 0, marginTop: '-1.5rem' });
				Board.modal.prepend(letter);
			}
			if (letter) Board.showLetter(letter);
		}
	}

	static showLetter(letter) {
		letter.delay(20).queue(() => {
			letter.animate({ opacity: 1, marginTop: 0 }, 80).dequeue();
			Board.showLetter(letter.next());
		});
	}

}

// linkin words transition words
