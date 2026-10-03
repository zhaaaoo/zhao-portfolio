import { createServer } from 'vite';
import { chromium } from 'playwright';

const out = 'public/wang-zhao-resume.pdf';

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();

try {
  const page = await browser.newPage();
  await page.goto('http://localhost:5199/resume/', { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });

  // .page has a min-height of one A4 sheet, so anything taller spills onto a second page
  const overflow = await page.evaluate(() => {
    const a4 = (297 / 25.4) * 96;
    return Math.ceil(document.querySelector('.page')!.getBoundingClientRect().height - a4);
  });
  if (overflow > 0) throw new Error(`Resume is ${overflow}px longer than one A4 page`);

  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  console.log(`Wrote ${out}`);
} finally {
  await browser.close();
  await server.close();
}
