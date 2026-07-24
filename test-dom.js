const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
<div id="ai-analysis-content">
  <div>
    <div>
       <h3>Title</h3>
       <p>Line 1</p>
       <p>Line 2</p>
       <ul>
         <li>Item 1</li>
         <li>Item 2</li>
       </ul>
    </div>
  </div>
</div>
`);
const document = dom.window.document;
const aiContent = document.querySelector('#ai-analysis-content > div');

const blocks = aiContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, blockquote, div > strong, div > span');
console.log(Array.from(blocks).map(b => b.tagName));
