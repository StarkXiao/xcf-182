export class AudioManager {
  constructor() {
    this.audioContext = null
    this.masterGain = null
    this.bgNoiseGain = null
    this.sfxGain = null
    this.isMuted = false
    this.isInitialized = false
    this.bgNoiseSource = null
    this.bgNoiseBuffer = null
    this.listeners = []
    this.lastPlayTime = {}
  }

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager()
    }
    return AudioManager.instance
  }

  init() {
    if (this.isInitialized) return

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) {
        console.warn('Web Audio API not supported')
        return
      }

      this.audioContext = new AudioContext()

      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)

      this.bgNoiseGain = this.audioContext.createGain()
      this.bgNoiseGain.gain.value = 0.15
      this.bgNoiseGain.connect(this.masterGain)

      this.sfxGain = this.audioContext.createGain()
      this.sfxGain.gain.value = 0.4
      this.sfxGain.connect(this.masterGain)

      this.loadMuteState()
      this.createBackgroundNoise()
      this.isInitialized = true
    } catch (e) {
      console.warn('AudioManager init failed:', e)
    }
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  loadMuteState() {
    try {
      const saved = localStorage.getItem('mossCave_audioMuted')
      if (saved !== null) {
        this.isMuted = JSON.parse(saved)
        this.updateMasterGain()
      }
    } catch (e) {
      console.warn('Failed to load mute state:', e)
    }
  }

  saveMuteState() {
    try {
      localStorage.setItem('mossCave_audioMuted', JSON.stringify(this.isMuted))
    } catch (e) {
      console.warn('Failed to save mute state:', e)
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    this.updateMasterGain()
    this.saveMuteState()
    this.notifyListeners()
    return this.isMuted
  }

  setMuted(muted) {
    if (this.isMuted !== muted) {
      this.isMuted = muted
      this.updateMasterGain()
      this.saveMuteState()
      this.notifyListeners()
    }
  }

  updateMasterGain() {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(
        this.isMuted ? 0 : 1,
        this.audioContext.currentTime
      )
    }
  }

  onMuteChange(callback) {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try {
        cb(this.isMuted)
      } catch (e) {}
    })
  }

  createBackgroundNoise() {
    if (!this.audioContext) return

    const bufferSize = 2 * this.audioContext.sampleRate
    this.bgNoiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate)
    const output = this.bgNoiseBuffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5
    }

    this.bgNoiseSource = this.audioContext.createBufferSource()
    this.bgNoiseSource.buffer = this.bgNoiseBuffer
    this.bgNoiseSource.loop = true

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 800
    filter.Q.value = 0.5

    const hpFilter = this.audioContext.createBiquadFilter()
    hpFilter.type = 'highpass'
    hpFilter.frequency.value = 100

    const envelope = this.audioContext.createGain()
    envelope.gain.value = 0.3

    this.bgNoiseSource.connect(hpFilter)
    hpFilter.connect(filter)
    filter.connect(envelope)
    envelope.connect(this.bgNoiseGain)

    this.bgNoiseSource.start()
  }

  fadeInBackgroundNoise(duration = 2) {
    if (!this.bgNoiseGain || !this.audioContext) return
    this.resume()
    
    const now = this.audioContext.currentTime
    this.bgNoiseGain.gain.cancelScheduledValues(now)
    this.bgNoiseGain.gain.setValueAtTime(0, now)
    this.bgNoiseGain.gain.linearRampToValueAtTime(0.15, now + duration)
  }

  fadeOutBackgroundNoise(duration = 1) {
    if (!this.bgNoiseGain || !this.audioContext) return
    
    const now = this.audioContext.currentTime
    this.bgNoiseGain.gain.cancelScheduledValues(now)
    this.bgNoiseGain.gain.linearRampToValueAtTime(0, now + duration)
  }

  playPlantLight(plantType = 'moss', combo = 0) {
    if (!this.audioContext) return
    this.resume()

    const now = this.audioContext.currentTime
    const throttleKey = `plant_${plantType}`
    const lastTime = this.lastPlayTime[throttleKey] || 0
    if (now - lastTime < 0.05) return
    this.lastPlayTime[throttleKey] = now

    const baseFreqs = {
      moss: 523.25,
      mushroom: 659.25,
      flower: 783.99
    }

    const timbres = {
      moss: 'sine',
      mushroom: 'triangle',
      flower: 'sine'
    }

    const baseFreq = baseFreqs[plantType] || 523.25
    const timbre = timbres[plantType] || 'sine'

    const osc1 = this.audioContext.createOscillator()
    const osc2 = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    osc1.type = timbre
    osc2.type = 'sine'

    let freq1 = baseFreq
    let freq2 = baseFreq * 1.5

    if (combo > 0) {
      const comboMultiplier = 1 + Math.min(combo, 10) * 0.05
      freq1 *= comboMultiplier
      freq2 *= comboMultiplier
    }

    osc1.frequency.setValueAtTime(freq1, now)
    osc1.frequency.exponentialRampToValueAtTime(freq1 * 1.25, now + 0.08)
    osc1.frequency.exponentialRampToValueAtTime(freq1 * 0.9, now + 0.2)

    osc2.frequency.setValueAtTime(freq2, now)
    osc2.frequency.exponentialRampToValueAtTime(freq2 * 1.3, now + 0.06)

    filter.type = 'lowpass'
    filter.frequency.value = 3000
    filter.Q.value = 1

    const baseVolume = plantType === 'moss' ? 0.25 : plantType === 'mushroom' ? 0.28 : 0.3
    const comboBoost = Math.min(combo, 10) * 0.02
    const volume = Math.min(baseVolume + comboBoost, 0.4)

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.sfxGain)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.4)
    osc2.stop(now + 0.4)
  }

  playSuccess(stars = 1) {
    if (!this.audioContext) return
    this.resume()

    const now = this.audioContext.currentTime

    const chord = [523.25, 659.25, 783.99, 1046.50]
    const arpeggioDelay = 0.08

    chord.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      const filter = this.audioContext.createBiquadFilter()

      osc.type = i % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.value = freq

      filter.type = 'lowpass'
      filter.frequency.value = 4000

      const startTime = now + i * arpeggioDelay
      const volume = 0.25 * (1 + stars * 0.15)

      gain.gain.setValueAtTime(0, startTime)
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2 - i * 0.1)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.sfxGain)

      osc.start(startTime)
      osc.stop(startTime + 1.5)
    })

    setTimeout(() => {
      const sparkleOsc = this.audioContext.createOscillator()
      const sparkleGain = this.audioContext.createGain()
      
      sparkleOsc.type = 'sine'
      sparkleOsc.frequency.setValueAtTime(1567.98, this.audioContext.currentTime)
      sparkleOsc.frequency.exponentialRampToValueAtTime(2093.00, this.audioContext.currentTime + 0.2)
      
      sparkleGain.gain.setValueAtTime(0, this.audioContext.currentTime)
      sparkleGain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.02)
      sparkleGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5)
      
      sparkleOsc.connect(sparkleGain)
      sparkleGain.connect(this.sfxGain)
      
      sparkleOsc.start()
      sparkleOsc.stop(this.audioContext.currentTime + 0.5)
    }, 500)
  }

  playFailure() {
    if (!this.audioContext) return
    this.resume()

    const now = this.audioContext.currentTime

    const osc1 = this.audioContext.createOscillator()
    const osc2 = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    osc1.type = 'sawtooth'
    osc2.type = 'square'

    osc1.frequency.setValueAtTime(392, now)
    osc1.frequency.exponentialRampToValueAtTime(261.63, now + 0.3)

    osc2.frequency.setValueAtTime(261.63, now)
    osc2.frequency.exponentialRampToValueAtTime(196, now + 0.25)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1500, now)
    filter.frequency.linearRampToValueAtTime(500, now + 0.3)

    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    osc1.connect(filter)
    osc2.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(this.sfxGain)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.5)
    osc2.stop(now + 0.5)
  }

  playClick() {
    if (!this.audioContext) return
    this.resume()

    const now = this.audioContext.currentTime
    const throttleKey = 'click'
    const lastTime = this.lastPlayTime[throttleKey] || 0
    if (now - lastTime < 0.05) return
    this.lastPlayTime[throttleKey] = now

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, now)
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1)

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    osc.connect(gain)
    gain.connect(this.sfxGain)

    osc.start(now)
    osc.stop(now + 0.15)
  }

  playStep() {
    if (!this.audioContext) return
    this.resume()

    const now = this.audioContext.currentTime
    const throttleKey = 'step'
    const lastTime = this.lastPlayTime[throttleKey] || 0
    if (now - lastTime < 0.08) return
    this.lastPlayTime[throttleKey] = now

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    const filter = this.audioContext.createBiquadFilter()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(200 + Math.random() * 50, now)
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.08)

    filter.type = 'lowpass'
    filter.frequency.value = 800

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)

    osc.start(now)
    osc.stop(now + 0.12)
  }

  destroy() {
    if (this.bgNoiseSource) {
      try {
        this.bgNoiseSource.stop()
      } catch (e) {}
      this.bgNoiseSource = null
    }
    if (this.audioContext) {
      try {
        this.audioContext.close()
      } catch (e) {}
      this.audioContext = null
    }
    this.isInitialized = false
  }
}
