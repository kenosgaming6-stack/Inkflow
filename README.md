# Inkflow · StallBook

StallBook is a credit book for a delivery business. A vehicle brings bags (onions, for example) to market women. Some pay cash, some take bags on credit and pay later, some ask you to hold bags for them. StallBook keeps track of the bags, the people, where to find them, and what they owe.

The app is the `public/` folder: one page (`index.html`) plus its icons, font and offline file. It works without internet, and the book stays on the phone.

## How it works

Three tabs at the bottom. Give and Collect never send you to another page; everything opens in a panel over the list.

- **Give**: the open delivery. A card shows the bags left, given and held.
  - **Recording someone:** type two letters or tap a face. Her spot and her usual number are filled in. Switch on **Hold for her** to keep bags for her (she owes nothing until they're handed over) or **Paid cash** if she pays now.
  - **Correcting a line:** tap the number in her row to change it. Tap her name to hand over held bags, release them, pick the right customer or change the spot.
- **Collect**: who owes, most urgent first, filtered by town and spot.
  - **Taking a payment:** tap a name and the money pad opens. Tap the cedi notes as she counts. **Done** shows her new balance in the list. **Next** saves and opens the next woman at that spot. **Not today** saves a promise.
  - **Overpayment:** if she pays more than she owes, you choose: keep it as credit, or record that you gave change.
- **Book**: everyone, by town and spot, and every delivery.
  - **Her page:** where she sells now (tap to change it) and what she owes, then one list of everything she took and paid. Each line keeps the delivery and the spot it happened at.

Nothing is ever overwritten. Corrections, handovers, releases and moves are new lines. Undo crosses a line out.

**Closing a delivery:** you can only close once no bags are held. Then choose what happened to what's left: kept for the next delivery, sent back, spoiled or lost, sold for cash, or the count was wrong.

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

## Releasing an update

Change `VERSION` in `public/sw.js` and `APP_VERSION` in `public/index.html`, then push. Phones download the new version in the background and show **New version of StallBook ready · Reload**.

## Your data

Everything is saved on the phone, in the browser's storage. The app asks the phone to keep it, but still use **Back up (WhatsApp or Files)** often. If the phone is lost, open the backup file with **Restore from a backup**.

Books from versions 1 and 2 are upgraded automatically when v3 opens. Old place names become towns, and the version 1 copy is left untouched.

The font is Atkinson Hyperlegible by the Braille Institute, included under the SIL Open Font License (`public/fonts/OFL.txt`).
