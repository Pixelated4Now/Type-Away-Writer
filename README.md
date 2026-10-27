# Type-Away-Writer: Digital Storytelling Platform

<p align="center"><img width="525" height="168" alt="Type-Away-Writer logo" src="https://github.com/user-attachments/assets/44513b11-4509-4c67-8aa3-440bd1c79ae2" /></p>
<br>

Type-Away-Writer is a digital storytelling platform that allows children to engage in creative and language proficiency growth outside the classroom. Its **objective** is to provide a social learning environment that offers Sri Lankan children primarily within the age range of 6–15 years illimitable creative freedom and expert review to improve writing and literacy skills outside the classroom. 

The system was developed as a solution to address the subsequent identified gaps:
- Creative expression and exploration are not recognised as components of learning at school, despite evidence that they are conducive to a child's cognitive development.
- All existing digital creative-writing platforms are primarily designed for Western users.
- There is a lack of a platform that offers both expert review and creative freedom.

This platform was developed by me as the Final Year Project for my BSc (Hons) in Software Engineering degree. It contributes to the field of educational technology by illustrating how web-based platforms can be designed to support both creativity and language development in specific cultural contexts. 

## 🌟 Highlights

Type-Away-Writer offers a plethora of features to ensure an environment that encourages children to engage in creative writing, while honing themselves in the craft and in their literacy.

**Features for students (the target audience):**
- Story creation via an easy-to-use rich-text editor provided by [Vanilla Quill.js](https://quilljs.com/)
- Story publication
- Story reading (and filtering)
- Collaboration
- Reading list creation (think digital bookshelves!)
- Story interaction (likes, comments, all the fun stuff!)
- Submission for review by language experts
- Tagging system (to streamline story filtering and discovering)

**Features for language experts (people who are fluent in English, who review stories and offer constructive feedback to young authors):**
- Receive review requests submitted by students
- Story reading (and filtering)
- Story interaction (they can like stories, too!)
- Story review (language experts can review both stories willingly submitted to them by authors, and any stories they stumble across and decide to review of their own accord)

**Administrators (though not a huge focus of the system, they are important to keeping the platform and its ecosystem in check):**
- User management
- Expert approval (they verify all qualification documents submitted by experts during registration and decide if they can be made experts or not)
- Content management
- Story tag and genre management
- Analytics

## 🤖 Technology Stack
🥞 **Front-end:**
- [React.js](https://react.dev/)
- Custom CSS files
- [Vanilla Quill.js](https://quilljs.com/)

🧱 **Back-end:**
- [Node.js](https://nodejs.org/en)
- [Express.js](https://expressjs.com/)
- [Multer](https://www.npmjs.com/package/multer) (for file upload handling)
- [Nodemailer](https://nodemailer.com/) (to handle automatic email sending)
- [Jsonwebtoken](https://www.jwt.io/) (for session management)
- [pg](https://www.npmjs.com/package/pg) library
- [CORS](https://www.npmjs.com/package/cors) package

🗄️ **Database:**
- [PostgreSQL](https://www.postgresql.org/)

🚆 **Infrastructure:**
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [GitHub Actions](https://github.com/features/actions) (for the CI/CD pipeline)
- GitHub Container Registry

## 🚀 Usage Instructions

Follow this guide to figure out how to clone this repository and make it _work_.

### 🪴 Platform Requirements
The following items of software must be installed on your device before you can successfully run Type-Away-Writer:
- **Docker Desktop:** Version 4.0 or later
- **A Gmail account with an app password**[^1]
- **Web browser:** any web browser of the user's choice
- **Minimum RAM:** 4GB (8GB recommended)
- **Disk space:** at least 2GB free

No additional software installations are required. All dependencies, including Node.js, PostgreSQL, and the npm packages, are managed within the Docker containers to ensure user convenience.

### ⬇️ Installation and Set-Up
1. Clone the repository from GitHub.
   ```
   git clone https://github.com/Pixelated4Now/Type-Away-Writer.git
   cd Type-Away-Writer
   ```

2. Create the environment file by copying the provided example (`.env.example`):
   ```
   cp .env.example .env
   ```
   
3. Open the `.env` file and fill in the required values:
   - `POSTGRES_PASSWORD`: a password of your choice for the database
   - `JWT_SECRET`: a random string used for authentication tokens (for instance, `taw_secret_2026`)
   - `GMAIL_USER`: a Gmail address for sending verification emails
   - `GMAIL_APP_PASSWORD`: the Gmail App Password for the email address provided for `GMAIL_USER`[^1].
   - `FRONTEND_URL`: leave it as [http://localhost:3000]()
4. Start the application by keying the following command into the terminal:
     ```
     docker compose up --build
     ```
5. Wait for all three containers (`taw_db` for the database, `taw_backend` for the back-end, and `taw_frontend` for the front-end) to start[^2].
     
   <img width="500" alt="Terminal output once all services have started" src="https://github.com/user-attachments/assets/dad1d74a-5300-486f-aad9-6f630683182f" /><br/>

   <img width="2140" alt="Docker Desktop showing the three running containers" src="https://github.com/user-attachments/assets/b8fdb5a8-d1c1-4df2-b4a9-c5b0a9900594" />


6. Open a web browser and navigate to [http://localhost:3000](). 

  
[^1]: To generate an App Password, go to the Google Account security settings, navigate to '2-Step Verification', select 'App passwords' at the bottom, name the app (Gmail), and click 'Create' to generate a 16-digit code.
[^2]: This may take several minutes on the first run as Docker downloads and builds the required images. The application is ready when the terminal shows that all services have started successfully.

### 🔍 Platform Operation
> [!NOTE]
> Useful information to know in order to use the system as each type of user (student, language expert, and admin).

As a student:
- Navigate to [http://localhost:3000]() and click the _Sign Up_ button to register a new student account.
- Complete the four-step registration process and verify your email address using the code sent to your inbox.
- Once logged in, you can:
  - use the _Write_ menu to start a new story or collaboration.
  - browse and read stories by clicking _Read_ in the navigation bar.
  - manage your stories, drafts, reading lists, and profile from your profile page.

As a language expert:
- Register using the _Language Expert_ option on the registration page and upload your qualification documents.
- An administrator must verify your account before expert privileges are granted.
- Once verified, log in and navigate to the _Review_ page to manage review requests from students.

As an admin:
- A default admin account is created automatically the first time Type-Away-Writer starts. Log in with these test credentials:
  - **Email address:** admin@typeawaywriter.com
  - **Password:** admin123

These credentials are for local testing only. To use different ones, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env` file before the first start.

### 🛑 Stopping the Application
- Press **Ctrl + C** in the terminal where Docker Compose is running.
- Run the following command[^3]:
  ```
  docker compose down
  ```

[^3]: To stop the application while preserving the database data, use `docker compose down` without any additional flags. To reset the database completely, run `docker compose down -v`. 