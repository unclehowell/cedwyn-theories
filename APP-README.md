# Theories

The family's open working theories about Great House Farm / Tŷ Mawr, Llandough. Every entry is a working theory, not checked,
and shows the records it rests on, what cuts against it, and the record that would test it. Served at `/theories/`
(dedicated repository; registered in cedwyn `themes.json` with no N-of-59 slot, cedwyn#594; all 59 slots are taken).

## Data
- `tools/theories.src.json`: the theories in neutral wording (title, summary, status, date added, evidence IDs for, what cuts
  against, what would test it, internal links).
- `tools/theories_sync.py`: reads the central catalogue (`data/core/records/*.json` on main, or `--ref` / `--core`), resolves
  each evidence ID (title, date, holder when the catalogue carries it; otherwise the register that holds it: evidence
  catalogue, missing-records register, Legal Wiki, That Old Chestnut), runs the word gate, and writes `data/theories.json`
  (only the fields shown) plus the server-rendered cards in `index.html` between the THEORIES markers.

```
python3 tools/theories_sync.py                         # main only
python3 tools/theories_sync.py --ref main --ref <branch>   # overlay an unmerged catalogue branch
```
First run: 3 Nov 2026, ref `main`: 6 theories, 21 evidence IDs, 5 resolved in the central catalogue.

Schedule (7 Nov 2026): `.github/workflows/sync-central.yml` runs the sync every 6 hours (cron `50 */6 * * *`) and on demand,
read-only against the central catalogue, and commits `data/theories.json` only when a theory or a resolved record changed.
While the page edit freeze is on it leaves the server-rendered cards in `index.html` alone (`RENDER_HTML: 'no'`). See #5.

## Hallmarks
- Standard header and burger (`ghf-boot.js`), day/night theme from the header toggle (`html[data-ghf-mode]`), the Garden banner
  (loaded by `ghf-boot.js`, the one site-wide promotion), no N-of-59 slot yet (all 59 are taken; the owner decides whether Theories replaces one).
- Header ‹ › step to slots 47 and 49 in the one nav chain (`/areas.json` "nav"); with no slot 49 built, › wraps to slot 1.
- Version v0.1.0, changelog table in the ⓘ modal and `CHANGELOG.md`, release tag `theories-v0.1.0`. No paid version, so no
  version gate (version standard §1).
- Agent guest book: the page's own table in the footer (`<details id="theories-gb">`, closed by default) plus the site build's
  shared footer.
- WebMCP tools `theories_list` and `theories_get` (read-only).

## Editorial
A theory is a question, not a finding. Neutral, dated wording; "not checked"; no named people accused; internal links only;
the sync's word gate runs on every output. A theory changes status only when a record answers it, and keeps its history.
