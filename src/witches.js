const toRad = (deg) => deg * (PI / 180);
const toDeg = (rad) => rad / (PI / 180);
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const cos = (rad) => Math.cos(rad);
const sin = (rad) => Math.sin(rad);
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.round(rand(min, max));
const mathFloor = (v) => Math.floor(v);
const mathCeil = (v) => Math.ceil(v);

const dist = (p1, p2) => Math.hypot(p1.x-p2.x, p1.y-p2.y);
const hexToInt = (h) => parseInt('0x' + h);

const setDim = (c, w, h) =>{c.width = w; c.height = h;};
const msg = (msg) => {document.querySelector('#status').innerText = msg};

const PI = Math.PI;
const STROKE = 1;
const FILL = 2;

const STATE_LOADING = 1;
const STATE_MENU = 2;
const STATE_RACE = 3;
const STATE_RACE_MENU = 4;

const BASEHEIGHT = 629;
const BASEWIDTH = 1366;
let renderScale = 1;
const scale = (v) => v * renderScale;
const unscale = (v) => v / renderScale;
const scaleI = (v) => Math.round(v * renderScale);
const font = 'Papyrus, Palatino Linotype, Book Antiqua, Palatino, Serif';

const titleText36 = '2a332s703d563x72542w00005k4t517r00005m3l8g3e00006y2o6h7l0000994e7m4p7a778t7k00009y379w7p0000cd34c47l00009d5hcf5c0000fz3hdy3qdj7nfj7h0000gq4jgm7bi279i64f0000ja3aiz7f0000ib3akz3ckx4xjb4z00004z9y6i8w6ccn00005ocp6yco00007o9k8i8l9y9l85cha4ch0000ao8qd68pbjci0000fp8mea8udicffhckflavdsaq';
const base36ToArray = (base36) => base36.match(/.{2}/g).map(n=>parseInt(n,36));
const titleText = base36ToArray(titleText36);

// Basic Grid fpr Collision-Checks (to only check fpr near obstacles)
const ColGrid = {
    w:100, // grid-width
    d:[],
    c() {
        for(let x = -1; x < 40; x++) {
            ColGrid.d[x] = [];
            for(let y = -1; y < 30; y++) {
                ColGrid.d[x][y] = [];
            }
        }
    },
    // add Object
    a(o) {
        let g = ColGrid.w; // gridwidth
        let d = mathCeil(g/2+1); 
        let x1 = mathFloor((o.p.x - d) / g);
        let x2 = mathFloor((o.p.x + d) / g);
        let y1 = mathFloor((o.p.y - d) / g);
        let y2 = mathFloor((o.p.y + d) / g);
        ColGrid.s(o,x1,y1);
        ColGrid.s(o,x2,y1);
        ColGrid.s(o,x1,y2);
        ColGrid.s(o,x2,y2);
    },
    // set in grid
    s(o,x,y) {
        if(!ColGrid.d[x]) {
            ColGrid.d[x] = [];
        }
        if(!ColGrid.d[x][y]) {
            ColGrid.d[x][y] = [];
        }
        ColGrid.d[x][y].push(o);
    },
    // get by screen-coordinates
    g(x,y) {
        let gx = mathFloor(x/ColGrid.w);
        let gy = mathFloor(y/ColGrid.w);
        return ColGrid.d[gx] && ColGrid.d[gx][gy] ? ColGrid.d[gx][gy] : [];
    }
}

// holds Pre-rendered Images (trees, rocks, Witches)
class ImagePool {
    constructor() {
        this.p = [];
        this.c = -1;
    }
    // add at the end
    a(i) {
        this.p.push(i);
    }
    // overwrite at index
    i(idx, i) {
        this.p[idx] = i;
    }
    // get image at index 
    g(idx) {
        if(idx !== undefined) {
            return this.p[idx];
        }
        this.c++;
        if(this.c >= this.p.length) {
            this.c = 0;
        }
        return this.p[this.c];
    }
    // get length of image-pool
    l() {
        return this.p.length;
    }
}
const treeImagePool = new ImagePool();
const pineImagePool = new ImagePool();
const rockImagePool = new ImagePool();
const witchImagePoolPlayer = new ImagePool();
const witchImagePoolCPU1 = new ImagePool();
const witchImagePoolCPU2 = new ImagePool();
const witchImagePoolCPU3 = new ImagePool();

const TREECOUNT = 30;
const PINECOUNT = 30;
const ROCKCOUNT = 20;


const getSpriteBuffer = (w,h) =>  new SpriteBuffer(scaleI(w),scaleI(h));
const translateContext = (c, x, y) => c.translate(scaleI(x),scale(y));

const fillImagePool = (numImages, type, color) => {
    let col = color.clone();
    let img = null;
    switch(type) {
        case "t":
            img = getSpriteBuffer(60,80);
            translateContext(img.ctx, 30, 73);
            renderTree(img.ctx, col.rand(40).rgba());
            treeImagePool.a(img);
            break;
        case "p":
            img = getSpriteBuffer(60,80);
            translateContext(img.ctx, 30, 73);
            renderPine(img.ctx, col.rand(40).rgba());
            pineImagePool.a(img);
            break;
        case "r":
            img = getSpriteBuffer(60,80);
            translateContext(img.ctx, 30, 73);
            renderRock(img.ctx, [0,0, col.lightness(randInt(-20,20)).rgba()], img);
            rockImagePool.a(img);
            break;
    }
    if(numImages > 0) {
        setTimeout(()=>fillImagePool(numImages-1,type,color),1);
    }
}

const renderWitch = (col, imagePool, deg) => {
    deg = deg !== undefined ? deg : 0;
    let sb = getSpriteBuffer(25,35);
    witchRenderer(sb.ctx, deg, false, col);
    imagePool.i(deg, sb);
    let ghost = getSpriteBuffer(25,35);
    witchRenderer(ghost.ctx, deg, true, col);
    imagePool.i(deg + 360, ghost);
    if(deg < 359) {
        setTimeout(()=>renderWitch(col, imagePool, deg+1),1);
    }
}

const Music = {
    raceAudio:null,
    crashAudio:null,
    playCrash() {
        if(this.crashAudio) {
            this.crashAudio.currentTime = 0;
            this.crashAudio.play();
        }
    },
    play() {
        if(this.raceAudio) {
            this.raceAudio.currentTime = 0;
            this.raceAudio.play();
        }
    },
    stop() {
        if(this.raceAudio) {
            this.raceAudio.pause();
            this.raceAudio.currentTime = 0;
        }
    },
}
const padStartTwo = (n) => String(n).padStart(2,'0');

class Game {
    constructor() {
        this.dbg = false;
        this.lastUpdate = Date.now();
        this.canvas = document.querySelector('#gameCanvas');
        this.c = this.canvas.getContext("2d");
        this.bgcanvas = document.querySelector('#bgCanvas');
        this.bgc = this.bgcanvas.getContext("2d");
        this.w = window.innerWidth;
        this.h = window.innerHeight;

        this.optMusic = false;
        this.optCollide = true;
        
        this.sprites = [];
        this.ghostSprites = [];
        this.otherWitches = []
        this.keyListeners = [];
        this.player = null;
        this.treeBaseColor = new Color('008800dd');
        this.rockBaseColor = new Color('666666');
        this.resize();
        this.keys = {
            'KeyA':'l',
            'KeyD':'r',
            'KeyW':'u',
            'KeyS':'d',
            'ArrowLeft':'l',
            'ArrowRight':'r',
            'ArrowUp':'u',
            'ArrowDown':'d',
            'Space':'f', // fire jinx 
        };
        this.actions = {
            l:false,
            r:false,
            u:false,
            d:false
        };
        let game = this;
        document.addEventListener('keydown', (ev)=> game.keydown(ev));
        document.addEventListener('keyup', (ev)=> game.keyup(ev));
        this.levels = [];
        this.currentLevel = -1;
        this.state = STATE_LOADING;
        this.raceMenu = null;
        this.flyPath = [];
        this.cps = []; //checkpoints
        this.roundsToRun = 5;
        this.finished = 0;
        this.startTime = -1;
        this.xp = 0; // "coins" for upgrades
        // upgradeables
        this.jinxCooldown = 10;
        this.maxFw = 0;
        this.turnspeed = 0;
    }
    keydown(ev) {
        if(this.keys[ev.code]) {
            this.actions[this.keys[ev.code]] = true;
        }
        if(ev.code == 'KeyI') {
            this.dbg = !this.dbg;
        }
        if(ev.code == 'Escape') {
            if(this.state == STATE_RACE) {
                this.displayRaceMenu(true);
            } else if(this.state == STATE_RACE_MENU) {
                this.state = STATE_RACE;
                this.raceMenu.ttl = -1;
            }
        }
        this.keyListeners.forEach(l=>l.keydown(ev.code));
    }
    displayRaceMenu(switchState) {
        if(this.raceMenu) {
            return;
        }
        if(switchState) {
            this.state = STATE_RACE_MENU;
        }
        this.raceMenu = new Menu({x:200, y:200, items:[
            {t:"Restart Race", cb:()=>game.lvl(game.currentLevel), remove:true},
            {t:"Abort to Mainmenu", cb:()=>game.menu(), remove:true},
            {t:"Continue Race", cb:()=>game.state = STATE_RACE, remove:true}
        ]});
        this.keyListeners.push(this.raceMenu);
    }
    keyup(ev) {
        if(this.keys[ev.code]) {
            this.actions[this.keys[ev.code]] = false;
        }
    }
    resize() {
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        let [w,h] = [this.w, this.h];
        setDim(this.canvas, w, h);
		this.c.clearRect(0, 0, w, h);
        setDim(this.bgcanvas, w, h);
        renderBg(this.bgc, w, h);
        renderScale = Math.min(w/BASEWIDTH, h/BASEHEIGHT);
	}

    gameloop() {
        let self = this;
        let now = Date.now();
        let delta = (now - this.lastUpdate) / 1000;
        delta = clamp(delta, 0, 0.1);
        this.lastUpdate = now;
        this.update(delta);
        this.render();
        requestAnimationFrame(() => self.gameloop())
    }

    update(delta) {
        if(this.state == STATE_RACE_MENU && this.raceMenu) {
            this.raceMenu.update(delta);
        } else {
            this.startIn -= delta;
            this.sprites = this.sprites.filter(s => s.ttl >= 0);
            this.ghostSprites = this.ghostSprites.filter(s => s.ttl >= 0);
            this.keyListeners = this.keyListeners.filter(s => s.ttl >= 0);
            if(this.raceMenu && this.raceMenu.ttl < 0) {
                this.raceMenu = null;
            }
            this.sprites.forEach(s => s.update(delta));
            this.sprites.sort((s1, s2) => (s1.p.y+s1.sortModifier) - (s2.p.y+s2.sortModifier));
            if(this.startIn <= 0 && this.raceTime < 0) {
                this.raceTime = 0;
            }
            if(this.raceTime >= 0 && this.player && this.player.place <= 0) {
                this.raceTime += delta;
            }
            if(this.player && this.player.place > 0) {
                this.displayRaceMenu(false);
            }
        }
    }

    render(delta) {
        let c = this.c;
		c.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if(this.player && this.state == STATE_RACE) {
            let cp = this.cps[this.player.cp];
            if(cp) {
                renderCheckpoint(c,cp);
            }
        }
        this.sprites.forEach(s => s.doRender(c, delta));
        this.ghostSprites.forEach(s => s.doRender(c, delta, true));
        if(this.raceMenu) {
            this.raceMenu.doRender(c, delta);
        }
        fill(c, '#ffffff');
        if(this.player && (this.state == STATE_RACE || this.state == STATE_RACE_MENU)) {
            c.font = '20px ' + font;
            c.textAlign = 'center';
            let txt = "Round " + clamp(this.player.rounds + 1, 0, this.roundsToRun) + " of " + this.roundsToRun;
            let rt = clamp(this.raceTime, 0, 9999);
            let rm = Math.floor(rt/60);
            let rs = Math.floor(rt - rm*60);
            let rms = Math.floor((rt - Math.floor(rt)) * 100);
            txt += " - Elapsed Time: " + padStartTwo(rm) + ":" + padStartTwo(rs) + "," + padStartTwo(rms);
            c.fillText(txt, this.w/2, 30);

            if(this.player.place) {
                c.font = '40px ' + font;
                c.textAlign = 'center';
                c.fillText("The race is over!", this.w/2, 150);
                
                c.font = '60px ' + font;
                c.fillText("Thou finished as " + this.player.place + ".", this.w/2, 250);
            }
        }
        c.font = '20px ' + font;
        c.textAlign = 'right';
        c.fillText("Witchcraft Points: " + this.xp, this.w-30, 30);
        if(this.state == STATE_MENU) {
            c.font = '16px ' + font;
            c.fillText("The music is a cover of \"Furatum Alci Provinciam\" by CORVUS CORAX", this.w-30, this.h-30);
        }

        if(this.dbg) {
            fill(c, 'ffff00');
            this.flyPath.forEach(p => ellipseRenderer(c, [p.x, p.y, 3, 3]));
            stroke(c, 'ffffff');
            this.cps.forEach(cp => {c.beginPath(); c.rect(cp.x, cp.y, cp.w, cp.h); c.stroke();});
        }
    }
    addSprite(spr) {
        spr.game = this;
        if(spr.keydown) {
            this.keyListeners.push(spr);
        }
        this.sprites.push(spr);
        if(Witch.prototype.isPrototypeOf(spr)) {
            this.ghostSprites.push(spr);
            if(!spr.isPlayer) {
                this.otherWitches.push(spr);
            }
        }
        return spr;
    }
    init() {
        let self = this;
        msg('preparing worldcup...');
        this.resize();
        this.lastUpdate = Date.now();
        this.gameloop();

        fillImagePool(TREECOUNT,"t",this.treeBaseColor);
        fillImagePool(PINECOUNT,"p",this.treeBaseColor);
        fillImagePool(ROCKCOUNT,"r",this.rockBaseColor);
        setTimeout(()=>renderWitch('#000000', witchImagePoolPlayer), 10);
        setTimeout(()=>renderWitch('#ff0000', witchImagePoolCPU1), 20);
        setTimeout(()=>renderWitch('#ff9900', witchImagePoolCPU2), 30);
        setTimeout(()=>renderWitch('#00aaff', witchImagePoolCPU3), 40);
        preload(this);
    }
    clean() {
        this.sprites = [];
        this.ghostSprites = [];
        this.keyListeners = [];
        this.player = null;
        this.cps = [];
        this.otherWitches = [];
        this.raceTime = -1;
        this.finished = 0;
    }
    menu() {
        ColGrid.c();
        Music.stop();
        msg("");
        this.state = STATE_MENU;
        let self = this;
        this.resize();
        this.clean();
        let menu = this.addSprite(new Menu({x:20, y:350, items:[]}));
        let witchcraftMenu = [];
        let mainMenu = [
            {t:"Witchcraft and Jinxes", cb:()=>{menu.items = witchcraftMenu; menu.selected = 0;}},
            {t:"Racing-Music", cb:()=> self.optMusic = !self.optMusic, o:"optMusic"},
            {t:"Collide with witches", cb:()=> self.optCollide = !self.optCollide, o:"optCollide"},
            {t:"Laps per Race", cb:(change)=> {
                self.roundsToRun += change;
                if(self.roundsToRun > 10) self.roundsToRun = 3; 
                if(self.roundsToRun < 3) self.roundsToRun = 10; 
            }, n:"roundsToRun"},
            {t:"Start Race in Vienna", cb:()=>self.lvl(0)},
            {t:"Start Race in Nottingham", cb:()=>self.lvl(1)},
            {t:"Start Race in Warsaw", cb:()=>self.lvl(2)},
            {t:"Start Race in Rome", cb:()=>self.lvl(3)},
        ];
        witchcraftMenu = [
            {
                t:"Upgrade Jinx-Interval", 
                cb:()=>{
                    let c = 11-self.jinxCooldown;
                    if(self.xp >= c && self.jinxCooldown > 2) {
                        self.jinxCooldown--; 
                        self.xp -= c;
                    }
                }, 
                u:"jinxCooldown", 
                c:()=>self.jinxCooldown > 2 ? 11-self.jinxCooldown : -1
            },
            {
                t:"Upgrade broomstick / max speed", 
                cb:()=>{
                    let c = self.maxFw + 1;
                    if(self.xp >= c) {
                        self.maxFw += 1; 
                        self.xp -= c;
                    }
                }, 
                u:"maxFw", 
                c:()=>self.maxFw + 1
            },
            {
                t:"Upgrade broom bristles / turn rate", 
                cb:()=>{
                    let c = self.turnspeed + 1;
                    if(self.xp >= c) {
                        self.turnspeed += 1; 
                        self.xp -= c;
                    }
                }, 
                u:"turnspeed", 
                c:()=>self.turnspeed + 1
            },
            {t:"Back to main", cb:()=>{menu.items = mainMenu; menu.selected = 0;}},
        ];
        menu.items = mainMenu;
        this.addSprite(new Title({x:450, y:0}));
        this.addSprite(new AIWitch({x:50, y:50, ip:witchImagePoolCPU1}));
        this.addSprite(new AIWitch({x:unscale(this.w-300), y:50, ip:witchImagePoolCPU2}));
        this.addSprite(new AIWitch({x:50, y:unscale(this.h-100), ip:witchImagePoolCPU3}));
        levelSetFlyPath(this, [this.w-180, 180, this.w-180, this.h-180, 180, 180, 180, this.h-180].map(v=>unscale(v)));
    }
    
    // Level-Loader
    lvl(li) {
        if(this.levels.length <= li) {
            alert('level ' + li + ' missing');
            return;
        }
        this.currentLevel = li;
        let l = this.levels[li];
        msg(l.n + ' loading...');
        this.clean();
        this.resize();
        this.render();
        let self = this;
        if(Music.crashAudio == null) {
           loadMusic(crash, game, 'crashAudio');
        }
        if(this.optMusic && Music.raceAudio == null) {
            msg('recruiting Corvus Corax as minstrels...');
            setTimeout(()=>loadMusic(raceSong, game, 'raceAudio', ()=>self.loadLevel(l)), 10);
        } else {
            self.loadLevel(l);
        }
    }
    loadLevel (leveldata) {
        ColGrid.c();
        this.player = this.addSprite(new Player({x:300, y:120, ip:witchImagePoolPlayer}));
        leveldata.d.forEach(ldr => {
            let s = ldr.split("#");
            let ld = {t:s[0], d:base36ToArray(s[1])};
            switch(ld.t) {
                case 't': levelPlantTrees(this, this.treeBaseColor, ld.d); break;
                case 'd': levelSpreadDirt(this, ld.d); break;
                case 'f': levelSpreadDirt(this, ld.d, 'ffffff22', 2); break;
                case 'r': levelDropRocks(this, ld.d); break;
                case 'ps': 
                    this.player.p.x = scale(ld.d[0]); 
                    this.player.p.y = scale(ld.d[1]); 
                    break; 
                case 'p': levelSetFlyPath(this, ld.d); break;
                case 'cp':
                    for(let i = 0; i <= ld.d.length -4; i+=4) {
                        this.cps.push(new CP(ld.d[i], ld.d[i+1], ld.d[i+2], ld.d[i+3]));
                    }
                    break;
            }
        });
        this.addSprite(new AIWitch({x:unscale(this.player.p.x) + 20, y:unscale(this.player.p.y) - 10, ip:witchImagePoolCPU1}));
        this.addSprite(new AIWitch({x:unscale(this.player.p.x) + 40, y:unscale(this.player.p.y) + 10, ip:witchImagePoolCPU2}));
        this.addSprite(new AIWitch({x:unscale(this.player.p.x) + 60, y:unscale(this.player.p.y) - 10, ip:witchImagePoolCPU3}));
        msg("");
        this.addSprite(new StartText({x:unscale(this.w / 2), y: unscale(this.h/2 - 60) }));
        this.state = STATE_RACE;
        if(this.optMusic) {
            Music.play();
        }
        this.startIn = 3;
    }
}

const preload = (game) => {
    let done = true;
    let m = "preparing worldcup: ";
    if(treeImagePool.l() < TREECOUNT || pineImagePool.l() < PINECOUNT) {
        m += "planting trees... ";
        done = false;
    }
    if(rockImagePool.l() < ROCKCOUNT) {
        m += "placing rocks... ";
        done = false;
    }
    if(treeImagePool.l() > 0 && pineImagePool.l() > 0) game.addSprite(new Tree({x:rand(40,game.w-40), y:rand(40,game.h-40)}));
    if(rockImagePool.l() > 0) game.addSprite(new Rock({x:rand(40,game.w-40), y:rand(40,game.h-40)}));
    let witches = witchImagePoolPlayer.l() + witchImagePoolCPU1.l() + witchImagePoolCPU2.l() + witchImagePoolCPU3.l();
    if(witches < 4*720) {
        m += "finding witches ("+witches+"/"+(4*720)+")... ";
        done = false;
    }
    msg(m);
    if(done) {
        msg('');
        game.menu();
        return;
    }
    setTimeout(()=>preload(game), 200);
}

class CP {
    constructor(x,y,w,h) {
        this.x = scale(x);
        this.y = scale(y);
        this.w = scale(w);
        this.h = scale(h);
    }
}

const renderCheckpoint = (c, cp) => {
    fill(c, '#ffffaa11');
    c.fillRect(cp.x,cp.y,cp.w,cp.h);
    c.fillRect(cp.x+2,cp.y+2,cp.w-4,cp.h-4);
    c.fillRect(cp.x+4,cp.y+4,cp.w-8,cp.h-8);
    fill(c, '#ffffaaaa');
    for(let i = 0; i < 20; i++) {
        let x = rand(cp.x, cp.x + cp.w-2);
        let y = rand(cp.y, cp.y + cp.h-2);
        c.fillRect(x,y,2,2);
    }
}

const levelSetFlyPath = (game, d) => {
    game.flyPath = [];
    for(let i = 0; i <= d.length -2; i += 2) {
        game.flyPath.push(new P(scale(d[i]),scale(d[i+1])));
    }
}

const renderBg = (c, w, h) => {
    let col = new Color('#285526');
    let flower = new Color('#ffffffaa');
    fill(c,col.rgb());
    c.fillRect(0, 0, w, h);
    for(let x = 0; x <= w; x+=5) {
        for(let y = 0; y <= h; y+=5) {
            let colGrass = col.clone().lightness(randInt(-10,30)).rand(20);
            stroke(c, colGrass.rgb());
            c.beginPath();
            let x1 = x + rand(-2,2);
            let y1 = y + rand(-2,2);
            let x2 = x1 + rand(-2,2);
            let y2 = y1 + rand(-5,-2);
            c.moveTo(x1, y1);
            c.lineTo(x2, y2);
            c.stroke();
            if(rand(0,1) > 0.95) {
                stroke(c, flower.clone().rand(200).rgba());
                c.beginPath();
                c.moveTo(x2-0.5, y2-0.5);
                c.lineTo(x2+0.5, y2+0.5);
                c.stroke();
            }
        }
    }
    //renderSpell(c, '88ffff');
};

class SpriteBuffer {
    constructor(w, h) {
        this.c = document.createElement("canvas");
        this.c.width = w;
        this.c.height = h;
        this.ctx = this.c.getContext('2d');
        this.colCircles = [];
    }
}

class P {
    constructor(x,y) {
        this.x = x;
        this.y = y;
    }
    clone() {
        return new P(this.x, this.y);
    }
    add(x,y) {
        return new P(this.x+x, this.y+y);
    }
    addP(p) {
        return this.add(p.x, p.y);
    }
    diffP(p) {
        return new P(this.x-p.x, this.y-p.y);
    }
    div(divisor) {
        return new P(this.x/divisor, this.y/divisor);
    }
}

class Sprite {
    constructor({x,y}) {
        this.p = new P(scale(x), scale(y));
        this.game = null;
        this.colliders = [];
        this.ttl = Infinity;
        this.sortModifier = 0;
    }
    addColliderCircle(x,y,r) {
        let c = new ColCircle(x,y,r);
        c.parent = this;
        this.colliders.push(c);
    }
    update(delta) {
        this.ttl -= delta;
    }
    doRender(c, delta, ghost) {
        this.renderStart(c, delta);
        this.render(c, delta, ghost);
        this.renderEnd(c, delta);
    }
    renderStart(c, delta) {
        c.save();
        c.translate(this.p.x, this.p.y);
    }
    render(c, delta) {}
    renderEnd(c, delta) {
        c.restore();
    }
}
class Title extends Sprite {
    constructor(o) {
        super(o);
        this.d = [];
        let d = [];
        for(let i = 0; i < titleText.length; i+=2) {
            if(titleText[i] == 0 ) {
                continue;
            }
            d.push(scale(titleText[i]));
            d.push(scale(titleText[i+1]));
            if(titleText[i+2] == 0) {
                this.d.push(d);
                d = [];
            }
        }
        if(d.length > 1) {
            this.d.push(d);
        }
        this.wiggle = 0.1;
        this.lw = 0;
        this.rd = [];
    }
    update(delta) {
        this.lw -= delta;
        if(this.lw <= 0) {
            this.rd = this.d.map(d=> d.map(n=>randInt(n-3,n+3)));
            this.lw = this.wiggle;
        }
    }
    render(c, delta) {
        c.lineCap = 'round';
        [[8,'#00000088'],[4,'#ffffaacc'],[1,'#ffffff']].forEach(l => {
            c.lineWidth = l[0];
            stroke(c, l[1]);
            this.rd.forEach(d=>lineRenderer(c, d, STROKE));
        });
    }
}
class Menu extends Sprite {
    constructor(o) {
        super(o);
        this.items = o.items || [];
        this.selected = 0;
        this.sortModifier = 2000;
    }
    keydown(k) {
        if(this.selected > 0 && (k == 'KeyW' || k == 'ArrowUp')) {
            this.selected--;
        }
        if(this.selected < this.items.length -1 && (k == 'KeyS' || k == 'ArrowDown')) {
            this.selected++;
        }
        let sel = this.items[this.selected];
        if(sel.cb && (k == 'Space' || k == 'Enter' || ((sel.o || sel.n) && (k == 'ArrowLeft' || k == 'ArrowRight')))) {
            sel.cb(k == 'ArrowLeft' ? -1 : 1);
            if(sel.remove) {
                this.ttl = -1;
            }
        }
    }
    render(c, delta) {
        c.textAlign = 'left';
        this.items.forEach((i,idx) => {
            c.font = scaleI(24) + 'px ' + font;
            let sel = (idx == this.selected);
            let t = sel ? "> " : "";
            t += i.t;
            if(i.o != undefined) {
                c.font = scaleI(14) + 'px ' + font;
                t += ": " + (this.game[i.o] ? "on" : "off");
            }
            if(i.n != undefined) {
                c.font = scaleI(14) + 'px ' + font;
                t += ": " + this.game[i.n];
            }
            if(i.u != undefined) {
                t += ": " + this.game[i.u] + (i.c() >= 0 ? " (costs " + i.c() + " witchcraft)" : " (max)");
            }
            t +=sel ? " <" : "";
            fill(c, '#000000');
            c.fillText(t, 0, scale(30 * idx));
            fill(c,sel ? '#ffff88' : '#ffffff');
            c.fillText(t,  scale(-2), scale(30 * idx - 2));
        });
    }
}

class StartText extends Sprite {
    constructor(o) {
        super(o);
        this.sortModifier = 2000;
    }
    update(delta) {
        if(game.startIn <= -0.5) {
            this.ttl = -1;
        } 
    }
    render(c, delta) {
        c.font = '40px ' + font;
        c.textAlign = 'center';
        fill(c, '#ffffff');
        let txt = "Mount thy broom! The race starteth in...";
        c.fillText(txt, 0, 0);
        c.font = '100px ' + font;
        let countdown = mathCeil(game.startIn);
        c.fillText(countdown, 0, 100);
    }
}

class Particle extends Sprite {
    constructor(o) {
        super(o);
        this.ttl = o.ttl || 1;
        this.initTtl = this.ttl;
        this.rot = 0;
        this.color = new Color(o.col || 'ffffaa25');
        this.fadeRate = this.color.a / this.initTtl;
        this.size = o.size != undefined ? o.size : 1;
        this.growRate = o.grow != undefined ? o.grow : 30;
        this.rotationRate = o.rot != undefined ? o.rot : 720;
        this.dpos = new P(rand(-10,10), rand(-15,5));
    }
    update(delta) {
        super.update(delta);
        this.color.fade(this.fadeRate * delta);
        this.size += this.growRate * delta;
        this.rot += this.rotationRate * delta;
        this.p = this.p.add(this.dpos.x * delta, this.dpos.y * delta); 
    }
    render(c) {
        fill(c, this.color.rgba());
        c.rotate(toRad(this.rot));
        c.fillRect(-this.size/2, -this.size/2, this.size, this.size);
    }
}



class Witch extends Sprite {
    constructor(o) {
        super(o);
        this.rot = 0;
        this.speed = 0; // pixel per second
        this.maxFw = scale(220 + game.maxFw * 3); 
        this.maxBw = scale(-200); 
        this.turnspeed = 110 + game.turnspeed *2;
        this.accFw = scale(200);
        this.accBw = scale(500);
        this.airbrake = 0.5;
        this.acc = 0;
        this.lastParticle = 0;
        this.particleRate = 0.02;
        // imagepool to use
        this.imgs = o.ip;
        this.rounds = -1;
        this.cp = 0; // current target Checkbox
        this.isPlayer = false;
        this.place = 0;
    }
    update(delta) {
        super.update(delta);
        if(this.acc != 0) {
            this.speed += this.acc * delta;
            this.speed = clamp(this.speed, this.maxBw, this.maxFw);
        }
        let angle = [0, 15, -15, 25, -25].find(r => {
            let newP = nextP(this.p, this.speed, this.rot + r, delta);
            let hitObstacle = hitsAnything(this.game, newP, this.isPlayer);
            if(!hitObstacle) {
                this.p = newP;
                this.rot += r;
                if(r != 0) { 
                    this.speed *= 0.5;
                    this.acc *= 0.1; 
                }
                return true; 
            } else {
                addCollisionParticle(this.game, this.p, 1);
            }
        });
        if(angle == undefined) {
            this.speed *= -0.2;
        }
        if(this.rot < 0) {
            this.rot += 360;
        }
        if(this.rot > 360) {
            this.rot -= 360;
        }
        let absSpeed = Math.abs(this.speed);
        if((absSpeed > scale(50) && this.lastParticle > this.particleRate * 6) 
            || (absSpeed > 120 && this.lastParticle > this.particleRate)) {
            this.lastParticle = 0;
            this.game.addSprite(new Particle({
                x:unscale(this.p.x),
                y:unscale(this.p.y) - 1
            }));
        }
        checkboxHit(this.game, this);
        this.lastParticle += delta;
    }
    nextP(rot, delta) {
        let newP = this.p.clone();
        if(Math.abs(this.speed) >= 0.5 ) {
            newP.x += Math.cos(toRad(rot)) * this.speed * delta;
            newP.y += Math.sin(toRad(rot)) * this.speed * delta;
        }
        return newP;
    }
    render(c, delta, ghost) {
        let rotIdx = Math.round(this.rot) % 360;
        if(ghost) {
            rotIdx += 360;
        }
        c.drawImage(this.imgs.g(rotIdx).c, scale(-11), scale(-19));
        if(this.game.dbg) {
            fill(c,'#ffff00');
            ellipseRenderer(c, [0, 0, 1, 1]);
        }
    }
}

const addCollisionParticle = (game, p, num, col) => {
    for(let i=0; i < (num || 1); i++) {
        game.addSprite(new Particle({
            x:unscale(p.x) + rand(-5,5),
            y:unscale(p.y) + rand(-5,5),
            size:15,
            col:col || 'ffffaa66',
            ttl:0.5,
            rot:1200
        }));
    }
}

const nextP = (p, speed, rot, delta) => {
    let newP = p.clone();
    if(Math.abs(speed) >= 0.5 ) {
        newP.x += Math.cos(toRad(rot)) * speed * delta;
        newP.y += Math.sin(toRad(rot)) * speed * delta;
    }
    return newP;
}

const hitsAnything = (game, p, isP, jinx) => {
    if((isP && game.optCollide) || jinx) {
        for(let w of game.otherWitches) {
            if(w.dizzy > 0)  {
                continue;
            }
            let c = new ColCircle(w.p.x, w.p.y, 9);
            if(c.isInside(p)) {
                if(jinx) {
                    jinx.damage(w);
                }
                Music.playCrash();
                return true;
            }
        }
    }
    return ColGrid.g(p.x, p.y).find(s => {
        return s.colliders.find(c => {
            let hit = c.isInside(p);
            if(hit) {
                Music.playCrash();
            }
            return hit;
        })
    });
}

const checkboxHit = (game, witch) => {
    if(game.cps.length == 0) return;
    let w = witch.p;
    let cp = game.cps[witch.cp];
    if(w.x >= cp.x && w.x <= cp.x+cp.w && w.y >= cp.y && w.y <= cp.y + cp.h) {
        if(witch.cp == 0) {
            witch.rounds++;
            if(witch.rounds == game.roundsToRun) {
                game.finished++;
                witch.place = game.finished;
                if(witch.isPlayer) {
                    game.xp += 5 - witch.place;
                }
            }
        }
        witch.cp++;
        if(witch.cp >= game.cps.length) {
            witch.cp = 0;
        }
    }
}

class AIWitch extends Witch {
    constructor(o) {
        super(o);
        this.t = null;
        this.ti = -1;
        this.dizzy = 0;
    }
    // set next target
    nt() {
        this.ti++;
        if(this.ti >= this.game.flyPath.length) this.ti = 0;
        this.t = this.game.flyPath[this.ti].clone();
        this.t.x += randInt(-10,10);
        this.t.y += randInt(-10,10);
    }
    update(delta) {
        if(this.game.flyPath.length > 0) {
            if(!this.t) { 
                this.nt();
            }
            let d = dist(this.p, this.t);
            if(d < 30) { 
                this.nt();
            }
            let ta = toDeg(Math.atan2(this.t.y - this.p.y, this.t.x - this.p.x));
            ta = normalizeAngle(ta);
            let la = normalizeAngle(360 + this.rot - ta);
            if(la <= 180) {
                this.rot -= this.turnspeed * delta;
            } else {
                this.rot += this.turnspeed * delta;
            }
            let a = Math.abs(this.rot - ta);
            if(a < 20) {
                if(d > 70) {
                    this.acc = this.accFw;
                } else {
                    this.acc = this.accFw * 0.2;
                }
            } else {
                this.acc = 0;
                this.speed *= 1 - 2 * this.airbrake * delta;
            }
        }
        if(this.game.startIn > 0) {
            this.acc = 0;
            this.speed = 0;
        }
        if(this.game.finished == 4 || (this.game.player && this.game.player.place > 0)) {
            this.acc = 0;
            this.speed *= 0.9;
        }
        this.dizzy -= delta;
        if(this.dizzy > 0) {
            this.acc *= 0.1;
        }
        super.update(delta);
    }
}

const normalizeAngle= (a) => {
    if(a > 360) {
        return a - 360;
    }
    if(a < 0) {
        return a + 360;
    }
    return a;
}

class Player extends Witch {
    constructor(o) {
        super(o);
        this.isPlayer = true;
        this.lastJinx = 0;
        this.maxFw = scale(210 + game.maxFw * 5); 
        this.maxBw = scale(-200); 
        this.turnspeed = 100 + game.turnspeed * 4;
    }
    update(delta) {
        this.lastJinx += delta;
        if(this.game.actions.l) {
            this.rot -= this.turnspeed * delta;
        }
        if(this.game.actions.r) {
            this.rot += this.turnspeed * delta;
        }
        if(this.game.actions.u) {
            this.acc = this.accFw;
        } else if(this.game.actions.d) {
            this.acc = -this.accBw;
        } else {
            this.acc = 0;
            this.speed *= 1 - this.airbrake * delta; 
        }
        if(this.game.startIn > 0) {
            this.acc = 0;
            this.speed = 0;
        }
        if(this.game.finished == 4 || this.place) {
            this.acc = 0;
            this.speed *= 0.9;
        }
        super.update(delta);
        if(this.game.actions.f && this.lastJinx >= this.game.jinxCooldown) {
            this.game.actions.f = false;
            this.game.addSprite(new Jinx({
                x:unscale(this.p.x), y:unscale(this.p.y),
                rot:this.rot
            }));
            this.lastJinx = 0;
        }
    }
    render(c, delta, ghost) {
        super.render(c, delta, ghost);
        if(this.lastJinx < this.game.jinxCooldown) {
            stroke(c,'#00000055');
            lineRendererScaled(c,[-11, -26, 9, -26]);
        }
        stroke(c,'#ffffaaaa');
        let d = [-11, -26, -11 + 20 * clamp(this.lastJinx / this.game.jinxCooldown, 0 ,1), -26];
        if(this.lastJinx >= this.game.jinxCooldown) {
            stroke(c,'#ffffaa88');
            c.lineWidth = 3;
            c.lineCap = 'round';
            lineRendererScaled(c,d);
        }
        c.lineWidth = 1;
        lineRendererScaled(c,d);
        
    }
}

class ColCircle {
    constructor(x,y,r) {
        this.p = new P(x,y);
        this.r = r;
        this.parent = null;
    }
    getP() {
        return this.parent ? this.p.addP(this.parent.p) : this.p;
    }
    isInside(point) {
        let d = dist(this.getP(), point);
        return d <= this.r;
    }
    intersets(other) {
        let d = dist(this.getP(), other);
        return d <= this.r + other.r;
    }
    render(c) {
        stroke(c,'#ffff0088');
        ellipseRenderer(c,[this.p.x,this.p.y,this.r,this.r, STROKE]);
    }
}

class Color {
    constructor(h) {
        h = h[0] == '#' ? h.substr(1) : h;
        this.r = hexToInt(h.substring(0,2));
        this.g = hexToInt(h.substring(2,4));
        this.b = hexToInt(h.substring(4,6));
        this.a = h.length == 8 ? hexToInt(h.substring(6,8)) : 255;
    }
    rgb() {
        return "#" + this._toHex(this.r) + this._toHex(this.g) + this._toHex(this.b);
    }
    rgba() {
        return "#" + this._toHex(this.r) + this._toHex(this.g) + this._toHex(this.b) + this._toHex(this.a);
    }
    clone() {
        return new Color(this.rgba());
    }
    lightness(d) {
        d = Math.round(d);
        this.r = clamp(this.r + d, 0 , 255);
        this.g = clamp(this.g + d, 0 , 255);
        this.b = clamp(this.b + d, 0 , 255);
        return this;
    }
    rand(d) {
        this.r = clamp(this.r + randInt(-d,d), 0 , 255);
        this.g = clamp(this.g + randInt(-d,d), 0 , 255);
        this.b = clamp(this.b + randInt(-d,d), 0 , 255);
        return this;
    }
    fade(a) {
        a = Math.round(a);
        this.a = clamp(this.a - a, 0, 255);
    }
    _toHex(d) {
        return (d <=15 ? "0" : "") + Number(d).toString(16);
    }
}

class Tree extends Sprite{
    constructor(obj) {
        super(obj);
        this.img = null;
        switch(randInt(1,2)) {
            case 1: this.img = treeImagePool.g(); break;
            case 2: this.img = pineImagePool.g(); break;
        }
        this.addColliderCircle(scale(0),scale(-9), scale(14));
    }
    render(c, delta) {
        c.drawImage(this.img.c, scale(-30), scale(-73));
        if(this.game.dbg) {
            this.colliders.forEach(col => col.render(c));
        }
    }
}

class Rock extends Sprite {
    constructor(obj) {
        super(obj);
        this.img = rockImagePool.g();
        this.img.colCircles.forEach(cc => this.addColliderCircle(cc.x, cc.y, cc.r));
    }
    render(c, delta) {
        c.drawImage(this.img.c, scale(-30), scale(-73));
        if(this.game.dbg) {
            this.colliders.forEach(col => col.render(c));
        }
    }
}

const stroke = (c, col) => c.strokeStyle = col;
const fill = (c, col) => c.fillStyle = col;
const witchRenderer = (c, rot, ghost, col) => {
    
    translateContext(c, 11, 19);
    col = col || '#000000';
    let radRot = toRad(rot);
    let cosV = cos(radRot);
    c.globalAlpha = ghost ? 0.4 : 1;
    let sf = ghost ? STROKE : FILL;
    if(!ghost) {
        fill(c, '#00000015');
        ellipseRendererScaled(c, [0, 8, 12, 4]);
        ellipseRendererScaled(c, [0, 8, 10, 3]);
        ellipseRendererScaled(c, [0, 8, 8, 2]);
    }
    // broom
    c.lineWidth = scale(1);
    c.rotate(radRot);
    stroke(c, '#5a3000');
    lineRendererScaled(c, [-10,0, 10,0]);
    stroke(c, '#ffffaa');
    lineRendererScaled(c, [-10,-2, -6,-1, -6,0, -10,0, -6,0, -6,1, -10,2]);
    c.rotate(-radRot);
    // body
    if(ghost) {
        c.clearRect(-5,-5,10,10);
    }
    fill(c, col);
    stroke(c, col);
    c.lineWidth = 1;
    ellipseRendererScaled(c, [0, -3, 3, 7, sf, cosV * 0.4]);
    // head
    let headX = cosV * 2
    fill(c, '#ffffff');
    stroke(c, '#ffffff');
    ellipseRendererScaled(c, [headX, -7, 2, 2, sf]);
    // hat
    fill(c, col);
    stroke(c, col);
    ellipseRendererScaled(c, [headX, -10, 7, 2, sf]);
    lineRendererScaled(c, [headX,-19, headX+3, -10, headX-3, -10, headX,-19, headX+3], sf);
    c.globalAlpha = 1;
}

const dataRenderer = (c, data) => {
    data.forEach(d => {
        let s = null;
        if(typeof d == 'string') {
            s = d[0];
        } else {
            s = d.shift();
        }
        switch(s) {
            case 's': stroke(c, d.substr(1)); break;
            case 'f': fill(c, d.substr(1)); break;
            case 'l': lineRendererScaled(c, d); break;
            case 'lf': lineRendererScaled(c, d, FILL); break;
            case 't': leafRenderer(c, d); break;
            case 'e': ellipseRendererScaled(c, d); break;
        }
    });    
}

const strokeFill = (c, sf) => { 
    if(sf==STROKE) {
        c.stroke();
    } else {
        c.fill();
    }
}

const lineRenderer = (c, d, sf) => {
    c.beginPath();
    c.moveTo(d[0], d[1]);
    for(let i = 2; i < d.length; i +=2) {
        c.lineTo(d[i], d[i+1]);
    }
    strokeFill(c, sf || STROKE);
}
const lineRendererScaled = (c, d, sf) => {
    lineRenderer(c, d.map(v => scale(v)), sf);
}

const ellipseRenderer = (c, d) => {
    let [x, y, rx, ry, sf, rot] = d;
    rot = rot || 0;
    sf = sf || FILL;
    c.beginPath();
    c.ellipse(x, y, rx, ry, rot, 0, 2 * PI);
    strokeFill(c, sf);
}
const ellipseRendererScaled = (c, d) => {
    let [x, y, rx, ry, sf, rot] = d;
    ellipseRenderer(c, [scale(x), scale(y), scale(rx), scale(ry), sf, rot]);
}

class Jinx extends Sprite {
    constructor(o) {
        super(o);
        this.rot = o.rot;
        this.ttl = 5;
        this.speed = 400;
        this.col = new Color(o.col || '#ffdd0088');
        this.col = this.col.rand(80);
    }
    update(delta) {
        super.update(delta);
        let newP = nextP(this.p, this.speed, this.rot, delta);
        let hitObstacle = hitsAnything(this.game, newP, false, this);
        if(!hitObstacle) {
            this.p = newP;
            return;
        } else {
            this.ttl = -1;
            addCollisionParticle(this.game, this.p, 3, this.col.rgba());
        }
    }
    // damage Witch
    damage(w) {
        w.speed = 0;
        w.acc = 0;
        w.dizzy = 1.5;
    }
    render(c, delta) {
        let spellHigh = this.col.clone().lightness(200);
        spellHigh.a = 150;
        let spellShadow =  this.col.clone();
        spellShadow.a = 10;
        let d = [];
        d.push('f'+spellShadow.rgba());
        d.push(['e', 0, 0, 12, 5, FILL]);
        d.push(['e', 0, 0, 11, 4, FILL]);
        d.push(['e', 0, 0, 10, 3, FILL]);
        d.push(['e', 0, 0, 9, 2, FILL]);
        d.push(['e', 0, 0, 8, 1, FILL]);
        // ball
        d.push(['e', 0, -9, 6, 6, FILL]);
        d.push(['e', 0, -9, 5, 5, FILL]);
        d.push(['e', 0, -9, 4, 4, FILL]);
        d.push('f'+this.col.rgba());
        d.push(['e', 0, -9, 3, 3, FILL]);
        d.push('s'+spellHigh.rgba());
        dataRenderer(c, d);
        // lightning
        let l = [];
        for(let i = 0; i < 10; i++) {
            l.push(randInt(-5,5));
            l.push(randInt(-14,-4));
        }
        c.lineWidth = 2;
        lineRenderer(c, l);
        c.lineWidth = 1;
        lineRenderer(c, l);
    }
}

const renderSpell = (c, col) => {
    
}

const leafRenderer = (c, d) => {
    let [f, x, y, rx, ry] = d;
    ry = ry || rx;
    x = scale(x);
    y = scale(y);
    rx = scale(rx);
    ry = scale(ry);
    let col = new Color(f);
    let bg = col.clone();
    bg.a = 100;
    fill(c, bg.rgba());
    ellipseRenderer(c, [x, y, rx, ry])
    for(let i = 0; i < scale(10 * PI); i += PI / scale(8)) {
        let q = i % (PI * 2);
        let mod = 0;
        if(q >= 0 && q <= 2) {
            mod = -30;
        } else if(q >= 3 && q <= 5) {
            mod = 20;
        }
        let leaf = col.clone().lightness(randInt(-10,10) + mod).rand(20);
        let rMod = rand(0,1);
        let lrx = rMod * rx;
        let lry = rMod * ry;
        mod *= rMod;
        let lx = x + cos(i)*lrx;
        let ly = y + sin(i)*lry;
        fill(c, leaf.rgba());
        ellipseRenderer(c, [lx, ly, scale(3), scale(1), FILL, rand(0,PI)]);
    }
}

const getTrunk = () => {
    return [
        'f#00000033',
        ['e', 0, 2, 14, 5],
        ['e', 0, 2, 9, 4],
        's#883300',
        ['l', -2,2, 1,-8],
        ['l', 2,3, 1,-9],
        ['l', randInt(2,4),2, randInt(-1,0),-8],
        's#aa5500',
        ['l', 0,3, 0,-10],
        ['l', randInt(-4,-2),2, randInt(0,1),-8]
    ];
}

const renderTree = (c, col) => {
    let treedata = getTrunk();
    let leafdata = [];
    leafdata.push(['t', col, rand(-5, 5),rand(-25, -40), rand(8, 14), rand(8, 14)]);
    leafdata.push(['t', col, rand(-8, 8),rand(-20, -35), rand(10, 16), rand(10, 16)]);
    leafdata.push(['t', col, rand(-10, -5), rand(-15,-20), rand(12,17), rand(12,17)]);
    leafdata.push(['t', col, rand(5, 10),rand(-15,-20), rand(12,17), rand(12,17)]);
    leafdata.sort(() => rand(-0.5, 0.5));
    dataRenderer(c, treedata.concat(leafdata));
}

const renderPine = (c, col) => {
    let treedata = getTrunk();
    let leafdata = [];
    let maxW = rand(18,25);
    let s = rand(2,5);
    let y = -8;
    for(let w = maxW; w > 0; w -=s) {
        y -= 5
        leafdata.push(['t', col, 0, y, w, w / 3]);
    }
    dataRenderer(c, treedata.concat(leafdata));
}



const levelPlantTrees = (game, treeBaseColor, d) => {
    for(let i = 0; i <= d.length -4; i += 2) {
        let p1 = new P(d[i], d[i+1]);
        let p2 = new P(d[i+2], d[i+3]);
        let p = p1.clone();
        let len = dist(p1, p2);
        let steps = mathCeil(len/22);
        let v = p2.diffP(p1).div(steps);
        if(i == 0) {
            p = p.add(-v.x, -v.y)
        }
        for(let step = (i == 0 ? 0 : 1); step <= steps; step++) {
            p = p.addP(v);
            let tp = p.clone();
            let t =game.addSprite(new Tree({
                x:tp.x + scale(rand(-3,3)), 
                y:tp.y + scale(rand(-3,3))
            }));
            ColGrid.a(t);
        }
    }
}
const levelSpreadDirt = (game, d, col, w) => {
    let baseColor = new Color(col || '#44371f55');
    let size = scale(w || 15);
    d = d.map(v => scale(v));
    for(let i = 0; i <= d.length -4; i += 2) {
        let p1 = new P(d[i], d[i+1]);
        let p2 = new P(d[i+2], d[i+3]);
        let p = p1.clone();
        let len = dist(p1, p2);
        let v = p2.diffP(p1).div(len);
        if(i == 0) {
            p = p.add(-v.x, -v.y)
        }
        game.bgc.lineCap = 'round';
        let stepFactor = 0.3;
        for(let step = 0; step <= len; step+=stepFactor) {
            p = p.add(v.x * stepFactor, v.y*stepFactor);
            let pv = p.add(v.x * rand(3,5)+rand(-1,1), v.y*rand(3,5)+rand(-1,1));
            let rx = rand(-size,size);
            let ry = rand(-size,size);
            
            let col = baseColor.clone().rand(30);
            stroke(game.bgc, col.rgba());
            game.bgc.lineWidth = randInt(1,3);
            lineRenderer(game.bgc, [p.x +rx, p.y +ry, pv.x+rx, pv.y+ry]);
        }
    }
} 

const levelDropRocks = (game, d) => {
    let col = new Color('666666');
    for(let i = 0; i <= d.length -4; i += 2) {
        let p1 = new P(d[i], d[i+1]);
        let p2 = new P(d[i+2], d[i+3]);
        let p = p1.clone();
        let len = dist(p1, p2);
        let steps = mathCeil(len/45);
        let v = p2.diffP(p1).div(steps);
        if(i == 0) {
            p = p.add(-v.x, -v.y)
        }
        for(let step = (i == 0 ? 0 : 1); step <= steps; step++) {
            p = p.addP(v);
            let rp = p.clone();
            let r = game.addSprite(new Rock({
                x:rp.x + scale(rand(-3,3)), 
                y:rp.y + scale(rand(-3,3)),
                f:col.rgba()
            }));
            ColGrid.a(r);
        }
    }
    
}

const renderRock = (c, d, sprite) => {
    let [x, y, f] = d;
    let col = new Color(f || '777777');
    fill(c, '#00000022');
    ellipseRenderer(c, [x, y, scale(24), scale(7)]);
    ellipseRenderer(c, [x, y, scale(21), scale(6)]);
    [rand(20,32), rand(15,22), rand(10,15), rand(7,13)].forEach((size, idx) => {
        size = scale(size);
        let dx = scale(rand(5,7) * idx * (rand(0,1) >= 0.5 ? -1 : 1));
        renderPebble(c, [x + dx, y-size, size * 0.8, size, col.rgba()], sprite);
        
    });
}

const renderPebble = (c, d, sb) => {
    let [x, y, rx, ry, f] = d;
    let col = new Color(f || '777777');
    fill(c, col.rgb());
    let ps = [];
    let step = (PI * 2) / 10;
    for(let a = 0; a <= (PI * 2)-step ; a += step) {
        let ra = a + rand(-step/3, step/3);
        ps.push(x + cos(ra) * (rx +2));
        ps.push(y + sin(ra) * (ry+2));
    }
    lineRenderer(c, ps, FILL);
    
    for(let i = 0; i < scale(30) * PI; i += PI / scale(20)) {
        let q = i % (PI * 2);
        let mod = 0;
        if((q >= 0 && q < 2.5) || q > 5.1) {
            mod = -30;
        } else if(q >= 3 && q <= 5) {
            mod = 40;
        }
        let rock = col.clone().lightness(rand(-10,10) + mod).rand(10);
        let rMod = rand(0,1);
        let lrx = rMod * rx;
        let lry = rMod * ry;
        mod *= rMod;
        let lx = x + cos(i)*lrx;
        let ly = y + sin(i)*lry;
        fill(c, rock.rgb());
        ellipseRenderer(c, [lx, ly, rand(1,3), rand(1,3), FILL, rand(0,PI)]);
    }
    if(sb) {
        sb.colCircles.push({x:x, y:y+scale(6), r:rx-scale(1)});
    }
}


const loadMusic = (song, game, audioname, cb) => {
    let musicplayer = new CPlayer();
    musicplayer.init(song);
    while(musicplayer.generate() < 1) {}
    let wave = musicplayer.createWave();
    Music[audioname] = document.createElement("audio");
    Music[audioname].src = URL.createObjectURL(new Blob([wave], {type: "audio/wav"}));
    Music[audioname].loop = cb ? true : false;
    if(cb) {
        Music.play();
        msg('musicians aquired');
        setTimeout(()=>msg(""), 2000);
        cb();
    }
}


let game = new Game();

game.levels.push(
    {
        n:"Lobau / Vienna",
        d:[
            "t#1i2ems2qnq8kp480p430xg2gyu3kzogwjkfi928q9a9yb8e49ugw2wgw0zf4132m",
            "t#506450bo6ed24qci465ki264jgaktwc4v5bev9a7ub64",
            "t#2c1pnx20oa7b",
            "r#tjbeufanud8qu26z",
            "d#dv40he4aji5sl27xmy97p696qj7u",
            "d#sj5qts4mvs4pwn6bxb8j",
            "d#9v767z6z6t81729q7yc07udx6pf14ifa2zdy2ec3",
            "d#2f6g2t5340475t3y",
            "r#hvg0eidvbbc4c8e7b8gm",
            "ps#7r48",
            "p#ig51l98foc9usz4wvv5gwmblu1dbk4c5es7t8w6w77a081dg4seo2mb2245z5c41eo3y",
            "f#ce2pce5m",
            "cp#cg2h123ev89a43144z9u5418"
          ]
    },
    {
        n:"Sherwood / Nottingham",
        d:[
            "ps#53ee",
            "t#6agwulgvxug0zccxzl3nyb1lu50eg30r3i0m1h1z0f760idq2bgc5ygt",
            "t#cm12at279r6k9n7x8s7x89698j2z710y9q1x906g",
            "t#475b4e9c69c0becce3amg360lb4uow5uqr81rncf",
            "t#l39lkgd5iwghl3eklmg6ntgfmbeelg9m",
            "r#vebfv8av",
            "r#wk4zw74z",
            "r#qk3wqz46",
            "d#gobcj799lq8wo8azqsdjsydf",
            "d#6p6p584s354k1y731e9r",
            "p#cvd2kw84suepxac1w880oe41hh36at8q8h8t4z4j285z2jbi8ydo",
            "f#aucmasgh",
            "cp#avcf124irobo7l154b673z14"
          ]
    },
    {
        n:"Kampinoski / Warsaw",
        d:[
            "t#r593oe82el7mbt92are5g2gbxcglzefmzgc7yq2fvo0k450m131y0rbt18f73ygm98geb4eo",
            "r#f1bnh0cwped3nebfgcbn",
            "t#q2d7tod3vbarv173rq4qil44b347605d5bco",
            "ps#fp9f",
            "p#lx9gqibdteaotg7hoi5ucr6r8icm5ae21tah5i4edd2sro37we6swsbgudecfyf5djblgb9u",
            "f#m08blzb3",
            "d#92a86wd84je033c0",
            "d#oc9zqtaxsc9qs181pn6h",
            "d#gefbe6dddpbof3a9hc9i",
            "cp#m27z1c3jen461f3cnd0j1g3xrod51a3f"
          ]
    },
    {
        n:"Rome",
        d:[
            "t#0x4t1a2r2y1i7v1lfn6hng1wrt0zxf1zym6nymc1x8g9srh2nwgqj4exgdd1ccf99wgi5fgn2jfq0scb0r54",
            "r#cp9vbkba8dcg54c24g8z5b6v7i67b48fcb9i",
            "r#kd9nn97cqx63uj86u3azrtcunqbkko9u",
            "f#6y1t6y60",
            "ps#2844",
            "d#68ds4id239af367i4l51",
            "d#qu4nua5ow78svlc9t2dup9dz",
            "r#6n7u5ub589b87u8fan9z",
            "r#qp7smk9lt59bppatrobi",
            "t#971hfo59ln1tay1efh3zim2ge227fe2w",
            "t#bdglgee7lpgyd0gngefbirgafsg3",
            "t#fqa4ga9z",
            "p#at4wnjd3t0ecx0a5ut52od4egtb78rer3jdo238v534q",
            "t#ydgoz7d6zf6qz31vvb0f1z0n056m0cdr0zgt4lh21bf0",
            "d#kk6vhy92h8akfhbjbud4",
            "d#bp63f18tgj8zhla3kxcl",
            "d#e38gewapgrbhj0bp",
            "d#iz7kg08reladcxch",
            "cp#701o134jqvck1n4cp11l154y7bcg1d44"
          ]
    }
);

game.init();
