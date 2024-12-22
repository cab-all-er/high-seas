import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer'
import Airtable from 'airtable'

let browser: puppeteer.Browser

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.BASE_ID!,
)

const stats = {
  shipCount: 0,
  refreshAt: 0,
}

const html = (shipCount: number) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    html, body { margin: 0 }
    main { display: flex; flex-direction: column; align-items: center; }
    h1 { font-family: sans-serif; text-align: center; }
  </style>
</head>
<body>
  <main>
    <h1>${shipCount} projects shipped</h1>
  </main>
</body>
</html>`

export async function GET() {
  // if (stats.refreshAt < Date.now()) {
  //   console.log("Refetching ships", stats.refreshAt, Date.now())
  //   const allShips = await base('ships').select({}).all()
  //   stats.shipCount = allShips.length
  //   stats.refreshAt = Date.now() + 60_000
  // }

  const isLocal = false // Set this variable as required - @sparticuz/chromium does not work on ARM, so we use a standard Chrome executable locally - see issue https://github.com/Sparticuz/chromium/issues/186
  if (!browser?.isConnected()) {
    // If you don't need webGL, this skips the extraction of the bin/swiftshader.tar.br file, improving performance
    chromium.setGraphicMode = false
    browser = await puppeteer.launch({
      // ...(isLocal
      //   ? { channel: 'chrome' }
      //   : {
      //       // args: chromeArgs,
      //       executablePath: await chromium.executablePath(),
      //       ignoreHTTPSErrors: true,
      //     }),
    })
  }

  try {
    const page = await browser.newPage()

    await page.setViewport({
      width: 800,
      height: 100,
      deviceScaleFactor: 3,
    })

    await page.setContent(html(123))

    const screenshot = await page.screenshot({
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 800,
        height: 100,
      },
    })

    await page.close()
    await browser.close()

    // Return the screenshot as a PNG
    return new Response(screenshot, {
      headers: {
        'Content-Type': 'image/png',
        // "Cache-Control": "public, max-age=3600"
      },
    })
  } catch (error) {
    await browser.close()
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }
}
