import { Editable } from "../tool/editable.js";
import { RectangleThing } from "./rectangleThing.js";

export class Thing extends RectangleThing {
	constructor({x, y, w, h, color, type, checkpointNumber}) {
		super({x, y, w, h});
		this.color = ko.observable(color);

		this.selected = false;
		this.editables.push(new Editable('X', this.x));
		this.editables.push(new Editable('Y', this.y));
		this.editables.push(new Editable('Width', this.w));
		this.editables.push(new Editable('Height', this.h));
		this.editables.push(new Editable('Fill', this.color, 'color'));
		
		this.type = ko.observable(type);
		this.editables.push(new Editable('Type', this.type, 'select', [
			{value:'cp', label:'Checkpoint'},
		]));
		this.checkpointNumber = ko.observable(checkpointNumber);
		this.editables.push(new Editable('CP-Nr.', this.checkpointNumber));
	}
	clone() {
		let clone = new Thing({
			x:this.x(),
			y:this.y(),
			w:this.w(),
			h:this.h(),
			color:this.color()
		});
		return clone;
	}

	update() {
		this.x(Math.floor(this.x()));
		this.y(Math.floor(this.y()));
		this.w(Math.floor(this.w()));
		this.h(Math.floor(this.h()));
	}

	render(ctx) {
		ctx.strokeStyle = '#00000066';
		ctx.beginPath();
		ctx.rect(this.x(), this.y(), this.w() , this.h());
		ctx.stroke();
		ctx.fillStyle = this.color() + 'aa';
		ctx.fillRect(this.x(), this.y(), this.w() , this.h());
	}
	renderSelection(ctx) {
		ctx.strokeStyle = '#ffffffdd';
		ctx.beginPath();
		ctx.rect(this.x()-1, this.y()-1, this.w()+2, this.h()+2);
		ctx.stroke();
		ctx.strokeStyle = '#000000dd';
		ctx.setLineDash([2, 2]);
		ctx.beginPath();
		ctx.rect(this.x()-1, this.y()-1, this.w() +2, this.h()+2);
		ctx.stroke();
		ctx.setLineDash([]);
	}
}