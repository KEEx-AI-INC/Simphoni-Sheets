# SimphoniSheets editor extension

This directory is the shared security boundary for the hosted Collabora bridge
and native Calc UNO extension.

Both adapters must:

1. expose bounded selection snapshots only to configured parent origins or an
   authenticated Nucleus loopback client;
2. accept only signed, user-approved proposal envelopes;
3. verify document, revision, selection hash, expiry, and nonce immediately
   before applying;
4. translate only the four allowlisted operation kinds;
5. group a proposal into one undo context and return a content-free receipt;
6. never expose a generic UNO dispatch, macro, Python, or shell bridge.

Production signature verification uses an Ed25519 public key embedded in the
reviewed artifact. Private signing material belongs to Service Bus secret
storage and never enters this repository.
