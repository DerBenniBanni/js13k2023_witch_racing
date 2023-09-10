export class BaseThing {
	constructor() {
		this.parentThing = null;
		this.editables = [];
		this.selected = false;
		this.type = null;
	}
	update() {}
	render(ctx) {}
	renderSelection(ctx) {}
	move(dx, dy) {}
	collidesPoint(x, y) {
		return false;
	}
}