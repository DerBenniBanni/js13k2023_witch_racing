import { Tool } from "./tool.js";
import { PathThing } from "../things/pathThing.js";
import { Editable } from "./editable.js";

export class PathTool extends Tool {
	constructor() {
		super("path");
		this.path = null;
		this.type = ko.observable();
		this.editables.push(new Editable('Type', this.type, 'select', [
			{value:'t', label:'Trees'},
			{value:'r', label:'Rocks'},
			{value:'d', label:'Dirt'},
			{value:'p', label:'Fly-Path'},
			{value:'f', label:'Finish Line'}
		]));
	}
	execute(ev, editor) {
		if(ev.type == 'mousedown') {
			if(!this.path) {
				this.path = new PathThing();
				editor.things.push(this.path);
				this.path.type(this.type());
			}
			this.path.addPoint(editor.getTranslatedX(ev.x), editor.getTranslatedY(ev.y));
		} else if(ev.type == 'mousemove' && this.currentThing) {
		} else if(ev.type == 'mouseup') {
		}
	}
	activate(editor) {
		this.path = null;
	}
	deactivate(editor) {
		this.path = null;
	}
}