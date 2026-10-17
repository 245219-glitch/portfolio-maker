# Folio Studio - a portfolio generator for anyone
HTML + CSS + jQuery AJAX + Node.js (Express) + MySQL

## Run (XAMPP / MySQL)
1. Start MySQL (XAMPP control panel) and install Node.js 18+.
2. Optional: import `folio_studio_db.sql` in phpMyAdmin (the server also creates everything automatically).
3. In this folder: `npm install` then `node server.js`
   (Default user `root`, empty password. Otherwise set DB_USER / DB_PASSWORD.)
4. Open http://localhost:3000

## How it works
- Home page: click "Create my portfolio", answer 5 short steps (about you, skills & links, experience & education,
  projects & posts, template + edit PIN). Your portfolio is generated at /p/your-name.
- Anyone can create their own. Each portfolio has its own PIN.
- 9 templates: Sketchbook, Minimal Outline, Editorial Hello, Aurora Gradient, Noir Red + (from coco-portfolio) Sketch Doors, Aurora Glow, Editorial Bold, Minimal Sidebar. Owners can switch any time.
- Owner tools (after PIN login): edit everything (add/edit/delete rows), change template, inbox, copy link, delete.
- GitHub: paste your profile URL -> live repos, stats and contribution chart; import repos into Projects.
- LinkedIn: profile link is shown. LinkedIn has no public feed API, so paste post links (wizard step 4 or owner Sync button) and the title/text is fetched from each link's preview and saved to Posts.
- Owner Sync button: one click adds new GitHub repos to Projects; paste LinkedIn post links to add them to Posts. No database changes needed.
- Database: folio_studio_db (portfolios, skills, education, experience, projects, posts, messages).
