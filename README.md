# Birthday Glass Cake Interactive Card

Open `index.html` with a local web server for the most reliable media playback.

Custom letter data is read from `#d=Base64(JSON)`, for example:

```json
{"recipientName":"Emily","message":"Wishing you a wonderful birthday filled with happiness and love.","senderName":"John"}
```

`?preview=1` is accepted alongside the hash and uses the same card data behavior. When no hash is present, the most recently decoded data is retained in `sessionStorage` for previewing.
