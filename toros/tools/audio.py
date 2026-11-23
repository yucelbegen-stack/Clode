"""Procedural soundtrack for the 59 s Toros short: music bed, engines that follow each car (stereo pan),
tyre roll, siren, stamps/whooshes, and (optional) Turkish narration via espeak-ng + MBROLA tr1."""
import numpy as np, subprocess, wave, os, sys
SR = 48000; DUR = 59.0; N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)
t_all = np.arange(N) / SR

def add(sig, t0, gain=1.0, pan=0.0):
    i0 = int(t0 * SR); n = min(len(sig), N - i0)
    if n <= 0: return
    if np.ndim(pan) == 0: pl, pr = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    else: p = pan[:n]; pl, pr = np.cos((p + 1) * np.pi / 4), np.sin((p + 1) * np.pi / 4)
    L[i0:i0 + n] += sig[:n] * gain * pl; R[i0:i0 + n] += sig[:n] * gain * pr

def lp(x, fc):  # one-pole low-pass
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); acc = 0.0
    # vectorised via lfilter-like recursion using cumulative trick is unstable; small loop in chunks
    from scipy.signal import lfilter
    return lfilter([1 - a], [1, -a], x)
from scipy.signal import lfilter, butter, sosfilt
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], btype='band', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, btype='high', fs=SR, output='sos'), x)
def env(n, a=0.005, r=0.2):
    e = np.ones(n); na = max(1, int(a * SR)); nr = min(n, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[n - nr:] *= np.linspace(1, 0, nr) ** 2; return e

# ------------------------------------------------------------ music (100 BPM, Am F C G, plucked)
BPM = 100; beat = 60 / BPM
def pluck(f, dur, bright=0.5):
    n = int(dur * SR); p = max(2, int(SR / f)); buf = rng.uniform(-1, 1, p) * bright + rng.uniform(-1, 1, p) * (1 - bright) * 0.3
    out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out * env(n, 0.002, 0.08)
def midi(m): return 440 * 2 ** ((m - 69) / 12)
CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
mus = np.zeros(N)
cache = {}
def pl(m, dur, br=0.5):
    k = (m, round(dur, 3), br)
    if k not in cache: cache[k] = pluck(midi(m), dur, br)
    return cache[k]
music_start, music_end = 4.0, 57.3
t = music_start; bar = 0
while t < music_end:
    ch = CH[bar % 4]
    for b8 in range(8):   # eighth-note arpeggio
        tt = t + b8 * beat / 2
        if tt >= music_end: break
        m = ch[[0, 1, 2, 1, 0, 2, 1, 2][b8]] + 12
        s = pl(m, 0.6, 0.6); i0 = int(tt * SR); n = min(len(s), N - i0); mus[i0:i0 + n] += s[:n] * 0.28
    # bass
    for b in (0, 2):
        tt = t + b * beat; i0 = int(tt * SR); n = int(beat * 1.8 * SR); n = min(n, N - i0)
        if n <= 0: continue
        f = midi(ch[0] - 24); x = np.arange(n) / SR
        s = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(4 * np.pi * f * x)) * env(n, 0.01, 0.3)
        mus[i0:i0 + n] += s * 0.22
    # melody (simple nostalgic motif)
    mel = [[69, 72, 71, 69], [65, 69, 67, 65], [64, 67, 72, 71], [67, 71, 74, 72]][bar % 4]
    if bar % 2 == 1 or bar > 6:
        for k, m in enumerate(mel):
            tt = t + k * beat
            s = pl(m + 12, beat * 1.1, 0.8); i0 = int(tt * SR); n = min(len(s), N - i0)
            if n > 0: mus[i0:i0 + n] += s[:n] * 0.16
    # drums: kick on 1 & 3, clap on 2 & 4, shaker 8ths
    for b in range(4):
        tt = t + b * beat; i0 = int(tt * SR)
        if b in (0, 2):
            n = int(0.25 * SR); x = np.arange(n) / SR; f = 110 * np.exp(-x * 30) + 45
            s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 14); n = min(n, N - i0); mus[i0:i0 + n] += s[:n] * 0.45
        else:
            n = int(0.18 * SR); s = bp(rng.normal(0, 1, n), 900, 3000) * np.exp(-np.arange(n) / SR * 25); n = min(n, N - i0); mus[i0:i0 + n] += s[:n] * 0.22
        for h in (0, 0.5):
            i1 = int((tt + h * beat) * SR); n = int(0.05 * SR); s = hp(rng.normal(0, 1, n), 6000) * np.exp(-np.arange(n) / SR * 80); n = min(n, N - i1)
            if n > 0: mus[i1:i1 + n] += s[:n] * 0.07
    t += 4 * beat; bar += 1
# fades
mus *= np.clip((t_all - music_start) / 0.4, 0, 1) * np.clip((music_end - t_all) / 0.8, 0, 1)
MUS = mus

# hook: dark drone + hits
drone = (np.sin(2 * np.pi * 55 * t_all) + 0.5 * np.sin(2 * np.pi * 82.4 * t_all) + 0.3 * np.sin(2 * np.pi * 110.3 * t_all)) * np.clip(t_all / 0.3, 0, 1) * np.clip((4.1 - t_all) / 0.3, 0, 1)
drone += lp(rng.normal(0, 1, N), 400) * 2.5 * np.clip((4.0 - t_all) / 0.3, 0, 1) * (t_all < 4.2)
add(drone * 0.10, 0)
def boom(gain=1.0):
    n = int(1.6 * SR); x = np.arange(n) / SR
    f = 70 * np.exp(-x * 6) + 32
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 3.5) + lp(rng.normal(0, 1, n), 1500) * np.exp(-x * 18) * 0.6
    return s * gain
for h, gnn in [(0.05, 0.8), (2.55, 0.7), (2.95, 0.9), (3.95, 1.0)]: add(boom(gnn), h)
def riser(d):
    n = int(d * SR); x = np.arange(n) / SR
    return hp(rng.normal(0, 1, n), 2000) * (x / d) ** 2 * 0.5
add(riser(1.0), 2.95, 0.5)

# ------------------------------------------------------------ engines
def engine(v_of_t, t0, t1, x_of_t=None, gain=1.0, seed=0):
    """v_of_t: speed m/s; x_of_t: screen x (px) for pan/distance; returns nothing (mixed)."""
    n = int((t1 - t0) * SR); tt = t0 + np.arange(n) / SR
    v = np.vectorize(v_of_t)(tt) if callable(v_of_t) else np.full(n, v_of_t)
    f0 = 30 + 9.0 * v  # firing frequency of a 4-cyl at low revs
    ph = 2 * np.pi * np.cumsum(f0) / SR
    s = np.zeros(n)
    for k in range(1, 10): s += np.sin(k * ph + k * 0.7) / k ** 0.9
    r2 = np.random.default_rng(seed)
    s += lp(r2.normal(0, 1, n), 900) * (0.6 + 0.4 * np.sin(ph)) * 1.5
    s = lp(s, 700)
    roll = bp(r2.normal(0, 1, n), 300, 1600) * np.clip(v / 3, 0, 1.4) * 0.9   # tyre roll on asphalt
    s = s * 0.22 + roll * 0.35
    if x_of_t is not None:
        x = np.vectorize(x_of_t)(tt); d = (x - 540) / 540
        pan = np.clip(d * 0.85, -1, 1); g_ = 1 / (1 + (d * 0.9) ** 2)
    else:
        pan = 0.0; g_ = 1
    s = s * g_ * env(n, 0.15, 0.3)
    add(s * gain, t0, 1.0, pan)

# S2 car rolls out (accel to 3.2 m/s)
smooth = lambda k: np.clip(k, 0, 1) ** 2 * (3 - 2 * np.clip(k, 0, 1))
def pos2(lt):  # numeric integral of 3.2*smooth(t/1.4)
    ts = np.linspace(0, lt, 200); return -2.7 + np.trapezoid(3.2 * smooth(ts / 1.4), ts) if lt > 0 else -2.7
engine(lambda t: 3.2 * smooth((t - 5) / 1.4), 5.0, 11.0, lambda t: 300 + pos2(t - 5) * 200, 1.0, 1)
# S3 passes
engine(3.3, 11.0, 14.6, lambda t: -560 + 3.3 * 205 * (t - 11.0), 1.0, 2)
engine(3.2, 14.4, 18.5, lambda t: -560 + 3.2 * 205 * (t - 14.6), 1.0, 3)
# S4 parade
for i in range(5):
    ts = 18.5 + i * 1.82
    engine(3.25, max(18.5, ts - 0.4), min(28.5, ts + 3.6), lambda t, ts=ts: -520 + 3.25 * 190 * (t - ts), 0.9, 10 + i)
# S5 taxi tracked (centre) + police overtaking with siren
engine(3.0, 28.5, 35.0, None, 0.9, 20)
engine(lambda t: 3.0 + 1.4 * smooth((t - 28.5) / 1.2), 28.5, 35.0, lambda t: 540 + (-7.5 + 1.0 * (t - 28.5) * 1.3 - (-0.6)) * 160, 0.7, 21)
n = int(5.8 * SR); x = np.arange(n) / SR
f = np.where((x * 1.4) % 1 < 0.5, 960, 770)  # two-tone siren
sir = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.35 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.65
sir = lp(sir, 3500) * env(n, 0.3, 0.6)
add(sir * 0.12, 29.2, 1.0, np.linspace(-0.7, 0.5, n))
# S6 close-up: engine follows the slow-down / speed-up
def v6(lt):
    if lt < 1.2: return 3.0
    if lt < 2.6: return 3.0 + (0.9 - 3.0) * smooth((lt - 1.2) / 1.4)
    if lt < 6.4: return 0.9
    return 0.9 + (3.3 - 0.9) * smooth((lt - 6.4) / 1.8)
engine(lambda t: v6(t - 35.0), 35.0, 44.0, None, 1.1, 30)
# S7 drive into the sunset
engine(2.6, 44.0, 49.6, lambda t: -480 + 2.6 * 195 * (t - 44.0), 0.9, 40)
# S8 arrivals (decelerating)
for i in range(7):
    ta = 51.35 + i * 0.16
    def vv(t, ta=ta):
        k = np.clip((t - ta) / 1.6, 0, 1); return 7 * 2.4 * (1 - k) ** 1.4 / 1.6 if k < 1 else 0
    engine(vv, ta, ta + 1.9, lambda t, ta=ta: 650 - 7 * 118 * (1 - (1 - np.clip((t - ta) / 1.6, 0, 1)) ** 2.4), 0.35, 50 + i)

# ------------------------------------------------------------ sfx
def whoosh(d=0.45, g=0.5):
    n = int(d * SR); x = np.arange(n) / SR
    s = bp(rng.normal(0, 1, n), 500, 5000) * np.sin(np.pi * x / d) ** 2
    return s * g
for ta in [5.0, 11.0, 18.5, 28.5, 35.0, 44.0, 51.0]: add(whoosh(), ta - 0.2, 0.6)
def pop(f=900, g=0.35):
    n = int(0.12 * SR); x = np.arange(n) / SR
    return np.sin(2 * np.pi * (f + 600 * np.exp(-x * 40)) * x) * np.exp(-x * 30) * g
def stamp(g=0.9):
    n = int(0.5 * SR); x = np.arange(n) / SR
    return (lp(rng.normal(0, 1, n), 600) * np.exp(-x * 22) * 1.2 + np.sin(2 * np.pi * 60 * x) * np.exp(-x * 12)) * g
add(stamp(), 16.35, 0.8)
for tp in [5.1, 11.15, 14.75, 18.65, 28.85, 29.95, 37.7, 38.6, 51.05]: add(pop(), tp, 0.6)
for i in range(7): add(pop(700 + i * 60, 0.3), 51.35 + i * 0.16 + 1.2, 0.7)   # number badges
# mission-passed jingle
for k, m in enumerate([72, 76, 79, 84]):
    s = pl(m, 1.2, 0.9); add(s * 0.35, 57.4 + k * 0.09)
add(boom(0.5), 57.4)
# birds in the village scenes
for tb in [12.0, 13.4, 19.6, 22.3, 36.2, 40.1]:
    n = int(0.25 * SR); x = np.arange(n) / SR
    s = np.sin(2 * np.pi * (3200 + 900 * np.sin(2 * np.pi * 14 * x)) * x) * np.exp(-x * 9) * 0.05
    add(s, tb, 1.0, 0.6 if tb % 2 > 1 else -0.6)

FX_L, FX_R = L.copy(), R.copy()

# ------------------------------------------------------------ narration (optional)
VO = [
    (0.15, 2.45, 'Bu araba yirmi dokuz yıl boyunca her sokaktaydı.'),
    (2.6, 3.9, 'Sonra bir gün... yok oldu.'),
    (5.4, 10.8, 'Bin dokuz yüz yetmiş bir. Bursada ilk Reno on iki banttan indi.'),
    (11.3, 14.7, 'Sedanı aileyi taşıdı.'),
    (14.8, 18.3, 'Steyşını ise yükü. Bin dokuz yüz seksen dokuzda adı kondu: Toros.'),
    (18.8, 23.4, 'Beyazı, kırmızısı, yeşili, mavisi, siyahı.'),
    (23.5, 28.3, 'Her mahallede mutlaka bir tane vardı.'),
    (28.8, 34.8, 'Taksi durağında da oydu, polis ekibinde de.'),
    (35.3, 39.5, 'Sırrı tekerleklerdeydi: önden çekişliydi.'),
    (39.6, 43.8, 'Kar, çamur, köy yolu. Durmak bilmedi.'),
    (44.3, 47.5, 'İki binde son Toros banttan indi.'),
    (47.6, 50.8, 'Ama yollardan hâlâ silinmedi.'),
    (51.3, 54.8, 'Peki sizin evde hangisi vardı?'),
    (55.0, 57.3, 'Numarasını yorumlara yaz!'),
]
def tts(text, tmp, speed=155):
    subprocess.run(['espeak-ng', '-v', 'mb-tr1', '-s', str(int(speed)), '-p', '42', '-w', tmp, text.replace('’', '')], check=True, capture_output=True)
    w = wave.open(tmp); sr = w.getframerate(); d = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768; w.close()
    # resample to SR
    x_old = np.arange(len(d)) / sr; x_new = np.arange(int(len(d) * SR / sr)) / SR
    return np.interp(x_new, x_old, d)
def stretch(sig, factor):  # simple overlap-add time-stretch (factor<1 = faster)
    if abs(factor - 1) < 0.02: return sig
    fr = int(0.04 * SR); hop_out = fr // 2; hop_in = int(hop_out / factor)
    win = np.hanning(fr); out = np.zeros(int(len(sig) * factor) + fr); pos_in = 0; pos_out = 0
    while pos_in + fr < len(sig):
        out[pos_out:pos_out + fr] += sig[pos_in:pos_in + fr] * win
        pos_in += hop_in; pos_out += hop_out
    return out[:int(len(sig) * factor)]
def build_vo(tmpdir):
    vo = np.zeros(N)
    for a, b, text in VO:
        s = tts(text, os.path.join(tmpdir, 'vo.wav'))
        room = b - a
        if len(s) / SR > room:   # speak faster natively instead of time-stretching
            s = tts(text, os.path.join(tmpdir, 'vo.wav'), min(300, 155 * (len(s) / SR) / room * 1.04))
        if len(s) / SR > room: s = stretch(s, room / (len(s) / SR))
        s = hp(s, 90)
        # warm radio-doc EQ + light compression
        s = np.tanh(s * 2.2) / np.tanh(2.2)
        i0 = int(a * SR); n = min(len(s), N - i0); vo[i0:i0 + n] += s[:n] * 0.9
    return vo

def write(path, l, r):
    m = max(np.abs(l).max(), np.abs(r).max())
    l = np.tanh(l / m * 1.4) * 0.92; r = np.tanh(r / m * 1.4) * 0.92
    data = (np.stack([l, r], 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data.tobytes())

if __name__ == '__main__':
    out = sys.argv[1]; tmpdir = sys.argv[2]
    # version A: music + fx
    write(os.path.join(out, 'mix_music.wav'), FX_L + MUS * 0.55, FX_R + MUS * 0.55)
    vo = build_vo(tmpdir)
    # side-chain duck the music under the voice
    e = lp(np.abs(vo), 8); duck = 1 - 0.6 * np.clip(e / (e.max() * 0.25), 0, 1)
    write(os.path.join(out, 'mix_vo.wav'), FX_L * 0.8 + MUS * 0.55 * duck + vo * 0.9, FX_R * 0.8 + MUS * 0.55 * duck + vo * 0.9)
    print('ok')
