# Secure private planning login setup

The website remains hosted on GitHub Pages.

Cloudflare Access provides the real authentication layer in front of:

`https://hewett-byrne-wedding.co.uk/private/*`

The public website stays available to everyone.

## What visitors see

- Public guests can browse the wedding website and RSVP pages.
- The navigation includes **Planning Login**.
- Clicking it opens `/private/`.
- Cloudflare Access intercepts the request.
- Approved users receive a single-use login code by email.
- Anyone else is denied.

## Part 1 — GitHub Pages

1. Upload all files from this package to the repository root.
2. Commit to the `main` branch.
3. In GitHub, open **Settings → Pages**.
4. Select **GitHub Actions** as the deployment source.
5. Confirm the custom domain is:
   `hewett-byrne-wedding.co.uk`

## Part 2 — Put the domain on Cloudflare

1. Add `hewett-byrne-wedding.co.uk` to Cloudflare.
2. Cloudflare gives you two nameservers.
3. Replace the domain registrar's nameservers with the Cloudflare nameservers.
4. Recreate the GitHub Pages DNS records in Cloudflare.
5. Keep the records proxied through Cloudflare where supported.
6. Wait until Cloudflare shows the domain as active.
7. Confirm the public website still loads over HTTPS.

## Part 3 — Enable one-time PIN login

1. Open **Cloudflare Dashboard → Zero Trust**.
2. Create a Zero Trust organisation if prompted.
3. Go to **Settings → Authentication → Login methods**.
4. Add or enable **One-time PIN**.

## Part 4 — Protect the private path

1. Go to **Zero Trust → Access controls → Applications**.
2. Select **Add an application**.
3. Choose **Self-hosted**.
4. Application name:
   `Hewett-Byrne Wedding Planning`
5. Public hostname:
   - Domain: `hewett-byrne-wedding.co.uk`
   - Path: `private/*`
6. Set the session duration, for example 24 hours or 7 days.
7. Create an **Allow** policy.
8. Include only Gary's and Jo's exact email addresses.
9. Save the application.

Cloudflare Access applications are deny-by-default, so only identities matching the Allow policy should be admitted.

## Test before adding private information

1. Open a private/incognito browser window.
2. Visit:
   `https://hewett-byrne-wedding.co.uk/private/`
3. Confirm the Cloudflare login page appears.
4. Test an approved email.
5. Test an unapproved email.
6. Confirm logout:
   `https://hewett-byrne-wedding.co.uk/cdn-cgi/access/logout`

## Important security point

GitHub's repository may still contain the private page source if the repository is public. Cloudflare blocks normal website access to the page, but it cannot make files in a public GitHub repository confidential.

Do not store:
- payment card details
- passport information
- full home addresses
- sensitive guest medical details
- private contracts containing personal data

For genuinely confidential planning data, use a private repository with a suitable GitHub plan, or move the private application/data to a server-backed platform.

## Files added by this secure version

- `login.html` — public login information page
- `private/index.html` — protected planning dashboard
- `SECURE_LOGIN_SETUP.md` — this guide
