import { Tool } from "./tool.js";
import { Editable } from "./editable.js";
import { Thing } from "../things/thing.js";

export class PointTool extends Tool {
	constructor() {
		super("point");
		this.currentThing = null;
		this.size = ko.observable(2);
		this.color = ko.observable('#dddddd');
		this.editables.push(new Editable('Size', this.size, 'text'));
		this.editables.push(new Editable('Fill', this.color, 'color'));
	}
	execute(ev, editor) {
		if(ev.type == 'mousedown') {
			let thing = new Thing({
				x:editor.getTranslatedX(ev.x),
				y:editor.getTranslatedY(ev.y),
				w:this.size(),
				h:this.size(),
				color:this.color()
			});
			editor.things.push(thing);
			this.currentThing = thing;
		} else if(ev.type == 'mousemove' && this.currentThing) {
			this.currentThing.x(editor.getTranslatedX(ev.x));
			this.currentThing.y(editor.getTranslatedY(ev.y));
		} else if(ev.type == 'mouseup') {
			this.currentThing = null;
		}
	}
}