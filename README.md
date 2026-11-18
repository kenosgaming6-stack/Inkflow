# Inkflow · StallBook

StallBook is a credit book for a delivery business. A vehicle brings bags (onions, for example) to market women. Some pay cash, some take bags on credit and pay later, some ask you to keep bags for them. StallBook keeps track of the bags, the people, where to find them, and what they owe.

The app is the `public/` folder: one page (`index.html`) plus its icons, font and offline file. It works without internet, and the book stays on the phone.

## How it works

Three tabs at the bottom: **Give bags**, **Take money** and **Book** (the Simple app adds **Today** first), and a fourth, **Buy bags**, for those who buy the goods themselves. Give bags and Take money never send you to another page; everything opens in a panel over the list. The words are plain English on purpose: short, two-word buttons, and pictures and numbers wherever they can stand in for a sentence.

- **Buy bags** (only if you buy the goods yourself: Settings › Buying trips; off at first): the first tab, on warm clay paper.
  - **Start buying** asks where you are buying (Abidjan…). Each time you buy, tap **Bought**: the photo of that kind (or a new photo for a new kind), how many, and what you paid for one. Each buy is a line; tap a line to change or remove it.
  - The card shows bags bought, money spent, each kind with its photo, and, if you put in the money you came with, what is left.
  - **Done buying** (card menu ⌄) puts the trip **On the way**. When the car arrives, **Car is here** (on Buy bags, or on Give bags when no load is open) turns the trip into a new load with the kinds, photos and counts filled in: you only type the selling price of each kind (it shows what you paid), and the load cost starts with what you paid for the goods (add the driver with +).
- **Give bags**: the open load. A card with the bags left, given and kept, then one tab per place (Koko Shell, Market…) and **+** to add a place. Each tab lists only that place, top to bottom in the order you gave. Swipe left or right to move between places; the list follows your finger.
  - **Starting a load:** **New load** asks one thing at a time: where it is from (not in the Simple app), the bag, how many, the price, then what the load cost (Skip is one tap). For the bag, take a photo, or press **No photo** and pick its **colour** (Red, Yellow, Brown or Other, the colours onion bags really come in): each kind is then a drawn net sack of onions in that colour (tied top, mesh, onions showing through), so two kinds never look alike. The same sack is big on the empty Give screen. Buying has the same colour pick.
  - **Recording someone:** type two letters or tap her name. Under the list are big name buttons for the regulars who have not taken from this load yet: the women of the place you are at first, then whoever comes most often. Tap one and her usual number of bags is already set; one more tap gives. Set the number of bags with − and + (tap the number to type it). With one kind of bag that has a photo (or a colour you picked), the bag is a big tile, the same as when there are several kinds: tap the bag itself to add one, the number sits on the bag (tap it to type a number), **−** is on the tile, and the price and how many are left are under it. The cash sale panel does the same. With several kinds, tap the photo of each kind she takes; she gets one line with each kind's photo and count side by side (more kinds wrap inside the line). Tap a photo on her line to change that kind's count, or her name to pick which kind to open. Switch on **Keep for her** (in the Simple app it is under **More**) to keep bags for her: she owes nothing until they're handed over. A new name only asks for a phone number, and that is optional. She goes into the tab you are on.
  - **Cash sales:** the big green **Cash** button (right of the name box) opens a green panel: − 1 + for one kind, or tap the photos for several kinds, then **Sold · ₵1,300**. Every cash sale is its own big green CASH line among the women's lines; tap it to change it or remove it. The load card counts cash in green, and Take money's **In today** and Book's **This week** include cash sales.
  - **Correcting a line:** tap the number in her row to change it. Tap her name to hand over kept bags, release them, pick the right customer or change the place.
- **Counting the car:** tap the big number on the card ("40 left") any time. It shows what the book says, you set what is really in the car with − and + (tap the number to type it), and save.
  - Same number: one tap. More than the book: the book is fixed. Fewer than the book: the missing bags show in the list as an amber line, **Who took these?**, in the place you are at. Tap it and pick who took them, or **Nobody. They are lost**. Naming turns them into a normal give, so the book stays right.
  - A later count that finds bags again gives them back to those no-name lines first.
  - Every 10 minutes (or 5, or 15, or never: Settings › Count the car, every) the number glows amber and plays a soft sound until you count. It only asks while the Give bags screen is open and something was done in the last 3 hours.
  - A load can't be closed while bags still have no name: name them or write them off as lost.
- **Counter** (card menu ⌄ › Counter): a full screen that counts by taps, for when the boys carry bags. Choose **Give out** or **Count car**, the kind of bag (by photo), and how many each tap is (1, 2 or 3). Tap anywhere for each trip: the number grows and dots fill in rows of ten, each trip in its own shade. **−** takes off the last trip (hold it to start again). The lock hides everything but the tapping, so you can hand the phone over; hold to unlock. **Hold to finish**: Give out asks *Who took 7 bags?* and opens the give with that number; Count car fills in the car count. The count is kept if the app closes.
- **Take money**: who owes, most urgent first, filtered by place. It always opens on the load you are working on, never on everybody: the open load even when nobody owes on it yet (it says "Nobody owes on Abidjan yet"), or else the newest load with money out. **All** and the other loads are one tap, and next time it snaps back to the current load. Today and the round follow the same rule. Loads have page numbers (No 1, No 2…) so two loads from the same place are told apart. The list shows only the women who owe on that load, with what they owe on it; a line underneath says how many more women owe on other loads (**See all**). A payment from there pays that load first. **Remind** and **End of day** sit in one slim row under the card. Newest first: inside each group, whoever took bags most recently is on top (overdue women stay in the red **Take now** group above).
  - **Round** (the green button right of the name box): one woman at a time, in the list's order. Her name, her place and what she owes, big. **Paid all · ₵1,950** is one tap; **Paid some** opens the money pad; **Not today** saves a pay date; **Skip** and **Back** move along. Went back to a woman you marked paid by mistake? **Remove this payment**. A round on one load takes what she owes on that load. At the end: **Round done**, with how many paid and how much, the pay dates, and who was not seen.
  - **End of day:** "You should have ₵X" (today's cash payments, not MoMo, plus today's cash sales). Count with the note buttons: **All there ✓**, **Short ₵200** or **₵50 extra**. The last count shows under the button. Then comes **Day closed**: "You took today" counts up to the day's total (cash, MoMo and cash sales together), a bar fills with the three parts, and it says how many women paid and how many bags were given. A right till gets a chime and coins. Tags say **Pay by 26 Nov**, **Pay today**, **2 days late**, **Pays Friday** (a pay date she gave) or **Missed pay date**.
  - **Taking a payment:** tap a name and the money pad opens. Tap the cedi notes as she counts. **Done** turns the phone to her: the lines she cleared are struck through, a part-paid line gets **− 200** written on it, what is left is circled, and a PAID stamp lands. **Next ›** goes to the next woman at that spot. **Not today** saves a pay date.
  - **Overpayment:** if she pays more than she owes, you choose: keep it as credit, or record that you gave change.
- **Book**: a big **People / Loads** switch with counts. The newest to take bags is on top; the sort button next to the search box cycles newest first, most owed first and A to Z. People are in coloured sections: **Owe money** (red, with the total), **Kept bags** (amber), **Paid up** (green), each woman with her coloured face, her place and her tag. Loads are in sections too: **Open** (blue), **Taking money** (red), **Done** (green), each with its page number, a coloured truck tile and a bar of how much is paid.
  - **Her page:** where she sells now (tap to change it) and what she owes, then one list of everything she took and paid. Each line keeps the load and the place it happened at.

Nothing is ever overwritten. Corrections, handovers, releases and moves are new lines. There is no Undo button: to fix a mistake, tap the line and change it, or remove it (it stays in her book, crossed out). A cash sale entered by mistake is taken off by tapping the cash line.

**A very big cash sale** (more than 20 bags or ₵15,000) asks first: "Sold 25 bags for cash? That is ₵16,250 in your hand."

**Closing a load:** you can only close once no bags are kept for anyone. Then choose what happened to what's left: for the next load, sent back, spoiled or lost, sold for cash, or the count was wrong.

**First open:** one big **Start** uses the usual answers (onions, bags, selling on credit and for cash, right hand) and goes straight in; **Set up** is the four short steps with a moving picture: welcome, what you sell, what you do (I buy · I give on credit · I sell for cash; "I buy" turns on Buy bags) and which hand holds the phone, and where you sell.

**Settings** is its own page of coloured cards (Easy to use, Your business, Places, Buying, Counting, Receipts, Sound and voice, Cloud book, Keep your book safe, Help, Delete) with real switches and a coloured backup status (red Never saved, green Saved 2 days ago).

**Today** (the Simple app opens on it once there is a book): "Good morning, Siddick", then two big cards. **2 women owe you ₵3,250** with a huge **Start round** button; **34 left** with a huge **Give bags** button (or **New load** when none is open); and what came in today. The lists show only after a tap.

**Simple app** (Settings › Easy to use; on for a new phone, off for a book already in use): fewer buttons. **Hold any button** for a moment and the phone says what it does (the button does not act). A new load starts at the bag, with no name question and no cost question (add the cost later from the load's **More** menu). With only one place, there are no place tabs on Give bags and no place chips on Take money. **Close load** says "N bags left. They go to the next load." and is one tap (**Something else** shows the other choices). There is no 10 minute count reminder. The hand setting sits here too. The extras are one tap away under **More**: Keep for her on the give panel; Counter, Add a cost, Load report and the load's name in the card menu ⌄ (Count the car, Price and Close load stay); Remind and End of day on Take money; and the Buying, Counting, Receipts and Sound and voice settings. The Book has no Show Mom or sort button. Big text sits next to the switch. Each phone has its own setting.

**Photos of customers** (Settings › Your business; off at first, each phone its own): while it is off no camera shows anywhere and nobody is asked for a photo. When it is on, tap her circle on her own page (it has a small camera) to take her photo, only if she says yes. Her photo then shows wherever her circle is: the Book, Take money, the round, the give panel. Tap it again for a new photo or **Remove photo**. Photos go in the backup and, with a cloud book, to your other phones (scrambled like everything else). Turn the switch off and the letters come back.

**The finger that teaches:** the first time on each spot an animated hand taps it with a few words (Type her name, Tap for cash, Tap the photo, Tap her name, Tap the notes, Tap Bought). Each shows once; Settings › Help › **Show me how** brings them back.

**Speak out loud** (Settings, off at first): the phone says each give ("Ama, 3 bags. 35 left."), each cash sale and each payment ("Ama paid 1,000 cedis. 2,300 cedis left."), and "Count the bags." when it is time to count. It uses the phone's own voice and works offline.

## The look

- **Colour has one job each.** Blue is the pen (what you write), red is debt and the notebook margin, green is money in, amber is waiting and counting (kept bags, no-name bags, the Counter), violet is a pay date she gave.
- **Find things by colour, not by reading.** Each place keeps its own colour everywhere: a stripe on its tab, a dot before its name in every list, its chip. Each woman has her own avatar colour, taken from her name, so it is the same on every screen. A kind of bag with no photo takes the colour in its name ("Red net" is red, "Yellow sack" yellow), or a colour of its own. Late, missed and refused are solid red. The card menu shows each action with a coloured icon: counting amber, price green, costs red, report blue.
- **The band at the top says the job:** blue for Give bags (with the page number, like a receipt book), green for Take money, black for Book. The phone's status bar takes the same colour.
- **Each job has its own world, felt before it is read:** Give bags is on blue paper, Take money on green paper with green ink and green keys, Book on cream ledger paper with dark ink. Panels stay white so they stand out. On Give bags, the place you are at tints the top of its page and its tab, so each place feels like its own page.
- **Numbers are painted big** in Barlow Condensed (SIL Open Font License, `public/fonts/OFL-barlow.txt`). Words stay in Atkinson Hyperlegible.
- **Places are index tabs** standing on the page.
- **Every number pad is a calculator**, laid out like the iPhone's: 7 8 9 × / 4 5 6 − / 1 2 3 + / 00 0 ⌫ and the action key. What you type shows small on top ("5 + 6 + 7 + 8") and the total shows big underneath; times goes before plus and minus. Tap ⌫ to take one off, hold it to clear. On the money pad the cedi notes add themselves to the sum.
- **Right hand first:** the things you tap most start on the right, near the thumb: bag photo tiles, the notes (₵200 on the right, ₵5 on the left), the Counter's kinds, the faces, the Cash button. Settings › Hand (or the first open) mirrors it all for the left hand.
- **The notes look like the real cedi notes:** ₵5 blue, ₵10 green, ₵20 violet, ₵50 brown, ₵100 teal green, ₵200 brick red. Counted notes stack under the total.
- **A big check on every save** in the job's colour (give blue, kept amber, cash green, buy clay, count amber) with the key fact, like "Ama · 3 bags".
- **Readable in the sun:** small lines are 15px and darker, the load card legend is icons with big numbers, and **Big text** (Settings) makes the whole app 15% bigger.
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

## Keep one book on every phone (cloud book)

By default the book lives on one phone. The **cloud book** keeps the same book on every phone you join (you and your mom, for example), saved online, so a lost phone loses nothing. It still works with no signal: lines wait on the phone and go when there is signal.

**How it stays safe and correct**
- Every line is **scrambled on the phone** (AES-GCM, with a key made from your book code) before it leaves. The online store only holds scrambled text, row ids and edit times, never names, numbers, places or money. Whoever has the book code can read the book, so treat it like a password.
- Lines (gives, payments, cash sales, buys, counts, removals) are **only ever added**, so two phones can never overwrite each other: the book is both phones' lines together, in date order. A removed line stays, crossed out, on both phones.
- The few things you can edit (a woman, a load, a place, a buying trip, the shared settings) keep an edit time, and **the newest edit wins**.
- Bag photos travel too.
- A **receipt SMS is sent by the phone that wrote the line**, never twice.
- Settings that belong to a phone (hand, sounds, voice, Big text, the Buy tab) stay on that phone.

**One-time setup on Cloudflare** (about ten minutes, free; the screens may be named a little differently):
1. In the Cloudflare dashboard, open **Storage & databases › D1 SQL database › Create database**. Name it `stallbook`.
2. Open **Workers & Pages › Create › Create Worker**. Name it `stallbook-sync` and press **Deploy**. Then **Edit code**, delete what is there, paste everything from `worker/stallbook-sync.mjs`, and **Deploy**.
3. On that Worker, open **Settings › Bindings › Add › D1 database**. Set the variable name to `DB` (capital letters) and choose `stallbook`. **Deploy** again.
4. Copy the Worker's address (it ends in `.workers.dev`). Open it in a browser: it should say `{"ok":true,"app":"stallbook-sync"...}`.
5. In StallBook on your phone: **Settings › Cloud book › Start a cloud book**, paste the address, **Start**. It shows your **book code**.
6. On your mom's phone: open StallBook, tap **Already have a book? Join it** (or **Settings › Cloud book › Join a book**), and paste the invite. The invite is the code and the address together (`ABCD-EFGH-JKMN-PQRS@https://…`); **Invite another phone** sends it by WhatsApp. Her phone then gets the whole book, photos included.

The tables are made by themselves the first time the Worker is used. If you use the wrangler command line instead, `worker/wrangler.toml` has the same setup.

**Never losing the book**
- The book is saved on the phone **twice**: the usual place, and a second copy kept apart from it. If the first is empty or older, the second brings it back ("Your book is back").
- If saving ever fails, a red bar says **Not saved!** with **Back up now**.
- In Safari (not the Home Screen icon) the Home Screen reminder returns every 3 days.
- If the app cannot open, the screen says so in short words, with **Save my book**, which makes the backup file without the app. See `docs/if-it-breaks.md`.
- A new cloud book says **Write this code on paper**, and once a month asks **Do you still have your book code?**

**Good to know**
- **Keep the book code safe** (and still make a file backup now and then). If every phone and the code are lost, the online copy cannot be opened by anyone, not even you.
- **Disconnect this phone** stops syncing but keeps this phone's book. **Delete everything** only empties this phone: the online book stays, and you can join again.
- If two phones add the same new woman or place at the same moment, you get two names for her. Fix it by giving to one of them.
- Free Cloudflare limits are far above what a stall needs. Each phone asks the server for news about every 20 seconds while the app is open.

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
| `sync.js` | The cloud book: two phones and the real Worker, no signal, edits, removals, scrambled data, wrong codes, disconnecting |
| `onboard.js` | The first open: four steps, the picture, What do you do? |
| `cash.js` | Cash: the button, the panel, a big line per sale, totals |
| `settings.js` | Settings cards, switches, backup status |
| `wow.js` | The big check, paper-money notes, tab pop, rows rising (motion on) |
| `sun.js` | Bigger, darker small text; icon legend; Big text |
| `by-load.js` | Take money by load, and paying a load first |
| `end-of-day.js` | The end of day cash count |
| `hints.js` | The finger that teaches |
| `hand.js` | Right hand first, left hand mirrored; the note colours |
| `focus.js` | Take money opens on the current load; the new Book; the big cash question; newest first |
| `colors.js` | Place, woman and kind colours, tags, the card menu |
| `vibes.js` | Each tab's own paper and ink; places tint their page |
| `screens.js` | Keyboard, turning the phone, and many screen sizes |
| `round.js` | The collect round: Paid all, Paid some, Not today, Skip, Back, Remove, a round on one load, the summary |
| `regulars.js` | The regulars on Give bags: this place first, then who comes most often; her usual bags set |
| `faces.js` | Photos of customers: off with no camera anywhere, taking, showing, replacing, removing, backup |
| `simple.js` | The Simple app: on for a new phone, what is under More, the switch |
| `safe.js` | The red Not saved bar, the second copy and bringing the book back |
| `rescue.js` | The could-not-open screen with Save my book; the monthly book code check |
| `colours.js` | Bag colours: No photo asks the colour, drawn bags, buying |
| `dayend.js` | The day-end screen: counting up, the bar, the split (with motion on) |
| `today.js` | Today (Simple app): the two big cards, Start round, no lists, small phones |
| `takeload.js` | Take money and Today open on the current load, never on everybody; All is one tap |
| `onekind.js` | A load with one kind and a picture: the bag is a tile you tap (give and cash), half bags, a colour instead of a photo |
| `simpler.js` | First open in one tap, a new load in Simple, closing in one tap, hold to hear, no count reminder |

## Your data

Everything is saved on the phone, in the browser's storage (and, if you turned on the cloud book, also online, scrambled). The app asks the phone to keep it, but still use **Back up (WhatsApp or Files)** often. If the phone is lost, open the backup file with **Restore from a backup**.

Older books are upgraded automatically when the app opens, and a version 1 copy is left untouched. Places are one list of names: a town and spot such as Bakwai and Market become the place Bakwai Market. Half bags are off until you switch them on in Settings.

The font is Atkinson Hyperlegible by the Braille Institute, included under the SIL Open Font License (`public/fonts/OFL.txt`).
