# GoatTimer

For anyone who needs motivation to focus students, professionals, business owners **The Goat Study Timer** is a web app that keeps users accountable by tracking study time. It surfaces other competitors, lets users climb the ranks, and treats focus as a social experience.

# Contributing
 - Formatting is default javascript and Prettier styles
 - At root & frontend & backend run "npm i" on all 3 directories
 - Project also comes with .vscode settings for easy linting and error checking
    - download ESLint on VSCode extentions
    - settings should automatically apply on save
        - explicitly apply formatting by pressing CTRL + s
    - errors should appear in editor of lint violations
 - Use commands from root "npm run lint" to see formatting errors
 - Use commands from root "npm run lint:fix" to see formatting errors and fix them
    - same could be done in frontend or backend if working in those directories
 - use the script "npm run dev" to start the service and check for linting errors
    - linting errors must be addressed or the service will not run
 - ensure no linting errors before pushing code
 - ### Development Enviroment
   - At root run "npm i" to install all packages
   - in `packages/backend/.env`
      - Set `MONGO_URI` to the MongoDB Atlas connection string
      - For JWT auth, set `JWT_SECRET` 
   - In one terminal start the backend: npm -w backend run dev
   - In another terminal: npm -w frontend run dev
   - The backend defaults to port 5050, and the frontend dev server proxies `/api` requests there.