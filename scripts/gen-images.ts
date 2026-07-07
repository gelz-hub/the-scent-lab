import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

const OUT = path.join(process.cwd(), 'public', 'images')
fs.mkdirSync(path.join(OUT, 'products'), { recursive: true })
const LOG = path.join(process.cwd(), 'scripts', 'gen-images.log')
fs.writeFileSync(LOG, '') // reset

function log(...a: any[]) {
  const line = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ')
  fs.appendFileSync(LOG, line + '\n')
}

process.on('uncaughtException', (e) => log('UNCAUGHT', e?.stack || e))
process.on('unhandledRejection', (e) => log('UNHANDLED', e?.stack || e))
process.on('SIGTERM', () => log('SIGTERM'))
process.on('SIGINT', () => log('SIGINT'))

const STYLE =
  'professional product photography, minimalist, soft diffused studio lighting, plain off-white seamless background, centered composition, subtle soft shadow beneath, elegant, high-end, photorealistic, sharp focus, no text, no watermark, no readable label lettering'

const jobs = [
  { out: 'products/p-dior-sauvage.png', size: '1024x1024', prompt: `luxury men's eau de toilette bottle, deep midnight blue glass, tall rectangular flacon with dark matte cap, ${STYLE}` },
  { out: 'products/p-chanel-bleu.png', size: '1024x1024', prompt: `elegant men's perfume bottle, thick clear glass with deep blue liquid, rounded square shape, black magnetic cap, ${STYLE}` },
  { out: 'products/p-tomford-tobacco.png', size: '1024x1024', prompt: `amber brown rectangular perfume bottle with brushed gold cap, luxurious tobacco colored liquid, ${STYLE}` },
  { out: 'products/p-mfk-baccarat.png', size: '1024x1024', prompt: `transparent faceted crystal perfume bottle with crimson red liquid, elegant symmetrical, ${STYLE}` },
  { out: 'products/p-creed-aventus.png', size: '1024x1024', prompt: `sleek matte black perfume bottle with polished silver cap, masculine premium flacon, ${STYLE}` },
  { out: 'products/p-lelabo-santal.png', size: '1024x1024', prompt: `amber apothecary perfume bottle with simple black label and pump dispenser, rustic minimalist, ${STYLE}` },
  { out: 'products/p-byredo-gypsy.png', size: '1024x1024', prompt: `clear cylindrical minimalist perfume bottle with white cap, scandinavian design, ${STYLE}` },
  { out: 'products/p-jomalone-woodsage.png', size: '1024x1024', prompt: `clear rectangular perfume bottle with black cap and cream colored label, british elegant, ${STYLE}` },
  { out: 'products/p-ysl-blackopium.png', size: '1024x1024', prompt: `black glittery round perfume bottle with glitter sparkle, feminine glamorous, gold accents, ${STYLE}` },
  { out: 'products/p-prada-candy.png', size: '1024x1024', prompt: `rounded soft pink perfume bottle with gold cap, feminine elegant, ${STYLE}` },
  { out: 'products/p-versace-eros.png', size: '1024x1024', prompt: `teal turquoise square perfume bottle with gold medusa accent, bold luxurious, ${STYLE}` },
  { out: 'products/p-chanel-no5.png', size: '1024x1024', prompt: `classic rectangular clear perfume bottle with golden liquid and minimalist cream label, timeless iconic, ${STYLE}` },
  { out: 'products/p-tomford-blackorchid.png', size: '1024x1024', prompt: `dark black ribbed perfume bottle with gold cap, opulent luxurious, ${STYLE}` },
  { out: 'products/p-dior-jadore.png', size: '1024x1024', prompt: `tall golden amphora shaped perfume bottle with long neck, feminine elegant, golden liquid, ${STYLE}` },
  { out: 'products/p-hermes-terre.png', size: '1024x1024', prompt: `orange amber rounded perfume bottle with black cap, refined french, ${STYLE}` },
  { out: 'products/p-marcjacobs-daisy.png', size: '1024x1024', prompt: `clear round perfume bottle topped with white daisy flowers, playful feminine, ${STYLE}` },
  { out: 'hero-1.png', size: '1440x720', prompt: `editorial perfume still life, a single elegant frosted glass perfume bottle resting on a sculptural travertine stone pedestal, warm beige seamless backdrop, soft directional morning light from the left, generous negative space on the right, calm minimal luxury, photorealistic, no text, no watermark` },
  { out: 'col-luxury.png', size: '864x1152', prompt: `luxury perfume bottle with gold accents on polished marble surface, dark moody elegant charcoal backdrop, single dramatic light, premium editorial, no text` },
  { out: 'col-niche.png', size: '864x1152', prompt: `niche artisan amber apothecary perfume bottle on raw concrete surface, minimalist, soft natural side light, neutral tones, editorial, no text` },
  { out: 'col-gift.png', size: '864x1152', prompt: `elegant perfume gift set, a softly opened cream box with a perfume bottle and silk ribbon, soft neutral background, minimal luxury, no text` },
  { out: 'journal-1.png', size: '1344x768', prompt: `flat lay of perfume ingredients, citrus slices, white flowers, cedar wood and amber resin, on warm neutral linen, soft overhead light, editorial minimal, no text` },
  { out: 'journal-2.png', size: '1344x768', prompt: `perfumer's laboratory, glass droppers, vials and beakers with amber liquid, moody minimalist soft light, neutral tones, editorial, no text` },
  { out: 'insta-1.png', size: '1024x1024', prompt: `a perfume bottle on a sunlit windowsill beside softly draped linen curtain, calm morning light, minimal scandinavian interior, no text` },
  { out: 'insta-2.png', size: '1024x1024', prompt: `perfume bottle on a stack of art books with a dried botanical branch, warm minimal still life, editorial, no text` },
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function genOne(zai: any, job: { out: string; size: string; prompt: string }) {
  const p = path.join(OUT, job.out)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  if (fs.existsSync(p) && fs.statSync(p).size > 5000) {
    log('skip', job.out)
    return
  }
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      log('start', job.out, 'attempt', attempt)
      const res = await zai.images.generations.create({ prompt: job.prompt, size: job.size })
      const b64 = res.data[0].base64
      fs.writeFileSync(p, Buffer.from(b64, 'base64'))
      log('done', job.out, `(${fs.statSync(p).size}b)`)
      return
    } catch (e: any) {
      const msg = String(e?.message || e)
      if (msg.includes('429') || msg.includes('Too many')) {
        const wait = 6000 * attempt
        log('retry', attempt, job.out, 'in', wait)
        await sleep(wait)
        continue
      }
      log('FAIL', job.out, msg)
      await sleep(2000)
      return
    }
  }
  log('GIVEUP', job.out)
}

async function run() {
  log('init ZAI')
  const zai = await ZAI.create()
  log('ZAI ready')
  let i = 0
  async function worker(w: number) {
    await sleep(w * 1500)
    while (i < jobs.length) {
      const idx = i++
      const job = jobs[idx]
      await genOne(zai, job)
      await sleep(1500)
    }
  }
  await Promise.all([worker(1), worker(2)])
  log('ALL DONE')
}

run().catch((e) => log('TOPLEVEL CATCH', e?.stack || e))
