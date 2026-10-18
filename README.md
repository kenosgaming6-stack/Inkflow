# Inkflow · StallBook

StallBook is a credit book for a delivery business. A vehicle brings bags (onions, for example) to market women. Some pay cash, some take bags on credit and pay later, some ask you to hold bags for them. StallBook keeps track of the bags, the people, where to find them, and what they owe.

It is one web page (`index.html`). It works without internet, and the book stays on the phone.

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

## Run it

Open `index.html` in a phone browser. The first time, set up what you hand out and the towns and spots you deliver to.

To install it on the home screen and use it offline, host the folder over HTTPS, for example with GitHub Pages (Settings → Pages → deploy from this branch). Then open the page in Chrome and choose **Add to Home screen**.

## Your data

Everything is saved on the phone, in the browser's storage. Use **Back up to WhatsApp** often. If the phone is lost, open the backup file with **Restore from a backup**.

Books from versions 1 and 2 are upgraded automatically when v3 opens:
- Old place names become towns.
- Count fixes and carried-over bags become book lines.
- The version 1 copy is left untouched.
