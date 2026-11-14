# Inkflow · StallBook

StallBook is a credit book for a delivery business. A vehicle brings bags (onions, for example) to market women. Some pay cash, some take bags on credit and pay later, some ask you to keep bags for them. StallBook keeps track of the bags, the people, where to find them, and what they owe.

The app is the `public/` folder: one page (`index.html`) plus its icons, font and offline file. It works without internet, and the book stays on the phone.

## How it works

Three tabs at the bottom: **Give bags**, **Take money** and **Book**, and a fourth, **Buy bags**, for those who buy the goods themselves. Give bags and Take money never send you to another page; everything opens in a panel over the list. The words are plain English on purpose: short, two-word buttons, and pictures and numbers wherever they can stand in for a sentence.

- **Buy bags** (only if you buy the goods yourself: Settings › Buying trips; off at first): the first tab, on warm clay paper.
  - **Start buying** asks where you are buying (Abidjan…). Each time you buy, tap **Bought**: the photo of that kind (or a new photo for a new kind), how many, and what you paid for one. Each buy is a line; tap a line to change or remove it.
  - The card shows bags bought, money spent, each kind with its photo, and, if you put in the money you came with, what is left.
  - **Done buying** (card menu ⌄) puts the trip **On the way**. When the car arrives, **Car is here** (on Buy bags, or on Give bags when no load is open) turns the trip into a new load with the kinds, photos and counts filled in: you only type the selling price of each kind (it shows what you paid), and the load cost starts with what you paid for the goods (add the driver with +).
- **Give bags**: the open load. A card with the bags left, given and kept, then one tab per place (Koko Shell, Market…) and **+** to add a place. Each tab lists only that place, top to bottom in the order you gave. Swipe left or right to move between places; the list follows your finger.
  - **Starting a load:** **New load** asks one thing at a time: where it is from, a photo of each kind of bag, how many, the price, then what the load cost.
  - **Recording someone:** type two letters or tap a face. Set the number of bags with − and + (tap the number to type it). With several kinds, tap the photo of each kind she takes; she gets one line with each kind's photo and count side by side (more kinds wrap inside the line). Tap a photo on her line to change that kind's count, or her name to pick which kind to open. Switch on **Keep for her** to keep bags for her: she owes nothing until they're handed over. A new name only asks for a phone number, and that is optional. She goes into the tab you are on.
  - **Cash sales:** the cash button counts a bag sold for cash, with no name.
  - **Correcting a line:** tap the number in her row to change it. Tap her name to hand over kept bags, release them, pick the right customer or change the place.
- **Counting the car:** tap the big number on the card ("40 left") any time. It shows what the book says, you set what is really in the car with − and + (tap the number to type it), and save.
  - Same number: one tap. More than the book: the book is fixed. Fewer than the book: the missing bags show in the list as an amber line, **Who took these?**, in the place you are at. Tap it and pick who took them, or **Nobody. They are lost**. Naming turns them into a normal give, so the book stays right.
  - A later count that finds bags again gives them back to those no-name lines first.
  - Every 10 minutes (or 5, or 15, or never: Settings › Count the car, every) the number glows amber and plays a soft sound until you count. It only asks while the Give bags screen is open and something was done in the last 3 hours.
  - A load can't be closed while bags still have no name: name them or write them off as lost.
- **Counter** (card menu ⌄ › Counter): a full screen that counts by taps, for when the boys carry bags. Choose **Give out** or **Count car**, the kind of bag (by photo), and how many each tap is (1, 2 or 3). Tap anywhere for each trip: the number grows and dots fill in rows of ten, each trip in its own shade. **−** takes off the last trip (hold it to start again). The lock hides everything but the tapping, so you can hand the phone over; hold to unlock. **Hold to finish**: Give out asks *Who took 7 bags?* and opens the give with that number; Count car fills in the car count. The count is kept if the app closes.
- **Take money**: who owes, most urgent first, filtered by place. Tags say **Pay by 26 Nov**, **Pay today**, **2 days late**, **Pays Friday** (a pay date she gave) or **Missed pay date**.
  - **Taking a payment:** tap a name and the money pad opens. Tap the cedi notes as she counts. **Done** turns the phone to her: the lines she cleared are struck through, a part-paid line gets **− 200** written on it, what is left is circled, and a PAID stamp lands. **Next ›** goes to the next woman at that spot. **Not today** saves a pay date.
  - **Overpayment:** if she pays more than she owes, you choose: keep it as credit, or record that you gave change.
- **Book**: everyone, by place, and every load.
  - **Her page:** where she sells now (tap to change it) and what she owes, then one list of everything she took and paid. Each line keeps the load and the place it happened at.

Nothing is ever overwritten. Corrections, handovers, releases and moves are new lines. There is no Undo button: to fix a mistake, tap the line and change it, or remove it (it stays in her book, crossed out). A cash sale entered by mistake is taken off by tapping the cash line.

**Closing a load:** you can only close once no bags are kept for anyone. Then choose what happened to what's left: for the next load, sent back, spoiled or lost, sold for cash, or the count was wrong.

**Speak out loud** (Settings, off at first): the phone says each give ("Ama, 3 bags. 35 left."), each cash sale and each payment ("Ama paid 1,000 cedis. 2,300 cedis left."), and "Count the bags." when it is time to count. It uses the phone's own voice and works offline.

## The look

- **Colour has one job each.** Blue is the pen (what you write), red is debt and the notebook margin, green is money in, amber is waiting and counting (kept bags, no-name bags, the Counter), violet is a pay date she gave.
- **Find things by colour, not by reading.** Each place keeps its own colour everywhere: a stripe on its tab, a dot before its name in every list, its chip. Each woman has her own avatar colour, taken from her name, so it is the same on every screen. A kind of bag with no photo takes the colour in its name ("Red net" is red, "Yellow sack" yellow), or a colour of its own. Late, missed and refused are solid red. The card menu shows each action with a coloured icon: counting amber, price green, costs red, report blue.
- **The band at the top says the job:** blue for Give bags (with the page number, like a receipt book), green for Take money, black for Book. The phone's status bar takes the same colour.
- **Each job has its own world, felt before it is read:** Give bags is on blue paper, Take money on green paper with green ink and green keys, Book on cream ledger paper with dark ink. Panels stay white so they stand out. On Give bags, the place you are at tints the top of its page and its tab, so each place feels like its own page.
- **Numbers are painted big** in Barlow Condensed (SIL Open Font License, `public/fonts/OFL-barlow.txt`). Words stay in Atkinson Hyperlegible.
- **Places are index tabs** standing on the page.
- **Every number pad is a calculator**, laid out like the iPhone's: 7 8 9 × / 4 5 6 − / 1 2 3 + / 00 0 ⌫ and the action key. What you type shows small on top ("5 + 6 + 7 + 8") and the total shows big underneath; times goes before plus and minus. Tap ⌫ to take one off, hold it to clear. On the money pad the cedi notes add themselves to the sum.
- **Things move like paper:** big numbers roll to their new value, a new line writes itself in from left to right, a panel follows your finger when you pull it down by its top edge (let go early and it springs back), a new load comes in as a page turning, and report totals count up over a double rule. Turn on Reduce Motion on the phone and all of it stops.

## Every screen size

The app fills the whole screen at any size: small phones, iPhones, tablets, computers, and both ways round. Everything is sized in `rem`, and one number (`--s`, set by `fit()` in `public/index.html`) scales all of it: 1 on an iPhone 12, a little less on small phones (down to 0.8), and more on tablets and computers (up to 1.35, so the text is bigger and more rows fit). Wide screens show one centred column the full height of the screen. When the keyboard opens on a phone, the app stays the same size and the bottom bar sits above the keyboard.

## Put it online with Cloudflare (free)

The repo is set up as a Cloudflare **Worker with static assets**: `wrangler.toml` points at `public/`, and there is no build step.

### Connected to GitHub (updates itself)

In Cloudflare, under **Workers & Pages**, the Worker **stallbook** is connected to this repo. Its build settings:

| Setting | Value |
|---|---|
| Build command | none |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Production branch | the branch that has the app: `main` after the pull request is merged, or `claude/new-session-j3q0ao` |

Every push to the production branch puts the new version online. The address is shown on the Worker's page, for example `https://stallbook.<your-name>.workers.dev`.

### From a computer with Node.js

```sh
npx wrangler login
npx wrangler deploy
```

`public/_headers` sets caching (the page and offline file are always rechecked, fonts are cached for a year) and basic security headers.

## Install on an iPhone

1. Open the Worker's address in **Safari**.
2. Tap **Share**, then **Add to Home Screen**, then **Add**.
3. Open StallBook from the new icon.

It opens full screen, works with no data, and keeps the bottom bar above the keyboard. Always use the icon: the iPhone keeps the Home Screen app's book separate from Safari's.

## Download the app

The `download/` folder always holds the latest ready-made files:

- `download/index.html` is the whole app in one file. Upload it to any static host.
- `download/look.html` is the new look sample: four screens to look at and tap. It is not the app and saves nothing.

On GitHub, open the file and press the download arrow at the top right of the file. After changing the app, rebuild the file with `python3 tools/build-single.py download/index.html`.

## One file to upload anywhere

`python3 tools/build-single.py stallbook.html` makes one file with the font and icons inside. Upload it to any static host. It has no offline file, so it needs internet to open; the book itself is kept on the phone.

`python3 tools/build-artifact.py stallbook-app.html` makes the Claude artifact version, which also saves the book in the owner's Claude account.

## Releasing an update

Change `VERSION` in `public/sw.js` and `APP_VERSION` in `public/index.html`, then push. Phones download the new version in the background and show **New version of StallBook ready · Reload**.

## Receipts by SMS

StallBook can send every receipt by itself, through [Arkesel](https://sms.arkesel.com), an SMS company in Ghana. An iPhone app or website cannot send text messages on its own; Apple asks for a tap on Send each time, so the messages come from Arkesel instead.

1. Open an Arkesel account, buy SMS credit, and ask for a sender name (up to 11 letters, for example StallBook). Arkesel approves it.
2. Copy your SMS API key from the Arkesel dashboard.
3. In StallBook, open **Settings › Receipts by SMS**. Switch it on, paste the key and type the sender name. **Send a test** sends one to your MoMo number.

After that, a customer with a phone number gets a receipt about 20 seconds after you give to her (kept bags: when they are handed over) and after each payment. Without signal, receipts wait and go out when it comes back. Only lines saved after the switch is turned on are sent. The key stays on the phone: it is not in the book or in backup files, so a new phone needs it typed in again.

## Tests

`tests/run.sh` runs every test in a real browser (headless Chromium) against the `public/` folder, then runs the main one again against the one-file build. It needs python3, Node.js, and Playwright installed globally (`npm install -g playwright && npx playwright install chromium`). Each test prints PASS or FAIL per check; pictures go to `tests/out/` (not saved in git).

| Test | What it checks |
|---|---|
| `buy.js` | Buy bags: a buying trip from the first buy to Car is here |
| `book.js` | A whole day: setup, a load, giving, keeping for her, payments with the proof screen, places, closing a load, backup |
| `sms.js` | Receipts that send themselves |
| `count-check.js` | Counting the car, no-name bags, the reminder |
| `keypad.js` | The calculator pads |
| `photos.js` | Photos of each kind of bag, giving by photo, backup and restore of photos |
| `upgrade.js` | Books from older versions open and keep everything |
| `motion.js` | Rolling numbers, ink, pull to close, swipe, page turn (with motion on) |
| `voice.js` | Speak out loud |
| `counter.js` | The Counter |
| `one-line.js` | Several kinds given together make one line |
| `colors.js` | Place, woman and kind colours, tags, the card menu |
| `vibes.js` | Each tab's own paper and ink; places tint their page |
| `screens.js` | Keyboard, turning the phone, and many screen sizes |

## Your data

Everything is saved on the phone, in the browser's storage. The app asks the phone to keep it, but still use **Back up (WhatsApp or Files)** often. If the phone is lost, open the backup file with **Restore from a backup**.

Older books are upgraded automatically when the app opens, and a version 1 copy is left untouched. Places are one list of names: a town and spot such as Bakwai and Market become the place Bakwai Market. Half bags are off until you switch them on in Settings.

The font is Atkinson Hyperlegible by the Braille Institute, included under the SIL Open Font License (`public/fonts/OFL.txt`).
