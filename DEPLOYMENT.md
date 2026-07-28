# Going Live: Deploying Godinez Resort

This walks you through putting the site on the public internet with its own web address, a free HTTPS (padlock)
certificate, and storage that survives restarts - so admin edits and uploaded photos don't disappear.

## What this will cost

Render's free tier does **not** support the kind of storage this app needs (admin edits, uploaded photos, and
bookings would all get wiped every time the app restarts - which happens often on the free tier). This guide uses
Render's **Starter** plan instead:

- **Starter web service:** about **$7/month**
- **Persistent disk (1 GB):** about **$0.25/month**
- **Total: roughly $7.25/month**

(Prices are Render's as of mid-2026 - double-check current pricing at [render.com/pricing](https://render.com/pricing)
before you commit, since hosting prices do change.) [Railway](https://railway.com) is a reasonable alternative
with a similar price range if you'd rather compare - the steps below are Render-specific, but the general shape
(connect GitHub, set a build/start command, attach persistent storage, set environment variables) is the same
anywhere you host a Node.js app.

## Overview of the steps

1. Put the code on GitHub (Render deploys from a GitHub repository, not a raw zip file).
2. Create a Render account and a new Web Service connected to that repository.
3. Attach a persistent disk so your data survives restarts.
4. Set two environment variables.
5. Deploy, then do the one-time admin account setup on your live site.
6. (Optional) Connect your own domain name.

---

## Step 1 — Put the code on GitHub

Render needs your code in a GitHub repository. The easiest way to do this without using any command-line tools is
**GitHub Desktop**, a free point-and-click app.

1. Create a free account at [github.com](https://github.com) if you don't already have one.
2. Download and install [GitHub Desktop](https://desktop.github.com).
3. Open GitHub Desktop and sign in with your GitHub account (**File → Options → Accounts**, or it'll prompt you on
   first launch).
4. **File → Add Local Repository**, and point it at your unzipped `godinez-resort` folder.
   - It will say "This directory does not appear to be a Git repository" - click **"create a repository"** in that
     same message.
   - On the "Create a Repository" screen, make sure a `.gitignore` for **Node** is *not* needed (this project
     already includes one) and click **Create Repository**.
5. Click **Publish repository** in the top bar. Choose a name (e.g. `godinez-resort`), and it's fine to leave
   "Keep this code private" **checked** - Render can deploy from a private repository, and there's no reason for
   this project's code to be public.
6. Click **Publish Repository**. Your code is now on GitHub.

> Whenever you (or I) make future code changes, GitHub Desktop will show them in the "Changes" tab - write a short
> summary, click **Commit to main**, then click **Push origin**. Render will automatically redeploy your live site
> a minute or two later.

---

## Step 2 — Create the Render Web Service

1. Create a free account at [render.com](https://render.com) (you can sign up with your GitHub account, which
   makes the next step easier).
2. From the Render dashboard, click **New +** → **Web Service**.
3. Connect your GitHub account if prompted, then select your `godinez-resort` repository.
4. Fill in the service settings:
   - **Name:** anything, e.g. `godinez-resort`
   - **Region:** pick whichever is closest to the Philippines (e.g. Singapore) for the best speed.
   - **Branch:** `main`
   - **Root Directory:** leave blank (unless your GitHub repo has the project inside a subfolder).
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** choose **Starter** (the free tier can't attach persistent storage, which this app needs).
5. Don't click "Create Web Service" yet - first, in the same screen, click **Advanced** to add the disk and
   environment variables below.

### Add the persistent disk

Still on the same creation screen, under the **Advanced** section, find **Add Disk** and set:

- **Name:** `resort-data`
- **Mount Path:** `/opt/render/project/src/server/data`
- **Size:** `1 GB` (plenty of room for text content, bookings, accounts, and hundreds of photos)

### Add environment variables

In the same **Advanced** section, add these two **Environment Variables**:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | *(see below)* |

For `SESSION_SECRET`, you need a long random string - it's what keeps login sessions secure. Generate one by
running this on your own computer (Terminal on Mac, Command Prompt on Windows with Node installed) and pasting the
result in:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

If you don't have Node installed locally, any long random string of letters/numbers (32+ characters) works too -
just don't reuse a password you use elsewhere, and don't share it.

6. Click **Create Web Service**. Render will build and deploy - this takes a few minutes the first time. You'll
   see build logs streaming on screen.

Once it's done, Render gives you a URL like `https://godinez-resort.onrender.com` - that's your live site.

---

## Step 3 — First-time admin setup on the live site

1. Visit `https://your-render-url.onrender.com/admin.html`.
2. Since no admin account exists yet on this fresh deployment, you'll land on a "Create the Admin Account" form.
   Create it now with a real password you'll remember - write it down somewhere safe (a password manager, ideally).
3. From there you can reach the **Content & Settings** dashboard to start editing text/photos/theme, and create
   staff accounts for anyone else who needs to manage bookings.

---

## Step 4 (optional) — Connect your own domain

If you own a domain name (e.g. `godinezresort.com`) instead of using the free `onrender.com` address:

1. In your Render service, go to **Settings → Custom Domains → Add Custom Domain**.
2. Enter your domain, and Render will show you a DNS record (usually a `CNAME`, or an `A` record for a root
   domain) to add.
3. Log in wherever you bought the domain (GoDaddy, Namecheap, etc.), find its DNS settings, and add the record
   Render gave you.
4. DNS changes can take anywhere from a few minutes to a few hours to take effect. Render automatically issues a
   free HTTPS certificate for your domain once it detects the DNS is pointed correctly.

---

## Ongoing maintenance

- **To update the site's code** (if you or I make further changes): open GitHub Desktop, commit the changes, and
  push. Render redeploys automatically. Your content/bookings/accounts/photos are untouched, since they live on
  the persistent disk, not in the code itself.
- **To back up your data:** the simplest approach is periodically opening the admin dashboard and noting your
  content, or using Render's **Shell** tab (under your service) to download `server/data/` - Render also
  automatically snapshots your persistent disk once a day and keeps snapshots for 7 days, restorable from the
  service's **Disks** page if something goes wrong.
- **If you ever need to scale beyond one server** (e.g. a lot of simultaneous traffic): this app's current session
  storage (who's logged in) lives in that one server's memory, and a persistent disk only works with a single
  instance. That's normal and fine for a single resort's traffic - just something to revisit with a developer if
  the site ever needs to run on more than one server at once.

## Troubleshooting

- **"Application failed to respond" right after deploying:** check the **Logs** tab on your Render service - it
  usually means an environment variable is missing or `npm install` failed. The logs will show the actual error.
- **Photos/edits disappear after a redeploy:** double check the persistent disk's mount path is exactly
  `/opt/render/project/src/server/data` (including the `/opt/render/project/src/` prefix - Render requires it for
  Node.js services).
- **Can't log in / forgot the admin password:** there's currently no "forgot password" flow. Use Render's **Shell**
  tab to open a shell on your live service, then run
  `node -e "require('./server/lib/users.js').setPassword('<user-id>', 'NewPassword123')"` (find the user ID via
  `cat server/data/store/users.json`), or delete that one user's entry from `server/data/store/users.json` and
  reload `/admin.html` to go through account setup again.
