import { SelectTool } from './tool/selectTool.js';
import { CircleTool } from './tool/circleTool.js';
import { PathTool } from './tool/pathTool.js';
import { RectangleTool } from './tool/rectangleTool.js';
import { HandTool } from './tool/handTool.js';
import { PathThing } from './things/pathThing.js';
import { CircleThing } from './things/circleThing.js';
import { Thing } from './things/thing.js';
//import { PointTool } from './tool/pointTool.js';

const base36ToArray = (base36) => base36.match(/.{2}/g).map(n=>parseInt(n,36));

export class Editor {
	constructor(canvasElement) {
		this.canvas = canvasElement;
		this.ctx = this.canvas.getContext("2d");

		this.tools = ko.observableArray();
		this.tools.push(new SelectTool());
		this.tools.push(new HandTool());
		this.tools.push(new RectangleTool());
		this.tools.push(new PathTool());
		this.tools.push(new CircleTool());
		this.activeToolIndex = 0;
		this.activeTool = ko.observable();

		this.things = [];
		this.selectedThing = ko.observable();

		this.handles = [];

		this.exportData = ko.observable();

		// init draw context
		this.initialTransformation = this.ctx.getTransform();
		this.ctx.strokeStyle = '#ffffff';
		this.ctx.lineWidth = 1;

		this.translation = {x:0, y:0};

		// init events
		let self = this;
		window.addEventListener("resize", () => this.resize());
		document.addEventListener("wheel", (ev) => this.onWheel(ev));
		document.addEventListener("keydown", (ev) => this.onKeyDown(ev));
		this.canvas.addEventListener("mousedown", (ev)=> self.canvasMouseEvent(ev));
		this.canvas.addEventListener("mouseup", (ev)=> self.canvasMouseEvent(ev));
		this.canvas.addEventListener("mousemove", (ev)=> self.canvasMouseEvent(ev));
		document.querySelector('#btnImport').addEventListener("click", (ev)=>self.import());
		document.querySelector('#btnImportMinified').addEventListener("click", (ev)=>self.import(true));
		document.querySelector('#btnExport').addEventListener("click", (ev)=>self.export());
		document.querySelector('#btnExportMinified').addEventListener("click", (ev)=>self.export(true));
		document.querySelector('#btnClose').addEventListener("click", (ev)=>self.closeExport());


		// init tools
		this.highlightActiveTool();
		// start loop
		this.render();
	}

	renderGameSize() {
		this.ctx.strokeStyle = '#ffff0088';
		this.ctx.beginPath();
		this.ctx.rect(0,0,1296,629);
		this.ctx.stroke();
	}

	render() {
		let self = this;
		this.things.forEach(thing => {
			thing.update();
		});
		this.ctx.setTransform(this.initialTransformation);
		this.ctx.clearRect(0, 0, canvas.width, canvas.height);
		this.ctx.translate(this.translation.x, this.translation.y);
		this.renderGameSize();
		this.things.forEach(thing => {
			thing.render(this.ctx);
		});
		if(this.selectedThing()) {
			this.selectedThing().renderSelection(this.ctx);
		}
		this.handles.forEach(handle => {
			handle.render(this.ctx);
		})
		requestAnimationFrame(() => self.render());
	}

	setActiveTool(toolIndex) {
		this.tools()[this.activeToolIndex].deactivate(this);
		this.activeToolIndex = toolIndex;
		this.tools()[this.activeToolIndex].activate(this);
		this.activeTool(this.tools()[this.activeToolIndex]);
		this.highlightActiveTool();
	}
	getActiveTool() {
		return this.tools()[this.activeToolIndex];
	}

	highlightActiveTool() {
		this.tools().forEach((tool, i)=>{
			if(i==this.activeToolIndex) {
				tool.active(true);
			} else {
				tool.active(false);
			}
		})
	}

	onWheel(ev) {
		let nextActiveTool = this.activeToolIndex;
		if(ev.deltaY < 0) {
			nextActiveTool = this.activeToolIndex == 0 ? this.tools().length - 1 : this.activeToolIndex - 1;
		} else if(ev.deltaY > 0) {
			nextActiveTool = this.activeToolIndex == this.tools().length - 1 ? 0 : this.activeToolIndex + 1;
		}
		this.setActiveTool(nextActiveTool);
	}

	
	onKeyDown(ev) {
		switch(ev.code) {
			case 'Delete':
				if(this.selectedThing()) {
					this.things = this.things.filter(t => t !== this.selectedThing());
					this.selectedThing(null);
					this.handles = [];
				}
				if(this.activeTool()) {
					this.activeTool().selectedThing = null;
				}
				break;
			case 'Escape':
				if(this.selectedThing() && this.activeTool()) {
					this.selectedThing(null);
					this.activeTool().selectedThing = null;
					this.handles = [];
				}
				break;
			case 'KeyQ':
				this.closeExport();
				break;
			case 'KeyE':
				document.querySelector('#export').classList.remove('hidden');
				break;
			default:
		}
	}
	closeExport() {
		document.querySelector('#export').classList.add('hidden');
	}
	export(minified) {
		let checkpoints = [];
		let data = this.things
			.filter(thing => thing.type && thing.type())
			.map(thing => {
				let o = {t:thing.type()};
				o.d = [];
				switch(thing.type()) {
					case "t":
					case "d":
					case "r":
					case "p":
					case "f":
						thing.points.forEach(p=> {
							o.d.push(p.x());
							o.d.push(p.y());
						});
						break;
					case 'ps':
						o.d.push(thing.x());
						o.d.push(thing.y());
						break;
					case 'cp':
						checkpoints[thing.checkpointNumber()] = [
							thing.x(),
							thing.y(),
							thing.w(),
							thing.h()
						];
						break;
				}
				return o;
			})
			.filter(o => o.t != 'cp');
		if(checkpoints.length > 0) {
			let cpdata = checkpoints
				.filter(cp=> !!cp)
				.reduce((cpdat,cp)=>cpdat.concat(cp),[]);
			data.push({t:'cp', d:cpdata});
		}
		if(minified) {
			data = data.map(d => {
				let s = d.t + "#";
				s += d.d.map(n=>{
					let b = n.toString(36);
					return b.length < 2 ? "0"+b: b;
				}).join("");
				return s;
			});
			this.exportData(JSON.stringify(data, null, 2));
		} else {
			this.exportData(JSON.stringify(data));
		}
	}

	import(minified) {
		this.things = [];
		let input = this.exportData().trim();
		if(input.endsWith(";")) {
			input = input.substring(0,input.length-1);
		}
		let data = JSON.parse(input);
		if(minified) {
			data = data.map(d=> {
				let splitted = d.split("#");
				return {
					t:splitted[0],
					d:base36ToArray(splitted[1])
				};
			});
		}
		data.forEach(d => {
			let thing = null;
			switch(d.t) {
				case "t":
				case "d":
				case "r":
				case "p":
				case "f":
					thing = new PathThing();
					thing.type(d.t);
					for(let i = 0; i < d.d.length; i+=2) {
						thing.addPoint(d.d[i], d.d[i+1]);
					}
					this.things.push(thing);
				break;
				case "ps":
					thing = new CircleThing({x:d.d[0],y:d.d[1], r:6});
					thing.type(d.t);
					this.things.push(thing);
				break;
				case "cp":
					let cpnr = 0;
					for(let i = 0; i <= d.d.length -4; i+=4) {
						thing = new Thing({
							x:d.d[i],
							y:d.d[i+1], 
							w:d.d[i+2], 
							h:d.d[i+3],
							color:'#ffffff',
							type:'cp',
							checkpointNumber:cpnr++
						});
						this.things.push(thing);
					}
					break;
			}
		});
	}

	resize() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		
		this.ctx.clearRect(0, 0, canvas.width, canvas.height);

	}

	canvasMouseEvent(ev) {
		ev.preventDefault();
		this.getActiveTool().execute(ev, this);
	}
	
	

	buttonClick(ev) {
		ev.preventDefault();
		console.log(ev.target.getAttribute('action'));
	}

	getTranslatedX(x) {
		return x - this.translation.x;
	}
	getTranslatedY(y) {
		return y - this.translation.y;
	}
}

