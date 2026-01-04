// TTS (Text-to-Speech) Service
// Extracted from game.js for modularity

const TTSService = (function() {
    // Private state
    let speechSynthesis = window.speechSynthesis;
    let spanishVoice = null;
    let finnishVoice = null;

    /**
     * Initialize voices - finds Spanish and Finnish voices
     */
    function initializeVoices() {
        const voices = speechSynthesis.getVoices();
        console.log('🔊 Available voices:', voices.map(v => `${v.name} (${v.lang})`));
        
        // Find Spanish voice (prefer es-ES, fallback to any Spanish)
        spanishVoice = voices.find(v => v.lang === 'es-ES') || 
                       voices.find(v => v.lang.startsWith('es')) ||
                       voices.find(v => v.lang === 'es-MX') ||
                       voices.find(v => v.lang === 'es-US');
        
        // Find Finnish voice (if available)
        finnishVoice = voices.find(v => v.lang === 'fi-FI') ||
                       voices.find(v => v.lang.startsWith('fi'));
        
        if (spanishVoice) {
            console.log('✅ Spanish voice found:', spanishVoice.name);
        } else {
            console.warn('⚠️ No Spanish voice available, using default');
        }
        
        if (finnishVoice) {
            console.log('✅ Finnish voice found:', finnishVoice.name);
        } else {
            console.log('ℹ️ No Finnish voice available, will use default');
        }
    }

    /**
     * Speak text in Spanish
     * @param {string} text - Text to speak
     */
    function speakSpanish(text) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.8; // Slightly slower for learning
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        if (spanishVoice) {
            utterance.voice = spanishVoice;
        }
        
        console.log('🔊 Speaking in Spanish:', text);
        speechSynthesis.speak(utterance);
    }

    /**
     * Speak text in Finnish
     * @param {string} text - Text to speak
     */
    function speakFinnish(text) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fi-FI';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        if (finnishVoice) {
            utterance.voice = finnishVoice;
        }
        
        console.log('🔊 Speaking in Finnish:', text);
        speechSynthesis.speak(utterance);
    }

    /**
     * Cancel any ongoing speech
     */
    function cancel() {
        speechSynthesis.cancel();
    }

    /**
     * Initialize the TTS service
     * Sets up voices and listens for async voice loading
     */
    function init() {
        initializeVoices();
        
        // Voices may load asynchronously, so listen for when they're available
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = initializeVoices;
        }
        
        console.log('🔊 TTS Service initialized');
    }

    // Public API
    return {
        init: init,
        speakSpanish: speakSpanish,
        speakFinnish: speakFinnish,
        cancel: cancel
    };
})();

// Export for use in other modules
window.TTSService = TTSService;

