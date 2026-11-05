# CreatorHub — Google Apps Script collaboration app

## Files
Create a Google Apps Script project and add the `.gs` files as script files and `.html` files as HTML files. Paste each file's contents into the matching Apps Script file.

## Setup
1. Create a new Google Spreadsheet (or let the initializer create one).
2. Open https://script.google.com and create a standalone Apps Script project.
3. Add `Code.gs` as a script file. Add `Index.html`, `Styles.html`, and `App.html` as HTML files.
4. Paste the matching source from this package.
5. In Apps Script, run `initializeCreatorHub()` and authorize the requested Google permissions. It creates/links the database and all seven tabs. Copy the spreadsheet URL shown in the execution log/result.
6. In Project Settings → Script properties, add `INVITE_CODE` with a long private value (at least 12 characters), or run `setCreatorHubInviteCode("your-long-private-invite-code")` from the editor. Do not publish this value.
7. Deploy → New deployment → Web app. Execute as: **Me**. Who has access: **Anyone with Google account** (or the narrowest option that allows both collaborators). Deploy and share the resulting web app URL only with the two intended people.
8. Both users create accounts from the signup page using the private invitation code. The first account is admin; the second is member. Signup closes automatically after two accounts exist.
9. Test on two separate browsers/devices. Create a task assigned to the other account, send messages, create content plans, and check presence.

## Database
The app stores shared records in the linked spreadsheet. The seven tabs are Users, Tasks, Messages, ContentPlans, ActivityLogs, Sessions, and Presence. The spreadsheet should be accessible only to the app owner and trusted administrators. Do not share edit access to the spreadsheet with ordinary collaborators.

## Security notes
- Passwords are salted and repeatedly HMAC-SHA256 hashed. This is a practical Apps Script example, not a substitute for a modern dedicated identity provider with a memory-hard password hashing function such as Argon2id.
- Session tokens are random UUID combinations; only token hashes are stored in the Sessions tab. Protected operations derive the user from the verified token, not a client-supplied user ID.
- The first registered account is admin. Only the task creator can delete a task. Content plans can be edited by their creator or the admin.
- Password reset is administrator-assisted. In the Apps Script editor, run `generatePasswordResetCode("username")`; share the returned one-time code privately. It expires in 15 minutes and invalidates other sessions after reset.
- Google Apps Script web apps have quotas and execution limits. Google Sheets is not a high-throughput transactional database. This implementation is intended for a small private workspace, not sensitive or large-scale production use.
- Presence is heartbeat-based. A user is considered online while their latest heartbeat is less than 75 seconds old. A background page poll marks stale users offline. A browser crash may leave the last heartbeat timestamp visible as last active.
- Browser LocalStorage is device/browser-specific. It is not shared between devices and can be cleared by the browser. Shared messages/tasks/content are stored in Sheets.
- The app is served over HTTPS by Google. It does not implement end-to-end encryption; spreadsheet owners and Apps Script administrators can access stored messages.
- The messaging view is a two-person private workspace, not a general multi-room chat service.

## Notes
The UI uses Google Fonts over the network. If blocked, it falls back to system sans-serif fonts.
