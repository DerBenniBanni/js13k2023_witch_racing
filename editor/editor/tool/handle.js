import { RectangleThing } from "../things/rectangleThing.js";

export class Handle extends RectangleThing {
	constructor(thing, position) {
		super({x:0, y:0, w:8, h:8});
		this.thing = thing;
		this.position = position;
		this.color = '#ffffff';
		this.offset = 3;
		this.originX = 0.5; // 0 to 1
		this.originY = 0.5; // 0 to 1
	}
	updatePosition() {
		switch(this.position) {
			case 'tl':
				this.x(this.thing.x() - this.offset);
				this.y(this.thing.y() - this.offset);
				break;
			case 'tr':
				this.x(this.thing.x() + this.thing.w() + this.offset);
				this.y(this.thing.y() - this.offset);
				break;
			case 'bl':
				this.x(this.thing.x() - this.offset);
				this.y(this.thing.y() + this.thing.h() + this.offset);
				break;
			case 'br':
				this.x(this.thing.x() + this.thing.w() + this.offset);
				this.y(this.thing.y() + this.thing.h() + this.offset);
				break;
			case 'p':
				this.x(this.thing.x());
				this.y(this.thing.y());
				break;
			case 'r':
				this.x(this.thing.x() + this.thing.r());
				this.y(this.thing.y());
				break;
			default:
		}
	}
	move(dx, dy) {
		switch(this.position) {
			case 'tl':
				this.thing.x(this.thing.x() + dx);
				this.thing.w(this.thing.w() - dx);
				this.thing.y(this.thing.y() + dy);
				this.thing.h(this.thing.h() - dy);
				break;
			case 'tr':
				this.thing.w(this.thing.w() + dx);
				this.thing.y(this.thing.y() + dy);
				this.thing.h(this.thing.h() - dy);
				break;
			case 'bl':
				this.thing.x(this.thing.x() + dx);
				this.thing.w(this.thing.w() - dx);
				this.thing.h(this.thing.h() + dy);
				break;
			case 'br':
				this.thing.w(this.thing.w() + dx);
				this.thing.h(this.thing.h() + dy);
				break;
			case 'p':
				this.thing.x(this.thing.x() + dx);
				this.thing.y(this.thing.y() + dy);
				if(this.thing.parentThing) {
					this.thing.parentThing.updateBoundingBox();
				}
				break;
			case 'r':
				this.thing.r(Math.abs(this.thing.r() + dx));
			default:
		}
	}
	render(ctx) {
		this.updatePosition();
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x() - (this.w() / 2), this.y() - (this.h() / 2), this.w() , this.h());
		ctx.strokeStyle = '#000000';
		ctx.beginPath();
		ctx.rect(this.x() - (this.w() / 2), this.y() - (this.h() / 2), this.w(), this.h());
		ctx.stroke();
	}
}