import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";

const doc = new jsPDF();
console.log(doc.html.toString());
