class Tetromino {

	constructor(delay) {
		delay = 100000; // TODO BORRAR
		this.delay = delay;
		this.blocks = [];
		this.projection = [];
		this.shape = shapes[Math.floor(Math.random()*shapes.length)];
		let shape = this.shape.toString(2).padStart(8, '0');
		let row = this.shape < 16 ? -1 : 0;
		for (let i = 0; i < 8; ++i) {
			if(shape[i] === '1') {
				let position = {
					col: Math.floor(COLS/2 - 2 + i % 4),
					row: i < 4 ? row : row + 1
				};
				this.blocks.push(new Block(position, this.shape));
				this.projection.push(new Block(position));
			}
		}
		this.getCenter();
	}

	start() {
		this.interval = setInterval(() => this.move(DOWN), this.delay);
		this.setTimeout();
		for (let i = 0; i < this.projection.length; i++)
			this.projection[i].element.css({
				height: this.blocks[i].element.css('height'),
				width: this.blocks[i].element.css('width')
			});
		this.project();
	}

	pause() {
		if (this.interval || this.timeout) {
			clearInterval(this.interval);
			this.interval = null;
			clearTimeout(this.timeout);
			this.timeout = null;
			return true;
		}
		this.start();
		return false;
	}

	finish() {
		clearInterval(this.interval);
		this.interval = null;
		clearTimeout(this.timeout);
		this.timeout = null;
		for (let i = 0; i < this.blocks.length; i++) {
			this.blocks[i].shadow.remove();
			this.projection[i].remove();
		}
	}

	getCenter() {
		let limits = { minCol: COLS, maxCol: -1, minRow: ROWS, maxRow: -1 };
		let blocks = { top: 0, bottom: 0 };
		for (let i = 0; i < this.blocks.length; i++) {
			let col = this.blocks[i].position.col;
			let row = this.blocks[i].position.row;
			if (col > limits.maxCol) limits.maxCol = col;
			if (col < limits.minCol) limits.minCol = col;
			if (row > limits.maxRow) limits.maxRow = row;
			if (row < limits.minRow) limits.minRow = row;
			if (this.blocks[i].position.row === limits.maxRow) blocks.bottom++;
			else blocks.top++;
		}
		let width = limits.maxCol - limits.minCol;
		let height = limits.maxRow - limits.minRow;
		this.center = { col: width/2 + limits.minCol, row: -0.5 + height };
		if (Math.max(width, height) % 2 === 0)
			this.center.row = blocks.bottom > blocks.top ? 1 : 0;
	}

	setTimeout() {
		if (this.canMove(DOWN)) {
			clearTimeout(this.timeout);
			this.timeout = null;
		} else if (!this.timeout)
			this.timeout = setTimeout(Board.stack, DELAY);
	}

	stopAnimation() {
	}

	canMove(direction) {
		for (let block of this.blocks)
			if (!block.canMove(direction))
				return false;
		return true;
	}

	move(direction, animation = true) {
		if (direction === BOTTOM) {
			let deep = this.deep();
			this.center.row += deep;
			for (let block of this.blocks)
				block.moveTo({ col: block.position.col, row: block.position.row + deep });
			return deep;
		} else if (direction === DOWN) {
			if (!this.canMove(DOWN))
				return false;
			this.center.row++;
		} else if (direction === LEFT || direction === RIGHT) {
			if (!this.canMove(direction))
				return false;
			this.center.col = this.center.col + (direction === RIGHT ? 1 : -1);
		}
		for (let block of this.blocks) {
			block.move();
			if (!animation) block.element.finish();
		}
		this.setTimeout();
		this.project();
		return true;
	}

	canRotate() {
		let canRotate = true;
		let tryMove = false;
		for (let block of this.blocks)
			if (!block.canRotate(this.center)) {
				canRotate = false;
				if (block.destination.col < 0)
					tryMove = RIGHT;
				else if (block.destination.col >= COLS)
					tryMove = LEFT;
			}
		if (!canRotate && tryMove && this.move(tryMove)) {
			canRotate = this.canRotate();
			if (!canRotate)
				this.move(tryMove === LEFT ? RIGHT : LEFT, false);
		}
		return canRotate;
	}

	rotate() {
		if (!this.canRotate()) return false;
		for (let i = 0; i < this.blocks.length; i++) {
			this.blocks[i].rotate();
			this.projection[i].moveTo(this.blocks[i].position);
		}
		this.setTimeout();
		this.project();
		return true;
	}

	project() {
		let deep = this.deep();
		for (let i = 0; i < this.blocks.length; i++) {
			let destination = {
				col: this.blocks[i].position.col,
				row: this.blocks[i].position.row + deep, 
			};
			this.projection[i].moveTo(destination);
		}
	}

	deep() {
		let deep = 0;
		let canMove;
		if (!this.canMove(DOWN)) return 0;
		do {
			canMove = true;
			for (let block of this.blocks)
				if (Board.isFilled({ col: block.position.col, row: block.position.row + deep+1})) {
					canMove = false;
					break;
				}
			if (canMove) deep++;
		} while (canMove);
		return deep;
	}

}