import { Editable} from './../tool/editable.js';
import { PointThing } from './pointThing.js';

export class CircleThing extends PointThing {
	constructor({x, y, r, color, type, checkpointNumber}) {
		super({x, y});
		this.r = ko.observable(r);
		this.color = ko.observable(color);
		this.editables.push(new Editable('X', this.x));
		this.editables.push(new Editable('Y', this.y));
		this.editables.push(new Editable('Radius', this.r));
		this.editables.push(new Editable('Fill', this.color, 'color'));
		this.type = ko.observable(type);
		this.editables.push(new Editable('Type', this.type, 'select', [
			{value:'ps', label:'Player Pos'},
			{value:'cp', label:'Checkpoint'},
		]));
		this.checkpointNumber = ko.observable(checkpointNumber);
	}
	clone() {
		let clone = new CircleThing({
			x:this.x(),
			y:this.y(),
			r:this.r(),
			color:this.color()
		});
		return clone;
	}
	render(ctx) {
		let fillStyles = {
			'ps':'#ff0000', // PlayerStart
			'cp':'#ffff00', // Checkpoint
		};
		ctx.fillStyle = fillStyles[this.type()] || (this.color() + 'aa');
		ctx.beginPath();
		ctx.arc(this.x(), this.y(), this.r(), 0, Math.PI * 2);
		ctx.fill();
	}
	collidesPoint(x, y) {
		let dx = x - this.x();
		let dy = y - this.y();
		let distance = Math.sqrt(dx*dx + dy*dy);
		return distance <= this.r();
	}
	renderSelection(ctx) {
		ctx.strokeStyle = '#ffffffdd';
		ctx.beginPath();
		ctx.arc(this.x(), this.y(), this.r(), 0, Math.PI * 2);
		ctx.stroke();
		ctx.strokeStyle = '#000000dd';
		ctx.setLineDash([2, 2]);
		ctx.beginPath();
		ctx.arc(this.x(), this.y(), this.r(), 0, Math.PI * 2);
		ctx.stroke();
		ctx.setLineDash([]);
	}
}