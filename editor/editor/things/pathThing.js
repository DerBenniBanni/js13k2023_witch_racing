import { PointThing } from "./pointThing.js";
import { RectangleThing } from "./rectangleThing.js";
import { Editable } from "../tool/editable.js";

export class PathThing extends RectangleThing {
	constructor() {
		super({x:0,y:0,w:0,h:0});
		this.type = ko.observable('t');
		this.points = [];
		this.editables.push(new Editable('Type', this.type, 'select', [
			{value:'t', label:'Trees'},
			{value:'r', label:'Rocks'},
			{value:'d', label:'Dirt'},
			{value:'p', label:'Fly-Path'},
			{value:'f', label:'Finish Line'}
		]));
	}
	clone() {
		let clone = new PathThing();
		this.points.forEach(p=>{
			clone.addPoint(p.x(), p.y()); 
		});
		return clone;
	}
	move(dx, dy) {
		this.x(this.x() + dx);
		this.y(this.y() + dy);
		this.points.forEach(p=>p.move(dx, dy));
	}
	addPoint(x, y) {
		let isFirst = this.points.length == 0;
		let point = new PointThing({x,y});
		point.parentThing = this;
		this.points.push(point);
		this.updateBoundingBox();
	}
	updateBoundingBox() {
		let bounding = this.points.reduce((bounding, point)=>{
			if(bounding.xMin == null || bounding.xMin > point.x()) {
				bounding.xMin = point.x();
			}
			if(bounding.yMin == null || bounding.yMin > point.y()) {
				bounding.yMin = point.y();
			}
			if(bounding.xMax == null || bounding.xMax < point.x()) {
				bounding.xMax = point.x();
			}
			if(bounding.yMax == null || bounding.yMax < point.y()) {
				bounding.yMax = point.y();
			}
			return bounding;
		}, {xMin:null, yMin:null, xMax:null, yMax:null});
		this.x(bounding.xMin);
		this.y(bounding.yMin);
		this.w(bounding.xMax - bounding.xMin);
		this.h(bounding.yMax - bounding.yMin);
	}
	update() {}
	render(ctx) {
		if(this.points.length == 0) {
			return;
		}
		
		ctx.strokeStyle = '#ffffff';
		let bold = ['t','r','d'].indexOf(this.type()) > -1 ;
		let strokestyles = {
			't':'#88ff8888', // Trees
			'r':'#cccccc88', // Rocks
			'd':'#ffff8888', // Dirt
			'p':'#ff888888', // FlyPath
			'f':'#ffffff', // FinishLine
		};
		if(bold) {
			ctx.lineCap = "round";
			ctx.lineWidth = 20;
		}
		ctx.strokeStyle = strokestyles[this.type()] || '#ffffff';
		ctx.beginPath();
		this.points.forEach((p,i) => {
			if(i == 0) {
				ctx.moveTo(p.x(), p.y());
			} else {
				ctx.lineTo(p.x(), p.y())
			}
			if(this.type == 't') {
				ctx.arc(p.x(), p.y(), 0, Math.PI * 2);
			}
		});
		ctx.stroke();
		if(bold) {
			ctx.lineWidth = 1;
			this.points.forEach((p,i) => {
				ctx.beginPath();
				ctx.arc(p.x(), p.y(), 10, 0, Math.PI * 2);
				ctx.stroke();
			});
		}
		ctx.fillStyle = '#ffffff';
		this.points.forEach(p => ctx.fillRect(p.x()-1, p.y()-1, 2, 2));
	}
	getLength(p1, p2) {
		return Math.sqrt(Math.pow(p1.x() - p2.x(),2) + Math.pow(p1.y() - p2.y(),2));
	}
	collidesPoint(x, y) {
		let selectionBuffer = 4;
		let collidesBoundingbox = this.x() - this.w()*this.originX - selectionBuffer <= x && this.x() + this.w()*(1-this.originX) + selectionBuffer >= x
			&& this.y() - this.w()*this.originY - selectionBuffer <= y && this.y() + this.h()*(1-this.originY) + selectionBuffer >= y;
		if(!collidesBoundingbox || this.points.length < 2) {
			return collidesBoundingbox;
		}
		let cp = new PointThing({x,y});
		for(let i = 0; i < this.points.length-1; i++) { 
			/*
			let p1 = this.points[i];
			let p2 = this.points[i+1];

			let segmentLength = this.getLength(p1, p2);
			let clickLength1 = this.getLength(p1, cp);
			let clickLength2 = this.getLength(p2, cp);

			console.log(segmentLength, clickLength1 + clickLength2, clickLength1, clickLength2);

			if(segmentLength + selectionBuffer >= clickLength1 + clickLength2) {
				return true;
			}
			*/


			let sx1 = Math.min(this.points[i].x(), this.points[i+1].x()) - selectionBuffer;
			let sy1 = Math.min(this.points[i].y(), this.points[i+1].y()) - selectionBuffer;
			let sx2 = Math.max(this.points[i].x(), this.points[i+1].x()) + selectionBuffer;
			let sy2 = Math.max(this.points[i].y(), this.points[i+1].y()) + selectionBuffer;
			let collidesSection = sx1 <= x && sx2 >= x && sy1 <= y && sy2 >= y;
			if(collidesSection) {
				let cp = new RectangleThing({
					x:this.points[i].x(),
					y:this.points[i].y(),
					w:2*selectionBuffer,
					h:2*selectionBuffer,
					ox:0.5,
					oy:0.5
				});
				let sw = this.points[i+1].x() - this.points[i].x();
				let sh = this.points[i+1].y() - this.points[i].y();
				let segmentLength = Math.sqrt(sw*sw + sh*sh);
				let steps = Math.ceil(segmentLength/(selectionBuffer/2));
				sw = (sw / segmentLength) * (selectionBuffer/2);
				sh = (sh / segmentLength) * (selectionBuffer/2);
				for(let s = 0; s < steps; s++) {
					if(cp.collidesPoint(x, y)) {
						return true;
					}
					cp.x(cp.x() + sw);
					cp.y(cp.y() + sh);
				}
			}
		}
		return false;
	}
	renderSelection(ctx) {
		ctx.strokeStyle = '#ffffffdd';
		ctx.beginPath();
		ctx.rect(this.x()-1, this.y()-1, this.w()+2, this.h()+2);
		ctx.stroke();
		ctx.strokeStyle = '#000000dd';
		ctx.setLineDash([2, 2]);
		ctx.beginPath();
		ctx.rect(this.x()-1, this.y()-1, this.w() +2, this.h()+2);
		ctx.stroke();
		ctx.setLineDash([]);
	}
}