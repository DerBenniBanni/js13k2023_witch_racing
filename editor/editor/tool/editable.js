export class Editable {
	constructor(label, value, type, options) {
		this.label = label;
		this.value = value;
		this.type = type || 'text';
		this.options = options;
	}
}