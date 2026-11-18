# If StallBook breaks

Short steps, in plain words. Nothing here needs a computer unless it says so.

## The app says "StallBook could not open"
1. Press **Save my book**. It makes a backup file with your whole book. Send the file to yourself on WhatsApp.
2. Press **Try again**.
3. Still the same? Close the app fully (swipe it away) and open it again.

Your book is not lost. It is saved on the phone, and a second copy is kept apart from the first.

## The red bar says "Not saved!"
The phone could not save the book. Press **Back up now** and keep the file in WhatsApp. Then free some space on the phone (delete old videos or photos) and open the app again. The bar goes away when saving works.

## The book looks empty
- If you use the Home Screen icon, close the app and open it again: the second copy brings the book back by itself ("Your book is back").
- If it is still empty: **Settings → Keep your book safe → Restore from a backup** and pick your last backup file.
- If you have a **cloud book**: **Already have a book? Join it**, then paste your invite (the code and the address). The whole book comes back from the online copy.

## The cloud book says it cannot reach the server
- No signal: nothing is lost. The lines wait on the phone and go when there is signal.
- "The server has no database yet": in Cloudflare, open the `stallbook-sync` Worker, then Settings, Bindings. There must be a D1 database called `DB` that points to your `stallbook` database.

## The code for the cloud book is lost
- Look on your other phone: **Settings → Cloud book → Invite another phone** shows it.
- If every phone and every paper is gone, nobody can open the online copy, not even Cloudflare. Restore from a backup file instead, then start a new cloud book.

## Put back the last version that worked (needs a computer)
Every version of the app is in GitHub. Open the repository, go to `download/index.html`, press **History**, choose an older version, press **Raw**, save the file, and upload it to your **stallbook** project in Cloudflare the same way as always.
