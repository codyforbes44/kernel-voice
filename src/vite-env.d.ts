/// <reference types="vite/client" />

// AudioWorklet types
interface AudioWorkletProcessor {
  readonly port: MessagePort;
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

declare let sampleRate: number;

declare function registerProcessor(
  name: string,
  processorCtor: new () => AudioWorkletProcessor
): void;
