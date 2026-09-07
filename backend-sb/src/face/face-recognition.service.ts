import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import { join } from 'path';

export interface DetectedFace {
  score: number;
  box: [number, number, number, number];
  kps: number[][];
}

export interface FaceResult {
  embedding: number[];
  score: number;
  box: [number, number, number, number];
}

/** Titik acuan ArcFace pada citra 112x112 untuk penyelarasan wajah. */
const ARCFACE_DST: number[][] = [
  [38.2946, 51.6963],
  [73.5318, 51.5014],
  [56.0252, 71.7366],
  [41.5493, 92.3655],
  [70.7299, 92.2041],
];

const DET_SIZE = 640;
const DET_STRIDES = [8, 16, 32];
const DET_NUM_ANCHORS = 2;
const EMBED_SIZE = 112;

@Injectable()
export class FaceRecognitionService implements OnModuleInit {
  private readonly logger = new Logger(FaceRecognitionService.name);

  private detector: ort.InferenceSession;
  private embedder: ort.InferenceSession;
  private ready = false;

  /** Dimensi embedding yang dihasilkan model (harus sama dengan kolom vector di DB). */
  static readonly EMBEDDING_DIM = 512;

  async onModuleInit(): Promise<void> {
    const dir = join(process.cwd(), 'models');
    const t0 = Date.now();
    try {
      [this.detector, this.embedder] = await Promise.all([
        ort.InferenceSession.create(join(dir, 'det_500m.onnx')),
        ort.InferenceSession.create(join(dir, 'w600k_mbf.onnx')),
      ]);
      this.ready = true;
      this.logger.log(
        `Model AI wajah siap (SCRFD + MobileFaceNet ${FaceRecognitionService.EMBEDDING_DIM}-dim) dalam ${Date.now() - t0}ms`,
      );
    } catch (err) {
      this.logger.error(
        `Gagal memuat model AI wajah dari ${dir}. Pastikan det_500m.onnx & w600k_mbf.onnx tersedia.`,
        err as Error,
      );
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  /** Ubah string base64 (dengan atau tanpa prefix data URI) menjadi Buffer gambar. */
  decodeBase64Image(base64: string): Buffer {
    const clean = base64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '').trim();
    const buf = Buffer.from(clean, 'base64');
    if (buf.length < 100) {
      throw new Error('Data gambar tidak valid atau kosong.');
    }
    return buf;
  }

  /**
   * Pipeline lengkap: decode gambar -> deteksi wajah -> align -> embedding 512-dim.
   * Mengembalikan null jika tidak ada wajah terdeteksi.
   */
  async extractEmbedding(image: Buffer): Promise<FaceResult | null> {
    if (!this.ready) {
      throw new Error('Model AI wajah belum siap dimuat di server.');
    }

    const { rgb, width, height } = await this.decodeToRgb(image);
    const faces = await this.detect(image, rgb, width, height);
    if (faces.length === 0) return null;

    // Ambil wajah terbesar (paling dekat ke kamera)
    const face = faces.reduce((a, b) => (this.area(a.box) >= this.area(b.box) ? a : b));
    const aligned = this.alignFace(rgb, width, height, face.kps);
    const embedding = await this.embed(aligned);

    return { embedding, score: face.score, box: face.box };
  }

  /** Cosine similarity untuk dua vektor yang sudah ter-L2-normalisasi. */
  cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return dot;
  }

  // ─── Tahap 1: decode gambar ke raw RGB ────────────────────────────────────

  private async decodeToRgb(
    image: Buffer,
    maxSide = 1280,
  ): Promise<{ rgb: Buffer; width: number; height: number }> {
    const oriented = await sharp(image).rotate().removeAlpha().toBuffer();
    const meta = await sharp(oriented).metadata();

    let width = meta.width ?? 0;
    let height = meta.height ?? 0;
    if (!width || !height) throw new Error('Gambar tidak valid atau rusak.');

    const longest = Math.max(width, height);
    if (longest > maxSide) {
      const s = maxSide / longest;
      width = Math.round(width * s);
      height = Math.round(height * s);
    }

    const rgb = await sharp(oriented)
      .resize(width, height, { fit: 'fill' })
      .raw()
      .toBuffer();

    return { rgb, width, height };
  }

  // ─── Tahap 2: deteksi wajah (SCRFD) ───────────────────────────────────────

  private async detect(
    original: Buffer,
    rgb: Buffer,
    width: number,
    height: number,
    threshold = 0.5,
  ): Promise<DetectedFace[]> {
    // Letterbox: skala gambar agar muat di 640x640, sisanya diisi hitam.
    const imRatio = height / width;
    let newW: number;
    let newH: number;
    if (imRatio > 1) {
      newH = DET_SIZE;
      newW = Math.floor(newH / imRatio);
    } else {
      newW = DET_SIZE;
      newH = Math.floor(newW * imRatio);
    }
    const detScale = newH / height;

    const padded = await sharp(rgb, { raw: { width, height, channels: 3 } })
      .resize(newW, newH, { fit: 'fill' })
      .extend({
        top: 0,
        left: 0,
        bottom: DET_SIZE - newH,
        right: DET_SIZE - newW,
        background: { r: 0, g: 0, b: 0 },
      })
      .raw()
      .toBuffer();

    const plane = DET_SIZE * DET_SIZE;
    const input = new Float32Array(3 * plane);
    for (let i = 0; i < plane; i++) {
      input[i] = (padded[i * 3] - 127.5) / 128.0;
      input[plane + i] = (padded[i * 3 + 1] - 127.5) / 128.0;
      input[2 * plane + i] = (padded[i * 3 + 2] - 127.5) / 128.0;
    }

    const feeds: Record<string, ort.Tensor> = {
      [this.detector.inputNames[0]]: new ort.Tensor('float32', input, [
        1,
        3,
        DET_SIZE,
        DET_SIZE,
      ]),
    };
    const out = await this.detector.run(feeds);
    const names = this.detector.outputNames;

    const candidates: DetectedFace[] = [];
    for (let s = 0; s < DET_STRIDES.length; s++) {
      const stride = DET_STRIDES[s];
      const scores = out[names[s]].data as Float32Array;
      const bboxes = out[names[s + 3]].data as Float32Array;
      const kpss = out[names[s + 6]].data as Float32Array;

      const fw = DET_SIZE / stride;
      const fh = DET_SIZE / stride;

      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) {
          for (let a = 0; a < DET_NUM_ANCHORS; a++) {
            const i = (y * fw + x) * DET_NUM_ANCHORS + a;
            const score = scores[i];
            if (score < threshold) continue;

            const cx = x * stride;
            const cy = y * stride;

            const box: [number, number, number, number] = [
              (cx - bboxes[i * 4] * stride) / detScale,
              (cy - bboxes[i * 4 + 1] * stride) / detScale,
              (cx + bboxes[i * 4 + 2] * stride) / detScale,
              (cy + bboxes[i * 4 + 3] * stride) / detScale,
            ];

            const kps: number[][] = [];
            for (let j = 0; j < 5; j++) {
              kps.push([
                (cx + kpss[i * 10 + j * 2] * stride) / detScale,
                (cy + kpss[i * 10 + j * 2 + 1] * stride) / detScale,
              ]);
            }

            candidates.push({ score, box, kps });
          }
        }
      }
    }

    return this.nms(candidates, 0.4);
  }

  private area(b: [number, number, number, number]): number {
    return Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
  }

  private nms(faces: DetectedFace[], iouThreshold: number): DetectedFace[] {
    const sorted = [...faces].sort((a, b) => b.score - a.score);
    const keep: DetectedFace[] = [];

    for (const cand of sorted) {
      let overlap = false;
      for (const kept of keep) {
        const x1 = Math.max(cand.box[0], kept.box[0]);
        const y1 = Math.max(cand.box[1], kept.box[1]);
        const x2 = Math.min(cand.box[2], kept.box[2]);
        const y2 = Math.min(cand.box[3], kept.box[3]);
        const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
        const iou = inter / (this.area(cand.box) + this.area(kept.box) - inter);
        if (iou > iouThreshold) {
          overlap = true;
          break;
        }
      }
      if (!overlap) keep.push(cand);
    }
    return keep;
  }

  // ─── Tahap 3: penyelarasan wajah (similarity transform 5 titik) ───────────

  private alignFace(
    rgb: Buffer,
    width: number,
    height: number,
    kps: number[][],
  ): Float32Array {
    // Least-square similarity transform: [X] = [a -b][x] + [tx]
    //                                    [Y]   [b  a][y]   [ty]
    const n = kps.length;
    let mx = 0;
    let my = 0;
    let MX = 0;
    let MY = 0;
    for (let i = 0; i < n; i++) {
      mx += kps[i][0];
      my += kps[i][1];
      MX += ARCFACE_DST[i][0];
      MY += ARCFACE_DST[i][1];
    }
    mx /= n;
    my /= n;
    MX /= n;
    MY /= n;

    let sxy = 0;
    let scross = 0;
    let norm = 0;
    for (let i = 0; i < n; i++) {
      const u = kps[i][0] - mx;
      const v = kps[i][1] - my;
      const U = ARCFACE_DST[i][0] - MX;
      const V = ARCFACE_DST[i][1] - MY;
      sxy += u * U + v * V;
      scross += u * V - v * U;
      norm += u * u + v * v;
    }
    const a = sxy / norm;
    const b = scross / norm;
    const tx = MX - (a * mx - b * my);
    const ty = MY - (b * mx + a * my);

    // Invers transform untuk memetakan piksel tujuan -> sumber
    const det = a * a + b * b;
    const out = new Float32Array(3 * EMBED_SIZE * EMBED_SIZE);
    const plane = EMBED_SIZE * EMBED_SIZE;

    for (let Y = 0; Y < EMBED_SIZE; Y++) {
      for (let X = 0; X < EMBED_SIZE; X++) {
        const dx = X - tx;
        const dy = Y - ty;
        const sxSrc = (a * dx + b * dy) / det;
        const sySrc = (-b * dx + a * dy) / det;

        const [r, g, bl] = this.bilinear(rgb, width, height, sxSrc, sySrc);
        const idx = Y * EMBED_SIZE + X;
        out[idx] = (r - 127.5) / 127.5;
        out[plane + idx] = (g - 127.5) / 127.5;
        out[2 * plane + idx] = (bl - 127.5) / 127.5;
      }
    }
    return out;
  }

  private bilinear(
    rgb: Buffer,
    width: number,
    height: number,
    x: number,
    y: number,
  ): [number, number, number] {
    if (x < 0 || y < 0 || x > width - 1 || y > height - 1) return [0, 0, 0];

    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);
    const fx = x - x0;
    const fy = y - y0;

    const at = (px: number, py: number, c: number) => rgb[(py * width + px) * 3 + c];

    const res: [number, number, number] = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      const top = at(x0, y0, c) * (1 - fx) + at(x1, y0, c) * fx;
      const bottom = at(x0, y1, c) * (1 - fx) + at(x1, y1, c) * fx;
      res[c] = top * (1 - fy) + bottom * fy;
    }
    return res;
  }

  // ─── Tahap 4: embedding (MobileFaceNet) ───────────────────────────────────

  private async embed(aligned: Float32Array): Promise<number[]> {
    const feeds: Record<string, ort.Tensor> = {
      [this.embedder.inputNames[0]]: new ort.Tensor('float32', aligned, [
        1,
        3,
        EMBED_SIZE,
        EMBED_SIZE,
      ]),
    };
    const out = await this.embedder.run(feeds);
    const raw = out[this.embedder.outputNames[0]].data as Float32Array;

    // L2 normalisasi supaya cosine distance pgvector konsisten
    let sum = 0;
    for (let i = 0; i < raw.length; i++) sum += raw[i] * raw[i];
    const inv = sum > 0 ? 1 / Math.sqrt(sum) : 1;

    return Array.from(raw, (v) => v * inv);
  }
}
