export class Tool {
	constructor(label) {
		this.label = label;
		this.active = ko.observable();
		this.editables = [];
		this.actions = [];
		this.editor = null;
	}
	activate(editor) {
		this.editor = editor;
	}
	deactivate(editor) {}
	execute(ev, editor) {}
	getContextMenu() {}
}