import { Tool } from "./tool.js";
import { Editable } from "./editable.js";
import { CircleThing } from "../things/circleThing.js";

export class CircleTool extends Tool {
	constructor() {
		super("circle");
		this.color = ko.observable('#dddddd');
		this.editables.push(new Editable('Fill', this.color, 'color'));
		this.start = {x:0, y:0};
		this.type = ko.observable('ps');
		this.editables.push(new Editable('Type', this.type, 'select', [
			{value:'ps', label:'Player Pos'},
		]));
		this.checkpointNumber = ko.observable();
		this.editables.push(new Editable('CP-Nr.', this.checkpointNumber));
	}
	execute(ev, editor) {
		if(ev.type == 'mousedown') {
			this.start.x = ev.x;
			this.currentThing = new CircleThing({
				x:editor.getTranslatedX(ev.x), 
				y:editor.getTranslatedY(ev.y),
				r:2,
				color:this.color(),
				type:this.type(),
				checkpointNumber:this.checkpointNumber()
			});
			editor.things.push(this.currentThing);
		} else if(ev.type == 'mousemove' && this.currentThing) {
			let r = ev.x - this.start.x;
			this.currentThing.r(Math.abs(r));
		} else if(ev.type == 'mouseup') {
			this.currentThing = null;
		}
	}
}