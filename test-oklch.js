import html2canvas from 'html2canvas-pro';
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!DOCTYPE html><div style="color: oklch(0.5 0.2 250)">Hello</div>`);
global.window = dom.window;
global.document = dom.window.document;
global.window.html2canvas = html2canvas;

html2canvas(document.body).then(() => console.log('success')).catch(e => console.error(e.message));
