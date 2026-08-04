# Hewett-Byrne Wedding website

Ready for GitHub Pages and the custom domain:

**hewett-byrne-wedding.co.uk**

## Upload to GitHub

1. Create a new GitHub repository.
2. Suggested repository name: `hewett-byrne-wedding`
3. Make the repository public if using GitHub Free.
4. Upload every file and folder from this package to the repository root.
5. Commit the files to the `main` branch.
6. Open **Settings → Pages**.
7. Under **Build and deployment**, choose **GitHub Actions**.
8. The included workflow deploys the site after each push.
9. Under **Custom domain**, enter `hewett-byrne-wedding.co.uk` and save.
10. At your domain registrar, add the DNS records GitHub shows.
11. Once available, enable **Enforce HTTPS**.

The package already contains:
- `CNAME` with `hewett-byrne-wedding.co.uk`
- `.nojekyll`
- `.github/workflows/deploy-pages.yml`
- public website pages
- unlisted private planning page
- mobile styling and countdown

## Important RSVP note

GitHub Pages serves static files and cannot store form submissions by itself.

The RSVP form is ready for an external form endpoint. In `rsvp.html`, replace:

`https://formspree.io/f/YOUR_FORM_ID`

with the endpoint from the form provider you choose.

Also update the final wedding date and confirmed timings before invitations are issued.

## Secure planning login

Public login page:
`https://hewett-byrne-wedding.co.uk/login.html`

Protected planning path:
`https://hewett-byrne-wedding.co.uk/private/`

Follow `SECURE_LOGIN_SETUP.md` to protect the private path with Cloudflare Access one-time email codes.

## Main pages

- `/` — homepage and countdown
- `/details.html` — schedule and package details
- `/travel.html` — venue, directions, accommodation
- `/faq.html` — guest FAQs
- `/rsvp.html` — RSVP form
- `/login.html` — planning login page
- `/private/` — Cloudflare-protected planning dashboard


## Guest list manager

The protected planning dashboard now includes Main, Evening and Night guest categories, RSVP status, notes, device-local saving, category totals and CSV export.


## Confirmed wedding date

**Saturday 11 September 2027**

Countdown and planning defaults use `2027-09-11`.
