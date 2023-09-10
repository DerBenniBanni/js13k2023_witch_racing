import { Tool } from "./tool.js";
import { Editable } from "./editable.js";
import { Thing } from "../things/thing.js";

export class RectangleTool extends Tool {
	constructor() {
		super("rectangle");

		this.currentThing = null;
		this.start = {x:0, y:0};
		
		this.color = ko.observable('#dddddd');
		this.editables.push(new Editable('Fill', this.color, 'color'));
		this.type = ko.observable('ps');
		this.editables.push(new Editable('Type', this.type, 'select', [
			{value:'cp', label:'Checkpoint'},
		]));
	}
	execute(ev, editor) {
		if(ev.type == 'mousedown') {
			this.start.x = ev.x;
			this.start.y = ev.y;
			let cpNr = this.editor.things.reduce((count,thing) => { return count + (thing.type && thing.type() == 'cp' ? 1 : 0);}, 0);
			let thing = new Thing({
				x:editor.getTranslatedX(ev.x),
				y:editor.getTranslatedY(ev.y),
				w:0,
				h:0,
				color:this.color(),
				type:this.type(),
				checkpointNumber:cpNr
			});
			editor.things.push(thing);
			this.currentThing = thing;
		} else if(ev.type == 'mousemove' && this.currentThing) {
			let w = ev.x - this.start.x;
			let h = ev.y - this.start.y;
			this.currentThing.w(w);
			this.currentThing.h(h);
		} else if(ev.type == 'mouseup') {
			if(this.currentThing.w() < 0) {
				this.currentThing.w(this.currentThing.w() * -1);
				this.currentThing.x(this.currentThing.x() - this.currentThing.w());
			}
			if(this.currentThing.h() < 0) {
				this.currentThing.h(this.currentThing.h() * -1);
				this.currentThing.y(this.currentThing.y() - this.currentThing.h());
			}
			if(this.currentThing.w() == 0) {
				this.currentThing.w(1);
			}
			if(this.currentThing.h() == 0) {
				this.currentThing.h(1);
			}
			this.currentThing = null;
		}
	}
}