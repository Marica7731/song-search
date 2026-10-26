# Lightweight song lookup

The updater generates a compact, deterministic title lookup index from **all**
`data/index.json.files` every run. It reads the complete generated song files
inside GitHub Actions, so downstream assistants do not download multi-megabyte
source files.

## Files

- `data/song-lookup/manifest.json`: source-file count, source hash and shard list
- `data/song-lookup/0.json` through `f.json`: compact records
  `[normalized_title, [normalized_artist, ...]]`.

A queried title is Unicode NFKC-normalized, lowercased, and stripped of
common presentation punctuation before hashing. The first hexadecimal
character of its SHA-256 selects a shard. This is a **conservative lookup
aid**, not semantic matching: alternate titles, translations, typos,
remixes and credits can still cause false negatives. If the title matches,
treat it as already cut even if the artist differs. Manual checking is
needed for unclear identities.

## Run

```bash
node scripts/song-lookup-index.js build
node --test scripts/song-lookup-index.test.js
node scripts/song-lookup-index.js check candidates.json
```

The input is a JSON array:
```json
[
  {"title":"シャルル","artist":"バルーン"},
  {"title":"糸は解けて","artist":"天音彩"}
]
```

`unseen_title` means **not present in the indexed song-search list**, not
guaranteed never performed, nor guaranteed absent from external Bilibili
uploads. Read `manifest.json` to confirm `sourceSha256` and freshness
against the current published `data/*.js` before reporting verified counts.

The existing `.github/workflows/update.yml` regenerates all shards **after**
source updates, and commits the shards with the source data in the same
transaction. Failed/missing input files cause the generator to fail rather
than silently producing a partial index.
