/**
 * Clase que representa un tetriminó. Esta compuesto de sus bloques reales y
 * otros bloques que indican la proyección del tetriminó en la posició más baja
 */
class Tetrimino {

	/**
	 * Crea el objeto con un intervalo pasado como parámetro y cada vez que
	 * transcurre ese intervalo, baja una posición. La forma del tetriminó será
	 * una aleatoria de entre las contenidas en la constante SHAPES y con su
	 * color asociado dentro de la constante COLORS. Para generar la forma del
	 * tetriminó se usa un número de 8 bits ya que es una matriz de 2 x 8
	 * posiciones las cuales pueden tener bloque o no.
	 */
	constructor(delay) {
		this.delay = delay;
		this.blocks = [];
		this.projection = [];
		let index = Math.floor(Math.random()*SHAPES.length);
		this.shape = SHAPES[index];
		this.color = COLORS[index];
		let shape = this.shape.toString(2).padStart(8, '0');
		let row = this.shape < 16 ? -1 : 0;
		for (let i = 0; i < 8; ++i) {
			if(shape[i] === '1') {
				let position = {
					col: Math.floor(COLS/2 - 2 + i % 4),
					row: i < 4 ? row : row + 1
				};
				this.blocks.push(new Block(position, this.color));
				this.projection.push(new Block(position));
			}
		}
		this.getCenter();
	}

	/**
	 * Inicializa el intervalo de bajar el tetriminó, comprueba que en la
	 * posición actual puede bajar y crea la proyección de los bloques en la
	 * posición más baja posible del tablero.
	 */
	start() {
		this.interval = setInterval(() => this.move(DOWN), this.delay);
		this.setTimeout();
		this.project();
	}

	/**
	 * Pausa o reanuda el progreso del tetriminó.
	 */
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

	/**
	 * Finaliza el progreso del tetriminó y elimina los bloques sombra y
	 * proyección.
	 */
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

	/**
	 * Calcula el centro de los bloques que forman el tetriminó para usarlo
	 * de origen de rotación y referencia de la posición actual.
	 */
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
			if (this.blocks[i].position.row === limits.minRow) blocks.top++;
			else blocks.bottom++;
		}
		let width = limits.maxCol - limits.minCol;
		let height = limits.maxRow - limits.minRow;
		this.center = { col: width/2 + limits.minCol, row: -0.5 + height };
		if (Math.max(width, height) % 2 === 0)
			this.center.row = blocks.bottom > blocks.top ? 1 : 0;
	}

	/**
	 * Comprueba que el tetriminó pueda moverse hacia abajo y si no es así,
	 * comienza un timeout para anclarlo al tablero y finalizarlo.
	 */
	setTimeout() {
		if (this.canMove(DOWN)) {
			clearTimeout(this.timeout);
			this.timeout = null;
		} else if (!this.timeout)
			this.timeout = setTimeout(Board.stack, DELAY);
	}
	
	/**
	 * Comprueba que cada uno de los bloques pueda moverse en la dirección
	 * indicada como parámetro.
	 */
	canMove(direction) {
		for (let block of this.blocks)
			if (!block.canMove(direction))
				return false;
		return true;
	}

	/**
	 * Mueve todos los bloques en la dirección indicada.
	 */
	move(direction, animation = true) {
		if (direction === BOTTOM) {
			let deep = this.deep();
			this.lastDirection = BOTTOM;
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
			this.center.col += direction === RIGHT ? 1 : -1;
		}
		for (let block of this.blocks) {
			block.move();
			if (!animation) block.element.finish();
		}
		this.lastDirection = direction;
		this.setTimeout();
		this.project();
		return true;
	}
	
	/**
	 * Comprueba que cada uno de los bloques pueda girar en sentido horario
	 * usando el centro del tetriminó como origen del giro.
	 */
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

	/**
	 * Mueve todos los bloques a la posición correspondiente a la rotación,
	 * actualiza la proyección y comprueba si puede seguir moviéndose hacia
	 * abajo.
	 */
	rotate() {
		if (!this.canRotate())
			return false;
		this.lastDirection = false;
		for (let i = 0; i < this.blocks.length; i++) {
			this.blocks[i].rotate();
			this.projection[i].moveTo(this.blocks[i].position);
		}
		this.setTimeout();
		this.project();
		return true;
	}

	/**
	 * Intenta deshacer el último movimiento efectuado. Esto es para evitar
	 * que el tetriminó se haya movido más de lo deseado si la animación
	 * correspondiente acaba de comenzar. Es lo que se llama 'Coyote Time'.
	 */
	undo() {
		if (this.lastDirection !== LEFT && this.lastDirection !== RIGHT) return;
		for (let block of this.blocks) if (!block.undoable) return;
		for (let block of this.blocks) block.moveTo(block.previous, false);
		this.center.col += this.lastDirection === LEFT ? 1 : -1;
		this.lastDirection = false;
		this.project();
	}

	/**
	 * Mueve los bloques de proyección a la posición más baja posible para
	 * proyectar la posición final de la pieza si no se moviera lateralmente
	 * ni se rotase.
	 */
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

	/**
	 * Devuelve cuántas posiciones puede moverse el tetriminó desde la posición
	 * actual hacia abajo.
	 */
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