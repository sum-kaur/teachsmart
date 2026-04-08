import { randomBytes } from "crypto";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

type ShareRecord = {
  payload: unknown;
  createdAt: number;
};

const SHARE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const shareStore = new Map<string, ShareRecord>();
const SHARE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SHARE_ID_LENGTH = 5;

function createShareId() {
  const bytes = randomBytes(SHARE_ID_LENGTH);
  let id = "";
  for (const byte of bytes) {
    id += SHARE_ALPHABET[byte % SHARE_ALPHABET.length];
  }
  return id;
}

function pruneExpiredShares() {
  const now = Date.now();
  for (const [id, record] of shareStore.entries()) {
    if (now - record.createdAt > SHARE_TTL_MS) {
      shareStore.delete(id);
    }
  }
}

router.post("/share", (req, res) => {
  const payload = (req.body as Record<string, unknown> | undefined)?.payload;
  if (!payload) {
    res.status(400).json({ error: "payload is required" });
    return;
  }

  pruneExpiredShares();

  let id = createShareId();
  while (shareStore.has(id)) {
    id = createShareId();
  }

  shareStore.set(id, { payload, createdAt: Date.now() });
  res.json({ id });
});

router.get("/share/:id", (req, res) => {
  pruneExpiredShares();

  const record = shareStore.get(req.params.id);
  if (!record) {
    res.status(404).json({ error: "share not found" });
    return;
  }

  res.json({ payload: record.payload });
});

export default router;
