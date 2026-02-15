# Firestore index for Settlements

The **settlements** collection is queried by `groupId` and ordered by `createdAt`. That requires a composite index.

## Option 1 – Firebase Console (quick)

1. Run the app and open the Balances tab (or any screen that loads settlements).
2. In the browser console you’ll see an error with a link like:  
   `The query requires an index. You can create it here: https://console.firebase.google.com/...`
3. Open that link and click **Create index**. Wait until the index is built.

## Option 2 – Firebase CLI

If you use Firebase CLI and have this project linked:

```bash
firebase deploy --only firestore:indexes
```

This deploys the index defined in `firestore.indexes.json`.

After the index is created, settlement queries will work and:
- Balances will include settle-up deductions.
- Settlements will show in the Transactions tab.
