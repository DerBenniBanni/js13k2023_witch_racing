import { Tool } from "./tool.js";

export class HandTool extends Tool {
	constructor() {
		super("hand");
		this.dragging = false;
		this.start = {x:0, y:0};
	}
	activate(editor) {
		super.activate(editor);
		editor.canvas.classList.add('grab');
	}
	deactivate(editor) {
		editor.canvas.classList.remove('grab');
	}
	execute(ev, editor) {
		if(ev.type == 'mousedown') {
			this.start.x = ev.x;
			this.start.y = ev.y;
			this.dragging = true;
		} else if(ev.type == 'mousemove' && this.dragging) {
			let tx = ev.x - this.start.x;
			let ty = ev.y - this.start.y;
			this.start.x = ev.x;
			this.start.y = ev.y;
			editor.translation.x += tx;
			editor.translation.y += ty;
		} else if(ev.type == 'mouseup') {
			this.dragging = false;
		}

	}
}