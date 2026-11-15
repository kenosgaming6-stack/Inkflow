# StallBook 8.0: colour, cash and wow

Build everything below in this order. Commit and push after each part, so finished parts reach the user even if the build stops early. Do not ask questions; the decisions are made here.

## Who this is for

StallBook is a credit book for an onion business in Kumasi, Ghana. The owner and his mom buy onions in Abidjan, give bags to market women on credit, take money later, and also sell for cash. Users read simple English slowly, know people by face, and know money by the colour of the notes. They use it on iPhones in bright sun. The owner's words: *"it's lacking simplicity, it's lacking colour, it's lacking the wow factor. Not dumb colourful, but more. Easy enough, not too easy."*

## The code

- The whole app is one file: `public/index.html` (vanilla JS, about 2,700 lines). Version: `APP_VERSION` in that file, `VERSION` in `public/sw.js`.
- Useful helpers already there: `sheet()`, `closeSheet()`, `render()`, `VIEWS.*`, the big `act()` switch (`data-act` buttons), `push`/`pop`/`toRoot`, `openNum()`, `keypad(mode, ok)`, `editNum`/`exprNum`, `kindImg(it, cls)`, `svg(name, size)` with the `IC` icon map, `sfx()`, `buzz()`, `say()`, `toast()`, `money()`, `bagsTxt()`, `bagsNum()`, `carStats()`, `ledger()`, `status()`, `givingCar()`.
- Colour system: `html[data-mode]` is `buy`, `give`, `collect` or `book`, and each sets `--bar`, `--paper`, `--key`, `--ink`, `--line` and `--rule`. Place colours come from `PAL`/`pc()`/`pdot()`, women from `avc()`, kinds from `kindCol()`. `.mi` is a coloured icon tile (see `carMenu`).
- Cash today: entries `{type: 'cash', carId, itemId, bags, price, amount, loc}`. The `cash` action asks the kind and then `cashitem` saves one bag at once. The Give list shows all cash as one small summary line (`cashline`, `data-act="cashfix"`). The cash button is a square on the left of the Give dock (`.sq.cash`).
- Settings: `VIEWS.settings` (plain `.set` rows, the `seg()` helper, On/Off chips). First open: `VIEWS.setup`.
- Pay pad notes: `NOTES` and `.note` buttons in `paySheet`. `openPay(pid, {loadId})` already pays one load first.
- Builds: `python3 tools/build-single.py download/index.html` makes the one file the user uploads to Cloudflare.
- Tests: `tests/*.js` (Playwright, Chromium), run all with `tests/run.sh` (it serves `public/` on 8768 and the one-file build on 8767). Test photos are in `tests/testphotos/`. Tests use `reducedMotion: 'reduce'` except `motion.js`.

## Rules (never break these)

1. Plain, short English. Two-word buttons. Numbers big. Pictures and colour before words.
2. No Undo button, ever. Mistakes are fixed by tapping the line and changing or removing it. Ledger entries are append-only (follow how gives and cash are removed today).
3. Panels (sheets) stay white, so they stand out on every tab's paper.
4. Everything is sized in `rem` (scaled by `--s` in `fit()`). Check iPhone 12 (390×844) and a small phone (320×568): nothing goes sideways, no text is cut.
5. Animations are short (under 0.6s), use transform and opacity only, never block a tap, and turn off with Reduce Motion.
6. Old books must still open (`normalize()`). New settings get defaults in `blank()`.
7. Keep every existing `data-act` name and input id unless you also update the tests that use them. All tests must pass at the end.
8. Do not invent the real colours of Ghana cedi notes (see Part 4).

## Part 1: Cash is as important as credit

1. **Cash button on the right.** In the Give dock the name box goes left and the cash button goes right. Make it a big green button (cash icon plus the word **Cash**), as tall as the name box. If Settings › Hand is left, mirror it.
2. **A cash panel instead of the instant one-bag sale.** Tapping Cash opens a green panel titled **Cash sale**:
   - One kind: − 1 + with the number big.
   - Several kinds: the photo tiles from the give sheet (tap to add, − on a tile, tap the number to type it).
   - The total shows big in green, and the button says **Sold · ₵1,300**. It opens with 1 bag already set, so a one-bag sale is still two taps.
   - Save one cash entry per kind (with `bags` > 1 allowed) and give the kinds sold together a shared `grp`, like gives. Before saving, check every place that reads cash entries (`carStats`, the report, closing a load, `cashfix`, totals) and make sure each works with `bags` > 1.
3. **Every cash sale is its own big line** in the Give list, in time order among the women's lines, as large as hers:
   - A green ₵ mark in the margin and the word **Cash** in green where her name would be.
   - The time underneath, the kind photo with its count (the `.kc` chips), and the amount in green.
   - Remove the old small `cashline` summary. Tapping a cash line opens a panel to change the count or **Remove this sale**.
4. **The load card shows cash:** a green "6 cash" in the legend and a green part in the progress bar.
5. **Totals count cash.**
   - On Take money, "In today" becomes payments plus today's cash sales, with a small green line under it: "₵2,000 cash sales".
   - On Book, "This week" counts cash sales too.
6. **Sound and voice:** a coin sound. With Speak on: "Cash, 2 bags. 1,300 cedis."
7. **Test:** add `tests/cash.js`. It covers the button on the right, the panel with one and with several kinds, the lines (one per sale, big, green), changing and removing a sale, the card legend, the totals and a small phone.

## Part 2: Settings with its own vibe

Settings is plain rows today and feels raw. Make it look like a finished product.

1. **Grouped white cards on tinted paper,** each with a heading and a coloured icon tile (`.mi`):
   - **Your business** (bag, blue): what you sell, counted in, price, your name on receipts, MoMo number.
   - **Places** (pin): each place as a chip with its own colour dot.
   - **Buying trips** (basket, clay `#B4541A`).
   - **Counting** (tally, amber): count the car every …
   - **Receipts** (message, green): SMS by themselves, SMS or WhatsApp, Arkesel fields.
   - **Sound and voice** (violet `#6D28D9`): sounds, speak out loud, hand that holds the phone, big text (Part 5).
   - **Keep your book safe** (cloud, ink): backup and restore, with a status in colour: green "Saved 2 days ago" or red "Never saved".
   - Anything destructive goes last, in red.
2. **Real switches** instead of On/Off chips: a pill with a knob that slides, filled with the section's colour when on. Keep the same `data-act` names and keep `aria-pressed`.
3. At most one short helper line per card. No paragraphs.
4. **Test:** extend `tests/vibes.js` or add `tests/settings.js`: the cards, the colours, switches that toggle, and that existing settings still work.

## Part 3: First open (onboarding) with vibes

1. Rebuild `VIEWS.setup` as a short, beautiful flow with progress dots, each step tinted by the world it sets up:
   1. **Welcome:** a notebook-and-onion illustration (inline SVG, gently moving), "StallBook", one line ("Bags, money, people. In one book."), **Start**, and **See an example first** (the demo).
   2. **What do you sell?** "Onions" and "bags" already chosen as big chips, with a text field to change them.
   3. **What do you do?** Three big picture cards, pick any:
      - **I buy** (clay; turns on Buy bags).
      - **I give on credit** (blue).
      - **I sell for cash** (green).
   4. **Where do you sell?** First place, can skip.
2. Steps slide in and the illustration bobs. Reduce Motion means no movement.
3. Read the current setup code and `tests/book.js` first. Keep the ids the tests use, or update the tests.

## Part 4: One colour language and wow moments

1. **One colour per job, everywhere:**
   - Buy is clay `#B4541A`.
   - Give is blue `#1D3FBB`.
   - Money in (payments and cash) is green `#12804A`.
   - Book is ink `#14161C`.
   - Counting is amber (`--held`).
   - Pay dates are violet `#6D28D9`.
   - Debt is red.
   - Every list of actions (her line's panel, her page buttons, the pay panel extras, the load report, Book) uses `.mi` icon tiles in these colours, like the card menu already does.
2. **A big ✓ on every save.** A circle with a check that draws itself pops in the middle of the screen for about 0.6s, in the colour of the job:
   - Blue for a give.
   - Green for cash.
   - Clay for a buy.
   - Amber for a count.
   - It shows the key fact under it ("Ama · 3 bags", "Cash · ₵1,300") and comes with a buzz and the existing sound.
   - It never blocks taps (`pointer-events: none`).
   - Skip it for payments, because the proof screen already celebrates.
   - With Reduce Motion it shows as a toast instead.
3. **The pay pad notes look like paper money.**
   - Banknote style: rounded rectangle, inner border, a faint ₵ watermark, a light gradient.
   - Each denomination gets a different tint from a `NOTE_TINT` map at the top of the script, with the comment: *"placeholder tints: replace with the real cedi note colours from the user's photos"*.
   - Tapped notes stack as small note chips in the display (up to 8 visible, then "+3").
4. **Motion:**
   - Switching tabs fades the paper colour (about 250ms).
   - The tab icon gives a small bounce when chosen.
   - On first open of a list, the first 8 rows rise in one after another (30ms apart).

## Part 5: Readable in the sun, simpler at a glance

1. Anything a user must read is at least 15px at `--s` 1: subs, tags, legends. Darken the muted grey (around `#4A5060`) and make lines and rules one step stronger.
2. Swap small word labels for icon plus number where the meaning is obvious:
   - given → bag 15
   - kept → clock 5
   - loaded → truck 60
   - since 11:15 → clock 11:15
   - cash → ₵ 6
3. Add a **Big text** switch (in Sound and voice): multiply `--s` by 1.15 in `fit()`, saved in settings.
4. Run `tests/screens.js` and check 320×568 by eye. Fix any overflow.

## Part 6: Take money by load

1. Under the Take money card, add a row of chips: **All**, then one chip per load that still has money out, newest first, for example "Wankai · 12 Nov · ₵6,500".
2. **Choosing a load:**
   - The list shows only the women who owe on that load, with what they owe on it.
   - The card total follows the filter.
   - A payment opened from there pays that load first (`openPay(pid, {ctx: 'collect', loadId})`).
3. The place chips still work together with the load filter. The default is **All**, so one-load users see no change.
4. **Test:** add `tests/by-load.js`.

## Part 7: End of day cash count

1. Add an **End of day** button on the Take money card. It opens a screen that says **You should have ₵X**, where X is today's cash payments (not MoMo) plus today's cash sales.
2. She counts with the same note buttons and keypad.
3. **The result:**
   - "All there ✓" in green.
   - "Short ₵200" in red.
   - "₵50 extra" in amber.
4. Save it as a new entry `{type: 'till', date, expected, counted}`. Check that the new type is ignored everywhere it should be (ledgers, lists, sync, backup).
5. Under the button, show the last count: "Yesterday: all there".
6. **Test:** add `tests/end-of-day.js`.

## Part 8: The finger that teaches

1. The first time on each spot, an animated hand (inline SVG) taps the right place with a 2 to 4 word bubble:
   - Give: "Type her name".
   - Give sheet: "Tap the photo".
   - Give dock: "Tap for cash".
   - Take money: "Tap her name".
   - Pay pad: "Tap the notes".
   - Buy bags: "Tap Bought".
2. Each hint shows once, remembered in localStorage `stallbook_hints`, and goes away on any tap.
3. **Show me how** in Settings brings them back.
4. The overlay never blocks taps (`pointer-events: none`), so the existing tests keep working.
5. With Reduce Motion the hand doesn't move.

## Part 9 (only if all of the above is done): her face

1. Tap her circle on her page to add a photo, using the same small-photo code as the bags (`readPhoto`, `phPut`, included in backups). Her photo then replaces the letters everywhere.
2. A ring around her face fills green as she pays off the load, and turns red when she is late.
3. It is never required. Letters stay the default.

## Finish

1. Version 8.0 (`APP_VERSION` and `sw.js` `VERSION`). Update `README.md` (How it works, The look, the tests table).
2. `tests/run.sh` must show every test passed, including one-file.
3. Rebuild `download/index.html`.
4. Commit with the session's attribution lines and push to `claude/new-session-j3q0ao`.
5. Make one PNG with Give, Cash sale, Take money, Settings and the first-open screen side by side (iPhone 12, scale 2), and look at it yourself before sending.
6. Send the user `download/index.html` and the PNG with `SendUserFile`.
7. Tell the user what changed in short, simple English (it is read on a phone), and what to look for when they test with their mom.
