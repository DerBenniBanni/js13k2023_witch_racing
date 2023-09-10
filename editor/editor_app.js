import {Editor} from './editor/editor.js'; 

window.editor = null; // make it global...
editor = new Editor(document.querySelector('#canvas'));
editor.resize();
ko.applyBindings(editor);
