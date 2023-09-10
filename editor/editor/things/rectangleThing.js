import { PointThing } from "./pointThing.js";
import { Editable } from "../tool/editable.js";


export class RectangleThing extends PointThing {
	constructor({x, y, w, h, ox, oy}) {
		super({x, y});
		this.w = ko.observable(w);
		this.h = ko.observable(h);
		this.originX = ox || 0; // 0 to 1
		this.originY = oy || 0; // 0 to 1
		
	}
	getBaseObj() {
		return {
			x:this.x(),
			y:this.y(),
			w:this.w(),
			h:this.h()
		};
	}
	collidesPoint(x, y) {
		return this.x() - this.w()*this.originX <= x && this.x() + this.w()*(1-this.originX) >= x
			&& this.y() - this.w()*this.originY <= y && this.y() + this.h()*(1-this.originY) >= y;
	}
}