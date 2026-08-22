<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import faviconImg from './assets/favicon.ico'
import guideStep1Img from './assets/guide_step1.png'
import guideStep2Img from './assets/guide_step2.png'
import guideStep3Img from './assets/guide_step3.png'
import guideStep4Img from './assets/guide_step4.png'
import guideBeforeImg from './assets/guide_before.png'
import guideAfterImg from './assets/guide_after.png'
import PrivacyPolicyModal from './components/PrivacyPolicyModal.vue'

const socketUrl = computed(() => {
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
  return `${protocol}${window.location.host}`
})

const isConnected = ref(false)
const userInteracted = ref(false)
const opportunities = ref([])
const totalScanned = ref(0)
const cumulativeProfit = ref(0)
const minProfit = ref(0.01)
const activeSince = ref(null)

const activeSinceText = computed(() => {
  if (!activeSince.value) return ''
  const dateStr = activeSince.value.toLocaleString()
  const prefixes = {
    EN: 'Active since:',
    TR: 'Aktiflik Başlangıcı:',
    ES: 'Activo desde:',
    PT: 'Ativo desde:',
    ID: 'Aktif sejak:',
    FR: 'Actif depuis:',
    DE: 'Aktiv seit:'
  }
  const prefix = prefixes[currentLanguage.value] || 'Active since:'
  return `${prefix} ${dateStr}`
})

const formatNumberWithDots = (val) => {
  if (val === undefined || val === null) return '0'
  const num = Math.floor(Number(val))
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const formatCumulativeProfit = computed(() => {
  const val = cumulativeProfit.value
  if (val >= 100) {
    const num = Math.floor(val / 100) * 100
    return '+' + formatNumberWithDots(num)
  } else if (val >= 10) {
    const num = Math.floor(val / 10) * 10
    return '+' + formatNumberWithDots(num)
  } else if (val >= 1) {
    const num = Math.floor(val)
    return '+' + formatNumberWithDots(num)
  }
  return '+0'
})
const profitSteps = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.2, 0.3, 0.4, 0.5, 1.0]

const minProfitIndex = computed({
  get: () => {
    const val = minProfit.value
    let closestIndex = 0
    let minDiff = Math.abs(profitSteps[0] - val)
    for (let i = 1; i < profitSteps.length; i++) {
      const diff = Math.abs(profitSteps[i] - val)
      if (diff < minDiff) {
        minDiff = diff
        closestIndex = i
      }
    }
    return closestIndex
  },
  set: (newIndex) => {
    minProfit.value = profitSteps[newIndex]
  }
})
const selectedCategory = ref('All')
const rltBalance = ref('')
const volumeLevel = ref(0)
const soundEnabled = computed(() => volumeLevel.value > 0)
const showVolumeSlider = ref(false)

const toggleMute = () => {
  if (volumeLevel.value > 0) {
    volumeLevel.value = 0
  } else {
    volumeLevel.value = 0.4
  }
}
const showLangDropdown = ref(false)
const currentLanguage = ref('EN')

const translations = {
  EN: {
    subtitle: "Automatically scans, calculates, and lists the most profitable instant arbitrage opportunities in the RollerCoin market.",
    guide: "GUIDE",
    soundSettings: "Volume Settings",
    langTitle: "Change Language",
    balancePlaceholder: "Enter your RLT balance here.",
    balanceTooltip: "Enter your RLT balance to hide high-priced items you cannot afford and only see opportunities within your budget.",
    minProfit: "Minimum Profit:",
    all: "All",
    miners: "Miners",
    parts: "Parts",
    racks: "Racks",
    batteries: "Batteries",
    other: "Other",
    tierRemaining: "remaining",
    watchAdMaintain: "watch ad to maintain tier",
    watchAdUpgrade: "watch ad to upgrade tier",
    qty: "Qty",
    qtyUnit: "Units",
    actualBuy: "Actual Buy",
    targetSell: "Target Sell (Net)",
    netProfit: "Net Profit",
    buyBtn: "Buy",
    showMore: "Show More",
    waitingLive: "Waiting for Live Opportunities...",
    emptyDesc: "As arbitrage opportunities are captured in the market, they will be displayed in this area.",
    fanDisclaimer: "Rollercoinmarkt is an independent fan project. It is not affiliated with, authorized, or endorsed by RollerCoin.",
    createdBy: "Created by",
    scannedOpportunities: "Scanned Opportunities",
    profitOpportunities: "Profit Opportunities",
    accessTiers: "Access Tiers",
    modalSubtitle: "Upgrade your tier to unlock advanced filtering tools and indicator features.",
    standardPlan: "Standard",
    advancedPlan: "Advanced",
    premiumPlan: "Premium",
    free: "Free",
    watchAd1: "1 Watch Ad",
    watchAd2: "1+1 Watch Ad",
    tier1Feature1: "Basic opportunity feed",
    tier1Feature2: "Standard search filter",
    tier1Feature3: "1 active indicator bar",
    tier2Feature1: "Affordability RLT filter",
    tier2Feature2: "15-minute tier timer boost",
    tier2Feature3: "2 active indicator bars",
    tier3Feature1: "Dynamic maintainable timer",
    tier3Feature2: "All features unlocked",
    tier3Feature3: "3 active indicator bars",
    modalDescription: "By default, you start with the Standard (Tier I) plan. Watching 1 video ad unlocks the Advanced (Tier II) plan for 15 minutes. If you do not watch another ad within these 15 minutes, your tier will be downgraded by one level. However, watching a second ad during this period upgrades you to the Premium (Tier III) plan. To maintain your Premium (Tier III) status, simply watch another ad within 15 minutes to reset the countdown and maximize your access time.",
    currentTierLabel: "YOUR CURRENT TIER",
    lockedLabel: "Locked (Watch Ad)",
    now: "Now",
    secAgo: "s ago",
    minAgo: "m ago",
    guideAlert: "RollerCoin Arbitrage Guide will be added soon!",
    guideTitle: "RollerCoin Arbitrage Guide",
    guideStep0Title: "Welcome to Rollercoinmarkt!",
    guideStep0Desc: "This guide is designed to help you turn instant price imbalances in the RollerCoin market into profit.\n\nOur system continuously analyzes the two cheapest listings in the market to capture quick and profitable buy-sell (arbitrage) opportunities. The main goal is to buy an underpriced item instantly and resell it using our automatically calculated target price to make a quick profit as the cheapest listing.",
    guideStep1Title: "Step 1 - Filter & List Opportunities",
    guideStep1Desc: "Enter your current RLT balance to view the full list of products you can purchase, and use other filtering options.",
    guideStep2Title: "Step 2 - Reading Listed Opportunities",
    guideStep2Desc: "The best market opportunities are instantly listed here based on your filters:\n\n• QTY: The quantity available at the cheapest price.\n• Actual Buy: The net RLT required to buy the product.\n• Target Sell: The recommended resale price (market fee included) to ensure your listing is the cheapest. Automatically copied to your clipboard.\n• Net Profit: Your net earnings after deducting the market fee.\n• Buy Button: Opens the RollerCoin page and copies the Target Sell price to your clipboard.",
    guideStep3Title: "Step 3 - Arbitrage Logic",
    guideStep3Desc: "When an arbitrage opportunity is captured, the price list on RollerCoin looks like the image.\n\nThe algorithm compares the two cheapest listings. If buying the cheapest item and reselling it (with fees included) allows listing it below the second cheapest option while still yielding profit, it is flagged as an opportunity.",
    guideStep4Title: "Step 4 - Sale & Profit Calculation",
    guideStep4Desc: "To resell the item we purchased for 0.252 RLT (Actual Buy), we paste the copied Target Sell price (0.295238 - blue box) into the price input field.\n\nThe price the buyer will pay (Expected pay - red box) appears as 0.31 RLT due to the 5% market fee. The net amount you will receive after the fee deduction is exactly the 0.295238 RLT (Target Sell) you entered. This places your listing at the top, just below the nearest competitor (0.32 RLT).\n\nYour net profit is calculated by subtracting Actual Buy (0.252 RLT) from the net Target Sell (0.295238 RLT) paid to you.",
    beforeLabel: "Before Transaction",
    afterLabel: "After Transaction",
    formulaTitle: "Profit Calculation Formula:",
    marketFeeLabel: "Market Fee",
    actualBuyLabel: "Actual Buy",
    guideStep5Title: "Important Tips & Recommendations",
    guideStep5Desc: "• Burning Event Items: Some items may list at abnormal prices due to market distortions. These items used in burning events might not yield high profits; trading them is entirely at your discretion.\n\n• Target Sell Flexibility: The algorithm always copies the target price just one step below the cheapest current listing. Reselling below or above this target price is up to you.\n\n• Resale Strategy: Reselling above the Target Sell price may increase gains but often slows down the sale. Reselling slightly below the Target Sell price is favored by the algorithm, allowing for a quicker sale and making the item eligible to be caught as an opportunity again."
  },
  TR: {
    subtitle: "RollerCoin marketindeki en kârlı anlık al-sat fırsatlarını otomatik olarak yakalar, hesaplar ve listeler.",
    guide: "REHBER",
    soundSettings: "Ses Ayarları",
    langTitle: "Dili Değiştir",
    balancePlaceholder: "RLT bakiyenizi girin.",
    balanceTooltip: "Mevcut RLT bakiyen hakkında bilgi sahibi olmamız sayesinde sana satın alabileceğin fırsatları filtrelemiş olacağız.",
    minProfit: "Minimum Kâr:",
    all: "Tümü",
    miners: "Madenciler",
    parts: "Parçalar",
    racks: "Raflar",
    batteries: "Bataryalar",
    other: "Diğer",
    tierRemaining: "kaldı",
    watchAdMaintain: "planı korumak için reklam izle",
    watchAdUpgrade: "planı yükseltmek için reklam izle",
    qty: "Miktar",
    qtyUnit: "Adet",
    actualBuy: "Gerçek Alış",
    targetSell: "Hedef Satış (Net)",
    netProfit: "Net Kazanç",
    buyBtn: "Satın Al",
    showMore: "Daha Fazla Göster",
    waitingLive: "Canlı Fırsatlar Bekleniyor...",
    emptyDesc: "Piyasada arbitraj fırsatları yakalandıkça bu alanda görüntülenecektir.",
    fanDisclaimer: "Rollercoinmarkt bağımsız bir hayran projesidir. RollerCoin ile herhangi bir bağı, ortaklığı veya yetkilendirmesi yoktur.",
    createdBy: "Geliştirici",
    scannedOpportunities: "Yakalanan Fırsatlar",
    profitOpportunities: "Kâr Fırsatları",
    accessTiers: "Erişim Planları",
    modalSubtitle: "Gelişmiş filtreleme araçlarını ve gösterge özelliklerini açmak için planınızı yükseltin.",
    standardPlan: "Standart",
    advancedPlan: "Gelişmiş",
    premiumPlan: "Premium",
    free: "Ücretsiz",
    watchAd1: "1 Reklam İzle",
    watchAd2: "1+1 Reklam İzle",
    tier1Feature1: "Temel fırsat akışı",
    tier1Feature2: "Standart arama filtresi",
    tier1Feature3: "1 aktif gösterge çubuğu",
    tier2Feature1: "Bütçe RLT filtresi",
    tier2Feature2: "15 dakikalık plan süresi artışı",
    tier2Feature3: "2 aktif gösterge çubuğu",
    tier3Feature1: "Dinamik uzatılabilir zamanlayıcı",
    tier3Feature2: "Tüm özellikler açık",
    tier3Feature3: "3 aktif gösterge çubuğu",
    modalDescription: "Varsayılan olarak Standart (Tier I) planla başlarsınız. 1 video reklam izlemek, Gelişmiş (Tier II) planın kilidini 15 dakika boyunca açar. Bu 15 dakika içinde başka bir reklam izlemezseniz planınız bir seviye düşürülür. Ancak bu süre içinde ikinci bir reklam izlemek sizi Premium (Tier III) plana yükseltir. Premium durumunuzu korumak için geri sayımı sıfırlamak ve erişim sürenizi en üst düzeye çıkarmak için 15 dakika içinde başka bir reklam izlemeniz yeterlidir.",
    currentTierLabel: "MEVCUT PLANINIZ",
    lockedLabel: "Kilitli (Reklam İzle)",
    now: "Şimdi",
    secAgo: "sn önce",
    minAgo: "dk önce",
    guideAlert: "RollerCoin Arbitraj Rehberi yakında eklenecektir!",
    guideTitle: "RollerCoin Arbitraj Rehberi",
    guideStep0Title: "Rollercoinmarkt'a Hoş Geldiniz!",
    guideStep0Desc: "Bu rehber, RollerCoin pazarındaki anlık fiyat dengesizliklerini kazanca dönüştürmenize yardımcı olmak için tasarlanmıştır.\n\nSistemimiz, marketteki en ucuz iki satış ilanını sürekli analiz ederek hızlı ve karlı al-sat (arbitraj) fırsatlarını yakalar. Temel amaç, ucuza listelenen bir ürünü anında satın alıp, otomatik hesaplanan hedef fiyatla pazarın en ucuz ilanı olacak şekilde yeniden satışa sunarak hızlıca kar elde etmenizdir.",
    guideStep1Title: "Adım 1 - Fırsatları Listeleyin ve Filtreleyin",
    guideStep1Desc: "Mevcut RLT bakiyenizi girerek satın alabileceğiniz ürünlerin tam listesini görün ve diğer filtreleme seçeneklerini kullanın.",
    guideStep2Title: "Adım 2 - Listelenen Fırsatların Okunması",
    guideStep2Desc: "Pazardaki en uygun fırsatlar filtrenize göre anlık olarak bu alanda listelenir:\n\n• QTY: En ucuz fiyattan ilanda olan ürün adeti.\n• Actual Buy: Ürünü almak için harcamanız gereken net RLT miktarı.\n• Target Sell: Hızlı satış için komisyonlar dahil hesaplanan hedef fiyattır. Panonuza otomatik kopyalanır; bu fiyatla satış yaptığınızda pazarın en ucuz ilanı sizinki olur.\n• Net Profit: Komisyonlar düşüldükten sonra elde edeceğiniz net karınız.\n• Buy Butonu: RollerCoin satın alma sayfasını açarken, Target Sell fiyatını panonuza otomatik kopyalar.",
    guideStep3Title: "Adım 3 - Arbitraj Fırsatının Mantığı",
    guideStep3Desc: "Bir fırsat ürünü yakalandığında RollerCoin üzerindeki fiyat tablosu görseldeki gibi görünür.\n\nAlgoritma, en ucuz iki satış ilanını karşılaştırır. En ucuz ilandaki ürün satın alınıp komisyonlar eklenerek yeniden listelendiğinde, hala ikinci en ucuz ilandan daha düşük fiyata satılabiliyor ve kar bırakıyorsa, sistem bunu anında fırsat olarak işaretler.",
    guideStep4Title: "Adım 4 - Satış ve Kar Hesaplama",
    guideStep4Desc: "Önceki adımda 0.252 RLT'ye (Actual Buy) satın aldığımız ürünü yeniden satmak için, panomuza kopyalanan Target Sell değerini (0.295238 - mavi kutu) fiyat giriş alanına yapıştırıyoruz.\n\nAlıcının ödeyeceği tutar (Expected pay - kırmızı kutu) %5 market komisyonuyla birlikte 0.31 RLT olarak görünür. Bu durumda komisyon düşüldükten sonra size net olarak ödenecek tutar, girdiğiniz 0.295238 RLT (Target Sell) olacaktır. Böylece ürününüz, en yakın rakibin (0.32 RLT) hemen altında yer alarak pazarın en ucuz ilanı olur.\n\nElde edeceğiniz net kar: Size net ödenecek olan Target Sell (0.295238 RLT) değerinden, Actual Buy (0.252 RLT) çıkarılarak hesaplanır.",
    beforeLabel: "İşlem Öncesi",
    afterLabel: "İşlem Sonrası",
    formulaTitle: "Kar Hesaplama Formülü:",
    marketFeeLabel: "Market Komisyonu",
    actualBuyLabel: "Gerçek Alış",
    guideStep5Title: "Önemli İpuçları & Tavsiyeler",
    guideStep5Desc: "• Burning Event Ürünleri: Bazı ürünlerin piyasa fiyatlarında aşırı bozulmalar oluşabilir. Burning (yakma) etkinliklerinde kullanılan bu tarz ürünler yüksek kar potansiyeli taşımayabilir, alım-satım kararı tamamen sizin inisiyatifinizdedir.\n\n• Target Sell Esnekliği: Algoritma size her zaman en ucuz ilanın bir kademe altındaki hedef satış fiyatını kopyalar. Satış yaparken bu fiyatın altına inmek veya üstüne çıkmak sizin tercihinizdir.\n\n• Fiyat Stratejisi: Target Sell fiyatının üzerinde satış yapmak bazen daha yüksek kazanç getirse de satış sürecini ciddi oranda uzatabilir. Target Sell fiyatının biraz daha altına listelemek ise ürünün çok daha hızlı satılmasını ve algoritma tarafından tekrar fırsat olarak yakalanmasını kolaylaştırır."
  },
  ES: {
    subtitle: "Escanea, calcula y lista automáticamente las oportunidades de arbitraje instantáneo más rentables en el mercado de RollerCoin.",
    guide: "GUÍA",
    soundSettings: "Ajustes de Sonido",
    langTitle: "Cambiar Idioma",
    balancePlaceholder: "Introduce tu saldo de RLT aquí.",
    balanceTooltip: "Introduce tu saldo de RLT para ocultar los artículos de alto precio que no puedes permitirte y ver solo las oportunidades dentro de tu presupuesto.",
    minProfit: "Ganancia Mínima:",
    all: "Todo",
    miners: "Mineros",
    parts: "Piezas",
    racks: "Estantes",
    batteries: "Baterías",
    other: "Otros",
    tierRemaining: "restante",
    watchAdMaintain: "ver anuncio para mantener nivel",
    watchAdUpgrade: "ver anuncio para subir de nivel",
    qty: "Cant",
    qtyUnit: "Unidades",
    actualBuy: "Compra Real",
    targetSell: "Venta Objetivo (Neto)",
    netProfit: "Ganancia Neta",
    buyBtn: "Comprar",
    showMore: "Mostrar Más",
    waitingLive: "Esperando Oportunidades en Vivo...",
    emptyDesc: "A medida que se capturen oportunidades de arbitraje en el mercado, se mostrarán en esta área.",
    fanDisclaimer: "Rollercoinmarkt es un proyecto independiente de fans. No está afiliado, autorizado ni respaldado por RollerCoin.",
    createdBy: "Creado por",
    scannedOpportunities: "Oportunidades Escaneadas",
    profitOpportunities: "Oportunidades de Ganancia",
    accessTiers: "Niveles de Acceso",
    modalSubtitle: "Mejora tu nivel para desbloquear herramientas de filtrado avanzadas y funciones de indicadores.",
    standardPlan: "Estándar",
    advancedPlan: "Avanzado",
    premiumPlan: "Premium",
    free: "Gratis",
    watchAd1: "Ver 1 Anuncio",
    watchAd2: "Ver 1+1 Anuncio",
    tier1Feature1: "Flujo de oportunidades básico",
    tier1Feature2: "Filtro de búsqueda estándar",
    tier1Feature3: "1 barra indicadora activa",
    tier2Feature1: "Filtro RLT de asequibilidad",
    tier2Feature2: "Impulso de temporizador de 15 minutos",
    tier2Feature3: "2 barras indicadoras activas",
    tier3Feature1: "Temporizador dinámico mantenible",
    tier3Feature2: "Todas las funciones desbloqueadas",
    tier3Feature3: "3 barras indicadoras activas",
    modalDescription: "Por defecto, comienzas con el plan Estándar (Tier I). Ver 1 anuncio de video desbloquea el plan Avanzado (Tier II) durante 15 minutos. Si no ves otro anuncio dentro de estos 15 minutos, tu nivel bajará un rango. Sin embargo, ver un segundo anuncio durante este período te mejora al plan Premium (Tier III). Para mantener tu estado Premium, simplemente mira otro anuncio dentro de los 15 minutos para restablecer la cuenta regresiva.",
    currentTierLabel: "TU NIVEL ACTUAL",
    lockedLabel: "Bloqueado (Ver Anuncio)",
    now: "Ahora",
    secAgo: "s antes",
    minAgo: "m antes",
    guideAlert: "¡La Guía de Arbitraje de RollerCoin se agregará pronto!",
    guideTitle: "Guía de Arbitraje de RollerCoin",
    guideStep0Title: "¡Bienvenido a Rollercoinmarkt!",
    guideStep0Desc: "Esta guía está diseñada para ayudarte a convertir los desequilibrios de precios instantáneos en el mercado de RollerCoin en ganancias.\n\nNuestro sistema analiza continuamente las dos ofertas más baratas del mercado para capturar oportunidades rápidas y rentables de compra y venta (arbitraje). El objetivo principal es comprar un artículo con descuento al instante y revenderlo utilizando nuestro precio objetivo calculado automáticamente para obtener una ganancia rápida como la oferta más barata.",
    guideStep1Title: "Paso 1 - Filtrar y Listar Oportunidades",
    guideStep1Desc: "Introduce tu saldo actual de RLT para ver la lista completa de productos que puedes comprar y utiliza otras opciones de filtrado.",
    guideStep2Title: "Paso 2 - Lectura de Oportunidades Listadas",
    guideStep2Desc: "Las mejores oportunidades del mercado se listan aquí instantáneamente según tus filtros:\n\n• QTY: La cantidad disponible al precio más barato.\n• Actual Buy: El RLT neto requerido para comprar el producto.\n• Target Sell: El precio de reventa recomendado (comisión de mercado incluida) para asegurar que tu oferta sea la más barata. Copiado automáticamente a tu portapapeles.\n• Net Profit: Tus ganancias netas después de deducir la comisión del mercado.\n• Buy (Comprar): Abre la página de RollerCoin y copia el precio de Target Sell a tu portapapeles.",
    guideStep3Title: "Paso 3 - Lógica de Arbitraje",
    guideStep3Desc: "Cuando se captura una oportunidad de arbitraje, la lista de precios en RollerCoin se ve como la imagen.\n\nEl algoritmo compara las dos ofertas más baratas. Si comprar el artículo más barato y revenderlo (con comisiones incluidas) permite listarlo por debajo de la segunda opción más barata y aun así obtener ganancias, se marca como una oportunidad.",
    guideStep4Title: "Paso 4 - Venta y Cálculo de Ganancias",
    guideStep4Desc: "Para revender el artículo que compramos por 0.252 RLT (Actual Buy), pegamos el precio de Target Sell copiado (0.295238 - recuadro azul) en el campo de entrada de precios.\n\nCon una comisión de mercado del 5%, este precio da como resultado un pago esperado de 0.31 RLT (Expected pay - recuadro rojo). Esto coloca tu oferta al principio como la más barata, justo por debajo del competidor más cercano (0.32 RLT).\n\nTu ganancia neta se calcula restando el Actual Buy (0.252 RLT) del Expected Pay (0.31 RLT) que se te pagará.",
    beforeLabel: "Antes de la Transacción",
    afterLabel: "Después de la Transacción",
    formulaTitle: "Fórmula de Cálculo de Ganancias:",
    marketFeeLabel: "Comisión de Mercado",
    actualBuyLabel: "Compra Real"
  },
  PT: {
    subtitle: "Varre, calcula e lista automaticamente as oportunidades de arbitragem instantânea mais lucrativas no mercado de RollerCoin.",
    guide: "GUIA",
    soundSettings: "Configurações de Som",
    langTitle: "Mudar Idioma",
    balancePlaceholder: "Insira seu saldo de RLT aqui.",
    balanceTooltip: "Insira seu saldo de RLT para ocultar itens de alto preço que você não pode pagar e ver apenas as oportunidades dentro do seu orçamento.",
    minProfit: "Lucro Mínimo:",
    all: "Tudo",
    miners: "Mineradores",
    parts: "Peças",
    racks: "Racks",
    batteries: "Baterias",
    other: "Outros",
    tierRemaining: "restante",
    watchAdMaintain: "ver anúncio para manter o nível",
    watchAdUpgrade: "ver anúncio para subir de nivel",
    qty: "Qtd",
    qtyUnit: "Unidades",
    actualBuy: "Compra Real",
    targetSell: "Venda Alvo (Líquido)",
    netProfit: "Lucro Líquido",
    buyBtn: "Comprar",
    showMore: "Mostrar Mais",
    waitingLive: "Aguardando Oportunidades ao Vivo...",
    emptyDesc: "À medida que as oportunidades de arbitragem forem capturadas no mercado, elas serão exibidas nesta área.",
    fanDisclaimer: "Rollercoinmarkt é um projeto de fãs independente. Não é afiliado, autorizado ou endossado pelo RollerCoin.",
    createdBy: "Criado por",
    scannedOpportunities: "Oportunidades Escaneadas",
    profitOpportunities: "Oportunidades de Lucro",
    accessTiers: "Níveis de Acesso",
    modalSubtitle: "Atualize seu nível para desbloquear ferramentas de filtragem avançadas e recursos de indicadores.",
    standardPlan: "Padrão",
    advancedPlan: "Avançado",
    premiumPlan: "Premium",
    free: "Grátis",
    watchAd1: "Ver 1 Anúncio",
    watchAd2: "Ver 1+1 Anúncio",
    tier1Feature1: "Feed de oportunidades básico",
    tier1Feature2: "Filtro de busca padrão",
    tier1Feature3: "1 barra indicadora ativa",
    tier2Feature1: "Filtro RLT de acessibilidade",
    tier2Feature2: "Impulso de temporizador de 15 minutos",
    tier2Feature3: "2 barras indicadoras ativas",
    tier3Feature1: "Temporizador dinâmico mantível",
    tier3Feature2: "Todos os recursos desbloqueados",
    tier3Feature3: "3 barras indicadoras ativas",
    modalDescription: "Por padrão, você começa com o plano Padrão (Tier I). Assistir a 1 anúncio de vídeo desbloqueia o plan Avançado (Tier II) por 15 minutos. Se você não assistir a outro anúncio dentro desses 15 minutos, seu nível será rebaixado em um nível. No entanto, assistir a um segundo anúncio durante este período atualiza você para o plano Premium (Tier III). Para manter seu status Premium, basta assistir a outro anúncio dentro de 15 minutos para reiniciar a contagem regressiva.",
    currentTierLabel: "SEU NÍVEL ATUAL",
    lockedLabel: "Bloqueado (Ver Anúncio)",
    now: "Agora",
    secAgo: "s atrás",
    minAgo: "m atrás",
    guideAlert: "O Guia de Arbitragem do RollerCoin será adicionado em breve!",
    guideTitle: "Guia de Arbitragem do RollerCoin",
    guideStep0Title: "Bem-vindo ao Rollercoinmarkt!",
    guideStep0Desc: "Este guia foi projetado para ajudá-lo a transformar desequilíbrios de preços instantâneos no mercado RollerCoin em lucro.\n\nNosso sistema analisa continuamente as duas ofertas mais baratas do mercado para capturar oportunidades rápidas e lucrativas de compra e venda (arbitragem). O principal objetivo é comprar um item com desconto instantaneamente e revendê-lo usando nosso preço-alvo calculado automaticamente para obter um lucro rápido como a oferta mais barata.",
    guideStep1Title: "Passo 1 - Filtrar e Listar Oportunidades",
    guideStep1Desc: "Insira seu saldo de RLT atual para ver a lista completa de produtos que você pode comprar e use outras opções de filtragem.",
    guideStep2Title: "Passo 2 - Leitura de Oportunidades Listadas",
    guideStep2Desc: "As melhores oportunidades do mercado são listadas aqui instantaneamente com base em seus filtros:\n\n• QTY: A quantidade disponível ao preço mais barato.\n• Actual Buy: O RLT líquido necessário para comprar o produto.\n• Target Sell: O preço de revenda recomendado (taxa de mercado incluída) para garantir que sua oferta seja a mais barata. Copiado automaticamente para a área de transferência.\n• Net Profit: Seus ganhos líquidos após deduzir a taxa de mercado.\n• Buy (Comprar): Abre a página do RollerCoin e copia o preço de Target Sell para a área de transferência.",
    guideStep3Title: "Passo 3 - Lógica de Arbitragem",
    guideStep3Desc: "Quando uma oportunidade de arbitragem é capturada, a lista de preços no RollerCoin se parece com a imagem.\n\nO algoritmo compara as duas ofertas mais baratas. Se comprar o item mais barato e revendê-lo (com taxas incluídas) permitir listá-lo abaixo da segunda opção mais barata e ainda obter lucro, ele é sinalizado como uma oportunidade.",
    guideStep4Title: "Passo 4 - Venda e Cálculo de Lucro",
    guideStep4Desc: "Para revender o item que compramos por 0.252 RLT (Actual Buy), colamos o preço de Target Sell copiado (0.295238 - caixa azul) no campo de entrada de preço.\n\nCom uma taxa de mercado de 5%, este preço resulta em um pagamento esperado de 0.31 RLT (Expected pay - caixa vermelha). Isso coloca sua oferta no topo como a mais barata, logo abaixo do concorrente mais próximo (0.32 RLT).\n\nSeu lucro líquido é calculado subtraindo o Actual Buy (0.252 RLT) do Expected Pay (0.31 RLT) que será pago a você.",
    beforeLabel: "Antes da Transação",
    afterLabel: "Após a Transação",
    formulaTitle: "Fórmula de Cálculo de Lucro:",
    marketFeeLabel: "Taxa de Mercado",
    actualBuyLabel: "Compra Real"
  },
  ID: {
    subtitle: "Secara otomatis memindai, menghitung, dan mencantumkan peluang arbitrase instan paling menguntungkan di pasar RollerCoin.",
    guide: "PANDUAN",
    soundSettings: "Pengaturan Suara",
    langTitle: "Ubah Bahasa",
    balancePlaceholder: "Masukkan saldo RLT Anda di sini.",
    balanceTooltip: "Masukkan saldo RLT Anda untuk menyembunyikan item berharga tinggi yang tidak mampu Anda beli dan hanya melihat peluang sesuai anggaran Anda.",
    minProfit: "Keuntungan Minimum:",
    all: "Semua",
    miners: "Penambang",
    parts: "Bagian",
    racks: "Rak",
    batteries: "Baterai",
    other: "Lainnya",
    tierRemaining: "tersisa",
    watchAdMaintain: "tonton iklan untuk mempertahankan tier",
    watchAdUpgrade: "tonton iklan untuk meningkatkan tier",
    qty: "Jml",
    qtyUnit: "Unit",
    actualBuy: "Beli Nyata",
    targetSell: "Target Jual (Bersih)",
    netProfit: "Keuntungan Bersih",
    buyBtn: "Beli",
    showMore: "Tampilkan Lebih Banyak",
    waitingLive: "Menunggu Peluang Langsung...",
    emptyDesc: "Saat peluang arbitrase ditangkap di pasar, peluang tersebut akan ditampilkan di area ini.",
    fanDisclaimer: "Rollercoinmarkt adalah proyek penggemar independen. Tidak berafiliasi dengan, diizinkan, atau didukung oleh RollerCoin.",
    createdBy: "Dibuat oleh",
    scannedOpportunities: "Peluang Dipindai",
    profitOpportunities: "Peluang Keuntungan",
    accessTiers: "Tingkat Akses",
    modalSubtitle: "Tingkatkan tingkat Anda untuk membuka kunci alat penyaringan tingkat lanjut dan fitur indikator.",
    standardPlan: "Standar",
    advancedPlan: "Lanjutan",
    premiumPlan: "Premium",
    free: "Gratis",
    watchAd1: "Tonton 1 Iklan",
    watchAd2: "Tonton 1+1 Iklan",
    tier1Feature1: "Umpan peluang dasar",
    tier1Feature2: "Filter pencarian standar",
    tier1Feature3: "1 bilah indikator aktif",
    tier2Feature1: "Filter keterjangkauan RLT",
    tier2Feature2: "Peningkatan timer 15 menit",
    tier2Feature3: "2 bilah indikator aktif",
    tier3Feature1: "Timer dinamis yang dapat dipertahankan",
    tier3Feature2: "Semua fitur terbuka",
    tier3Feature3: "3 bilah indikator aktif",
    modalDescription: "Secara default, Anda memulai dengan rencana Standar (Tier I). Menonton 1 iklan video membuka rencana Lanjutan (Tier II) selama 15 menit. Jika Anda tidak menonton iklan lain dalam 15 menit ini, tingkat Anda akan diturunkan satu tingkat. Namun, menonton iklan kedua selama periode ini akan meningkatkan Anda ke rencana Premium (Tier III). Untuk mempertahankan status Premium Anda, cukup tonton iklan lain dalam waktu 15 menit untuk menyetel ulang hitung mundur.",
    currentTierLabel: "TINGKAT ANDA SAAT INI",
    lockedLabel: "Terkunci (Tonton Iklan)",
    now: "Sekarang",
    secAgo: "d lalu",
    minAgo: "m lalu",
    guideAlert: "Panduan Arbitrase RollerCoin akan segera ditambahkan!",
    guideTitle: "Panduan Arbitrase RollerCoin",
    guideStep0Title: "Selamat Datang di Rollercoinmarkt!",
    guideStep0Desc: "Panduan ini dirancang untuk membantu Anda mengubah ketidakseimbangan harga instan di pasar RollerCoin menjadi keuntungan.\n\nSistem kami terus menganalisis dua penawaran termurah di pasar untuk menangkap peluang beli-jual (arbitrase) yang cepat dan menguntungkan. Tujuan utamanya adalah membeli item diskon secara instan dan menjualnya kembali menggunakan harga target kami yang dihitung otomatis untuk menghasilkan keuntungan cepat sebagai penawaran termurah.",
    guideStep1Title: "Langkah 1 - Filter & Daftar Peluang",
    guideStep1Desc: "Masukkan saldo RLT Anda saat ini untuk melihat daftar lengkap produk yang dapat Anda beli, dan gunakan opsi penyaringan lainnya.",
    guideStep2Title: "Langkah 2 - Membaca Peluang yang Terdaftar",
    guideStep2Desc: "Peluang pasar terbaik terdaftar secara instan di sini berdasarkan filter Anda:\n\n• QTY: Jumlah yang tersedia dengan harga termurah.\n• Actual Buy: RLT bersih yang diperlukan untuk membeli produk.\n• Target Sell: Harga jual kembali yang disarankan (termasuk biaya pasar) untuk memastikan daftar Anda adalah yang termurah. Otomatis disalin ke papan klip Anda.\n• Net Profit: Penghasilan bersih Anda setelah dikurangi biaya pasar.\n• Buy (Beli): Membuka halaman RollerCoin dan menyalin harga Target Sell ke papan klip Anda.",
    guideStep3Title: "Langkah 3 - Logika Arbitrase",
    guideStep3Desc: "Ketika peluang arbitrase ditangkap, daftar harga di RollerCoin terlihat seperti gambar.\n\nAlgoritme membandingkan dua penawaran termurah. Jika membeli item termurah dan menjualnya kembali (termasuk biaya) memungkinkan pendaftaran di bawah opsi termurah kedua sambil tetap menghasilkan keuntungan, itu ditandai sebagai peluang.",
    guideStep4Title: "Langkah 4 - Penjualan & Perhitungan Keuntungan",
    guideStep4Desc: "Untuk menjual kembali item yang kita beli seharga 0.252 RLT (Actual Buy), kita menempelkan harga Target Sell yang disalin (0.295238 - kotak biru) ke kolom input harga.\n\nDengan biaya pasar 5%, harga ini menghasilkan pembayaran yang diharapkan sebesar 0.31 RLT (Expected pay - kotak merah). Ini menempatkan daftar Anda di atas sebagai penawaran termurah, tepat di bawah pesaing terdekat (0.32 RLT).\n\nKeuntungan bersih Anda dihitung dengan mengurangi Actual Buy (0.252 RLT) dari Expected Pay (0.31 RLT) yang akan dibayarkan kepada Anda.",
    beforeLabel: "Sebelum Transaksi",
    afterLabel: "Setelah Transaksi",
    formulaTitle: "Formula Perhitungan Keuntungan:",
    marketFeeLabel: "Biaya Pasar",
    actualBuyLabel: "Beli Nyata"
  },
  FR: {
    subtitle: "Scanne, calcule et répertorie automatiquement les opportunités d'arbitrage instantané les plus rentables sur le marché RollerCoin.",
    guide: "GUIDE",
    soundSettings: "Paramètres du Son",
    langTitle: "Changer de Langue",
    balancePlaceholder: "Entrez votre solde RLT ici.",
    balanceTooltip: "Entrez votre solde RLT pour masquer les objets chers que vous ne pouvez pas vous offrir et ne voir que les opportunités correspondant à votre budget.",
    minProfit: "Bénéfice Minimum :",
    all: "Tout",
    miners: "Mineurs",
    parts: "Pièces",
    racks: "Racks",
    batteries: "Batteries",
    other: "Autre",
    tierRemaining: "restant",
    watchAdMaintain: "regarder une pub pour maintenir le tier",
    watchAdUpgrade: "regarder une pub pour améliorer le tier",
    qty: "Qté",
    qtyUnit: "Unités",
    actualBuy: "Achat Réel",
    targetSell: "Vente Cible (Net)",
    netProfit: "Bénéfice Net",
    buyBtn: "Acheter",
    showMore: "Afficher Plus",
    waitingLive: "En attente d'opportunités en direct...",
    emptyDesc: "Au fur et à mesure que des opportunités d'arbitrage sont capturées sur le marché, elles s'afficheront dans cette zone.",
    fanDisclaimer: "Rollercoinmarkt est un projet de fans indépendant. Il n'est pas affilié à, autorisé ou approuvé par RollerCoin.",
    createdBy: "Créé par",
    scannedOpportunities: "Opportunités Scannées",
    profitOpportunities: "Opportunités de Bénéfice",
    accessTiers: "Niveaux d'Accès",
    modalSubtitle: "Améliorez votre niveau pour débloquer des outils de filtrage avancés et des fonctionnalités d'indicateurs.",
    standardPlan: "Standard",
    advancedPlan: "Avancé",
    premiumPlan: "Premium",
    free: "Gratuit",
    watchAd1: "Regarder 1 Pub",
    watchAd2: "Regarder 1+1 Pub",
    tier1Feature1: "Flux d'opportunités de base",
    tier1Feature2: "Filtre de recherche standard",
    tier1Feature3: "1 barre d'indicateur active",
    tier2Feature1: "Filtre d'abordabilité RLT",
    tier2Feature2: "Boost de minuterie de 15 minutes",
    tier2Feature3: "2 barres d'indicateurs actives",
    tier3Feature1: "Minuterie dynamique maintenable",
    tier3Feature2: "Toutes les fonctionnalités débloquées",
    tier3Feature3: "3 barres d'indicateurs actives",
    modalDescription: "Par défaut, vous commencez avec le plan Standard (Tier I). Regarder 1 publicité vidéo débloque le plan Avancé (Tier II) pendant 15 minutes. Si vous ne regardez pas une autre publicité dans ces 15 minutes, votre niveau sera rétrogradé d'un niveau. Cependant, regarder une deuxième publicité pendant cette période vous fait passer au plan Premium (Tier III). Pour maintenir votre statut Premium, regardez simplement une autre publicité dans les 15 minutes pour réinitialiser le compte à rebours.",
    currentTierLabel: "VOTRE NIVEAU ACTUEL",
    lockedLabel: "Verrouillé (Regarder Pub)",
    now: "Maintenant",
    secAgo: "s avant",
    minAgo: "m avant",
    guideAlert: "Le guide d'arbitrage RollerCoin sera bientôt ajouté !",
    guideTitle: "Guide d'Arbitrage RollerCoin",
    guideStep0Title: "Bienvenue sur Rollercoinmarkt !",
    guideStep0Desc: "Ce guide est conçu pour vous aider à transformer les déséquilibres de prix instantanés sur le marché RollerCoin en profit.\n\nNotre système analyse en permanence les deux offres les moins chères du marché pour capturer des opportunités d'achat-vente (arbitrage) rapides et rentables. Le but principal est d'acheter un article à prix réduit instantanément et de le revendre en utilisant notre prix cible calculé automatiquement pour réaliser un profit rapide en tant qu'offre la moins chère.",
    guideStep1Title: "Étape 1 - Filtrer et Lister les Opportunités",
    guideStep1Desc: "Entrez votre solde RLT actuel pour voir la liste complète des produits que vous pouvez acheter, et utilisez d'autres options de filtrage.",
    guideStep2Title: "Étape 2 - Lecture des Opportunités Listées",
    guideStep2Desc: "Les meilleures opportunités du marché sont listées instantanément ici en fonction de vos filtres :\n\n• QTY: La quantité disponible au prix le moins cher.\n• Actual Buy: Le RLT net requis pour acheter le produit.\n• Target Sell: Le prix de revente recommandé (frais de marché inclus) pour garantir que votre offre soit la moins chère. Copié automatiquement dans votre presse-papiers.\n• Net Profit: Vos gains nets après déduction des frais de marché.\n• Buy (Acheter): Ouvre la page RollerCoin et copie le prix de Target Sell dans votre presse-papiers.",
    guideStep3Title: "Étape 3 - Logique d'Arbitrage",
    guideStep3Desc: "Lorsqu'une opportunité d'arbitrage est capturée, la liste des prix sur RollerCoin ressemble à l'image.\n\nL'algorithme compare les deux offres les moins chères. Si l'achat de l'article le moins cher et sa revente (frais inclus) permettent de le lister en dessous de la deuxième option la moins chère tout en générant un profit, il est signalé comme une opportunité.",
    guideStep4Title: "Étape 4 - Vente et Calcul du Profit",
    guideStep4Desc: "Pour revendre l'article que nous avons acheté pour 0.252 RLT (Actual Buy), nous collons le prix Target Sell copié (0.295238 - encadré bleu) dans le champ de saisie du prix.\n\nAvec des frais de marché de 5%, ce prix donne un paiement attendu de 0.31 RLT (Expected pay - encadré rouge). Cela place votre offre en tête en tant que moins chère, juste en dessous du concurrent le plus proche (0.32 RLT).\n\nVotre profit net est calculé en soustrayant l'Actual Buy (0.252 RLT) de l'Expected Pay (0.31 RLT) qui vous sera payé.",
    beforeLabel: "Avant la Transaction",
    afterLabel: "Après la Transaction",
    formulaTitle: "Formule de Calcul du Profit :",
    marketFeeLabel: "Frais de Marché",
    actualBuyLabel: "Achat Réel"
  },
  DE: {
    subtitle: "Scannt, berechnet und listet automatisch die profitabelsten sofortigen Arbitrage-Möglichkeiten auf dem RollerCoin-Markt auf.",
    guide: "ANLEITUNG",
    soundSettings: "Toneinstellungen",
    langTitle: "Sprache ändern",
    balancePlaceholder: "Geben Sie hier Ihr RLT-Guthaben ein.",
    balanceTooltip: "Geben Sie Ihr RLT-Guthaben ein, um teure Gegenstände auszublenden, die Sie sich nicht leisten können, und nur Möglichkeiten innerhalb Ihres Budgets zu sehen.",
    minProfit: "Mindestgewinn:",
    all: "Alle",
    miners: "Miner",
    parts: "Teile",
    racks: "Regale",
    batteries: "Batterien",
    other: "Andere",
    tierRemaining: "verbleibend",
    watchAdMaintain: "Werbung ansehen, um Tier zu behalten",
    watchAdUpgrade: "Werbung ansehen, um Tier zu verbessern",
    qty: "Menge",
    qtyUnit: "Einheiten",
    actualBuy: "Tatsächlicher Kauf",
    targetSell: "Zielverkauf (Netto)",
    netProfit: "Nettogewinn",
    buyBtn: "Kaufen",
    showMore: "Mehr anzeigen",
    waitingLive: "Warten auf Live-Möglichkeiten...",
    emptyDesc: "Sobald Arbitrage-Möglichkeiten auf dem Markt erfasst werden, werden sie in diesem Bereich angezeigt.",
    fanDisclaimer: "Rollercoinmarkt ist ein unabhängiges Fanprojekt. Es ist nicht mit RollerCoin verbunden, von RollerCoin autorisiert oder unterstützt.",
    createdBy: "Erstellt von",
    scannedOpportunities: "Gescannte Möglichkeiten",
    profitOpportunities: "Gewinnmöglichkeiten",
    accessTiers: "Zugriffs-Tiers",
    modalSubtitle: "Verbessern Sie Ihr Tier, um erweiterte Filterwerkzeuge und Indikatorfunktionen freizuschalten.",
    standardPlan: "Standard",
    advancedPlan: "Fortgeschritten",
    premiumPlan: "Premium",
    free: "Kostenlos",
    watchAd1: "1 Werbung ansehen",
    watchAd2: "1+1 Werbung ansehen",
    tier1Feature1: "Einfacher Feed für Gelegenheiten",
    tier1Feature2: "Standard-Suchfilter",
    tier1Feature3: "1 aktive Indikatorleiste",
    tier2Feature1: "RLT-Erschwinglichkeitsfilter",
    tier2Feature2: "15-Minuten-Timer-Boost",
    tier2Feature3: "2 aktive Indikatorleisten",
    tier3Feature1: "Dynamischer, beibehaltbarer Timer",
    tier3Feature2: "Alle Funktionen freigeschaltet",
    tier3Feature3: "3 aktive Indikatorleisten",
    modalDescription: "Standardmäßig starten Sie mit dem Standard-Plan (Tier I). Das Ansehen von 1 Videowerbung schaltet den Fortgeschrittenen-Plan (Tier II) für 15 Minuten frei. Wenn Sie innerhalb dieser 15 Minuten keine weitere Werbung ansehen, wird Ihr Tier um eine Stufe herabgestuft. Das Ansehen einer zweiten Werbung während dieses Zeitraums wertet Sie jedoch auf den Premium-Plan (Tier III) auf. Um Ihren Premium-Status zu behalten, sehen Sie sich einfach innerhalb von 15 Minuten eine weitere Werbung an, um den Countdown zurückzusetzen.",
    currentTierLabel: "IHR AKTUELLES TIER",
    lockedLabel: "Gesperrt (Werbung ansehen)",
    now: "Jetzt",
    secAgo: "s zuvor",
    minAgo: "m zuvor",
    guideAlert: "Die RollerCoin Arbitrage-Anleitung wird bald hinzugefügt!",
    guideTitle: "RollerCoin Arbitrage-Anleitung",
    guideStep0Title: "Willkommen bei Rollercoinmarkt!",
    guideStep0Desc: "Diese Anleitung soll Ihnen helfen, sofortige Preisungleichgewichte auf dem RollerCoin-Markt in Gewinn umzuwandeln.\n\nUnser System analysiert kontinuierlich die beiden günstigsten Angebote auf dem Markt, um schnelle und profitable Kauf-Verkauf-Möglichkeiten (Arbitrage) zu erfassen. Das Hauptziel besteht darin, einen rabattierten Artikel sofort zu kaufen und ihn zu unserem automatisch berechneten Zielpreis weiterzuverkaufen, um als günstigstes Angebot einen schnellen Gewinn zu erzielen.",
    guideStep1Title: "Schritt 1 - Möglichkeiten filtern und auflisten",
    guideStep1Desc: "Geben Sie Ihr aktuelles RLT-Guthaben ein, um die vollständige Liste der Produkte anzuzeigen, die Sie kaufen können, und verwenden Sie andere Filteroptionen.",
    guideStep2Title: "Schritt 2 - Lesen der aufgelisteten Möglichkeiten",
    guideStep2Desc: "Die besten Marktchancen werden hier basierend auf Ihren Filtern sofort aufgelistet:\n\n• QTY: Die zum günstigsten Preis verfügbare Menge.\n• Actual Buy: Das für den Kauf des Produkts erforderliche Netto-RLT.\n• Target Sell: Der empfohlene Wiederverkaufspreis (inkl. Marktgebühr), um sicherzustellen, dass Ihr Angebot das günstigste ist. Automatisch in Ihre Zwischenablage kopiert.\n• Net Profit: Ihr Nettoverdienst nach Abzug der Marktgebühr.\n• Buy (Kaufen): Öffnet die RollerCoin-Seite und kopiert den Target-Sell-Preis in Ihre Zwischenablage.",
    guideStep3Title: "Schritt 3 - Arbitrage-Logik",
    guideStep3Desc: "Wenn eine Arbitrage-Möglichkeit erfasst wird, sieht die Preisliste auf RollerCoin wie auf dem Bild aus.\n\nDer Algorithmus vergleicht die beiden günstigsten Angebote. Wenn der Kauf des günstigsten Artikels und sein Wiederverkauf (inklusive Gebühren) eine Listung unter der zweitgünstigsten Option ermöglichen und dennoch Gewinn abwerfen, wird dies als Gelegenheit gekennzeichnet.",
    guideStep4Title: "Schritt 4 - Verkauf und Gewinnberechnung",
    guideStep4Desc: "Um den Artikel, den wir für 0,252 RLT (Actual Buy) gekauft haben, wiederzuverkaufen, fügen wir den kopierten Target-Sell-Preis (0,295238 - blaues Feld) in das Preiseingabefeld ein.\n\nMit einer Marktgebühr von 5 % führt dieser Preis zu einer erwarteten Auszahlung von 0,31 RLT (Expected pay - rotes Feld). Dadurch wird Ihr Angebot ganz oben als günstigstes Angebot platziert, knapp unter dem des nächsten Konkurrenten (0,32 RLT).\n\nIhr Nettogewinn errechnet sich durch Abzug des Actual Buy (0,252 RLT) von der Expected Pay (0,31 RLT), die an Sie ausgezahlt wird.",
    beforeLabel: "Vor der Transaktion",
    afterLabel: "Nach der Transaktion",
    formulaTitle: "Gewinnberechnungsformel:",
    marketFeeLabel: "Marktgebühr",
    actualBuyLabel: "Tatsächlicher Kauf"
  }
}

const languages = [
  { code: 'EN', name: 'English' },
  { code: 'TR', name: 'Türkçe' },
  { code: 'ES', name: 'Español' },
  { code: 'PT', name: 'Português' },
  { code: 'ID', name: 'Bahasa Indonesia' },
  { code: 'FR', name: 'Français' },
  { code: 'DE', name: 'Deutsch' }
]

const t = (key) => {
  return translations[currentLanguage.value][key] || key
}

const currentTier = ref(1)
const tierTimer = ref(0)
let tierInterval = null
const showTierModal = ref(false)
const showGuideModal = ref(false)
const showPrivacyModal = ref(false)
const guidePage = ref(1)

const startTierTimer = () => {
  if (tierInterval) clearInterval(tierInterval)
  tierInterval = setInterval(() => {
    if (tierTimer.value > 0) {
      tierTimer.value--
    } else {
      if (currentTier.value > 1) {
        currentTier.value--
        if (currentTier.value > 1) {
          tierTimer.value = 15 * 60
        } else {
          clearInterval(tierInterval)
        }
      }
    }
  }, 1000)
}

const handleWatchAd = () => {
  if (currentTier.value === 1) {
    currentTier.value = 2
    tierTimer.value = 15 * 60
    startTierTimer()
  } else if (currentTier.value === 2) {
    currentTier.value = 3
    tierTimer.value = 15 * 60
    startTierTimer()
  } else if (currentTier.value === 3) {
    tierTimer.value = 15 * 60
  }
  showTierModal.value = false
}

const formatTimer = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getBarColor = (barIndex) => {
  if (currentTier.value >= barIndex) {
    if (currentTier.value === 1) return 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
    if (currentTier.value === 2) return 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
    if (currentTier.value === 3) return 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
  }
  return 'bg-white/10'
}

const getTierTextColor = computed(() => {
  if (currentTier.value === 1) return 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]'
  if (currentTier.value === 2) return 'text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]'
  return 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]'
})

const getTimerTextColor = computed(() => {
  if (currentTier.value === 1) return 'text-red-500/80'
  if (currentTier.value === 2) return 'text-blue-400/80'
  return 'text-emerald-400/80'
})

const toggleLanguageDropdown = () => {
  showLangDropdown.value = !showLangDropdown.value
  showVolumeSlider.value = false
}

const toggleVolumeSlider = () => {
  showVolumeSlider.value = !showVolumeSlider.value
  showLangDropdown.value = false
}

const openGuide = () => {
  guidePage.value = 0
  showGuideModal.value = true
}

const mouseX = ref(window.innerWidth / 2)
const mouseY = ref(window.innerHeight / 2)
const bgX = ref(50)
const bgY = ref(50)

const tiltX = ref(0)
const tiltY = ref(0)

const handleMouseMove = (event) => {
  mouseX.value = event.clientX
  mouseY.value = event.clientY
  
  const halfWidth = window.innerWidth / 2
  const halfHeight = window.innerHeight / 2
  tiltX.value = -((event.clientY - halfHeight) / halfHeight) * 3
  tiltY.value = ((event.clientX - halfWidth) / halfWidth) * 3
}

let rAF
const updateBg = () => {
  const targetX = (mouseX.value / window.innerWidth) * 100
  const targetY = (mouseY.value / window.innerHeight) * 100
  bgX.value += (targetX - bgX.value) * 0.08
  bgY.value += (targetY - bgY.value) * 0.08
  rAF = requestAnimationFrame(updateBg)
}

const canvasRef = ref(null)
let pRAF
let width, height, canvas, ctx, handleResize
const particles = []
const particleCount = 70

const setupCanvas = () => {
  canvas = canvasRef.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  
  width = canvas.width = window.innerWidth
  height = canvas.height = window.innerHeight
  
  handleResize = () => {
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
  }
  window.addEventListener('resize', handleResize)
  
  for (let i = 0; i < particleCount; i++) {
    const isFast = Math.random() < 0.08
    if (isFast) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 30 + 20,
        speed: Math.random() * 4.0 + 3.0,
        opacity: Math.random() * 0.06 + 0.03,
        width: Math.random() * 1.0 + 0.5
      })
    } else {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 10 + 4,
        speed: Math.random() * 0.6 + 0.2,
        opacity: Math.random() * 0.05 + 0.02,
        width: Math.random() * 0.5 + 0.2
      })
    }
  }
  
  const drawParticles = () => {
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = '#ffffff'
    
    for (let i = 0; i < particleCount; i++) {
      const p = particles[i]
      ctx.lineWidth = p.width
      ctx.globalAlpha = p.opacity
      ctx.beginPath()
      ctx.moveTo(p.x, p.y)
      ctx.lineTo(p.x, p.y + p.length)
      ctx.stroke()
      
      p.y += p.speed
      if (p.y > height) {
        p.y = -p.length
        p.x = Math.random() * width
      }
    }
    
    pRAF = requestAnimationFrame(drawParticles)
  }
  
  drawParticles()
}

const playAlertSound = () => {
  if (!soundEnabled.value || !userInteracted.value) return
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const audioCtx = new AudioCtx()
    
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    
    osc.type = 'sine'
    osc.frequency.setValueAtTime(600, audioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08)
    
    gain.gain.setValueAtTime(0.08 * volumeLevel.value, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25)
    
    osc.start()
    osc.stop(audioCtx.currentTime + 0.28)
  } catch (error) {
    console.error('Audio synthesis failed:', error)
  }
}

let ws
const connectWebSocket = () => {
  const currentHost = window.location.host
  const targetHost = currentHost.includes('5173') ? 'localhost:3000' : currentHost
  const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
  
  ws = new WebSocket(`${protocol}${targetHost}`)
  
  ws.onopen = () => {
    isConnected.value = true
  }
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'history') {
        opportunities.value = data.data.map(item => ({ ...item, time: new Date(item.timestamp) }))
        totalScanned.value = data.totalScanned !== undefined ? data.totalScanned : opportunities.value.length
        cumulativeProfit.value = data.cumulativeProfit !== undefined ? data.cumulativeProfit : opportunities.value.reduce((acc, o) => acc + o.netProfitMargin, 0)
        activeSince.value = data.activeSince ? new Date(data.activeSince) : null
      } else if (data.type === 'opportunity') {
        const newItem = {
          ...data.data,
          time: new Date(data.data.timestamp)
        }
        opportunities.value.unshift(newItem)
        totalScanned.value = data.totalScanned !== undefined ? data.totalScanned : totalScanned.value + 1
        cumulativeProfit.value = data.cumulativeProfit !== undefined ? data.cumulativeProfit : cumulativeProfit.value + data.data.netProfitMargin
        if (data.activeSince && !activeSince.value) {
          activeSince.value = new Date(data.activeSince)
        }
        
        // Sadece kullanıcının filtrelerine uyan ürünler için bildirim sesi çal
        const matchesProfit = newItem.netProfitMargin >= minProfit.value
        
        let matchesCategory = true
        const typeLower = String(newItem.itemType || '').toLowerCase()
        if (selectedCategory.value === 'Miners') {
          matchesCategory = typeLower.startsWith('miner')
        } else if (selectedCategory.value === 'Parts') {
          matchesCategory = typeLower.startsWith('part') || typeLower === 'mutation_component'
        } else if (selectedCategory.value === 'Racks') {
          matchesCategory = typeLower.startsWith('rack')
        } else if (selectedCategory.value === 'Batteries') {
          matchesCategory = typeLower.startsWith('battery')
        } else if (selectedCategory.value === 'Other') {
          matchesCategory = !typeLower.startsWith('miner') && 
                            !typeLower.startsWith('part') && 
                            typeLower !== 'mutation_component' &&
                            !typeLower.startsWith('rack') && 
                            !typeLower.startsWith('battery')
        }
        
        const matchesBalance = rltBalance.value !== '' && rltBalance.value !== null
          ? newItem.actualBuyPriceRlt <= parseFloat(rltBalance.value)
          : true
          
        if (matchesProfit && matchesCategory && matchesBalance) {
          playAlertSound()
        }
        
        if (opportunities.value.length > 150) {
          opportunities.value.pop()
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err)
    }
  }
  
  ws.onclose = () => {
    isConnected.value = false
    setTimeout(connectWebSocket, 3000)
  }
}

const maxProfitValue = computed(() => {
  if (opportunities.value.length === 0) return 0
  return Math.max(...opportunities.value.map(o => o.netProfitMargin))
})

const averageProfitValue = computed(() => {
  if (opportunities.value.length === 0) return 0
  const sum = opportunities.value.reduce((acc, o) => acc + o.netProfitMargin, 0)
  return sum / opportunities.value.length
})

const filteredOpportunities = computed(() => {
  return opportunities.value.filter(o => {
    const matchesProfit = o.netProfitMargin >= minProfit.value
    
    let matchesCategory = true
    const typeLower = String(o.itemType || '').toLowerCase()
    if (selectedCategory.value === 'Miners') {
      matchesCategory = typeLower.startsWith('miner')
    } else if (selectedCategory.value === 'Parts') {
      matchesCategory = typeLower.startsWith('part') || typeLower === 'mutation_component'
    } else if (selectedCategory.value === 'Racks') {
      matchesCategory = typeLower.startsWith('rack')
    } else if (selectedCategory.value === 'Batteries') {
      matchesCategory = typeLower.startsWith('battery')
    } else if (selectedCategory.value === 'Other') {
      matchesCategory = !typeLower.startsWith('miner') && 
                        !typeLower.startsWith('part') && 
                        typeLower !== 'mutation_component' &&
                        !typeLower.startsWith('rack') && 
                        !typeLower.startsWith('battery')
    }
    
    const matchesBalance = rltBalance.value !== '' && rltBalance.value !== null
      ? o.actualBuyPriceRlt <= parseFloat(rltBalance.value)
      : true
    return matchesProfit && matchesCategory && matchesBalance
  })
})

const displayLimit = ref(6)

const visibleOpportunities = computed(() => {
  const list = filteredOpportunities.value
  if (list.length > displayLimit.value) {
    return list.slice(0, displayLimit.value + 1)
  }
  return list
})

const listHeight = computed(() => {
  return `${(displayLimit.value + 1) * 136}px`
})

const now = ref(new Date())
let clockInterval

const timeAgo = (date) => {
  const seconds = Math.floor((now.value - date) / 1000)
  if (seconds < 5) return t('now')
  if (seconds < 60) return `${seconds} ${t('secAgo')}`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} ${t('minAgo')}`
  return date.toLocaleTimeString()
}

const formatRLT = (val) => {
  return parseFloat(Number(val).toFixed(6))
}

const formatItemType = (type) => {
  const typeLower = String(type || '').toLowerCase()
  if (typeLower === 'mutation_component') {
    return 'parts'
  }
  return type
}

const getItemImageUrl = (opp) => {
  const typeLower = String(opp.itemType || '').toLowerCase()
  if (typeLower === 'mutation_component') {
    return `https://static.rollercoin.com/static/img/storage/mutation_components/${opp.itemId}.png`
  }

  if (typeLower === 'utility_item') {
    const nameKey = opp.itemFilename || String(opp.itemName || opp.itemId)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
    return `https://static.rollercoin.com/static/img/market/utility_items/${nameKey}.png`
  }

  if (typeLower === 'battery' || typeLower === 'batteries') {
    return `https://static.rollercoin.com/static/img/market/batteries/${opp.itemId}.png`
  }

  const isMiner = typeLower.startsWith('miner')
  const typeFolder = typeLower.endsWith('s') ? typeLower : `${typeLower}s`
  
  if (isMiner) {
    const nameKey = opp.itemFilename || String(opp.itemName || opp.itemId)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      
    return `https://static.rollercoin.com/static/img/market/miners/${nameKey}.gif`
  }
  return `https://static.rollercoin.com/static/img/market/${typeFolder}/${opp.itemId}.png`
}

const handleBuyClick = (opp) => {
  const targetPriceText = parseFloat(opp.newSellingPrice.toFixed(6)).toString()
  navigator.clipboard.writeText(targetPriceText).catch(err => {
    console.error('Clipboard copy failed:', err)
  })
  const url = `https://rollercoin.com/marketplace/buy/${opp.itemType}/${opp.itemId}`
  window.open(url, '_blank')
}

const handleUserInteraction = () => {
  userInteracted.value = true
  window.removeEventListener('click', handleUserInteraction)
  window.removeEventListener('keydown', handleUserInteraction)
  window.removeEventListener('touchstart', handleUserInteraction)
}

onMounted(() => {
  window.addEventListener('click', handleUserInteraction)
  window.addEventListener('keydown', handleUserInteraction)
  window.addEventListener('touchstart', handleUserInteraction)
  window.addEventListener('mousemove', handleMouseMove)
  rAF = requestAnimationFrame(updateBg)
  setupCanvas()
  connectWebSocket()
  
  clockInterval = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('click', handleUserInteraction)
  window.removeEventListener('keydown', handleUserInteraction)
  window.removeEventListener('touchstart', handleUserInteraction)
  window.removeEventListener('mousemove', handleMouseMove)
  cancelAnimationFrame(rAF)
  if (handleResize) window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(pRAF)
  if (ws) ws.close()
  if (clockInterval) clearInterval(clockInterval)
  if (tierInterval) clearInterval(tierInterval)
})
</script>

<template>
  <div class="site-wrapper flex flex-col justify-between min-h-screen text-white select-none relative overflow-hidden font-inter">
    <canvas ref="canvasRef" class="particle-canvas"></canvas>

    <div 
      class="ambient-glow pointer-events-none"
      :style="{
        left: `${bgX}%`,
        top: `${bgY}%`
      }"
    ></div>

    <div class="grid-overlay"></div>

    <div class="w-full max-w-[1648px] mx-auto grid grid-cols-1 2xl:grid-cols-[160px_1fr_160px] items-start gap-6 relative z-10">
      <!-- Left Ad Sidebar -->
      <div class="hidden 2xl:flex flex-col items-start justify-start pt-6 px-2 w-full">
        <!-- BEGIN AADS AD UNIT 2452715 -->
        <div id="ad-left-frame" style="width: 160px;margin: auto;z-index: 99998;height: auto">
            <iframe data-aa='2452715'
                src='//ad.a-ads.com/2452715/?size=160x600'
                style='border:0; padding:0; width:160px; height:600px; overflow:hidden;display: block;margin: auto'>
            </iframe>
        </div>
        <!-- END AADS AD UNIT 2452715 -->
      </div>

      <main class="flex-1 flex flex-col items-center justify-start p-4 md:p-8 w-full max-w-7xl mx-auto mt-6">
        <!-- Mobile Ad 1 (Top unit in responsive layout) -->
        <div class="flex 2xl:hidden items-center justify-center w-full mb-6 select-none relative z-30">
          <!-- BEGIN AADS AD UNIT 2453037 -->
          <div id="frame-top-mob" style="width: 100%;margin: auto;position: relative; z-index: 99998;">
            <iframe data-aa='2453037' src='//acceptable.a-ads.com/2453037/?size=Adaptive'
              style='border:0; padding:0; width:70%; height:auto; overflow:hidden;display: block;margin: auto'></iframe>
          </div>
          <!-- END AADS AD UNIT 2453037 -->
        </div>
        <div class="w-full flex flex-col gap-6">
        <header class="flex flex-col md:flex-row items-center justify-between gap-4 w-full border-b border-white/5 pb-6">
          <div class="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <img :src="faviconImg" class="logo-img w-12 h-12 md:w-16 md:h-16" alt="Logo" />
            <div class="text-center md:text-left">
              <h1 class="text-2xl md:text-3xl font-black tracking-wider font-outfit uppercase bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Rollercoinmarkt
              </h1>
              <p class="text-xs text-gray-400 mt-1 md:whitespace-nowrap">
                {{ t('subtitle') }}
              </p>
            </div>
          </div>
          
          <div class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-end">
            <button 
              @click="openGuide"
              class="cursor-pointer flex items-center gap-2 px-4 py-2 h-10 rounded-lg bg-white/15 hover:bg-white/20 border border-white/20 hover:border-white/30 text-sm font-bold text-white transition-all font-outfit uppercase tracking-[0.12em] group"
            >
              <svg class="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>{{ t('guide') }}</span>
            </button>

            <div class="relative flex items-center group/volume">
              <button 
                @click="toggleMute"
                class="cursor-pointer flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group z-30"
                :title="t('soundSettings')"
              >
                <svg v-if="soundEnabled" class="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <svg v-else class="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </button>
              
              <div 
                class="absolute left-1/2 -translate-x-1/2 top-10 pt-2.5 opacity-0 pointer-events-none group-hover/volume:opacity-100 group-hover/volume:pointer-events-auto transition-all duration-200 z-20 transform translate-y-1 group-hover/volume:translate-y-0"
              >
                <div class="bg-black/95 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl min-w-[210px]">
                  <!-- Sound wave visualizer icon -->
                  <div class="flex items-end gap-[2.5px] h-4.5 w-6 shrink-0 justify-center">
                    <div class="w-[3px] bg-emerald-400 rounded-full transition-all duration-150" :style="{ height: volumeLevel > 0 ? '40%' : '20%', opacity: volumeLevel > 0 ? 1 : 0.3 }"></div>
                    <div class="w-[3px] bg-emerald-400 rounded-full transition-all duration-150" :style="{ height: volumeLevel >= 0.25 ? '70%' : '20%', opacity: volumeLevel >= 0.25 ? 1 : 0.3 }"></div>
                    <div class="w-[3px] bg-emerald-400 rounded-full transition-all duration-150" :style="{ height: volumeLevel >= 0.5 ? '100%' : '20%', opacity: volumeLevel >= 0.5 ? 1 : 0.3 }"></div>
                    <div class="w-[3px] bg-emerald-400 rounded-full transition-all duration-150" :style="{ height: volumeLevel >= 0.75 ? '80%' : '20%', opacity: volumeLevel >= 0.75 ? 1 : 0.3 }"></div>
                  </div>
                  
                  <input 
                    v-model.number="volumeLevel" 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    class="w-24 h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-emerald-400 hover:accent-emerald-300 transition-colors" 
                  />
                  
                  <span class="text-xs font-mono text-gray-300 w-8 text-right select-none">
                    {{ Math.round(volumeLevel * 100) }}%
                  </span>
                </div>
              </div>
            </div>

            <div class="relative flex items-center">
              <button 
                @click="toggleLanguageDropdown"
                class="cursor-pointer flex items-center gap-2 px-3.5 py-2 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-bold text-gray-300 transition-all font-outfit uppercase tracking-wider group z-30"
                :title="t('langTitle')"
              >
                <svg class="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>{{ currentLanguage }}</span>
              </button>
              
              <transition name="fade">
                <div 
                  v-if="showLangDropdown"
                  class="absolute right-0 top-12 bg-black/95 backdrop-blur-md border border-white/10 rounded-lg p-1 flex flex-col gap-1 z-20 shadow-xl min-w-[110px]"
                >
                  <button 
                    v-for="lang in languages"
                    :key="lang.code"
                    @click="currentLanguage = lang.code; showLangDropdown = false"
                    class="cursor-pointer px-3 py-1.5 rounded text-xs font-semibold hover:bg-white/10 transition-colors text-left flex items-center justify-between w-full"
                    :class="currentLanguage === lang.code ? 'text-white bg-white/5' : 'text-gray-400'"
                  >
                    <span>{{ lang.name }}</span>
                    <span v-if="currentLanguage === lang.code" class="text-[10px] text-emerald-400 font-bold">✓</span>
                  </button>
                </div>
              </transition>
            </div>
          </div>
        </header>

        <div class="rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md grid grid-cols-1 md:grid-cols-12 w-full overflow-hidden">
          <div class="col-span-1 md:col-span-9 p-5 flex flex-col gap-4">
            <div class="flex flex-col md:flex-row gap-4 items-center justify-start w-full">
              <div class="flex items-center gap-3 w-full md:w-80 h-11 bg-black/40 border border-white/15 rounded-lg px-3 focus-within:border-white/40 transition-colors">
                <img src="https://static.rollercoin.com/static/img/icons/currencies/rlt.svg" class="w-5 h-5 select-none pointer-events-none" alt="RLT" />
                <input 
                  v-model="rltBalance" 
                  type="number" 
                  min="0"
                  step="0.01"
                  :placeholder="t('balancePlaceholder')" 
                  class="w-full bg-transparent border-none text-sm text-gray-200 focus:outline-none no-spin"
                />
                <div class="relative group/info flex items-center justify-center w-5 h-5 shrink-0 rounded-full border border-white/20 hover:border-white/40 cursor-help transition-colors">
                  <span class="text-[10px] font-bold text-gray-400 group-hover/info:text-white">?</span>
                  <div class="absolute top-full right-[-8px] md:left-1/2 md:right-auto md:-translate-x-1/2 mt-2 w-64 p-2 bg-black/95 border border-white/10 rounded-lg text-[10px] text-gray-300 font-medium text-center shadow-xl opacity-0 scale-95 pointer-events-none group-hover/info:opacity-100 group-hover/info:scale-100 transition-all z-50">
                    {{ t('balanceTooltip') }}
                    <div class="absolute bottom-full right-[14px] md:left-1/2 md:right-auto md:-translate-x-1/2 border-4 border-transparent border-b-black/95"></div>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 w-full md:w-[380px] h-11 bg-black/40 border border-white/15 rounded-lg px-3 focus-within:border-white/40 transition-colors">
                <span class="text-xs text-gray-400 whitespace-nowrap">{{ t('minProfit') }}</span>
                <input 
                  v-model.number="minProfit" 
                  type="number" 
                  min="0"
                  step="0.001"
                  placeholder="0.01" 
                  class="w-14 bg-transparent border-none text-sm text-white focus:outline-none no-spin placeholder-white/30"
                />
                <span class="text-white/10 select-none">|</span>
                <input 
                  v-model.number="minProfitIndex" 
                  type="range" 
                  min="0" 
                  max="14" 
                  step="1" 
                  class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <img src="https://static.rollercoin.com/static/img/icons/currencies/rlt.svg" class="w-5 h-5 select-none pointer-events-none shrink-0" alt="RLT" />
              </div>
            </div>
            
            <div class="border-t border-white/5 w-full"></div>

            <div class="flex flex-col md:flex-row gap-4 items-center justify-between w-full">
              <div class="flex flex-wrap gap-2 w-full md:w-auto items-center">
                <button 
                  v-for="cat in ['All', 'Miners', 'Parts', 'Racks', 'Batteries', 'Other']"
                  :key="cat"
                  @click="selectedCategory = cat"
                  class="cursor-pointer px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all select-none"
                  :class="selectedCategory === cat 
                    ? 'bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.2)]' 
                    : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/20 hover:text-white'"
                >
                  {{ t(cat.toLowerCase()) }}
                </button>
              </div>
            </div>
          </div>

          <div class="col-span-1 md:col-span-3 border-t md:border-t-0 md:border-l border-white/5 flex flex-col items-center justify-center p-6 bg-white/[0.01] relative overflow-hidden">
            <!-- Coming Soon Display -->
            <div class="flex flex-col items-center justify-center select-none">
              <span class="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-emerald-400 uppercase tracking-widest shadow-md">
                Coming Soon
              </span>
            </div>
          </div>
        </div>

        <div 
          class="w-full relative overflow-hidden transition-all duration-500 ease-out pb-1"
          :style="{ height: listHeight }"
        >
          <transition-group 
            name="list" 
            tag="div" 
            class="flex flex-col gap-4 w-full"
          >
            <div 
              v-for="opp in visibleOpportunities" 
              :key="opp.timestamp + opp.itemId"
              class="opportunity-card grid grid-cols-1 md:grid-cols-12 items-center p-6 md:h-[120px] md:py-0 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/15 backdrop-blur-xl transition-all duration-300 relative group overflow-hidden w-full gap-5"
            >
              <div class="absolute inset-0 bg-gradient-to-tr from-white/[0.01] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              
              <img 
                :src="getItemImageUrl(opp)" 
                referrerpolicy="no-referrer"
                class="absolute left-6 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-35 rotate-[-15deg] group-hover:rotate-[-5deg] group-hover:scale-110 transition-all duration-500 pointer-events-none select-none z-0 object-contain" 
                :class="['mutation_component', 'utility_item'].includes(String(opp.itemType).toLowerCase()) ? 'w-24 h-24' : 'w-40 h-40'"
                alt=""
                @error="(e) => { e.target.style.display = 'none'; }"
              />
              
              <div class="col-span-1 md:col-span-3 flex flex-col gap-2 relative z-10 text-left">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 font-semibold uppercase tracking-wider">
                    {{ formatItemType(opp.itemType) }}
                  </span>
                  <span class="text-xs text-gray-500 font-mono">{{ timeAgo(opp.time) }}</span>
                </div>
                <h3 class="text-base md:text-lg font-black font-outfit text-white line-clamp-1" :title="opp.itemName || opp.itemId">
                  {{ opp.itemName || opp.itemId }}
                </h3>
              </div>

              <div class="col-span-1 md:col-span-2 flex flex-col relative z-10 text-left md:pl-2">
                <span class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{{ t('qty') }}</span>
                <span class="font-bold text-white font-mono mt-0.5 text-sm md:text-base">{{ opp.quantity }} {{ t('qtyUnit') }}</span>
              </div>

              <div class="col-span-1 md:col-span-2 flex flex-col relative z-10 text-left">
                <span class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{{ t('actualBuy') }}</span>
                <span class="font-bold text-white font-mono mt-0.5 text-sm md:text-base text-emerald-400 font-semibold flex items-center gap-1.5 flex-wrap">
                  <template v-if="opp.quantity > 1">
                    <span class="flex items-center gap-1">
                      <span>{{ formatRLT(opp.actualBuyPriceRlt * opp.quantity) }}</span>
                      <span class="text-[11.5px] text-gray-400 font-normal flex items-center justify-center select-none">({{ formatRLT(opp.actualBuyPriceRlt) }})</span>
                    </span>
                  </template>
                  <template v-else>
                    {{ formatRLT(opp.actualBuyPriceRlt) }}
                  </template>
                  <img src="https://static.rollercoin.com/static/img/icons/currencies/rlt.svg" class="w-4.5 h-4.5 select-none pointer-events-none" alt="RLT" />
                </span>
              </div>

              <div class="col-span-1 md:col-span-2 flex flex-col relative z-10 text-left">
                <span class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{{ t('targetSell') }}</span>
                <span class="font-bold text-white font-mono mt-0.5 text-sm md:text-base text-gray-300 flex items-center gap-1.5">
                  {{ formatRLT(opp.newSellingPrice) }}
                  <img src="https://static.rollercoin.com/static/img/icons/currencies/rlt.svg" class="w-4.5 h-4.5 select-none pointer-events-none" alt="RLT" />
                </span>
              </div>

              <div class="col-span-1 md:col-span-3 flex items-center justify-between gap-2 relative z-10 w-full border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                <div class="text-left">
                  <span class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{{ t('netProfit') }}</span>
                  <div class="text-base md:text-lg font-black font-outfit text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.2)] flex items-center gap-1.5">
                    +{{ formatRLT(opp.netProfitMargin) }}
                    <img src="https://static.rollercoin.com/static/img/icons/currencies/rlt.svg" class="w-4.5 h-4.5 select-none pointer-events-none" alt="RLT" />
                  </div>
                </div>
                <button 
                  @click="handleBuyClick(opp)"
                  class="cursor-pointer h-9 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all text-black font-black text-xs font-outfit uppercase tracking-wider flex items-center justify-center whitespace-nowrap"
                >
                  {{ t('buyBtn') }}
                </button>
              </div>
            </div>
          </transition-group>

          <transition name="fade">
            <div 
              v-if="filteredOpportunities.length > displayLimit"
              class="absolute bottom-0 left-0 right-0 h-[136px] bg-gradient-to-t from-[#030207] via-[#030207]/95 to-[#030207]/40 z-20 backdrop-blur-[3px] flex items-center justify-center pointer-events-none"
            >
              <button 
                @click="displayLimit += 6"
                class="cursor-pointer px-6 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all font-outfit uppercase tracking-wider text-xs font-bold text-gray-200 pointer-events-auto shadow-[0_0_20px_rgba(3,2,7,0.8)]"
              >
                {{ t('showMore') }}
              </button>
            </div>
          </transition>

          <div 
            v-if="filteredOpportunities.length === 0" 
            class="flex flex-col items-center justify-center h-[calc(100%-4px)] border border-dashed border-white/5 rounded-2xl bg-white/[0.01]"
          >
            <span class="text-4xl">📡</span>
            <h3 class="text-lg font-bold font-outfit text-gray-400 mt-4">{{ t('waitingLive') }}</h3>
            <p class="text-xs text-gray-500 max-w-xs text-center mt-1">{{ t('emptyDesc') }}</p>
          </div>
        </div>
      </div>
      
      <!-- Mobile Ad 2 (Bottom unit in responsive layout - placed outside the blurred Show More area, at the absolute bottom of main) -->
      <div class="flex 2xl:hidden items-center justify-center w-full mt-6 select-none relative z-30">
        <!-- BEGIN AADS AD UNIT 2453038 -->
        <div id="frame-bottom-mob" style="width: 100%;margin: auto;position: relative; z-index: 99998;">
          <iframe data-aa='2453038' src='//acceptable.a-ads.com/2453038/?size=Adaptive'
            style='border:0; padding:0; width:70%; height:auto; overflow:hidden;display: block;margin: auto'></iframe>
        </div>
        <!-- END AADS AD UNIT 2453038 -->
      </div>
    </main>

      <!-- Right Ad Sidebar -->
      <div class="hidden 2xl:flex flex-col items-start justify-start pt-6 px-2 w-full">
        <!-- BEGIN AADS AD UNIT 2452716 -->
        <div id="ad-right-frame" style="width: 160px;margin: auto;z-index: 99998;height: auto">
            <iframe data-aa='2452716'
                src='//ad.a-ads.com/2452716/?size=160x600'
                style='border:0; padding:0; width:160px; height:600px; overflow:hidden;display: block;margin: auto'>
            </iframe>
        </div>
        <!-- END AADS AD UNIT 2452716 -->
      </div>
    </div>

    <footer class="w-full bg-[#050409] border-t border-white/5 py-20 px-8 relative z-10">
      <div class="w-full grid grid-cols-1 md:grid-cols-3 items-center gap-8 max-w-7xl mx-auto">
        <div class="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left justify-self-center">
          <img :src="faviconImg" class="w-20 h-20 object-contain shrink-0 select-none pointer-events-none" alt="Logo" />
          <div class="flex flex-col gap-1 max-w-md">
            <span class="text-lg md:text-xl font-black font-outfit uppercase tracking-widest text-white select-none">
              ROLLERCOINMARKT
            </span>
            <span class="font-outfit uppercase font-semibold text-gray-400 tracking-widest text-[9px]">&copy; 2026 Rollercoinmarkt.com</span>
            <p class="text-gray-500 text-xs leading-relaxed mt-1">
              {{ t('fanDisclaimer') }}
            </p>
            <div class="flex items-center justify-center sm:justify-start gap-3 text-[11px] text-gray-500 mt-2">
              <div class="flex items-center gap-1">
                <span>{{ t('createdBy') }}</span>
                <span class="creator-name">kryptonn567</span>
              </div>
              <span class="text-gray-700">|</span>
              <button 
                @click="showPrivacyModal = true" 
                class="hover:text-white transition-colors cursor-pointer underline decoration-dotted underline-offset-2"
              >
                Privacy Policy
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-center justify-self-center">
          <a href="https://rollercoin.com/?r=kxsl6ix5" target="_blank" rel="noopener" class="block hover:opacity-90 transition-opacity max-w-full overflow-hidden">
            <img src="https://static.rollercoin.com/static/img/ref/gen3/w320h100.gif" alt="320h100" class="rounded-lg border border-white/5 shadow-md max-w-full h-auto object-contain" />
          </a>
        </div>

        <div class="flex flex-col items-start justify-center justify-self-center gap-2">
          <span v-if="activeSinceText" class="text-[9px] text-gray-500 uppercase tracking-widest font-bold select-none text-left">
            {{ activeSinceText }}
          </span>
          <div class="grid grid-cols-[auto_auto] gap-x-6 gap-y-2.5 shrink-0 select-none items-center">
            <span class="text-[10px] text-gray-400 uppercase tracking-widest font-semibold text-left">
              {{ t('scannedOpportunities') }}
            </span>
            <span class="text-3xl font-black font-mono text-gray-300 text-left">
              {{ formatNumberWithDots(totalScanned) }}
            </span>

            <span class="text-[10px] text-blue-400 uppercase tracking-widest font-semibold text-left">
              {{ t('profitOpportunities') }}
            </span>
            <span class="text-3xl font-black font-mono text-blue-400 text-left flex items-center justify-start gap-1.5">
              {{ formatCumulativeProfit }}
              <img src="https://static.rollercoin.com/static/img/icons/currencies/rlt.svg" class="w-4.5 h-4.5 select-none pointer-events-none brightness-110" alt="RLT" />
            </span>
          </div>
        </div>
      </div>
    </footer>

    <transition name="fade-modal">
      <div 
        v-if="showTierModal"
        class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-6"
      >
        <div class="flex flex-col items-center justify-center max-w-4xl w-full gap-6 relative">
          <div class="flex items-center gap-4 justify-center relative z-10 select-none -mb-3 mt-2">
            <img :src="faviconImg" class="w-14 h-14 object-contain" alt="Logo" />
            <span class="text-3xl md:text-4xl font-black font-outfit uppercase tracking-widest bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              rollercoinmarkt
            </span>
          </div>

          <div 
            class="modal-card bg-[#030207]/90 border border-white/10 p-8 rounded-3xl w-full flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden transform scale-100 transition-all duration-300"
          >
            <button 
              @click="showTierModal = false"
              class="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 hover:border-white/20 transition-all cursor-pointer z-20"
              :title="t('langTitle') === 'Dili Değiştir' ? 'Kapat' : 'Close'"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" stroke="currentColor" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="text-center relative z-10">
              <h2 class="text-xl md:text-2xl font-black font-outfit uppercase tracking-widest text-gray-300">
                {{ t('accessTiers') }}
              </h2>
              <p class="text-xs text-gray-400 mt-2">
                {{ t('modalSubtitle') }}
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 mt-2">
              <div class="p-6 rounded-2xl border border-red-500/10 bg-red-500/[0.02] flex flex-col justify-between hover:border-red-500/30 hover:bg-red-500/[0.04] transition-all duration-300 relative">
                <div v-if="currentTier === 1" class="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-xs text-white font-bold z-10" title="Active Plan">
                  ✓
                </div>
                <div v-else class="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-white z-10" title="Unlocked">
                  <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 018 0M6 11h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                  </svg>
                </div>
                <div>
                  <span class="text-xs font-black text-red-500 uppercase tracking-widest">Tier I</span>
                  <h3 class="text-xl font-black font-outfit text-white mt-1">{{ t('standardPlan') }}</h3>
                  <div class="border-t border-red-500/10 my-3"></div>
                  <ul class="text-[11px] text-gray-400 space-y-2 text-left">
                    <li class="flex items-center gap-1.5"><span class="text-red-500">✓</span> {{ t('tier1Feature1') }}</li>
                    <li class="flex items-center gap-1.5"><span class="text-red-500">✓</span> {{ t('tier1Feature2') }}</li>
                    <li class="flex items-center gap-1.5"><span class="text-red-500">✓</span> {{ t('tier1Feature3') }}</li>
                  </ul>
                </div>
                <div class="mt-6 text-center">
                  <span class="text-lg font-black text-white font-outfit uppercase">{{ t('free') }}</span>
                </div>
              </div>

              <div class="p-6 rounded-2xl border border-blue-500/10 bg-blue-500/[0.02] flex flex-col justify-between hover:border-blue-500/30 hover:bg-blue-500/[0.04] transition-all duration-300 relative overflow-hidden">
                <div v-if="currentTier === 2" class="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-xs text-white font-bold z-10" title="Active Plan">
                  ✓
                </div>
                <div v-else-if="currentTier > 2" class="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-white z-10" title="Unlocked">
                  <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 11V7a4 4 0 018 0M6 11h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                  </svg>
                </div>
                <div v-else class="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-white z-10" title="Locked">
                  <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <span class="text-xs font-black text-blue-400 uppercase tracking-widest">Tier II</span>
                  <h3 class="text-xl font-black font-outfit text-white mt-1">{{ t('advancedPlan') }}</h3>
                  <div class="border-t border-blue-500/10 my-3"></div>
                  <ul class="text-[11px] text-gray-400 space-y-2 text-left">
                    <li class="flex items-center gap-1.5"><span class="text-blue-400">✓</span> {{ t('tier2Feature1') }}</li>
                    <li class="flex items-center gap-1.5"><span class="text-blue-400">✓</span> {{ t('tier2Feature2') }}</li>
                    <li class="flex items-center gap-1.5"><span class="text-blue-400">✓</span> {{ t('tier2Feature3') }}</li>
                  </ul>
                </div>
                <div class="mt-6 text-center">
                  <span class="text-lg font-black text-blue-400 font-outfit uppercase">{{ t('watchAd1') }}</span>
                </div>
              </div>

              <div class="p-6 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.02] flex flex-col justify-between hover:border-emerald-500/30 hover:bg-emerald-500/[0.04] transition-all duration-300 relative">
                <div v-if="currentTier === 3" class="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-xs text-white font-bold z-10" title="Active Plan">
                  ✓
                </div>
                <div v-else class="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-white z-10" title="Locked">
                  <svg class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <span class="text-xs font-black text-emerald-400 uppercase tracking-widest">Tier III</span>
                  <h3 class="text-xl font-black font-outfit text-white mt-1">{{ t('premiumPlan') }}</h3>
                  <div class="border-t border-emerald-500/10 my-3"></div>
                  <ul class="text-[11px] text-gray-400 space-y-2 text-left">
                    <li class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> {{ t('tier3Feature1') }}</li>
                    <li class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> {{ t('tier3Feature2') }}</li>
                    <li class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> {{ t('tier3Feature3') }}</li>
                  </ul>
                </div>
                <div class="mt-6 text-center">
                  <span class="text-lg font-black text-emerald-400 font-outfit uppercase">{{ t('watchAd2') }}</span>
                </div>
              </div>
            </div>

            <p class="text-[11px] text-gray-500 leading-relaxed text-center max-w-3xl mx-auto mt-4 px-4 select-none">
              {{ t('modalDescription') }}
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 z-10 w-full px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5 select-none relative">
              <div class="flex justify-center items-center py-1">
                <div v-if="currentTier > 1" class="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 border border-white/30 text-[10px] text-white font-bold" title="Completed">
                  ✓
                </div>
                <span v-else class="px-2.5 py-1 rounded-full bg-white/10 border border-white/30 text-[10px] font-black text-white uppercase tracking-wider">
                  {{ t('currentTierLabel') }}
                </span>
              </div>

              <div class="flex justify-center items-center py-1">
                <div v-if="currentTier > 2" class="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 border border-white/30 text-[10px] text-white font-bold" title="Completed">
                  ✓
                </div>
                <span v-else-if="currentTier === 2" class="px-2.5 py-1 rounded-full bg-white/10 border border-white/30 text-[10px] font-black text-white uppercase tracking-wider">
                  {{ t('currentTierLabel') }}
                </span>
                <span v-else class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {{ t('lockedLabel') }}
                </span>
              </div>

              <div class="flex justify-center items-center py-1">
                <span v-if="currentTier === 3" class="px-2.5 py-1 rounded-full bg-white/10 border border-white/30 text-[10px] font-black text-white uppercase tracking-wider">
                  {{ t('currentTierLabel') }}
                </span>
                <span v-else class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {{ t('lockedLabel') }}
                </span>
              </div>

              <div class="absolute top-1/2 -translate-y-1/2 left-[33.33%] -translate-x-1/2 hidden md:block select-none pointer-events-none z-20">
                <svg class="w-6 h-6 transition-colors" :class="currentTier > 1 ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]' : 'text-gray-600/40'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>

              <div class="absolute top-1/2 -translate-y-1/2 left-[66.66%] -translate-x-1/2 hidden md:block select-none pointer-events-none z-20">
                <svg class="w-6 h-6 transition-colors" :class="currentTier > 2 ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]' : 'text-gray-600/40'" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- Guide Modal -->
    <transition name="fade-modal">
      <div 
        v-if="showGuideModal"
        class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6"
      >
        <div class="flex flex-col items-center justify-center max-w-4xl w-full gap-4 relative">
          <!-- Modal Body -->
          <div 
            class="modal-card bg-[#030207]/95 border border-white/10 p-4 md:p-8 rounded-2xl md:rounded-3xl w-full flex flex-col gap-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden transform scale-100 transition-all duration-300 max-h-[92vh]"
          >
            <!-- Close Button / Header Row -->
            <div class="flex items-center justify-between border-b border-white/5 pb-3 relative z-10 w-full">
              <h2 class="text-sm md:text-2xl font-black font-outfit uppercase tracking-widest text-gray-300 pr-10">
                {{ t('guideTitle') }}
              </h2>
              <button 
                @click="showGuideModal = false"
                class="absolute -top-1 right-0 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 hover:border-white/20 transition-all cursor-pointer z-20"
                :title="t('langTitle') === 'Dili Değiştir' ? 'Kapat' : 'Close'"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" stroke="currentColor" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Page Container (Grid with arrow buttons on sides) -->
            <div class="relative z-10 grid grid-cols-[auto_1fr_auto] items-center gap-2 md:gap-4 w-full">
              <!-- Left Arrow -->
              <button 
                @click="guidePage = Math.max(0, guidePage - 1)"
                :disabled="guidePage === 0"
                class="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed enabled:hover:bg-white/15 enabled:hover:border-white/25 cursor-pointer"
              >
                <svg class="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <!-- Content Area (Scrollable on mobile) -->
              <div class="text-left overflow-y-auto max-h-[62vh] md:max-h-none scrollbar-thin flex flex-col gap-4 pr-1 w-full">
                <!-- Page 0 Content (Welcome) -->
                <div v-if="guidePage === 0" class="flex flex-col gap-4 py-1 min-h-[300px] justify-center items-center text-center w-full">
                  <h3 class="text-2xl font-black font-outfit text-emerald-400 text-center uppercase tracking-wider w-full">
                    {{ t('guideStep0Title') }}
                  </h3>
                  <div class="border-t border-emerald-500/10 my-1 w-24 mx-auto"></div>
                  <p class="text-xs text-gray-300 leading-relaxed whitespace-pre-line text-center max-w-xl mx-auto w-full">
                    {{ t('guideStep0Desc') }}
                  </p>
                  
                  <!-- Before & After Comparison Grid -->
                  <div class="flex items-center justify-center gap-4 mt-2 max-w-lg mx-auto w-full">
                    <!-- Before Card -->
                    <div class="flex flex-col items-center gap-1.5 flex-1">
                      <span class="text-[10px] font-black text-red-400 uppercase tracking-widest">{{ t('beforeLabel') }}</span>
                      <div class="rounded-xl border border-white/10 overflow-hidden bg-black/40 p-1 shadow-md w-full">
                        <img :src="guideBeforeImg" alt="Before" class="w-full h-auto object-contain rounded-lg" />
                      </div>
                    </div>

                    <!-- Arrow -->
                    <div class="flex items-center justify-center shrink-0">
                      <svg class="w-6 h-6 text-emerald-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>

                    <!-- After Card -->
                    <div class="flex flex-col items-center gap-1.5 flex-1">
                      <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{{ t('afterLabel') }}</span>
                      <div class="rounded-xl border border-white/10 overflow-hidden bg-black/40 p-1 shadow-md w-full">
                        <img :src="guideAfterImg" alt="After" class="w-full h-auto object-contain rounded-lg" />
                      </div>
                    </div>
                  </div>

                  <!-- Profit Calculation Formula (Mathematical Fractional Representation) -->
                  <div class="mt-3 text-center flex justify-center">
                    <div class="inline-flex flex-col items-center bg-emerald-500/5 border border-emerald-500/10 px-5 py-3 rounded-2xl select-none">
                      <span class="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">{{ t('formulaTitle') }}</span>
                      <div class="flex items-center gap-3 font-mono text-sm text-white font-black">
                        <!-- Fractional division block -->
                        <div class="flex flex-col items-center">
                          <span class="pb-0.5 text-white">0.31</span>
                          <div class="w-full h-[1.5px] bg-white/60"></div>
                          <span class="pt-0.5 text-gray-400 text-xs">1.05 <span class="text-[9px] block -mt-0.5 font-sans uppercase font-bold text-gray-500">({{ t('marketFeeLabel') }})</span></span>
                        </div>
                        
                        <span class="text-base text-gray-400 font-sans">-</span>
                        
                        <div class="flex flex-col items-center">
                          <span>0.252</span>
                          <span class="text-[9px] font-sans uppercase font-bold text-gray-500">({{ t('actualBuyLabel') }})</span>
                        </div>

                        <span class="text-base text-emerald-400 font-sans">=</span>

                        <div class="flex flex-col items-center text-emerald-400">
                          <span>0.043 RLT</span>
                          <span class="text-[9px] font-sans uppercase font-black text-emerald-500/80">PROFIT</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Page 1 Content -->
                <div v-if="guidePage === 1" class="flex flex-col gap-3">
                  <h3 class="text-lg font-bold font-outfit text-emerald-400">
                    {{ t('guideStep1Title') }}
                  </h3>
                  <p class="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {{ t('guideStep1Desc') }}
                  </p>
                  <div class="mt-2 rounded-2xl border border-white/10 overflow-hidden bg-black/40 p-2 shadow-inner max-w-full">
                    <img :src="guideStep1Img" alt="Guide Step 1" class="w-full h-auto object-cover rounded-xl" />
                  </div>
                </div>

                <!-- Page 2 Content -->
                <div v-if="guidePage === 2" class="flex flex-col gap-3">
                  <h3 class="text-lg font-bold font-outfit text-emerald-400">
                    {{ t('guideStep2Title') }}
                  </h3>
                  <p class="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {{ t('guideStep2Desc') }}
                  </p>
                  <div class="mt-2 rounded-2xl border border-white/10 overflow-hidden bg-black/40 p-2 shadow-inner max-w-full">
                    <img :src="guideStep2Img" alt="Guide Step 2" class="w-full h-auto object-cover rounded-xl" />
                  </div>
                </div>

                <!-- Page 3 Content -->
                <div v-if="guidePage === 3" class="flex flex-col gap-3">
                  <h3 class="text-lg font-bold font-outfit text-emerald-400">
                    {{ t('guideStep3Title') }}
                  </h3>
                  <p class="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {{ t('guideStep3Desc') }}
                  </p>
                  <div class="mt-2 rounded-2xl border border-white/10 overflow-hidden bg-black/40 p-2 shadow-inner max-w-full">
                    <img :src="guideStep3Img" alt="Guide Step 3" class="w-full h-auto object-cover rounded-xl" />
                  </div>
                </div>

                <!-- Page 4 Content -->
                <div v-if="guidePage === 4" class="flex flex-col gap-3">
                  <h3 class="text-lg font-bold font-outfit text-emerald-400">
                    {{ t('guideStep4Title') }}
                  </h3>
                  <p class="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                    {{ t('guideStep4Desc') }}
                  </p>
                  <div class="mt-2 rounded-2xl border border-white/10 overflow-hidden bg-black/40 p-2 shadow-inner max-w-full">
                    <img :src="guideStep4Img" alt="Guide Step 4" class="w-full h-auto object-cover rounded-xl" />
                  </div>
                </div>

                <!-- Page 5 Content (Tips & Recommendations) -->
                <div v-if="guidePage === 5" class="flex flex-col gap-3 py-2 min-h-[300px] justify-center w-full">
                  <h3 class="text-xl font-bold font-outfit text-emerald-400 text-center uppercase tracking-wider">
                    {{ t('guideStep5Title') }}
                  </h3>
                  <div class="border-t border-emerald-500/10 my-2 w-24 mx-auto"></div>
                  
                  <div class="flex flex-col gap-4 text-xs text-gray-300 max-w-2xl mx-auto w-full px-4 mt-2">
                    <!-- Tip 1 -->
                    <div class="guide-bullet-item">
                      <span class="guide-bullet"></span>
                      <p class="leading-relaxed">
                        <strong class="text-white block mb-0.5">{{ currentLanguage === 'TR' ? 'Burning Event Ürünleri' : 'Burning Event Items' }}:</strong>
                        {{ currentLanguage === 'TR' 
                          ? 'Bazı ürünlerin piyasa fiyatlarında geçici dengesizlikler oluşabilir. Özellikle Burning (yakma) etkinliklerinde kullanılan bu tarz ürünler yüksek kar potansiyeli taşımayabilir, alım-satım kararı tamamen sizin inisiyatifinizdedir.' 
                          : 'Some items may list at abnormal prices due to market distortions. These items used in burning events might not yield high profits; trading them is entirely at your discretion.' }}
                      </p>
                    </div>

                    <!-- Tip 2 -->
                    <div class="guide-bullet-item">
                      <span class="guide-bullet"></span>
                      <p class="leading-relaxed">
                        <strong class="text-white block mb-0.5">{{ currentLanguage === 'TR' ? 'Target Sell Esnekliği' : 'Target Sell Flexibility' }}:</strong>
                        {{ currentLanguage === 'TR' 
                          ? 'Algoritma size her zaman en ucuz ilanın bir kademe altındaki hedef satış fiyatını kopyalar. Satış yaparken bu fiyatın altına inmek veya üstüne çıkmak sizin tercihinizdir.' 
                          : 'The algorithm always copies the target price just one step below the cheapest current listing. Reselling below or above this target price is up to you.' }}
                      </p>
                    </div>

                    <!-- Tip 3 -->
                    <div class="guide-bullet-item">
                      <span class="guide-bullet"></span>
                      <p class="leading-relaxed">
                        <strong class="text-white block mb-0.5">{{ currentLanguage === 'TR' ? 'Fiyat Stratejisi' : 'Resale Strategy' }}:</strong>
                        {{ currentLanguage === 'TR' 
                          ? 'Target Sell fiyatının üzerinde satış yapmak bazen daha yüksek kazanç getirse de satış sürecini uzatabilir. Target Sell fiyatının biraz daha altına listelemek ise ürünün çok daha hızlı satılmasını ve algoritma tarafından tekrar fırsat olarak yakalanmasını kolaylaştırır.' 
                          : 'Reselling above the Target Sell price may increase gains but often slows down the sale. Reselling slightly below the Target Sell price is favored by the algorithm, allowing for a quicker sale and making the item eligible to be caught as an opportunity again.' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Arrow -->
              <button 
                @click="guidePage = Math.min(5, guidePage + 1)"
                :disabled="guidePage === 5"
                class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed enabled:hover:bg-white/15 enabled:hover:border-white/25 cursor-pointer"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <!-- Dots Indicator / Page Numbers -->
            <div class="flex justify-center items-center gap-2.5 mt-2 z-10">
              <button 
                @click="guidePage = 0"
                class="w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
                :class="guidePage === 0 ? 'bg-emerald-400 scale-125 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-white/20 hover:bg-white/40'"
                title="Introduction"
              ></button>
              <button 
                @click="guidePage = 1"
                class="w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
                :class="guidePage === 1 ? 'bg-emerald-400 scale-125 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-white/20 hover:bg-white/40'"
                title="Page 1"
              ></button>
              <button 
                @click="guidePage = 2"
                class="w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
                :class="guidePage === 2 ? 'bg-emerald-400 scale-125 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-white/20 hover:bg-white/40'"
                title="Page 2"
              ></button>
              <button 
                @click="guidePage = 3"
                class="w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
                :class="guidePage === 3 ? 'bg-emerald-400 scale-125 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-white/20 hover:bg-white/40'"
                title="Page 3"
              ></button>
              <button 
                @click="guidePage = 4"
                class="w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
                :class="guidePage === 4 ? 'bg-emerald-400 scale-125 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-white/20 hover:bg-white/40'"
                title="Page 4"
              ></button>
              <button 
                @click="guidePage = 5"
                class="w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
                :class="guidePage === 5 ? 'bg-emerald-400 scale-125 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-white/20 hover:bg-white/40'"
                title="Tips"
              ></button>
            </div>
          </div>
        </div>
      </div>
    </transition>
    
    <!-- Privacy Policy Modal -->
    <PrivacyPolicyModal :show="showPrivacyModal" @close="showPrivacyModal = false" />

  </div>
</template>

<style scoped>
.font-outfit {
  font-family: 'Outfit', sans-serif;
}
.font-inter {
  font-family: 'Inter', sans-serif;
}

.site-wrapper {
  background-color: #030207;
}

.ambient-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, rgba(59, 130, 246, 0.02) 40%, transparent 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  filter: blur(80px);
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse at center, black, transparent 85%);
  pointer-events: none;
  z-index: 2;
}

.particle-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.list-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}
.list-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.95);
}
.list-move {
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.01);
  border-radius: 3px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

.creator-name {
  position: relative;
  display: inline-block;
  font-weight: 800;
  cursor: default;
  background: linear-gradient(135deg, #4b5563, #ffffff, #4b5563);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine-gradient 3s ease-in-out infinite;
}

@keyframes shine-gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.no-spin::-webkit-outer-spin-button,
.no-spin::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.no-spin[type=number] {
  -moz-appearance: textfield;
}

.fade-modal-enter-active {
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-modal-leave-active {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.fade-modal-enter-active .modal-card {
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-modal-leave-active .modal-card {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.fade-modal-enter-from .modal-card {
  transform: scale(0.96) translateY(8px);
}
.fade-modal-leave-to .modal-card {
  transform: scale(0.96) translateY(8px);
}

/* Guide List Styling */
.guide-bullet-list {
  display: flex;
  flex-col: column;
  gap: 1.25rem;
}
.guide-bullet-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  line-height: 1.6;
}
.guide-bullet {
  width: 6px;
  height: 6px;
  background-color: #ffffff;
  border-radius: 9999px;
  margin-top: 6px;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
}
</style>
