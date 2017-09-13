import { randFloatSpread } from './math';

var { AudioContext } = window;

var audioContext = new AudioContext();
var { sampleRate } = audioContext;

// A4 is 69.
var toFreq = note => (2 ** ((note - 69) / 12)) * 440;

var playSound = (sound, destination = audioContext.destination) => {
  var source = audioContext.createBufferSource();
  source.buffer = sound;
  source.connect(destination);
  source.start();
};

var generateAudioBuffer = (fn, duration, volume) => {
  var length = duration * sampleRate;

  var buffer = audioContext.createBuffer(1, length, sampleRate);
  var channel = buffer.getChannelData(0);
  for (var i = 0; i < length; i++) {
    channel[i] = fn(i / sampleRate, i, channel) * volume;
  }

  return buffer;
};

var wet = audioContext.createGain();
wet.gain.value = 0.5;
wet.connect(audioContext.destination);

var dry = audioContext.createGain();
dry.gain.value = 1 - wet.gain.value;
dry.connect(audioContext.destination);

var convolver = audioContext.createConvolver();
convolver.connect(wet);

var master = audioContext.createGain();
master.gain.value = 0.8;
master.connect(dry);
master.connect(convolver);

var impulseResponse = (t, i, a) => {
  return (2 * Math.random() - 1) * Math.pow(64, -i / a.length);
};

var impulseResponseBuffer = generateAudioBuffer(impulseResponse, 2, 1);

// Cheap hack for reverb.
var renderLowPassOffline = (convolver, startFrequency, endFrequency, duration) => {
  var offlineCtx = new OfflineAudioContext(1, impulseResponseBuffer.length, sampleRate);

  var offlineFilter = offlineCtx.createBiquadFilter();
  offlineFilter.type = 'lowpass';
  offlineFilter.Q.value = 0.0001;
  offlineFilter.frequency.value = startFrequency;
  offlineFilter.frequency.linearRampToValueAtTime(endFrequency, duration);
  offlineFilter.connect(offlineCtx.destination);

  var offlineBufferSource = offlineCtx.createBufferSource();
  offlineBufferSource.buffer = impulseResponseBuffer;
  offlineBufferSource.connect(offlineFilter);
  offlineBufferSource.start();

  var render = offlineCtx.startRendering();

  // https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext/startRendering
  if (render !== undefined) {
    // Promises.
    render.then(buffer => convolver.buffer = buffer);
  } else {
    // Callbacks.
    offlineCtx.oncomplete = event => convolver.buffer = event.renderedBuffer;
  }
};

// A4 to A3.
renderLowPassOffline(convolver, 440, 220, 1);

// Oscillators
// f: frequency, t: parameter.
var sin = f => t => Math.sin(t * 2 * Math.PI * f);

var saw = f => t => {
  var n = ((t % (1 / f)) * f) % 1;
  return -1 + 2 * n;
};

var tri = f => t => {
  var n = ((t % (1 / f)) * f) % 1;
  return n < 0.5 ? -1 + (2 * (2 * n)) : 1 - (2 * (2 * n));
};

var square = f => t => {
  var n = ((t % (1 / f)) * f) % 1;
  return n > 0.5 ? 1 : -1;
};

var decay = d => () => t => Math.exp(-t * d);

// Brown noise.
// https://github.com/Tonejs/Tone.js/blob/master/Tone/source/Noise.js
var noise = () => {
  var value = 0;

  return () => {
    var step = (value + (0.02 * randFloatSpread(1))) / 1.02;
    value += step;

    // Limit to [-1, 1].
    if (-1 > value || value > 1) {
      value -= step;
    }

    return value * 3.5;
  };
};

// Operators
var add = (a, b) => f => {
  var af = a(f);
  var bf = b(f);

  return t => af(t) + bf(t);
};

var mul = (a, b) => f => {
  var af = a(f);
  var bf = b(f);

  return t => af(t) * bf(t);
};

var zero = () => () => 0;
var one = () => () => 1;

var scale = (fn, n) => f => {
  var fnf = fn(f);
  return t => n * fnf(t);
};

var steps = (f, d) => f * (2 ** (d / 12));

var detune = (fn, d) => f => fn(steps(f, d));

// Sequencer
var delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  playSound(generateAudioBuffer(
    mul(add(sin, noise), decay(8))(toFreq(69)),
    2,
    1,
  ), master);

  await delay(1000);

  // Chorus sine
  playSound(generateAudioBuffer(
    mul(
      add(
        add(
          sin,
          detune(sin, 0.1),
        ),
        detune(sin, -0.1),
      ),
      decay(2)
    )(toFreq(57)),
    8,
    0.4,
  ), master);
})();
