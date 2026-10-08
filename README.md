# Evaltra website

Product website with an animated dependency explanation and workbook walkthroughs. No backend, API key, engine binary, external JavaScript library or paid hosting is required.

## Preview and check

Node.js 22 or newer; no dependency installation required.

```sh
npm start
npm run check
npm test
```

Preview: http://127.0.0.1:4311/evaltra-website/

These checks cover the website only. They are not Evaltra engine or Excel compatibility tests.

## Publish

GitHub Pages publishes `dist/` when changes reach `main`. The workflow runs the checks before deployment. Repository Settings → Pages → Source must be **GitHub Actions**.

Site: https://evaltra.ai/

The custom domain is managed in GitHub Pages settings, with GoDaddy DNS pointing to GitHub Pages. `www.evaltra.ai` redirects to the main domain and HTTPS is enforced. The original GitHub Pages URL redirects to the custom domain.

Edit the files in `dist/`, run the checks, and push to `main`. Public GitHub Pages hosting and standard GitHub Actions runners for this public repository use GitHub's free offering, subject to its limits.

## Demo scope

- Project estimate: Inputs, Estimate and Summary sheets; base and expanded scenarios.
- Sales analysis: Orders and Summary sheets; North, South and no-match scenarios, including FILTER spill output.
- Selectable cells expose their formula or input. Scenario and sheet controls browse bounded workbook states; there is no arbitrary formula editor or parser.
- All five workbook states were independently checked against native Evaltra and Excel on 2026-10-07 (America/New_York): 672 cells including every formula and spill result. The source model, raw outputs and binary hashes remain in ignored artifacts.
- The IF/SUMIF comparison was refreshed on 2026-10-07 using Excel 16.0 build 20430 and the existing native engine binary. Internal evidence identifies the tested comparison implementation/version. These checks establish the displayed examples, not full workbook compatibility.
- The dependency sequence is an explanatory animation with pause, replay and manual steps. It does not distribute or execute the Evaltra engine in the website.

The public repository contains only reviewed static site files and publishing support. Local native service experiments, private artifacts, research notes and runtime files are excluded.
