const SHOP_DOMAINS = Object.freeze({
  "Temu": ["temu.com"],
  "AliExpress": ["aliexpress.com"],
  "Alibaba": ["alibaba.com"],
  "Amazon": ["amazon.com", "amazon.co.uk", "amazon.fr", "amazon.de", "amazon.it", "amazon.es", "amazon.ca", "amazon.ae", "amazon.sa", "amazon.com.tr", "amazon.co.jp", "amazon.com.mx", "amazon.in", "amazon.nl", "amazon.com.au", "amazon.sg", "amazon.com.br", "amazon.pl", "amazon.se", "amazon.eg"],
  "SHEIN": ["shein.com"],
  "eBay": ["ebay.com", "ebay.co.uk", "ebay.fr", "ebay.de", "ebay.it", "ebay.es", "ebay.ca", "ebay.com.au", "ebay.ie", "ebay.nl", "ebay.be", "ebay.at", "ebay.ch", "ebay.com.sg"],
  "Walmart": ["walmart.com"],
  "Etsy": ["etsy.com"],
  "ASOS": ["asos.com"],
  "Banggood": ["banggood.com"],
  "Best Buy": ["bestbuy.com", "bestbuy.ca"],
  "B&H Photo": ["bhphotovideo.com"],
  "Carrefour": ["carrefour.com", "carrefour.fr", "carrefour.es", "carrefouruae.com", "carrefourksa.com"],
  "Cdiscount": ["cdiscount.com"],
  "Costco": ["costco.com", "costco.ca", "costco.co.uk", "costco.com.au"],
  "Decathlon": ["decathlon.com", "decathlon.fr", "decathlon.co.uk", "decathlon.de", "decathlon.es", "decathlon.it", "decathlon.ca"],
  "Depop": ["depop.com"],
  "DHgate": ["dhgate.com"],
  "Flipkart": ["flipkart.com"],
  "Fnac": ["fnac.com", "fnac.fr", "fnac.es", "fnac.pt", "fnac.be"],
  "Fruugo": ["fruugo.com", "fruugo.fr", "fruugo.co.uk"],
  "Geekbuying": ["geekbuying.com"],
  "GOAT": ["goat.com"],
  "Home Depot": ["homedepot.com", "homedepot.ca"],
  "IKEA": ["ikea.com", "ikea.fr", "ikea.de", "ikea.co.uk", "ikea.es", "ikea.it", "ikea.ca", "ikea.ae", "ikea.sa"],
  "Joom": ["joom.com"],
  "Lazada": ["lazada.com", "lazada.sg", "lazada.com.my", "lazada.co.th", "lazada.co.id", "lazada.com.ph", "lazada.vn"],
  "LightInTheBox": ["lightinthebox.com"],
  "Macy's": ["macys.com"],
  "Mercari": ["mercari.com", "mercari.jp"],
  "Newegg": ["newegg.com", "newegg.ca"],
  "Nike": ["nike.com"],
  "Noon": ["noon.com", "noon.sa", "noon.ae", "noon.com.eg"],
  "Nordstrom": ["nordstrom.com", "nordstromrack.com"],
  "OnBuy": ["onbuy.com"],
  "Poshmark": ["poshmark.com", "poshmark.ca"],
  "Rakuten": ["rakuten.com", "rakuten.co.jp", "rakuten.fr", "rakuten.de"],
  "Romwe": ["romwe.com"],
  "Sephora": ["sephora.com", "sephora.fr", "sephora.co.uk", "sephora.ae", "sephora.sa"],
  "Shopee": ["shopee.com", "shopee.sg", "shopee.com.my", "shopee.co.th", "shopee.co.id", "shopee.ph", "shopee.vn", "shopee.tw", "shopee.com.br"],
  "StockX": ["stockx.com"],
  "Target": ["target.com"],
  "Trendyol": ["trendyol.com"],
  "Vinted": ["vinted.com", "vinted.fr", "vinted.co.uk", "vinted.de", "vinted.es", "vinted.it", "vinted.pl", "vinted.nl"],
  "Wayfair": ["wayfair.com", "wayfair.co.uk", "wayfair.ca", "wayfair.de"],
  "Zalando": ["zalando.com", "zalando.co.uk", "zalando.de", "zalando.fr", "zalando.es", "zalando.it", "zalando.nl", "zalando.pl", "zalando.se"],
  "Zara": ["zara.com"],
  "Adidas": ["adidas.com"],
  "Puma": ["puma.com"],
  "Lowe's": ["lowes.com"],
  "Ulta Beauty": ["ulta.com"],
  "iHerb": ["iherb.com"],
  "Boohoo": ["boohoo.com"],
  "Farfetch": ["farfetch.com"],
  "Mytheresa": ["mytheresa.com"],
  "SSENSE": ["ssense.com"],
  "Revolve": ["revolve.com"],
  "Kohl's": ["kohls.com"],
  "Overstock": ["overstock.com"],
  "Allegro": ["allegro.pl"],
  "Ozon": ["ozon.ru"],
  "Wildberries": ["wildberries.ru", "wildberries.com"],
  "Hepsiburada": ["hepsiburada.com"],
  "Myntra": ["myntra.com"],
  "eMAG": ["emag.ro", "emag.hu", "emag.bg"],
  "Coolblue": ["coolblue.nl", "coolblue.be"],
  "MediaMarkt": ["mediamarkt.de", "mediamarkt.nl", "mediamarkt.es", "mediamarkt.at"],
  "Boulanger": ["boulanger.com", "boulanger.fr"],
  "Darty": ["darty.com", "darty.fr"],
  "Fnac Darty": ["fnac-darty.com"],
  "Shopify Store": ["shop.app"],
});

export function findSupportedShop(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  for (const [shop, domains] of Object.entries(SHOP_DOMAINS)) {
    if (domains.some(domain => host === domain || host.endsWith('.' + domain))) return shop;
  }
  return null;
}

export function isValidProductUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && url.href.length <= 2048 && Boolean(findSupportedShop(url.hostname));
  } catch {
    return false;
  }
}
