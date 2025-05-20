const fs = require('fs')

const policies = require('./policies.json')
const tocs = require('./tocs.json')

const main = async () => {
  policies.forEach(async ({title, url})=> {
    const pdfRespone = await fetch(url);
    const pdfBuffer = await pdfRespone.arrayBuffer();
    const binaryPdf = Buffer.from(pdfBuffer);
    fs.writeFileSync(`./pdfs/${title}.pdf`, binaryPdf, 'binary');
    console.log(`Wrote "${title}"`)
  })
  tocs.forEach(async ({title, url})=> {
    const pdfRespone = await fetch(url);
    const pdfBuffer = await pdfRespone.arrayBuffer();
    const binaryPdf = Buffer.from(pdfBuffer);
    fs.writeFileSync(`./pdfs/${title}.pdf`, binaryPdf, 'binary');
    console.log(`Wrote "${title}"`)
  })
}

main()