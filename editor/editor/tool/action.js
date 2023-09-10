export class Action {
	constructor(name, listener) {
		this.name = name;
		this.listener = listener;
	}
	execute() {
		this.listener();
	}
}