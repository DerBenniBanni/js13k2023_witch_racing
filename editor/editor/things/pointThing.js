import { BaseThing } from "./baseThing.js";

export class PointThing extends BaseThing {
	constructor({x, y}) {
		super();
		this.x = ko.observable(x);
		this.y = ko.observable(y);
	}
	move(dx, dy) {
		this.x(this.x() + dx);
		this.y(this.y() + dy);
	}
}