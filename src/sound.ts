import { useSyncExternalStore } from 'react'

// No remote audio or API: the transition is a quiet, locally synthesized breath.
let context: AudioContext | undefined
let enabled = false
let source: AudioBufferSourceNode | undefined
let utterance: SpeechSynthesisUtterance | undefined
const listeners = new Set<() => void>()
export const soundEnabled = () => enabled
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
export function useSound() {
  return useSyncExternalStore(subscribe, soundEnabled, () => false)
}
export function stopNarration() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window)
    window.speechSynthesis.cancel()
  utterance = undefined
}
export async function setSoundEnabled(next: boolean): Promise<void> {
  if (next) {
    try {
      context ??= new AudioContext()
      await context.resume()
      if (context.state !== 'running') return
    } catch {
      return
    }
  }
  enabled = next
  if (!next) {
    stopNarration()
    source?.stop()
    source = undefined
    void context?.suspend()
  }
  listeners.forEach((listener) => listener())
}
export function playTransitionSound() {
  if (!enabled || !context || context.state !== 'running' || document.hidden)
    return
  source?.stop()
  const audio = context
  const duration = 0.74
  const buffer = audio.createBuffer(
    1,
    Math.ceil(audio.sampleRate * duration),
    audio.sampleRate,
  )
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
  const noise = audio.createBufferSource()
  const filter = audio.createBiquadFilter()
  const gain = audio.createGain()
  noise.buffer = buffer
  filter.type = 'bandpass'
  filter.Q.value = 0.4
  const start = audio.currentTime
  filter.frequency.setValueAtTime(380, start)
  filter.frequency.exponentialRampToValueAtTime(1300, start + 0.3)
  filter.frequency.exponentialRampToValueAtTime(300, start + duration)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(0.075, start + 0.18)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.04)
  gain.gain.linearRampToValueAtTime(0, start + duration)
  noise.connect(filter).connect(gain).connect(audio.destination)
  noise.onended = () => {
    noise.disconnect()
    filter.disconnect()
    gain.disconnect()
    if (source === noise) source = undefined
  }
  source = noise
  noise.start(start)
  noise.stop(start + duration)
}
export function speakHero(text: string, lang: string) {
  if (
    !enabled ||
    document.hidden ||
    !('speechSynthesis' in window) ||
    typeof SpeechSynthesisUtterance === 'undefined'
  )
    return
  stopNarration()
  const speech = new SpeechSynthesisUtterance(text)
  speech.lang = lang
  const voices = speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith(lang.split('-')[0]))
  const voice = voices.find((voice) => voice.localService) ?? voices[0]
  if (voice) speech.voice = voice
  speech.rate = lang === 'zh-CN' ? 0.86 : 0.91
  speech.pitch = 1
  speech.volume = 0.72
  utterance = speech
  speech.onend = speech.onerror = () => {
    if (utterance === speech) utterance = undefined
  }
  speechSynthesis.speak(speech)
}
