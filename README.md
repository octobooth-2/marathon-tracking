# Marathon Tracker

Client-side web app to log and visualize marathon training runs. Data is stored in the browser using `localStorage` and can be exported/imported as JSON backups.

## Features

- Log runs: date, distance (km/mi), duration, notes, effort (1-10)
- Run history with filtering and sorting
- Dashboard with total distance, longest run, average pace, and weekly mileage chart
- Training plan table with weekly target vs. actual distance
- Export/import JSON backup data

## Run Locally

Open `/index.html` in your browser.

## Deploy

The repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that deploys to GitHub Pages on pushes to `main`.
