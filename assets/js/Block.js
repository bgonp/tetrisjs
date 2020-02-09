class Block {
	
	constructor(position, shape = 0) {
		this.position = { col: position.col, row: position.row };
		this.element = $('<div></div>');
		this.element.addClass('block shape-'+shape);
		this.element.css({ height: 100/ROWS+'%', width: 100/COLS+'%' });
		this.shape = shape;
		if (this.shape > 0) {
			this.square = $('<div></div>');
			this.square.addClass('square');
			this.element.append(this.square);
			this.shadow = $('<div></div>');
			this.shadow.addClass('shadow');
			this.element.append(this.shadow);
		}
	}

	canRotate(origin) {
		let distance = {
			col: origin.col - this.position.col,
			row: origin.row - this.position.row
		};
		this.destination = {
			col: this.position.col + distance.col + distance.row,
			row: this.position.row - distance.col + distance.row
		};
		return !Board.isFilled(this.destination);
	}

	rotate() {
		this.element.finish();
		this.element.animate({
			left: Board.getLeft(this.destination.col),
			top: Board.getTop(this.destination.row)
		}, 50);
		this.position = this.destination;
	}

	canMove(direction) {
		this.destination = { col: this.position.col, row: this.position.row	};
		switch (direction) {
			case DOWN: this.destination.row++; break;
			case LEFT: this.destination.col--; break;
			case RIGHT: this.destination.col++; break;
		}
		return !Board.isFilled(this.destination);
	}

	move(direction = false) {
		if (direction && !this.canMove(direction))
			return false;
		let css = {
			left: Board.getLeft(this.destination.col),
			top: Board.getTop(this.destination.row)
		};
		if (direction) {
			this.element.queue(() => {
				this.element.animate(css, 160, 'linear');
				this.element.dequeue();
			});
		} else {
			this.element.finish();
			this.element.animate(css, 80);
		}
		this.position = this.destination;
		return true;
	}

	moveTo(position) {
		this.element.finish();
		this.position = { col: position.col, row: position.row };
		let css = { left: Board.getLeft(this.position.col), top: Board.getTop(this.position.row) };
		if (this.shape > 0) this.element.animate(css, 80);
		else this.element.css(css);
	}

	remove() {
		if (this.shape > 0) {
			this.element.css('z-index', 20).animate({
				height: 400/ROWS+'%',
				width: 400/COLS+'%',
				margin: '-'+100/ROWS+'% -'+100/COLS+'%',
				opacity: 0
			}, {
				duration: 400,
				always: () => this.element.remove()
			});
		} else {
			this.element.remove();
		}
	}
	
}