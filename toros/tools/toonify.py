"""Photo -> flat illustrated look (to sit with the cartoon cars): edge-preserving smoothing,
colour quantisation, soft ink lines, warm print tone. Output 1080x1920."""
import cv2, numpy as np, sys
def toon(src, dst, k=28, ink=0.55, size=(1080, 1920)):
    img = cv2.imread(src); img = cv2.resize(img, size, interpolation=cv2.INTER_LANCZOS4)
    sm = img.copy()
    for _ in range(3): sm = cv2.bilateralFilter(sm, 9, 40, 9)
    sm = cv2.edgePreservingFilter(sm, flags=1, sigma_s=50, sigma_r=0.35)
    Z = sm.reshape(-1, 3).astype(np.float32)
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 12, 1.0)
    sample = Z[np.random.default_rng(0).choice(len(Z), 60000, replace=False)]
    _, _, centers = cv2.kmeans(sample, k, None, crit, 2, cv2.KMEANS_PP_CENTERS)
    d = ((Z[:, None, :] - centers[None]) ** 2).sum(-1); q = centers[d.argmin(1)].reshape(sm.shape)
    q = cv2.addWeighted(q.astype(np.float32), 0.75, sm.astype(np.float32), 0.25, 0)       # keep a little gradient
    g = cv2.cvtColor(cv2.medianBlur(img, 7), cv2.COLOR_BGR2GRAY)
    edges = cv2.adaptiveThreshold(g, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 11, 6)
    edges = cv2.GaussianBlur(edges, (3, 3), 0).astype(np.float32) / 255
    out = q * (1 - ink * (1 - edges[..., None])) + np.array([36, 46, 58], np.float32) * (ink * (1 - edges[..., None]))
    out = np.clip(out * np.array([0.96, 1.0, 1.04]) + 4, 0, 255)                          # warm print (BGR)
    cv2.imwrite(dst, out.astype(np.uint8))
if __name__ == '__main__':
    for s, d in zip(sys.argv[1::2], sys.argv[2::2]): toon(s, d); print('ok', d)
