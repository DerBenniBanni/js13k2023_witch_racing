import { Tool } from './tool.js';
import { Action } from './action.js';
import { PathThing } from '../things/pathThing.js';
import { CircleThing } from '../things/circleThing.js';
import { Handle } from './handle.js';
import { RectangleThing } from '../things/rectangleThing.js';


export class SelectTool extends Tool {
	constructor() {
		super("select");
		this.selectedThing = null;
		this.grabbedHandle = null;
		this.start = {x:0, y:0};
		this.dragging = false;
		this.actions.push(new Action("sort up", ()=>this.onSortUp()));
		this.actions.push(new Action("sort down", ()=>this.onSortDown()));
		this.actions.push(new Action("duplicate", ()=>this.onDuplicate()));
	}
	execute(ev, editor) {
		if(ev.type == 'mousedown') {
			this.onMouseDown(ev);
		} else if(ev.type == 'mousemove') {
			this.onMouseMove(ev);
		} else if(ev.type == 'mouseup') {
			this.onMouseUp(ev);
		}
	}
	onDuplicate() {
		if(!this.selectedThing) {
			return;
		}
		let thing = this.selectedThing.clone();
		this.selectedThing.selected = false;
		thing.selected = true;
		this.editor.things.push(thing);
		this.selectedThing = thing;
		this.editor.selectedThing(thing);
		this.createHandles(this.editor);
	}
	onSortUp() {
		if(this.editor.things.length == 0 || this.editor.things[this.editor.things.length-1] === this.selectedThing) {
			return;
		}
		let things = [];
		for(let i = 0; i < this.editor.things.length; i++) {
			let current = this.editor.things[i];
			let next = i+1 < this.editor.things.length ? this.editor.things[i+1] : null;
			let prev = i > 0 ? this.editor.things[i-1] : null;
			if(current === this.selectedThing && next) {
				things.push(next);
			}
			if(!prev || prev !== this.selectedThing) {
				things.push(current);
			}
		}
		this.editor.things = [];
		things.forEach(t => this.editor.things.push(t));
	}
	onSortDown() {
		if(this.editor.things.length == 0 || this.editor.things[0] === this.selectedThing) {
			return;
		}
		let things = [];
		for(let i = 0; i < this.editor.things.length; i++) {
			let current = this.editor.things[i];
			let next = i+1 < this.editor.things.length ? this.editor.things[i+1] : null;
			if(next && next === this.selectedThing) {
				things.push(next);
			}
			if(current !== this.selectedThing) {
				things.push(current);
			}
		}
		this.editor.things = [];
		things.forEach(t => this.editor.things.push(t));
	}
	onMouseDown(ev) {
		this.start.x = ev.x;
		this.start.y = ev.y;
		if(this.grabbedHandle) {
			this.grabbedHandle = null;
		}
		editor.handles.forEach(handle => {
			if(handle.collidesPoint(this.start.x - editor.translation.x, this.start.y - editor.translation.y)) {
				this.grabbedHandle = handle;
			}
		});
		if(this.grabbedHandle) {
			return;
		}
		if(this.selectedThing) {
			this.selectedThing.selected = false;
			this.selectedThing = null;
		}
		editor.things.forEach(thing => {
			if(thing.collidesPoint(this.start.x - editor.translation.x, this.start.y - editor.translation.y)) {
				if(this.selectedThing) {
					this.selectedThing.selected = false;
				}
				this.selectedThing = thing;
				thing.selected = true;
			} else {
				thing.selected = false;
			}
		});
		if(this.selectedThing) {
			this.dragging = true;
			if(editor.selectedThing() !== this.selectedThing) {
				editor.selectedThing(this.selectedThing);
				this.createHandles(editor);
			}
		} else {
			editor.handles = [];
			editor.selectedThing(null);
		}
	}
	createHandles(editor) {
		editor.handles = [];
		if(!this.selectedThing) {
			return;
		}
		if(this.selectedThing instanceof PathThing) {
			this.selectedThing.points.forEach(p=>{
				editor.handles.push(new Handle(p, 'p'));
			});
		} else if(this.selectedThing instanceof CircleThing) {
			editor.handles.push(new Handle(this.selectedThing, 'p'));
			editor.handles.push(new Handle(this.selectedThing, 'r'));
		} else {
			editor.handles.push(new Handle(this.selectedThing, 'tl'));
			editor.handles.push(new Handle(this.selectedThing, 'tr'));
			editor.handles.push(new Handle(this.selectedThing, 'bl'));
			editor.handles.push(new Handle(this.selectedThing, 'br'));
		}
	}

	onMouseMove(ev) {
		let dx = 0;
		let dy = 0;
		if(this.dragging || this.grabbedHandle) {
			dx = ev.x - this.start.x;
			dy = ev.y - this.start.y;
			this.start.x = ev.x;
			this.start.y = ev.y;
		}
		if(this.dragging && this.selectedThing) {
			this.selectedThing.move(dx, dy);
		} else if(this.grabbedHandle) {
			this.grabbedHandle.move(dx, dy);
		}
	}

	onMouseUp(ev) {
		this.dragging = false;
		this.grabbedHandle = null;
		if(this.selectedThing && this.selectedThing instanceof RectangleThing) {
			if(this.selectedThing.w() < 0) {
				this.selectedThing.x(this.selectedThing.x() + this.selectedThing.w());
				this.selectedThing.w(Math.abs(this.selectedThing.w()));
			}
			if(this.selectedThing.h() < 0) {
				this.selectedThing.y(this.selectedThing.y() + this.selectedThing.h());
				this.selectedThing.h(Math.abs(this.selectedThing.h()));
			}
		}
	}

	deactivate(editor) {
		if(this.selectedThing) {
			this.selectedThing.selected = false;
			this.selectedThing = null;
		}
		editor.selectedThing(null);
		editor.handles = [];
	}
}