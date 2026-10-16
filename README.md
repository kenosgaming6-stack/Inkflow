# Inkflow · StallBook

StallBook is a credit book for market traders. You give bags on credit, collect the money about two weeks later, and never lose track of who owes what.

It is one web page (`index.html`). It works without internet, and the book stays on the phone.

## How it works

The app has three tabs at the bottom of the screen:

- **Give**: the car you are giving from. It shows how many bags are still free to give. Bags you promised someone but that haven't left the car count as *waiting*, so you don't sell the same bag twice. A woman doesn't owe anything until her bags are marked *taken*.
- **Collect**: who to collect from now (late, due today, broke a promise, refused), who has promised to pay, and who isn't due yet. **Collection run** goes through them one at a time: *Paid all*, *Some*, or *Not today*. *Not today* saves the day she promised to pay.
- **Book**: everyone, and the total owed to you. **Show Mom** puts the results in big numbers.

Collecting money has its own keypad with cedi note buttons and a **+** key, so you can add the notes as she counts them into your hand.

Receipts and reminders go by SMS or WhatsApp. SMS text uses `GHS` instead of `₵`, so one message fits 160 letters and costs less.

## Run it

Open `index.html` in a phone browser.

To install it on the home screen and use it offline, host the folder over HTTPS, for example with GitHub Pages (Settings → Pages → deploy from this branch). Then open the page in Chrome and choose **Add to Home screen**.

## Your data

Everything is saved on the phone (in the browser's local storage). Use **Back up to WhatsApp** often. If the phone is lost, open the backup file with **Restore from a backup**.

A book from version 1 is moved over automatically the first time v2 opens. The old copy is left untouched.
