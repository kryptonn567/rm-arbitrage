<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import faviconImg from './assets/favicon.ico'

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

const formatCumulativeProfit = computed(() => {
  const val = cumulativeProfit.value
  if (val >= 100) {
    return '+' + Math.floor(val / 100) * 100
  } else if (val >= 10) {
    return '+' + Math.floor(val / 10) * 10
  } else if (val >= 1) {
    return '+' + Math.floor(val)
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
const volumeLevel = ref(0.3)
const soundEnabled = computed(() => volumeLevel.value > 0)
const showVolumeSlider = ref(false)
const showLangDropdown = ref(false)
const currentLanguage = ref('TR')

const currentTier = ref(1)
const tierTimer = ref(0)
let tierInterval = null
const showTierModal = ref(false)

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
  alert('RollerCoin Arbitraj Rehberi (Guide) yakında eklenecektir!')
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
        cumulativeProfit.value = data.cumulativeProfit !== undefined ? data.cumulativeProfit : opportunities.value.reduce((acc, o) => acc + o.kesinKarMarji, 0)
      } else if (data.type === 'opportunity') {
        const newItem = {
          ...data.data,
          time: new Date(data.data.timestamp)
        }
        opportunities.value.unshift(newItem)
        totalScanned.value = data.totalScanned !== undefined ? data.totalScanned : totalScanned.value + 1
        cumulativeProfit.value = data.cumulativeProfit !== undefined ? data.cumulativeProfit : cumulativeProfit.value + data.data.kesinKarMarji
        playAlertSound()
        
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
  return Math.max(...opportunities.value.map(o => o.kesinKarMarji))
})

const averageProfitValue = computed(() => {
  if (opportunities.value.length === 0) return 0
  const sum = opportunities.value.reduce((acc, o) => acc + o.kesinKarMarji, 0)
  return sum / opportunities.value.length
})

const filteredOpportunities = computed(() => {
  return opportunities.value.filter(o => {
    const matchesProfit = o.kesinKarMarji >= minProfit.value
    
    let matchesCategory = true
    const typeLower = String(o.itemType || '').toLowerCase()
    if (selectedCategory.value === 'Miners') {
      matchesCategory = typeLower.startsWith('miner')
    } else if (selectedCategory.value === 'Parts') {
      matchesCategory = typeLower.startsWith('part')
    } else if (selectedCategory.value === 'Racks') {
      matchesCategory = typeLower.startsWith('rack')
    } else if (selectedCategory.value === 'Batteries') {
      matchesCategory = typeLower.startsWith('battery')
    } else if (selectedCategory.value === 'Other') {
      matchesCategory = !typeLower.startsWith('miner') && 
                        !typeLower.startsWith('part') && 
                        !typeLower.startsWith('rack') && 
                        !typeLower.startsWith('battery')
    }
    
    const matchesBalance = rltBalance.value !== '' && rltBalance.value !== null
      ? o.gercekAlisFiyatiRlt <= parseFloat(rltBalance.value)
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
  if (seconds < 5) return 'Şimdi'
  if (seconds < 60) return `${seconds} sn önce`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} dk önce`
  return date.toLocaleTimeString()
}

const formatRLT = (val) => {
  return parseFloat(Number(val).toFixed(6))
}

const getItemImageUrl = (opp) => {
  const typeLower = String(opp.itemType || '').toLowerCase()
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
  const targetPriceText = parseFloat(opp.yeniSatisFiyati.toFixed(6)).toString()
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

    <main class="flex-1 flex flex-col items-center justify-start p-4 md:p-8 relative z-10 w-full max-w-7xl mx-auto mt-6">
      <div class="w-full flex flex-col gap-6">
        <header class="flex flex-col md:flex-row items-center justify-between gap-4 w-full border-b border-white/5 pb-6">
          <div class="flex items-center gap-4">
            <img :src="faviconImg" class="logo-img w-12 h-12 md:w-16 md:h-16" alt="Logo" />
            <div class="text-left">
              <h1 class="text-2xl md:text-3xl font-black tracking-wider font-outfit uppercase bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Rollercoinmarkt
              </h1>
              <p class="text-xs text-gray-400 mt-1 md:whitespace-nowrap">
                RollerCoin marketindeki en kârlı anlık al-sat fırsatlarını otomatik olarak yakalar, hesaplar ve listeler.
              </p>
            </div>
          </div>
          
          <div class="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <button 
              @click="openGuide"
              class="cursor-pointer flex items-center gap-2 px-4 py-2 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-bold text-gray-200 transition-all font-outfit uppercase tracking-[0.12em] group"
            >
              <svg class="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>GUIDE</span>
            </button>

            <div class="relative flex items-center">
              <button 
                @click="toggleVolumeSlider"
                class="cursor-pointer flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group z-30"
                title="Ses Ayarı"
              >
                <svg v-if="soundEnabled" class="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <svg v-else class="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </button>
              
              <transition name="fade">
                <div 
                  v-if="showVolumeSlider"
                  class="absolute left-1/2 -translate-x-1/2 top-12 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2 z-20 shadow-xl"
                >
                  <input 
                    v-model.number="volumeLevel" 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    class="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white" 
                  />
                  <span class="text-[10px] font-mono text-gray-300 w-6 text-right">{{ Math.round(volumeLevel * 100) }}%</span>
                </div>
              </transition>
            </div>

            <div class="relative flex items-center">
              <button 
                @click="toggleLanguageDropdown"
                class="cursor-pointer flex items-center gap-2 px-3.5 py-2 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm font-bold text-gray-300 transition-all font-outfit uppercase tracking-wider group z-30"
                title="Dili Değiştir / Change Language"
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
                    @click="currentLanguage = 'TR'; showLangDropdown = false"
                    class="cursor-pointer px-3 py-1.5 rounded text-xs font-semibold hover:bg-white/10 transition-colors text-left flex items-center justify-between w-full"
                    :class="currentLanguage === 'TR' ? 'text-white bg-white/5' : 'text-gray-400'"
                  >
                    <span>Türkçe</span>
                    <span v-if="currentLanguage === 'TR'" class="text-[10px] text-emerald-400 font-bold">✓</span>
                  </button>
                  <button 
                    @click="currentLanguage = 'EN'; showLangDropdown = false"
                    class="cursor-pointer px-3 py-1.5 rounded text-xs font-semibold hover:bg-white/10 transition-colors text-left flex items-center justify-between w-full"
                    :class="currentLanguage === 'EN' ? 'text-white bg-white/5' : 'text-gray-400'"
                  >
                    <span>English</span>
                    <span v-if="currentLanguage === 'EN'" class="text-[10px] text-emerald-400 font-bold">✓</span>
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
                  placeholder="Enter your RLT balance here." 
                  class="w-full bg-transparent border-none text-sm text-gray-200 focus:outline-none no-spin"
                />
                <div class="relative group/info flex items-center justify-center w-5 h-5 shrink-0 rounded-full border border-white/20 hover:border-white/40 cursor-help transition-colors">
                  <span class="text-[10px] font-bold text-gray-400 group-hover/info:text-white">?</span>
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/95 border border-white/10 rounded-lg text-[10px] text-gray-300 font-medium text-center shadow-xl opacity-0 scale-95 pointer-events-none group-hover/info:opacity-100 group-hover/info:scale-100 transition-all z-50">
                    Bütçenizin yetmediği yüksek fiyatlı eşyaları gizlemek ve sadece satın alabileceğiniz fırsatları görmek için RLT bakiyenizi girin.
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95"></div>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 w-full md:w-[380px] h-11 bg-black/40 border border-white/15 rounded-lg px-3 focus-within:border-white/40 transition-colors">
                <span class="text-xs text-gray-400 whitespace-nowrap">Minimum Kâr:</span>
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
                  {{ cat }}
                </button>
              </div>
            </div>
          </div>

          <div class="col-span-1 md:col-span-3 border-t md:border-t-0 md:border-l border-white/5 flex flex-col items-center justify-center p-6 bg-white/[0.01] relative">
            <div 
              @click="showTierModal = true"
              class="absolute top-0 right-0 w-10 h-10 cursor-pointer group/fold z-30"
              title="Membership Info / Tier Details"
            >
              <div class="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-white/10 border-l-[40px] border-l-transparent transition-all group-hover/fold:border-t-white/20"></div>
              <div class="absolute top-0 right-0 w-0 h-0 border-b-[40px] border-b-transparent border-r-[40px] border-r-black/40 shadow-md"></div>
              <span class="absolute top-1.5 right-2.5 text-xs font-black text-white/50 group-hover/fold:text-white transition-colors">?</span>
            </div>

            <div class="flex items-end gap-2 h-12">
              <div class="w-2.5 h-4 rounded transition-all" :class="getBarColor(1)"></div>
              <div class="w-2.5 h-8 rounded transition-all" :class="getBarColor(2)"></div>
              <div class="w-2.5 h-12 rounded transition-all" :class="getBarColor(3)"></div>
            </div>
            
            <span class="text-base font-black uppercase tracking-widest mt-3 transition-colors" :class="getTierTextColor">
              Tier {{ currentTier === 1 ? 'I' : currentTier === 2 ? 'II' : 'III' }}
            </span>
            
            <span v-if="tierTimer > 0" class="text-xs font-mono mt-1.5 font-bold transition-colors" :class="getTimerTextColor">
              {{ formatTimer(tierTimer) }} remaining
            </span>
            
            <button 
              @click="handleWatchAd"
              class="relative mt-4 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[10px] font-black text-white transition-all uppercase tracking-wider cursor-pointer pr-10 group/up"
            >
              <span>{{ currentTier === 3 ? 'watch ad to maintain tier' : 'watch ad to upgrade tier' }}</span>
              <div class="absolute -top-2 -right-2 bg-white text-black w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-lg border border-black/20 group-hover/up:scale-110 transition-all" title="Rewarded Video Ad">
                <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
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
                class="absolute left-6 top-1/2 -translate-y-1/2 w-40 h-40 opacity-20 group-hover:opacity-35 rotate-[-15deg] group-hover:rotate-[-5deg] group-hover:scale-110 transition-all duration-500 pointer-events-none select-none z-0 object-contain" 
                alt=""
                @error="(e) => { e.target.style.display = 'none'; }"
              />
              
              <div class="col-span-1 md:col-span-3 flex flex-col gap-2 relative z-10 text-left">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-300 font-semibold uppercase tracking-wider">
                    {{ opp.itemType }}
                  </span>
                  <span class="text-xs text-gray-500 font-mono">{{ timeAgo(opp.time) }}</span>
                </div>
                <h3 class="text-base md:text-lg font-black font-outfit text-white line-clamp-1" :title="opp.itemName || opp.itemId">
                  {{ opp.itemName || opp.itemId }}
                </h3>
              </div>

              <div class="col-span-1 md:col-span-2 flex flex-col relative z-10 text-left md:pl-2">
                <span class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Miktar</span>
                <span class="font-bold text-white font-mono mt-0.5 text-sm md:text-base">{{ opp.quantity }} Adet</span>
              </div>

              <div class="col-span-1 md:col-span-2 flex flex-col relative z-10 text-left">
                <span class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Gerçek Alış</span>
                <span class="font-bold text-white font-mono mt-0.5 text-sm md:text-base text-emerald-400 font-semibold flex items-center gap-1.5">
                  {{ formatRLT(opp.gercekAlisFiyatiRlt) }}
                  <img src="https://static.rollercoin.com/static/img/icons/currencies/rlt.svg" class="w-4.5 h-4.5 select-none pointer-events-none" alt="RLT" />
                </span>
              </div>

              <div class="col-span-1 md:col-span-2 flex flex-col relative z-10 text-left">
                <span class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Hedef Satış (Net)</span>
                <span class="font-bold text-white font-mono mt-0.5 text-sm md:text-base text-gray-300 flex items-center gap-1.5">
                  {{ formatRLT(opp.yeniSatisFiyati) }}
                  <img src="https://static.rollercoin.com/static/img/icons/currencies/rlt.svg" class="w-4.5 h-4.5 select-none pointer-events-none" alt="RLT" />
                </span>
              </div>

              <div class="col-span-1 md:col-span-3 flex items-center justify-between gap-2 relative z-10 w-full border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                <div class="text-left">
                  <span class="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Net Kazanç</span>
                  <div class="text-base md:text-lg font-black font-outfit text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.2)] flex items-center gap-1.5">
                    +{{ formatRLT(opp.kesinKarMarji) }}
                    <img src="https://static.rollercoin.com/static/img/icons/currencies/rlt.svg" class="w-4.5 h-4.5 select-none pointer-events-none" alt="RLT" />
                  </div>
                </div>
                <button 
                  @click="handleBuyClick(opp)"
                  class="cursor-pointer h-9 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all text-black font-black text-xs font-outfit uppercase tracking-wider flex items-center justify-center whitespace-nowrap"
                >
                  Satın Al
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
                Daha Fazla Göster
              </button>
            </div>
          </transition>

          <div 
            v-if="filteredOpportunities.length === 0" 
            class="flex flex-col items-center justify-center h-[calc(100%-4px)] border border-dashed border-white/5 rounded-2xl bg-white/[0.01]"
          >
            <span class="text-4xl">📡</span>
            <h3 class="text-lg font-bold font-outfit text-gray-400 mt-4">Canlı Fırsatlar Bekleniyor...</h3>
            <p class="text-xs text-gray-500 max-w-xs text-center mt-1">Piyasada arbitraj fırsatları yakalandıkça bu alanda görüntülenecektir.</p>
          </div>
        </div>
      </div>
    </main>

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
              Rollercoinmarkt is an independent fan project. It is not affiliated with, authorized, or endorsed by RollerCoin.
            </p>
            <div class="flex items-center justify-center sm:justify-start gap-1 text-[11px] text-gray-500 mt-2">
              <span>Created by</span>
              <span class="creator-name">kryptonn567</span>
            </div>
          </div>
        </div>

        <div class="flex justify-center justify-self-center">
          <a href="https://rollercoin.com/?r=kxsl6ix5" target="_blank" rel="noopener" class="block hover:opacity-90 transition-opacity max-w-full overflow-hidden">
            <img src="https://static.rollercoin.com/static/img/ref/gen3/w320h100.gif" alt="320h100" class="rounded-lg border border-white/5 shadow-md max-w-full h-auto object-contain" />
          </a>
        </div>

        <div class="flex justify-center justify-self-center">
          <div class="grid grid-cols-[auto_auto] gap-x-6 gap-y-2.5 shrink-0 select-none items-center">
            <span class="text-[10px] text-gray-400 uppercase tracking-widest font-semibold text-left">
              Yakalanan Fırsatlar
            </span>
            <span class="text-3xl font-black font-mono text-gray-300 text-left">
              {{ totalScanned }}
            </span>

            <span class="text-[10px] text-blue-400 uppercase tracking-widest font-semibold text-left">
              Kâr Fırsatları
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
              title="Kapat"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" stroke="currentColor" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="text-center relative z-10">
              <h2 class="text-xl md:text-2xl font-black font-outfit uppercase tracking-widest text-gray-300">
                Access Tiers
              </h2>
              <p class="text-xs text-gray-400 mt-2">
                Upgrade your tier to unlock advanced filtering tools and indicator features.
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
                  <h3 class="text-xl font-black font-outfit text-white mt-1">Standart</h3>
                  <div class="border-t border-red-500/10 my-3"></div>
                  <ul class="text-[11px] text-gray-400 space-y-2 text-left">
                    <li class="flex items-center gap-1.5"><span class="text-red-500">✓</span> Basic opportunity feed</li>
                    <li class="flex items-center gap-1.5"><span class="text-red-500">✓</span> Standard search filter</li>
                    <li class="flex items-center gap-1.5"><span class="text-red-500">✓</span> 1 active indicator bar</li>
                  </ul>
                </div>
                <div class="mt-6 text-center">
                  <span class="text-lg font-black text-white font-outfit uppercase">Free</span>
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
                  <h3 class="text-xl font-black font-outfit text-white mt-1">Advanced</h3>
                  <div class="border-t border-blue-500/10 my-3"></div>
                  <ul class="text-[11px] text-gray-400 space-y-2 text-left">
                    <li class="flex items-center gap-1.5"><span class="text-blue-400">✓</span> Affordability RLT filter</li>
                    <li class="flex items-center gap-1.5"><span class="text-blue-400">✓</span> 15-minute tier timer boost</li>
                    <li class="flex items-center gap-1.5"><span class="text-blue-400">✓</span> 2 active indicator bars</li>
                  </ul>
                </div>
                <div class="mt-6 text-center">
                  <span class="text-lg font-black text-blue-400 font-outfit uppercase">1 Watch Ad</span>
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
                  <h3 class="text-xl font-black font-outfit text-white mt-1">Premium</h3>
                  <div class="border-t border-emerald-500/10 my-3"></div>
                  <ul class="text-[11px] text-gray-400 space-y-2 text-left">
                    <li class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> Dynamic maintainable timer</li>
                    <li class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> All features unlocked</li>
                    <li class="flex items-center gap-1.5"><span class="text-emerald-400">✓</span> 3 active indicator bars</li>
                  </ul>
                </div>
                <div class="mt-6 text-center">
                  <span class="text-lg font-black text-emerald-400 font-outfit uppercase">1+1 Watch Ad</span>
                </div>
              </div>
            </div>

            <p class="text-[11px] text-gray-500 leading-relaxed text-center max-w-3xl mx-auto mt-4 px-4 select-none">
              By default, you start with the Standard (Tier I) plan. Watching 1 video ad unlocks the Advanced (Tier II) plan for 15 minutes. If you do not watch another ad within these 15 minutes, your tier will be downgraded by one level. However, watching a second ad during this period upgrades you to the Premium (Tier III) plan. To maintain your Premium (Tier III) status, simply watch another ad within 15 minutes to reset the countdown and maximize your access time.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 z-10 w-full px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/5 select-none relative">
              <div class="flex justify-center items-center py-1">
                <div v-if="currentTier > 1" class="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 border border-white/30 text-[10px] text-white font-bold" title="Completed">
                  ✓
                </div>
                <span v-else class="px-2.5 py-1 rounded-full bg-white/10 border border-white/30 text-[10px] font-black text-white uppercase tracking-wider">
                  YOUR CURRENT TIER
                </span>
              </div>

              <div class="flex justify-center items-center py-1">
                <div v-if="currentTier > 2" class="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 border border-white/30 text-[10px] text-white font-bold" title="Completed">
                  ✓
                </div>
                <span v-else-if="currentTier === 2" class="px-2.5 py-1 rounded-full bg-white/10 border border-white/30 text-[10px] font-black text-white uppercase tracking-wider">
                  YOUR CURRENT TIER
                </span>
                <span v-else class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Locked (Watch Ad)
                </span>
              </div>

              <div class="flex justify-center items-center py-1">
                <span v-if="currentTier === 3" class="px-2.5 py-1 rounded-full bg-white/10 border border-white/30 text-[10px] font-black text-white uppercase tracking-wider">
                  YOUR CURRENT TIER
                </span>
                <span v-else class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Locked (Watch Ad)
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
</style>
