/**
 * Clase que representa cada bloque de los que se forma un tetriminó.
 */
class Block {
	
	/**
	 * Crea el objeto en la posición indicada. Se mostrará del color pasado
	 * como parámetro. Si no se especifica color el objeto representará la
	 * proyección de otro bloque si se bajara del todo. Si no es una proyección,
	 * existirá un bloque detrás del bloque real que hará el efecto de
	 * bordearlo y será eliminado por el tetriminó al finalizar el movimiento.
	 */
	constructor(position, color = false) {
		this.position = { col: position.col, row: position.row };
		this.previous = {};
		this.undoable = false;
		this.element = $('<div/>');
		this.element.addClass('block');
		this.projection = !Boolean(color);
		this.element.css({ height: 100/ROWS+'%', width: 100/COLS+'%' });
		if (!this.projection) {
			this.square = $('<div/>');
			this.square.addClass('square');
			this.square.css('background', color);
			this.element.append(this.square);
			this.shadow = $('<div/>');
			this.shadow.addClass('shadow');
			this.element.append(this.shadow);
		} else {
			this.element.hide();
			this.element.addClass('projection');
		}
	}

	/**
	 * Recibe como parámetro una posición con respecto a la cual el bloque
	 * debe girar (en sentido horario). Fija la posición de destino y devuelve
	 * true si dicha posición esta libre.
	 */
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

	/**
	 * Finaliza los posibles efectos en cola y mueve el bloque al destino
	 * que se ha debido fijar previamente con canRotate()
	 */
	rotate() {
		this.translate(this.destination, ANIMATION_TIME/2);
	}

	/**
	 * Recibe como parámetro una dirección hacia la cual moverse y actualiza
	 * la posición de destino. Devuelve false si el destino esta ocupado.
	 */
	canMove(direction) {
		this.destination = { col: this.position.col, row: this.position.row	};
		switch (direction) {
			case DOWN: this.destination.row++; break;
			case LEFT: this.destination.col--; break;
			case RIGHT: this.destination.col++; break;
		}
		return !Board.isFilled(this.destination);
	}

	/**
	 * Mueve el bloque a la posición destino fijada previamente con canMove.
	 * Si se pasa como parámetro una dirección, llama internamente a dicho método
	 * canMove para fijar el destino. Devuelve true si ha podido moverse.
	 */
	move(direction = false) {
		if (direction && !this.canMove(direction))
			return false;
		this.translate(this.destination, ANIMATION_TIME);
		return true;
	}

	/**
	 * Mueve el bloque a la posición indicada como parámetro.
	 */
	moveTo(destination, finish = true) {
		this.translate(destination, ANIMATION_TIME, finish, true);
	}

	/**
	 * Método auxiliar para los métodos move(), moveTo(), y rotate() que traslada
	 * el bloque. Cuidado: no comprueba que la posición de destino este libre.
	 */
	translate(destination, animationTime, finish = true, clearPrevious = false) {
		if (finish)
			this.element.finish();
		else
			this.element.stop(true, false);
		this.setPrevious(clearPrevious);
		this.position = {
			col: destination.col,
			row: destination.row
		};
		let css = {
			left: (this.position.col*100/COLS)+'%',
			top: (this.position.row*100/ROWS)+'%'
		};
		if (this.projection) {
			this.element.delay(COYOTE_TIME).queue(() => {
				css.display = 'block';
				this.element.css(css);
				this.element.dequeue();
			});
		} else if (animationTime) {
			this.element.animate(css, animationTime);
		} else {
			this.element.css(css);
		}
	}

	/**
	 * Guarda la posición actual para deshacer el movimiento si la animación acaba
	 * de comenzar, para evitar movimientos de más y afinar el control. Una vez
	 * transcurrido el 'coyote time' se deshabilita la posibilidad de deshacer.
	 * Si el parámetro clear es true lo que hace es deshabilitar directamente esta
	 * opcion para el último movimiento.
	 */
	setPrevious(clear = false) {
		if (this.projection)
			return;
		clearTimeout(this.previousTimeout);
		if (clear) {
			this.undoable = false;
		} else {
			this.undoable = true;
			this.previous.col = this.position.col;
			this.previous.row = this.position.row;
			this.previousTimeout = setTimeout(() => this.undoable = false, COYOTE_TIME);
		}
	}

	/**
	 * Elimina el bloque con una animación.
	 */
	remove() {
		if (!this.projection) {
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