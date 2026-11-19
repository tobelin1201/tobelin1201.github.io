# tobelin1201.github.io

Personal finance portfolio covering credit analysis, equity valuation and financial modeling. It's a plain static site
(HTML, CSS and a little JavaScript) with no build step, hosted on GitHub Pages.

## Structure

```
index.html                      Home: hero, about, project cards (filterable), skills, contact
projects/
  project-template.html         Copy this to start a new project page
assets/
  css/style.css                 All styling; colors and fonts are tokens at the top (:root)
  js/main.js                    Mobile nav, project filters, table-of-contents highlight
  js/charts.js                  Small SVG chart helper (bar + line, tooltips, data tables)
  img/favicon.svg
```

## Fill in your details

Search the project for `[` placeholders and replace them:

- `[Your Name]`, `[School]`, `[Major]`, `[Year]` and the About text in `index.html`
- the email and LinkedIn links in the Contact section
- your résumé: save it as `assets/resume.pdf`, which the Résumé button links to

## Add a new project

1. Copy `projects/project-template.html` to a new file, e.g. `projects/apple-dcf.html`.
2. Edit the title, tag (`tag-credit`, `tag-equity` or `tag-model`), sections and sources.
   Remove the `noindex` meta line.
3. In `index.html`, replace one of the dashed "Coming soon" cards with a real card linking to it
   (an `<a class="card" href="projects/your-page.html">` with a tag, title, description and metrics).

### Charts

Each project page loads `assets/js/charts.js`. Add a container and call the helper:

```html
<div class="chart-card">
  <h4>Revenue</h4><p class="chart-sub">$ billions</p>
  <div class="chart" id="rev"></div>
</div>
<script>
  Charts.bar('#rev', {
    categories: ['FY23', 'FY24', 'FY25'],
    series: [{ name: 'Revenue', values: [176.2, 185.0, 187.3], color: 'var(--series-1)' }],
    format: (v) => '$' + v.toFixed(1) + 'B',
  });
</script>
```

`Charts.line` takes the same options and also accepts `refLine: { value, label }`. Use the colors
`--series-1` to `--series-4` in that order. They are checked to stay distinguishable for colorblind readers.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publish

Settings → Pages → Build and deployment → Source: **Deploy from a branch**, then pick the branch and the `/ (root)` folder.
The site is served at https://tobelin1201.github.io.
