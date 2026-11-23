"""Soundtrack for 'Dağ Keçisi' (59.2 s): original 9/8 aksak (2+2+2+3) piece in Hicaz on D with ney + bağlama
+ darbuka/tef, and scene-synced SFX (engines, gear shift, horn, window crank, goat, chains, mud, siren, ferry)."""
import numpy as np, wave, sys
from scipy.signal import lfilter, butter, sosfilt
SR = 48000; DUR = 59.2; N = int(SR * DUR); T = np.arange(N) / SR
rng = np.random.default_rng(11)
L = np.zeros(N); R = np.zeros(N); M = np.zeros(N)   # M = music bus (mono, widened later)

def lp(x, fc): a = np.exp(-2 * np.pi * fc / SR); return lfilter([1 - a], [1, -a], x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], btype='band', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, btype='high', fs=SR, output='sos'), x)
def env(n, a=0.005, r=0.2):
    e = np.ones(n); na = max(1, int(a * SR)); nr = min(n, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[n - nr:] *= np.linspace(1, 0, nr) ** 2; return e
def add(sig, t0, gain=1.0, pan=0.0, bus=None):
    i0 = int(round(t0 * SR));
    if i0 < 0: sig = sig[-i0:]; i0 = 0
    n = min(len(sig), N - i0)
    if n <= 0: return
    if bus is not None: bus[i0:i0 + n] += sig[:n] * gain; return
    p = pan if np.ndim(pan) == 0 else pan[:n]
    pl, pr = np.cos((p + 1) * np.pi / 4), np.sin((p + 1) * np.pi / 4)
    L[i0:i0 + n] += sig[:n] * gain * pl; R[i0:i0 + n] += sig[:n] * gain * pr
smooth = lambda k: np.clip(k, 0, 1) ** 2 * (3 - 2 * np.clip(k, 0, 1))

# ------------------------------------------------------------------ instruments
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def pluck(f, dur, bright=0.8, decay=0.995):
    n = int(dur * SR); p = max(2, int(round(SR / f))); buf = rng.uniform(-1, 1, p) * bright
    out = np.empty(n); idx = 0
    for i in range(n):
        j = i % p; out[i] = buf[j]; buf[j] = 0.5 * (buf[j] + buf[(j + 1) % p]) * decay
    return out
_cache = {}
def baglama(m, dur, vel=1.0):
    k = (m, round(dur, 3))
    if k not in _cache:
        f = hz(m)
        s = pluck(f, dur + 0.05, 0.9) + 0.6 * pluck(f * 2 * 1.002, dur + 0.05, 0.7) + 0.25 * pluck(f * 0.5 * 0.999, dur + 0.05, 0.6)
        n = len(s); s += bp(rng.normal(0, 1, n), 2500, 7000) * np.exp(-np.arange(n) / SR * 120) * 0.6   # tezene click
        _cache[k] = s * env(n, 0.001, 0.05)
    return _cache[k] * vel
def ney(notes, t0):
    """notes: list of (midi, dur). continuous breathy tone with portamento + vibrato."""
    total = sum(d for _, d in notes); n = int(total * SR); f = np.zeros(n); amp = np.zeros(n)
    i = 0
    for m, d in notes:
        k = int(d * SR); f[i:i + k] = hz(m) if m else 0; amp[i:i + k] = 0 if m is None else 1; i += k
    f = np.where(f == 0, np.maximum.accumulate(f), f)
    f = lp(f, 14)                                   # portamento
    tt = np.arange(n) / SR
    f = f * (1 + 0.006 * np.sin(2 * np.pi * 5.3 * tt) * np.clip(tt / 0.4, 0, 1))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.32 * np.sin(2 * ph + 0.3) + 0.12 * np.sin(3 * ph + 1) + 0.05 * np.sin(4 * ph)
    breath = bp(rng.normal(0, 1, n), 900, 4200) * 0.22 * (0.7 + 0.3 * np.sin(ph * 0.5))
    a = lp(amp, 7) * env(n, 0.12, 0.35)
    add((tone * 0.75 + breath) * a, t0, 0.32, bus=M)
def darbuka(kind, t0, vel=1.0):
    n = int(0.35 * SR); x = np.arange(n) / SR
    if kind == 'D':   # düm
        s = np.sin(2 * np.pi * (95 + 60 * np.exp(-x * 30)) * x) * np.exp(-x * 9) + lp(rng.normal(0, 1, n), 400) * np.exp(-x * 40) * 0.3
    elif kind == 'T': # tek
        s = bp(rng.normal(0, 1, n), 2500, 9000) * np.exp(-x * 60) * 0.9 + np.sin(2 * np.pi * 620 * x) * np.exp(-x * 45) * 0.4
    else:             # ka (soft)
        s = bp(rng.normal(0, 1, n), 1800, 7000) * np.exp(-x * 80) * 0.5
    add(s * vel, t0, 0.5, bus=M)
def tef(t0, vel=1.0):
    n = int(0.25 * SR); x = np.arange(n) / SR
    s = hp(rng.normal(0, 1, n), 6000) * np.exp(-x * 18) * (1 + 0.5 * np.sin(2 * np.pi * 37 * x))
    add(s * vel, t0, 0.13, bus=M)

# ------------------------------------------------------------------ the piece (Hicaz on D, 9/8 = 2+2+2+3)
E8 = 0.165; BAR = 9 * E8
D, Eb, Fs, G, A, Bb, C = 62, 63, 66, 67, 69, 70, 72
RIFFS = [
    [(D, 1), (Eb, 1), (Fs, 1), (G, 1), (A, 2), (G, 1), (Fs, 1), (Eb, 1)],
    [(A, 1), (Bb, 1), (A, 1), (G, 1), (Fs, 2), (G, 1), (Fs, 1), (Eb, 1)],
    [(D, 1), (Eb, 1), (Fs, 1), (G, 1), (A, 1), (Bb, 1), (A, 1), (G, 2)],
    [(Fs, 1), (Eb, 1), (D, 2), (C, 1), (D, 1), (Eb, 1), (D, 2)],
]
def bar_groove(t0, intensity=1.0, perc=True, riff=0, octave=0):
    # bağlama riff
    tt = t0
    for m, d in RIFFS[riff % 4]:
        s = baglama(m + octave, d * E8 * 1.6, 0.9); add(s, tt, 0.42 * intensity, bus=M)
        if d == 2: add(baglama(m + octave, E8 * 1.2, 0.6), tt + E8, 0.28 * intensity, bus=M)   # tremolo stroke
        tt += d * E8
    # drone on downbeat (D + A)
    add(baglama(D - 12, BAR * 1.1, 0.8), t0, 0.30 * intensity, bus=M)
    add(baglama(A - 12, BAR * 0.9, 0.5), t0 + 4 * E8, 0.18 * intensity, bus=M)
    if perc:
        for pos, k, v in [(0, 'D', 1), (2, 'T', 0.8), (3, 'K', 0.6), (4, 'D', 0.8), (6, 'T', 0.9), (7, 'K', 0.5), (8, 'T', 0.7)]:
            darbuka(k, t0 + pos * E8, v * intensity)
        for pos in (0, 2, 4, 6): tef(t0 + pos * E8, intensity)

def build_music():
    # intro 0–3.5: drone + ney call (hook)
    add(baglama(D - 12, 3.6, 0.8), 0.0, 0.32, bus=M)
    ney([(A, 0.9), (Bb, 0.35), (A, 0.5), (G, 0.45), (Fs, 1.2)], 0.15)
    darbuka('D', 0.0, 1.2); darbuka('D', 1.1, 0.9)
    t = 3.5; b = 0
    while t < 58.5 - 1e-6:
        if 17.5 <= t < 20.45:           # freeze-frame: groove drops out
            t += BAR; continue
        inten = 1.0 if t > 20.4 else 0.85
        bar_groove(t, inten, perc=True, riff=b, octave=12 if (t > 45.5 and b % 2) else 0)
        b += 1; t += BAR
    # ney phrases riding over the groove
    ney([(A, 1.0), (G, 0.5), (Fs, 0.5), (G, 1.4)], 4.2)
    ney([(D + 12, 1.2), (C + 12 - 12 + 12, 0.5), (Bb, 0.5), (A, 1.6)], 12.3)
    ney([(A, 0.8), (Bb, 0.4), (A, 0.6), (G, 0.6), (Fs, 0.6)], 17.6)     # alone during the freeze
    ney([(D + 12, 0.7), (Eb + 12, 0.4), (D + 12, 0.6), (C + 12, 0.6), (Bb, 0.6), (A, 1.2)], 20.5)
    ney([(Fs, 0.9), (G, 0.5), (A, 1.3)], 36.6)
    ney([(A, 0.6), (Bb, 0.6), (C + 12, 0.6), (D + 12, 1.6)], 51.0)
    ney([(D + 12, 0.8), (C + 12, 0.4), (Bb, 0.4), (A, 0.8), (G, 0.6), (Fs, 0.6), (D, 1.3)], 54.6)
    # final cadence + drone that matches the opening (seamless loop)
    add(baglama(D, 1.2, 1.0), 58.5, 0.5, bus=M); add(baglama(D - 12, 1.0, 0.9), 58.5, 0.4, bus=M)

# ------------------------------------------------------------------ SFX
def engine(vfun, t0, t1, xfun=None, gain=1.0, seed=0, rpm=1.0, muffle=900):
    n = int((t1 - t0) * SR); tt = t0 + np.arange(n) / SR
    v = np.vectorize(vfun)(tt) if callable(vfun) else np.full(n, float(vfun))
    f0 = (30 + 9.0 * v) * rpm
    ph = 2 * np.pi * np.cumsum(f0) / SR
    s = sum(np.sin(k * ph + k * 0.7) / k ** 0.9 for k in range(1, 10))
    r2 = np.random.default_rng(seed)
    s = s + lp(r2.normal(0, 1, n), 900) * (0.6 + 0.4 * np.sin(ph)) * 1.5
    s = lp(s, muffle) * 0.22 + bp(r2.normal(0, 1, n), 300, 1600) * np.clip(v / 3, 0, 1.4) * 0.3
    if xfun is not None:
        x = np.vectorize(xfun)(tt); d = (x - 540) / 540; pan = np.clip(d * 0.85, -1, 1); g_ = 1 / (1 + (d * 0.9) ** 2)
    else: pan, g_ = 0.0, 1.0
    add(s * g_ * env(n, 0.12, 0.25), t0, gain, pan)
def goat_bleat(t0, gain=1.0, pan=0.0, dur=0.85):
    n = int(dur * SR); x = np.arange(n) / SR
    f = 430 * (1 + 0.08 * np.sin(2 * np.pi * 21 * x)) * (1 + 0.06 * np.sin(np.pi * x / dur))   # bleat tremolo
    ph = 2 * np.pi * np.cumsum(f) / SR
    src = sum(np.sin(k * ph) / k for k in range(1, 14))
    s = bp(src, 500, 1300) * 1.2 + bp(src, 2000, 3200) * 0.6
    s *= (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 10.5 * x))) * env(n, 0.04, 0.3)
    add(s, t0, 0.32 * gain, pan)
def horn(t0, n_beeps=2, gain=1.0, pan=0.0):
    for k in range(n_beeps):
        n = int(0.26 * SR); x = np.arange(n) / SR
        s = np.sign(np.sin(2 * np.pi * 415 * x)) * 0.5 + np.sign(np.sin(2 * np.pi * 523 * x)) * 0.5
        add(lp(s, 2500) * env(n, 0.01, 0.05), t0 + k * 0.34, 0.12 * gain, pan)
def clunk(t0, gain=1.0):
    n = int(0.25 * SR); x = np.arange(n) / SR
    s = lp(rng.normal(0, 1, n), 500) * np.exp(-x * 30) + np.sin(2 * np.pi * 85 * x) * np.exp(-x * 25) * 0.6
    add(s, t0, 0.5 * gain)
def click(t0, gain=1.0, f=3200, pan=0.0):
    n = int(0.03 * SR); x = np.arange(n) / SR
    add(bp(rng.normal(0, 1, n), f * 0.6, f * 1.4) * np.exp(-x * 220), t0, 0.35 * gain, pan)
def whoosh(t0, d=0.45, g=0.5):
    n = int(d * SR); x = np.arange(n) / SR
    add(bp(rng.normal(0, 1, n), 500, 5000) * np.sin(np.pi * x / d) ** 2, t0, g)
def noise_bed(t0, t1, lo, hi, gain, mod=0.0):
    n = int((t1 - t0) * SR); x = np.arange(n) / SR
    s = bp(rng.normal(0, 1, n), lo, hi) * (1 + mod * np.sin(2 * np.pi * 0.3 * x)) * env(n, 0.3, 0.3)
    add(s, t0, gain)

def build_sfx():
    # K1 mountain road, goat on roof
    engine(2.6, 0.0, 3.55, None, 0.9, 1)
    goat_bleat(0.40, 1.0, 0.1)
    noise_bed(0, 3.5, 200, 1200, 0.05)                    # mountain wind
    # K2 factory: machine hum, clanks, welding buzz; yard birds
    n = int(3.3 * SR); x = np.arange(n) / SR
    add((np.sin(2 * np.pi * 100 * x) * 0.3 + bp(rng.normal(0, 1, n), 80, 400)) * env(n, 0.2, 0.2), 3.5, 0.12)
    weld = bp(rng.normal(0, 1, n), 1500, 6000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 7 * x))) * env(n, 0.1, 0.2)
    add(weld, 3.5, 0.05, 0.15)
    for tc in [3.9, 4.8, 5.6, 6.3]: clunk(tc, 0.6)
    for tb in [7.3, 8.4, 9.6]:
        n = int(0.22 * SR); x = np.arange(n) / SR
        add(np.sin(2 * np.pi * (3300 + 800 * np.sin(2 * np.pi * 15 * x)) * x) * np.exp(-x * 10), tb, 0.04, 0.5)
    # K3 photo drop
    whoosh(10.45, 0.3, 0.4); clunk(10.9, 0.4)
    # K4 crossing + TOROS stamp
    engine(2.3, 12.0, 17.5, lambda t: -470 + 2.3 * 175 * (t - 12.0), 1.0, 4)
    n = int(0.6 * SR); x = np.arange(n) / SR
    add(np.sin(2 * np.pi * (70 * np.exp(-x * 6) + 35) * x) * np.exp(-x * 5), 14.3, 0.6)
    # K5 freeze: tape-stop + whoosh
    whoosh(17.45, 0.5, 0.5)
    # K6 village dirt road
    engine(3.3, 20.5, 23.7, lambda t: -520 + 3.3 * 190 * (t - 20.5), 1.0, 6)
    noise_bed(20.5, 23.7, 300, 2500, 0.05)                # gravel
    # K7 bayram road, horn
    engine(3.15, 23.7, 26.9, None, 0.7, 7, muffle=700); horn(24.4, 2, 1.0)
    # K8 mud: squelches
    engine(2.9, 26.9, 30.1, None, 0.9, 8)
    for i in range(10):
        tq = 27.0 + i * 0.31 + rng.uniform(0, 0.08); n = int(0.18 * SR); x = np.arange(n) / SR
        add(lp(rng.normal(0, 1, n), 420) * np.exp(-x * 18) * (1 + np.sin(2 * np.pi * (60 + 200 * np.exp(-x * 20)) * x)), tq, 0.35)
    # K9 snow: wind + chain jingle synced to wheel rotation (10 cross links per turn)
    engine(2.4, 30.1, 33.3, None, 0.8, 9, muffle=650)
    noise_bed(30.1, 33.3, 600, 3000, 0.06, 0.6)
    rate = 2.4 / 0.3013 / (2 * np.pi) * 10
    tc = 30.15
    while tc < 33.25: click(tc, 0.5, 4200, -0.2); click(tc + 0.01, 0.35, 5200, 0.2); tc += 1 / rate
    # K10 climb: gear shift + strained engine + goat
    engine(lambda t: 2.2, 33.3, 36.5, None, 1.0, 10, rpm=1.35)
    clunk(33.55, 0.9)
    goat_bleat(34.35, 1.1, -0.6)
    # K11 heavy steering: muffled engine + creaks
    engine(2.6, 36.5, 39.5, None, 0.5, 11, muffle=400)
    for tc in [36.9, 37.8, 38.7]:
        n = int(0.35 * SR); x = np.arange(n) / SR
        add(bp(np.sign(np.sin(2 * np.pi * 180 * x * (1 + 0.3 * x))), 300, 1500) * np.exp(-x * 6) * 0.4, tc, 0.18)
    # K12 window crank ratchet (one click per 1/8 turn, matches the animation)
    def turns(lt): return smooth((lt - 0.25) / 2.3) * 3
    prev = 0
    for k in range(1, 3000):
        lt = k / 1000
        cur = int(turns(lt) * 8)
        if cur > prev: click(39.5 + lt, 0.8, 2600, 0.3); prev = cur
    noise_bed(41.0, 42.5, 400, 3000, 0.07)                 # wind once the window is open
    # K13 wrench clinks + engine start
    for k in range(6):
        tc = 43.7 + k * (2 * np.pi / 9)
        if tc < 44.8:
            n = int(0.3 * SR); x = np.arange(n) / SR
            add((np.sin(2 * np.pi * 2600 * x) + 0.6 * np.sin(2 * np.pi * 3900 * x)) * np.exp(-x * 25), tc, 0.12, 0.1)
    n = int(0.55 * SR); x = np.arange(n) / SR
    add(lp(rng.normal(0, 1, n), 600) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 11 * x))) * 0.6, 44.9 - 0.55, 0.4)   # starter
    engine(0.2, 44.9, 45.6, None, 0.9, 13)
    # K14 Galata: seagulls + ferry horn + taxi pass
    engine(3.4, 45.5, 48.5, lambda t: -500 + 3.4 * 185 * (t - 45.5), 1.0, 14)
    n = int(1.4 * SR); x = np.arange(n) / SR
    add(lp(np.sin(2 * np.pi * 110 * x) + 0.5 * np.sin(2 * np.pi * 220 * x), 800) * env(n, 0.15, 0.4), 45.8, 0.15, 0.4)
    for tg in [46.3, 47.2, 47.9]:
        n = int(0.4 * SR); x = np.arange(n) / SR
        add(np.sin(2 * np.pi * (1500 - 600 * x) * x) * np.exp(-x * 5) * (1 + 0.5 * np.sin(2 * np.pi * 30 * x)), tg, 0.05, -0.4)
    # K15 police siren
    engine(3.2, 48.5, 51.0, None, 0.8, 15)
    n = int(2.5 * SR); x = np.arange(n) / SR
    f = np.where((x * 1.4) % 1 < 0.5, 960, 770)
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.35 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.65
    add(lp(s, 3500) * env(n, 0.1, 0.3), 48.5, 0.11)
    # K16 traffic bed + horns
    for i in range(4): engine(3.1, 51.0, 54.5, None, 0.35, 160 + i)
    horn(51.9, 1, 0.8, -0.5); horn(53.1, 2, 0.7, 0.5)
    # K17 picnic birds
    for tb in [55.0, 56.1, 57.4]:
        n = int(0.22 * SR); x = np.arange(n) / SR
        add(np.sin(2 * np.pi * (3300 + 800 * np.sin(2 * np.pi * 15 * x)) * x) * np.exp(-x * 10), tb, 0.04, -0.5)
    # loop transition (into the opening: same road wind + engine)
    whoosh(58.45, 0.6, 0.4)
    engine(2.6, 58.7, 59.2, None, 0.9 * 0.6, 1)
    # scene-cut whooshes
    for tc in [3.5, 12.0, 20.5, 23.7, 26.9, 30.1, 33.3, 36.5, 39.5, 42.5, 45.5, 48.5, 51.0, 54.5]: whoosh(tc - 0.18, 0.36, 0.3)

def write(path, l, r):
    m = max(np.abs(l).max(), np.abs(r).max())
    l = np.tanh(l / m * 1.3) * 0.92; r = np.tanh(r / m * 1.3) * 0.92
    data = (np.stack([l, r], 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())

if __name__ == '__main__':
    build_music(); build_sfx()
    # widen music a little (Haas) and mix under the sfx
    d = int(0.012 * SR); Ml = M; Mr = np.concatenate([np.zeros(d), M[:-d]])
    write(sys.argv[1], L + Ml * 0.9, R + Mr * 0.9)
    print('ok')
