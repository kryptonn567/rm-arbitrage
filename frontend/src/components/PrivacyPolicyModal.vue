<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

// Track which sections are expanded (all collapsed by default)
const activeSections = ref({
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
  6: false,
  7: false,
  8: false,
  9: false,
  10: false
})

const toggleSection = (id) => {
  activeSections.value[id] = !activeSections.value[id]
}

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && props.show) {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <transition name="fade-modal">
    <div 
      v-if="show"
      class="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6"
      @click.self="emit('close')"
    >
      <div 
        class="modal-card bg-[#030207]/95 border border-white/10 p-6 md:p-8 rounded-3xl w-full max-w-3xl flex flex-col gap-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden transform scale-100 transition-all duration-300"
      >
        <!-- Close Button -->
        <button 
          @click="emit('close')"
          class="absolute top-4 right-4 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 hover:border-white/20 transition-all cursor-pointer z-20"
          title="Close"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" stroke="currentColor" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Title -->
        <div class="text-center relative z-10 border-b border-white/5 pb-4">
          <h2 class="text-xl md:text-2xl font-black font-outfit uppercase tracking-widest text-gray-300">
            Privacy Policy
          </h2>
        </div>

        <!-- Content Area -->
        <div class="text-left overflow-y-auto max-h-[60vh] md:max-h-[65vh] pr-2 scrollbar-thin text-xs text-gray-300 space-y-3 leading-relaxed font-inter">
          
          <!-- Section 1 -->
          <div class="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden transition-all duration-300">
            <button 
              @click="toggleSection(1)" 
              class="w-full flex items-center justify-between p-4 text-left font-bold text-white uppercase tracking-wider hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
            >
              <span class="text-[11px] md:text-xs">1. Information We Collect</span>
              <svg 
                class="w-3.5 h-3.5 text-gray-400 transition-transform duration-300 shrink-0"
                :class="{ 'rotate-180 text-emerald-400': activeSections[1] }"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              v-show="activeSections[1]" 
              class="p-4 pt-0 border-t border-white/5 text-gray-300 space-y-2 bg-[#030207]/40"
            >
              <p>
                RollerCoinMarkt does not directly collect, request, or store any of your personal data, credentials, account information, or persistent identifiers on our servers.
              </p>
              <p>
                When you interact with the app, certain preference settings are processed and maintained solely in your browser's temporary memory (in-memory state) to enable localized features:
              </p>
              <ul class="list-disc pl-5 space-y-1">
                <li><strong>RLT Balance Filter:</strong> The RLT balance you enter is processed locally within your browser to filter arbitrage opportunities. It is never sent to our servers.</li>
                <li><strong>Language & Interface Preferences:</strong> Your language selection and volume levels are held in memory to configure the site interface.</li>
                <li><strong>Active Access Tier:</strong> Your active tier level and corresponding cooldown timer status are kept in memory for the duration of your browser session.</li>
              </ul>
            </div>
          </div>

          <!-- Section 2 -->
          <div class="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden transition-all duration-300">
            <button 
              @click="toggleSection(2)" 
              class="w-full flex items-center justify-between p-4 text-left font-bold text-white uppercase tracking-wider hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
            >
              <span class="text-[11px] md:text-xs">2. How We Use Information</span>
              <svg 
                class="w-3.5 h-3.5 text-gray-400 transition-transform duration-300 shrink-0"
                :class="{ 'rotate-180 text-emerald-400': activeSections[2] }"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              v-show="activeSections[2]" 
              class="p-4 pt-0 border-t border-white/5 text-gray-300 space-y-2 bg-[#030207]/40"
            >
              <p>
                The locally-processed settings listed above are used exclusively to:
              </p>
              <ul class="list-disc pl-5 space-y-1">
                <li>Display and filter market arbitrage opportunities matching your custom criteria.</li>
                <li>Deliver interface configurations, translations, and sound settings.</li>
                <li>Manage your session tier status based on user interactions.</li>
              </ul>
            </div>
          </div>

          <!-- Section 3 -->
          <div class="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden transition-all duration-300">
            <button 
              @click="toggleSection(3)" 
              class="w-full flex items-center justify-between p-4 text-left font-bold text-white uppercase tracking-wider hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
            >
              <span class="text-[11px] md:text-xs">3. Cookies and Advertising</span>
              <svg 
                class="w-3.5 h-3.5 text-gray-400 transition-transform duration-300 shrink-0"
                :class="{ 'rotate-180 text-emerald-400': activeSections[3] }"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              v-show="activeSections[3]" 
              class="p-4 pt-0 border-t border-white/5 text-gray-300 space-y-2 bg-[#030207]/40"
            >
              <p>
                To keep our service free, we display ads using the <strong>AADS</strong> (Anonymous Ads) advertising provider. AADS is integrated via iframes pointing to domains owned by AADS.
              </p>
              <p>
                While RollerCoinMarkt does not set cookies or track your browsing activity, the third-party AADS advertising network may process technical data (such as your IP address, browser user-agent, or request headers) and set cookies to:
              </p>
              <ul class="list-disc pl-5 space-y-1">
                <li>Serve and rotate advertising content.</li>
                <li>Prevent fraudulent clicks or impressions.</li>
                <li>Gather aggregated technical metrics.</li>
              </ul>
              <p>
                You can control or disable cookies through your browser settings at any time.
              </p>
            </div>
          </div>

          <!-- Section 4 -->
          <div class="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden transition-all duration-300">
            <button 
              @click="toggleSection(4)" 
              class="w-full flex items-center justify-between p-4 text-left font-bold text-white uppercase tracking-wider hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
            >
              <span class="text-[11px] md:text-xs">4. Third-Party Services</span>
              <svg 
                class="w-3.5 h-3.5 text-gray-400 transition-transform duration-300 shrink-0"
                :class="{ 'rotate-180 text-emerald-400': activeSections[4] }"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              v-show="activeSections[4]" 
              class="p-4 pt-0 border-t border-white/5 text-gray-300 space-y-2 bg-[#030207]/40"
            >
              <p>
                Our application relies on and links to the following third-party integrations:
              </p>
              <ul class="list-disc pl-5 space-y-1">
                <li><strong>AADS Network:</strong> Serves advertisements inside embedded frames.</li>
                <li><strong>RollerCoin:</strong> Outgoing links are provided to RollerCoin.com for the convenience of purchasing scanned items.</li>
                <li><strong>Live WebSocket Feed:</strong> Connects to our back-end server over a secure WebSocket protocol to fetch live scanned arbitrage items. No client tracking telemetry is transmitted back through this channel.</li>
              </ul>
              <p>
                We are not responsible for the privacy practices of external platforms. We encourage you to review the privacy policies of any third-party websites or services you visit.
              </p>
            </div>
          </div>

          <!-- Section 5 -->
          <div class="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden transition-all duration-300">
            <button 
              @click="toggleSection(5)" 
              class="w-full flex items-center justify-between p-4 text-left font-bold text-white uppercase tracking-wider hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
            >
              <span class="text-[11px] md:text-xs">5. Data Retention</span>
              <svg 
                class="w-3.5 h-3.5 text-gray-400 transition-transform duration-300 shrink-0"
                :class="{ 'rotate-180 text-emerald-400': activeSections[5] }"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              v-show="activeSections[5]" 
              class="p-4 pt-0 border-t border-white/5 text-gray-300 space-y-2 bg-[#030207]/40"
            >
              <p>
                Since we do not collect or store any personal data or persistent records on our backend databases, RollerCoinMarkt does not retain any user-identifiable data.
              </p>
            </div>
          </div>

          <!-- Section 6 -->
          <div class="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden transition-all duration-300">
            <button 
              @click="toggleSection(6)" 
              class="w-full flex items-center justify-between p-4 text-left font-bold text-white uppercase tracking-wider hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
            >
              <span class="text-[11px] md:text-xs">6. Data Security</span>
              <svg 
                class="w-3.5 h-3.5 text-gray-400 transition-transform duration-300 shrink-0"
                :class="{ 'rotate-180 text-emerald-400': activeSections[6] }"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              v-show="activeSections[6]" 
              class="p-4 pt-0 border-t border-white/5 text-gray-300 space-y-2 bg-[#030207]/40"
            >
              <p>
                We use secure web protocols (HTTPS and secure WebSockets - WSS) to deliver the application to your browser and fetch market logs. However, because we do not collect or store user accounts, emails, or personal databases, there is no repository of your personal data on our server to secure or compromise.
              </p>
            </div>
          </div>

          <!-- Section 7 -->
          <div class="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden transition-all duration-300">
            <button 
              @click="toggleSection(7)" 
              class="w-full flex items-center justify-between p-4 text-left font-bold text-white uppercase tracking-wider hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
            >
              <span class="text-[11px] md:text-xs">7. User Rights</span>
              <svg 
                class="w-3.5 h-3.5 text-gray-400 transition-transform duration-300 shrink-0"
                :class="{ 'rotate-180 text-emerald-400': activeSections[7] }"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              v-show="activeSections[7]" 
              class="p-4 pt-0 border-t border-white/5 text-gray-300 space-y-2 bg-[#030207]/40"
            >
              <p>
                As we do not record, store, or process any identifiable personal database records, we are unable to process request forms for access, modification, deletion, or portability of personal information, as no such records exist in our systems.
              </p>
            </div>
          </div>

          <!-- Section 8 -->
          <div class="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden transition-all duration-300">
            <button 
              @click="toggleSection(8)" 
              class="w-full flex items-center justify-between p-4 text-left font-bold text-white uppercase tracking-wider hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
            >
              <span class="text-[11px] md:text-xs">8. Children's Privacy</span>
              <svg 
                class="w-3.5 h-3.5 text-gray-400 transition-transform duration-300 shrink-0"
                :class="{ 'rotate-180 text-emerald-400': activeSections[8] }"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              v-show="activeSections[8]" 
              class="p-4 pt-0 border-t border-white/5 text-gray-300 space-y-2 bg-[#030207]/40"
            >
              <p>
                Our website is not designed or intended to collect any information from children. Because we do not store or collect personal information from any user, we do not knowingly collect or maintain data from children.
              </p>
            </div>
          </div>

          <!-- Section 9 -->
          <div class="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden transition-all duration-300">
            <button 
              @click="toggleSection(9)" 
              class="w-full flex items-center justify-between p-4 text-left font-bold text-white uppercase tracking-wider hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
            >
              <span class="text-[11px] md:text-xs">9. Changes to This Privacy Policy</span>
              <svg 
                class="w-3.5 h-3.5 text-gray-400 transition-transform duration-300 shrink-0"
                :class="{ 'rotate-180 text-emerald-400': activeSections[9] }"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              v-show="activeSections[9]" 
              class="p-4 pt-0 border-t border-white/5 text-gray-300 space-y-2 bg-[#030207]/40"
            >
              <p>
                We reserves the right to modify or update this Privacy Policy at any time. Any changes will be posted directly within this modal. We encourage you to periodically review this section to stay informed of our data practices.
              </p>
            </div>
          </div>

          <!-- Section 10 -->
          <div class="border border-white/5 rounded-2xl bg-white/[0.01] overflow-hidden transition-all duration-300">
            <button 
              @click="toggleSection(10)" 
              class="w-full flex items-center justify-between p-4 text-left font-bold text-white uppercase tracking-wider hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
            >
              <span class="text-[11px] md:text-xs">10. Contact</span>
              <svg 
                class="w-3.5 h-3.5 text-gray-400 transition-transform duration-300 shrink-0"
                :class="{ 'rotate-180 text-emerald-400': activeSections[10] }"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="2.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div 
              v-show="activeSections[10]" 
              class="p-4 pt-0 border-t border-white/5 text-gray-300 space-y-2 bg-[#030207]/40"
            >
              <p>
                If you have any questions or feedback regarding our privacy practices, you may contact us at: <a href="mailto:kryptonn567@gmail.com" class="text-emerald-400 font-mono hover:underline">kryptonn567@gmail.com</a>.
              </p>
            </div>
          </div>

          <div class="pt-4 border-t border-white/5 text-gray-500 text-[10px] text-center uppercase tracking-widest">
            Last Updated: August 21, 2026
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.font-outfit {
  font-family: 'Outfit', sans-serif;
}
.font-inter {
  font-family: 'Inter', sans-serif;
}

/* Modern thin scrollbar styling */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.01);
  border-radius: 9999px;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(16, 185, 129, 0.5); /* Emerald neon accent on hover */
}
</style>
