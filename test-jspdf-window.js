import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import { JSDOM } from "jsdom";

const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`);
global.window = dom.window;
global.document = dom.window.document;
global.window.html2canvas = html2canvas;

const doc = new jsPDF();
doc.html(document.body, {
  callback: function (doc) {
    console.log("Success!");
  }
}).catch(console.error);
