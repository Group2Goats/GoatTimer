# GoatTimer

Web application that tracks a users study time

## How to Run

On the: npm install
Set `MONGO_URI` in `packages/backend/.env` to your MongoDB Atlas connection string
In one terminal start the backend: npm -w backend run dev
In another terminal: npm -w frontend run dev

The backend defaults to port 5050, and the frontend dev server proxies `/api`
requests there.

For JWT auth, set `JWT_SECRET` in `packages/backend/.env`.
Successful login/signup sets an HttpOnly cookie named `goattimer_jwt`.

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
