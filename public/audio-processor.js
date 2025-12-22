/**
 * AudioWorklet processor for voice input
 * Runs on the audio thread for better performance and no main thread blocking
 */
class VoiceProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.bufferSize = 4096; // Match previous ScriptProcessorNode buffer size
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input[0]) {
      // Accumulate samples from the input channel
      const channelData = input[0];
      for (let i = 0; i < channelData.length; i++) {
        this.buffer.push(channelData[i]);
      }
      
      // When buffer is full, send to main thread
      while (this.buffer.length >= this.bufferSize) {
        const audioData = new Float32Array(this.buffer.splice(0, this.bufferSize));
        this.port.postMessage({ type: 'audio', data: audioData });
      }
    }
    return true; // Keep processor alive
  }
}

registerProcessor('voice-processor', VoiceProcessor);
