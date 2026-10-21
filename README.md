# Type-Away-Writer: Digital Storytelling Platform

<p align="center"><img width="525" height="168" alt="Type-Away-Writer logo" src="https://github.com/user-attachments/assets/44513b11-4509-4c67-8aa3-440bd1c79ae2" /></p>
<br>

Type-Away-Writer is a digital storytelling platform that allows children to engage in creative and language proficiency growth outside the classroom. Its **objective** is to provide a socially learning environment that offers Sri Lankan children within the age range of 6–15 years illimitable creative freedom and expert review to improve writing and literacy skills outside the classroom. 

The system was developed as a solution to address the subsequent identified gaps:
- Creative expression and exploration are not recognised as components of learning at school, despite evidence that they are conducive to a child's cognitive development.
- All existing digital creative-writing platforms are primarily designed for Western users.
- There is a lack of a platform that offers both expert review and creative freedom.

## 🌟 Highlights

Type-Away-Writer offers a plethora of features to ensure an environment that encourages children to engage in creative writing, while honing themselves in the craft, and in their literacy.

**Features for students (the target audience):**
- Story creation using easy-to-use rich-text editor provided by [Vanilla Quill.js](https://quilljs.com/)
- Story publication
- Story reading (and filtering)
- Collaboration
- Reading list creation (think digital bookshelves!)
- Story interaction (likes, comments, all the fun stuff!)
- Submission for review by language experts
- Tagging system (to streamline story filtering and discovering)

**Features for language experts (people who are fluent in English, who review stories and offer constructive feedback to young authors):**
- Receive review requests submitted by students.
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
- [PostreSQL](https://www.postgresql.org/)

🚆 **Infrastructure:**
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [GitHub Actions](https://github.com/features/actions) (for the CI/CD pipeline)
- GitHub Container Registry



## Getting Started with Create React App
This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

#### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

### Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

#### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

#### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

#### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

#### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

#### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

#### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
