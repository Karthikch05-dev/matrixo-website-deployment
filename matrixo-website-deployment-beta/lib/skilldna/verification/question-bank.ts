// ============================================================
// Skill Verification — Question Bank
// Curated question pools mapped by skill → category → difficulty
// Extensible: add new skills by adding entries to QUESTION_BANKS
// ============================================================

import { TestQuestion, SkillQuestionBank, Difficulty, QuestionType } from './types';

// ---- Helper to build question ids ----
let _qid = 0;
function qid(skill: string): string {
  _qid++;
  return `${skill.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${_qid}`;
}

// ---- Question factories ----

function mcq(
  skill: string,
  question: string,
  options: string[],
  correctIndex: number,
  difficulty: Difficulty,
  explanation?: string,
  tags?: string[],
): TestQuestion {
  return {
    id: qid(skill),
    question,
    options,
    correctIndex,
    difficulty,
    type: 'mcq' as QuestionType,
    explanation,
    tags,
  };
}

function scenario(
  skill: string,
  question: string,
  options: string[],
  correctIndex: number,
  difficulty: Difficulty,
  explanation?: string,
  tags?: string[],
): TestQuestion {
  return {
    id: qid(skill),
    question,
    options,
    correctIndex,
    difficulty,
    type: 'scenario' as QuestionType,
    explanation,
    tags,
  };
}

// ============================================================
// QUESTION BANKS — organized by skill
// ============================================================

const JAVASCRIPT_QUESTIONS: TestQuestion[] = [
  mcq('javascript', 'What is the output of typeof null in JavaScript?', ['"null"', '"object"', '"undefined"', '"boolean"'], 1, 'easy', 'typeof null returns "object" due to a legacy bug in JavaScript.', ['types']),
  mcq('javascript', 'Which method converts a JSON string to a JavaScript object?', ['JSON.stringify()', 'JSON.parse()', 'JSON.convert()', 'JSON.toObject()'], 1, 'easy', 'JSON.parse() parses a JSON string and returns a JavaScript value.', ['json']),
  mcq('javascript', 'What does the "===" operator check?', ['Value only', 'Type only', 'Value and type', 'Reference only'], 2, 'easy', '=== is the strict equality operator that checks both value and type.', ['operators']),
  mcq('javascript', 'What is a closure in JavaScript?', ['A way to close the browser', 'A function with access to its outer scope variables', 'A type of loop', 'A CSS property'], 1, 'medium', 'A closure is a function that retains access to variables from its enclosing scope.', ['closures']),
  mcq('javascript', 'What is the output of: console.log(0.1 + 0.2 === 0.3)?', ['true', 'false', 'undefined', 'NaN'], 1, 'medium', 'Due to floating-point precision, 0.1 + 0.2 equals 0.30000000000000004.', ['numbers']),
  mcq('javascript', 'Which array method does NOT mutate the original array?', ['push()', 'splice()', 'map()', 'sort()'], 2, 'medium', 'map() returns a new array without modifying the original.', ['arrays']),
  mcq('javascript', 'What is event delegation?', ['Delegating events to another thread', 'Attaching a single event listener to a parent element', 'Removing all event listeners', 'Creating custom events'], 1, 'medium', 'Event delegation leverages event bubbling to handle events at a parent level.', ['dom', 'events']),
  mcq('javascript', 'What does Promise.allSettled() return?', ['Only resolved values', 'Only rejected reasons', 'An array of objects with status and value/reason for each promise', 'The first settled promise'], 2, 'hard', 'Promise.allSettled() waits for all promises and returns their outcomes.', ['promises', 'async']),
  mcq('javascript', 'What is the Temporal Dead Zone (TDZ)?', ['A zone where time functions fail', 'The period between entering scope and variable declaration for let/const', 'A memory leak pattern', 'A deprecated feature'], 1, 'hard', 'TDZ is the period where let/const variables exist but cannot be accessed before declaration.', ['scope', 'hoisting']),
  scenario('javascript', 'You need to debounce a search input that fires API calls on every keystroke. Which approach is best?', ['Use setInterval to batch calls', 'Wrap the handler in a debounce function with setTimeout', 'Use synchronous XMLHttpRequest', 'Add a CSS animation delay'], 1, 'hard', 'Debouncing delays execution until a pause in input, reducing unnecessary API calls.', ['performance', 'patterns']),
  mcq('javascript', 'What is the purpose of the "use strict" directive?', ['Enables strict CSS mode', 'Opts into a restricted variant of JavaScript', 'Activates TypeScript mode', 'Turns off error logging'], 1, 'easy', '"use strict" enforces stricter parsing and error handling.', ['basics']),
  mcq('javascript', 'Which of these is NOT a primitive type in JavaScript?', ['string', 'boolean', 'object', 'symbol'], 2, 'easy', 'object is a reference type, not a primitive.', ['types']),
];

const PYTHON_QUESTIONS: TestQuestion[] = [
  mcq('python', 'What is the output of: print(type([]))?', ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"], 0, 'easy', '[] creates a list in Python.', ['types']),
  mcq('python', 'Which keyword is used to define a function in Python?', ['function', 'def', 'func', 'define'], 1, 'easy', 'The def keyword is used to define functions.', ['functions']),
  mcq('python', 'What does the "self" parameter represent in a class method?', ['The class itself', 'The instance of the class', 'A global variable', 'The parent class'], 1, 'easy', 'self refers to the current instance of the class.', ['oop']),
  mcq('python', 'What is a list comprehension?', ['A way to document lists', 'A concise way to create lists using a single line', 'A debugging tool', 'A type of dictionary'], 1, 'medium', 'List comprehensions provide a compact syntax for creating lists.', ['lists']),
  mcq('python', 'What is the difference between a list and a tuple?', ['Lists are faster', 'Tuples are mutable, lists are not', 'Lists are mutable, tuples are immutable', 'There is no difference'], 2, 'medium', 'Lists can be modified after creation, tuples cannot.', ['data-structures']),
  mcq('python', 'What does the @staticmethod decorator do?', ['Makes the method run faster', 'Defines a method that does not receive self or cls', 'Makes the method private', 'Caches the method result'], 1, 'medium', '@staticmethod creates a method that belongs to the class but does not access instance or class state.', ['oop', 'decorators']),
  mcq('python', 'What is a generator in Python?', ['A function that returns a list', 'A function that yields values lazily using yield', 'A class that generates random numbers', 'A built-in sorting function'], 1, 'hard', 'Generators produce values on-demand, saving memory for large sequences.', ['generators']),
  mcq('python', 'What is the GIL in CPython?', ['A graphics library', 'Global Interpreter Lock — prevents true multi-threaded execution', 'A garbage collection mechanism', 'A type of import'], 1, 'hard', 'The GIL ensures only one thread executes Python bytecode at a time.', ['concurrency']),
  scenario('python', 'You are processing a 10GB CSV file. Which approach is most memory-efficient?', ['Read entire file with pandas.read_csv()', 'Use a generator with csv.reader() line by line', 'Convert to JSON first then parse', 'Load into a list then iterate'], 1, 'hard', 'Processing line-by-line with a generator avoids loading the entire file into memory.', ['performance']),
  mcq('python', 'What does "pip" stand for?', ['Python Install Packages', 'Pip Installs Packages', 'Package Installation Program', 'Python Integration Platform'], 1, 'easy', 'pip is a recursive acronym: Pip Installs Packages.', ['tools']),
];

const REACT_QUESTIONS: TestQuestion[] = [
  mcq('react', 'What is JSX?', ['A JavaScript testing framework', 'A syntax extension that allows HTML-like code in JavaScript', 'A CSS framework', 'A database query language'], 1, 'easy', 'JSX is a syntax extension for JavaScript used with React.', ['basics']),
  mcq('react', 'What hook is used for side effects in functional components?', ['useState', 'useEffect', 'useRef', 'useMemo'], 1, 'easy', 'useEffect handles side effects like data fetching and subscriptions.', ['hooks']),
  mcq('react', 'What is the virtual DOM?', ['A physical DOM copy', 'A lightweight in-memory representation of the real DOM', 'A testing tool', 'A CSS rendering engine'], 1, 'easy', 'The virtual DOM is a programming concept where a virtual representation of the UI is kept in memory.', ['concepts']),
  mcq('react', 'When does useEffect with an empty dependency array run?', ['On every render', 'Only on mount and unmount', 'Never', 'On state change only'], 1, 'medium', 'An empty dependency array means the effect runs once on mount and cleanup on unmount.', ['hooks']),
  mcq('react', 'What is the purpose of React.memo()?', ['To create memos in the app', 'To memoize a component and prevent unnecessary re-renders', 'To manage state', 'To handle routing'], 1, 'medium', 'React.memo() skips re-rendering when props have not changed.', ['performance']),
  mcq('react', 'What is prop drilling and how do you avoid it?', ['A testing technique; use Jest', 'Passing props through many levels; use Context API or state management', 'A CSS technique; use Flexbox', 'A build optimization; use Webpack'], 1, 'medium', 'Prop drilling passes data through intermediate components. Context or state management libraries solve this.', ['patterns']),
  mcq('react', 'What is the difference between controlled and uncontrolled components?', ['Controlled use refs, uncontrolled use state', 'Controlled components have form data managed by React state', 'There is no difference', 'Uncontrolled components are faster'], 1, 'medium', 'Controlled components derive their input values from React state.', ['forms']),
  scenario('react', 'Your React app re-renders 100+ list items on every keystroke in a search input. What is the best optimization?', ['Add more RAM', 'Use React.memo for list items + useMemo for filtered list + debounce input', 'Remove the search feature', 'Use class components instead'], 1, 'hard', 'Combining memoization with debouncing prevents expensive re-renders on every keystroke.', ['performance']),
  mcq('react', 'What is a React Portal?', ['A way to navigate between pages', 'A way to render children into a DOM node outside the parent hierarchy', 'A state management library', 'A testing utility'], 1, 'hard', 'Portals render children into a different DOM subtree, useful for modals and tooltips.', ['advanced']),
  mcq('react', 'What is Suspense used for?', ['Error handling', 'Declaratively specifying loading states for async operations', 'CSS animations', 'Form validation'], 1, 'hard', 'Suspense lets you show fallback content while waiting for async operations like lazy loading.', ['advanced']),
];

const TYPESCRIPT_QUESTIONS: TestQuestion[] = [
  mcq('typescript', 'What is the main benefit of TypeScript over JavaScript?', ['Faster execution', 'Static type checking at compile time', 'Smaller bundle size', 'Better CSS support'], 1, 'easy', 'TypeScript adds static type checking to catch errors before runtime.', ['basics']),
  mcq('typescript', 'What is the "any" type in TypeScript?', ['A type that accepts only strings', 'A type that opts out of type checking', 'A type for arrays only', 'A type for async functions'], 1, 'easy', 'any disables type checking for that variable.', ['types']),
  mcq('typescript', 'What is the difference between "interface" and "type"?', ['They are identical', 'Interfaces can be extended with extends, types use intersections; interfaces are open for declaration merging', 'Types are faster', 'Interfaces only work with classes'], 1, 'medium', 'Both can describe object shapes, but interfaces support declaration merging.', ['types']),
  mcq('typescript', 'What does the "keyof" operator do?', ['Returns all keys of an object at runtime', 'Creates a union type of all property names of a type', 'Deletes a key from an object', 'Checks if a key exists'], 1, 'medium', 'keyof creates a union of literal types from the keys of a given type.', ['utility-types']),
  mcq('typescript', 'What is a generic in TypeScript?', ['A default type', 'A way to create reusable components that work with various types', 'A type that is always string', 'A runtime type check'], 1, 'medium', 'Generics allow writing flexible, reusable functions and classes.', ['generics']),
  mcq('typescript', 'What is a discriminated union?', ['A union with a common literal property used for narrowing', 'A union that excludes certain types', 'A type for arrays', 'A deprecated feature'], 0, 'hard', 'Discriminated unions use a shared property with literal types for type narrowing.', ['advanced']),
  mcq('typescript', 'What does the "infer" keyword do in conditional types?', ['Infers the return type of a function at runtime', 'Declares a type variable within a conditional type', 'Imports types automatically', 'Creates inference rules for ESLint'], 1, 'hard', 'infer captures a type within a conditional type expression.', ['advanced', 'conditional-types']),
  scenario('typescript', 'You want a function that accepts either a string ID or a numeric ID and returns the corresponding user type. What is the best TypeScript approach?', ['Use any for the parameter', 'Use function overloads with specific return types', 'Cast everything to string', 'Use a single object parameter'], 1, 'hard', 'Function overloads provide precise type signatures for different input/output combinations.', ['patterns']),
];

const HTML_CSS_QUESTIONS: TestQuestion[] = [
  mcq('html-css', 'What does the "alt" attribute in an <img> tag do?', ['Sets image size', 'Provides alternative text for accessibility', 'Changes image format', 'Adds a border'], 1, 'easy', 'alt text describes the image for screen readers and when images fail to load.', ['html', 'accessibility']),
  mcq('html-css', 'What is the CSS box model?', ['A 3D rendering technique', 'Content + padding + border + margin layout model', 'A JavaScript framework', 'A responsive design pattern'], 1, 'easy', 'The box model determines how element dimensions and spacing are calculated.', ['css', 'layout']),
  mcq('html-css', 'What is the difference between display: none and visibility: hidden?', ['No difference', 'display: none removes from flow; visibility: hidden keeps space', 'visibility: hidden is faster', 'display: none only works on divs'], 1, 'medium', 'display: none removes the element from document flow entirely.', ['css']),
  mcq('html-css', 'What is a CSS Grid?', ['A JavaScript library', 'A two-dimensional layout system for rows and columns', 'A type of flexbox', 'A media query'], 1, 'medium', 'CSS Grid provides a powerful 2D layout system.', ['css', 'layout']),
  mcq('html-css', 'What is semantic HTML?', ['HTML with inline styles', 'Using elements that convey meaning (header, nav, article, etc.)', 'HTML generated by AI', 'Minified HTML'], 1, 'medium', 'Semantic HTML uses elements that describe their content structurally.', ['html', 'accessibility']),
  scenario('html-css', 'A modal dialog needs to overlay the entire page and center its content. Which CSS approach is most robust?', ['Use position: absolute with calculated margins', 'Use position: fixed with inset: 0, display: grid, place-items: center', 'Use float: center', 'Use text-align: center on the body'], 1, 'hard', 'Fixed positioning with grid centering handles all viewport sizes reliably.', ['css', 'layout']),
];

const NODE_QUESTIONS: TestQuestion[] = [
  mcq('nodejs', 'What is Node.js?', ['A browser engine', 'A JavaScript runtime built on Chrome V8 engine', 'A CSS preprocessor', 'A database'], 1, 'easy', 'Node.js allows running JavaScript outside the browser.', ['basics']),
  mcq('nodejs', 'What is the event loop in Node.js?', ['A for loop optimization', 'A mechanism that handles asynchronous callbacks in a single thread', 'A UI rendering loop', 'A testing pattern'], 1, 'medium', 'The event loop processes async operations, enabling non-blocking I/O.', ['concepts']),
  mcq('nodejs', 'What is middleware in Express.js?', ['Database connection', 'Functions that process requests between receiving and responding', 'A styling framework', 'A caching mechanism'], 1, 'medium', 'Middleware functions have access to req, res, and next in the request pipeline.', ['express']),
  mcq('nodejs', 'What is the purpose of package.json?', ['To store user data', 'To define project metadata, dependencies, and scripts', 'To configure the database', 'To write HTML'], 1, 'easy', 'package.json is the manifest file for Node.js projects.', ['tools']),
  mcq('nodejs', 'What is the difference between process.nextTick() and setImmediate()?', ['They are the same', 'nextTick fires before I/O callbacks; setImmediate fires after', 'setImmediate is synchronous', 'nextTick is deprecated'], 1, 'hard', 'process.nextTick() queues before the next event loop phase; setImmediate() queues at the end of the current phase.', ['event-loop']),
  scenario('nodejs', 'Your Node.js API is blocking under heavy load because of a CPU-intensive computation. What is the best solution?', ['Add more RAM', 'Offload the computation to a Worker Thread', 'Use setTimeout', 'Switch to Python'], 1, 'hard', 'Worker Threads run CPU-intensive tasks in parallel without blocking the event loop.', ['performance']),
];

const DATA_SCIENCE_QUESTIONS: TestQuestion[] = [
  mcq('data-science', 'What is the difference between supervised and unsupervised learning?', ['Supervised is faster', 'Supervised uses labeled data; unsupervised finds patterns in unlabeled data', 'Unsupervised is more accurate', 'They are the same'], 1, 'easy', 'Supervised learning trains on labeled examples; unsupervised discovers hidden structure.', ['ml-basics']),
  mcq('data-science', 'What is overfitting?', ['Training too few epochs', 'When a model performs well on training data but poorly on new data', 'Using too much data', 'A data cleaning step'], 1, 'medium', 'Overfitting occurs when a model memorizes training data instead of learning generalizable patterns.', ['ml-concepts']),
  mcq('data-science', 'What is a confusion matrix?', ['A matrix that confuses the model', 'A table showing true/false positives and negatives for classification', 'A type of neural network', 'A data visualization tool'], 1, 'medium', 'A confusion matrix summarizes classification performance across predicted vs actual classes.', ['evaluation']),
  mcq('data-science', 'What is the purpose of cross-validation?', ['To validate user input', 'To assess model performance on unseen data by splitting data into folds', 'To clean data', 'To visualize results'], 1, 'medium', 'Cross-validation reduces overfitting risk by evaluating on multiple train/test splits.', ['evaluation']),
  mcq('data-science', 'What is the bias-variance tradeoff?', ['A negotiation technique', 'The balance between underfitting (high bias) and overfitting (high variance)', 'A data storage pattern', 'A visualization method'], 1, 'hard', 'Models must balance simplicity (bias) with flexibility (variance) for optimal generalization.', ['ml-theory']),
  scenario('data-science', 'You have a dataset with 95% class A and 5% class B. Which metric is most appropriate?', ['Accuracy', 'F1-Score or Precision-Recall AUC', 'Mean Squared Error', 'R-squared'], 1, 'hard', 'With imbalanced classes, accuracy is misleading. F1-Score balances precision and recall.', ['evaluation', 'imbalanced']),
];

const GIT_QUESTIONS: TestQuestion[] = [
  mcq('git', 'What does "git clone" do?', ['Creates a new branch', 'Creates a local copy of a remote repository', 'Deletes a repository', 'Merges two branches'], 1, 'easy', 'git clone downloads a repository and its complete history.', ['basics']),
  mcq('git', 'What is the difference between "git merge" and "git rebase"?', ['They are the same', 'Merge creates a merge commit; rebase replays commits on top of another branch', 'Rebase is always faster', 'Merge deletes the branch'], 1, 'medium', 'Merge preserves history; rebase creates a linear history by moving commits.', ['branching']),
  mcq('git', 'What does "git stash" do?', ['Deletes uncommitted changes', 'Temporarily stores uncommitted changes for later use', 'Creates a new branch', 'Pushes to remote'], 1, 'medium', 'git stash saves and cleans your working directory changes.', ['workflow']),
  mcq('git', 'What is a "detached HEAD" state?', ['A bug in Git', 'When HEAD points to a specific commit instead of a branch', 'When the repository is corrupted', 'When you have no branches'], 1, 'hard', 'Detached HEAD means you are not on any branch, making commits that could be lost.', ['advanced']),
];

const SQL_QUESTIONS: TestQuestion[] = [
  mcq('sql', 'What does SQL stand for?', ['Structured Query Language', 'Simple Query Logic', 'Standard Question Language', 'System Query Library'], 0, 'easy', 'SQL stands for Structured Query Language.', ['basics']),
  mcq('sql', 'What is the difference between WHERE and HAVING?', ['They are the same', 'WHERE filters rows before grouping; HAVING filters after GROUP BY', 'HAVING is faster', 'WHERE only works with numbers'], 1, 'medium', 'WHERE operates on individual rows; HAVING operates on aggregated groups.', ['queries']),
  mcq('sql', 'What is a JOIN?', ['A way to delete tables', 'A way to combine rows from two or more tables based on a related column', 'A backup command', 'A security feature'], 1, 'medium', 'JOINs combine data from multiple tables using matching columns.', ['joins']),
  mcq('sql', 'What is an index and when should you use one?', ['A table of contents for data that speeds up queries on frequently searched columns', 'A way to rename tables', 'A backup mechanism', 'A type of stored procedure'], 0, 'hard', 'Indexes improve query performance but add overhead to writes.', ['performance']),
];

const COMMUNICATION_QUESTIONS: TestQuestion[] = [
  scenario('communication', 'A teammate disagrees with your technical approach in a code review. What is the best response?', ['Ignore their comments', 'Acknowledge their perspective, present data supporting your approach, and suggest discussing in a call', 'Escalate to management immediately', 'Rewrite everything their way without discussion'], 1, 'easy', 'Effective communication involves active listening, evidence-based discussion, and collaboration.', ['soft-skills']),
  scenario('communication', 'You need to explain a complex technical decision to a non-technical stakeholder. What approach works best?', ['Use as many technical terms as possible', 'Use analogies, focus on business impact, and avoid jargon', 'Send them the source code', 'Skip the explanation and just do it'], 1, 'medium', 'Translating technical concepts into business language ensures stakeholder understanding.', ['soft-skills']),
  scenario('communication', 'A critical production bug is reported during a team meeting. How should you communicate?', ['Panic and blame the last person who deployed', 'Clearly describe the impact, assign investigation tasks, set a follow-up timeline, and keep stakeholders informed', 'Ignore it until after the meeting', 'Send a vague email later'], 1, 'medium', 'Crisis communication requires clarity, ownership, and structured follow-up.', ['soft-skills']),
  scenario('communication', 'You are leading a retrospective and the team is not participating. What do you do?', ['Cancel the meeting', 'Use structured formats like Start/Stop/Continue, ask specific questions, and create psychological safety', 'Criticize the team for not talking', 'Fill the silence with your own opinions'], 1, 'hard', 'Facilitation techniques and psychological safety encourage team participation.', ['leadership']),
];

const DOCKER_QUESTIONS: TestQuestion[] = [
  mcq('docker', 'What is Docker?', ['A programming language', 'A platform for building, shipping, and running applications in containers', 'A database', 'A testing framework'], 1, 'easy', 'Docker containerizes applications for consistent deployment.', ['basics']),
  mcq('docker', 'What is the difference between an image and a container?', ['They are the same', 'An image is a template; a container is a running instance of an image', 'A container is a template; an image is running', 'Images are only for production'], 1, 'easy', 'Images are read-only templates; containers are executable instances.', ['concepts']),
  mcq('docker', 'What is a Dockerfile?', ['A log file', 'A text file with instructions to build a Docker image', 'A container configuration', 'A network setting'], 1, 'medium', 'Dockerfiles define the steps to create a Docker image.', ['basics']),
  mcq('docker', 'What is Docker Compose used for?', ['Building individual containers', 'Defining and running multi-container Docker applications', 'Monitoring container health', 'Container security scanning'], 1, 'medium', 'Docker Compose orchestrates multiple containers with a single YAML file.', ['orchestration']),
  mcq('docker', 'What is the best practice for Docker image layers?', ['Use one RUN command per line', 'Combine related commands in fewer layers and use multi-stage builds', 'Never use caching', 'Always run as root'], 1, 'hard', 'Fewer layers and multi-stage builds reduce image size and build time.', ['best-practices']),
];

const MACHINE_LEARNING_QUESTIONS: TestQuestion[] = [
  mcq('machine-learning', 'What is a neural network?', ['A biological brain scan', 'A computing system inspired by biological neural networks', 'A database schema', 'A CSS framework'], 1, 'easy', 'Neural networks are computational models inspired by the brain.', ['basics']),
  mcq('machine-learning', 'What is gradient descent?', ['A way to climb graphs', 'An optimization algorithm that minimizes a loss function', 'A data visualization technique', 'A type of database query'], 1, 'medium', 'Gradient descent iteratively adjusts parameters to minimize the error.', ['optimization']),
  mcq('machine-learning', 'What is the difference between bagging and boosting?', ['They are the same', 'Bagging trains models in parallel; boosting trains sequentially to correct errors', 'Boosting is always better', 'Bagging uses neural networks only'], 1, 'medium', 'Bagging reduces variance; boosting reduces bias by learning from mistakes.', ['ensembles']),
  mcq('machine-learning', 'What is transfer learning?', ['Moving data between databases', 'Using a pre-trained model on a new but related task', 'A type of reinforcement learning', 'A data augmentation technique'], 1, 'hard', 'Transfer learning leverages knowledge from one task to improve performance on another.', ['deep-learning']),
  mcq('machine-learning', 'What is the vanishing gradient problem?', ['When gradients become too large', 'When gradients become so small that early layers stop learning', 'When the model runs out of memory', 'A problem with data loading'], 1, 'hard', 'In deep networks, gradients can shrink exponentially, preventing early layers from updating.', ['deep-learning']),
];

const FIGMA_QUESTIONS: TestQuestion[] = [
  mcq('figma', 'What is Figma primarily used for?', ['Backend development', 'UI/UX design and prototyping', 'Database management', 'Video editing'], 1, 'easy', 'Figma is a collaborative design tool for UI/UX.', ['basics']),
  mcq('figma', 'What are Auto Layout frames in Figma?', ['Frames that automatically code your design', 'Frames that dynamically resize based on their content', 'A plugin for animation', 'A way to export images'], 1, 'medium', 'Auto Layout creates responsive designs that adapt to content changes.', ['features']),
  mcq('figma', 'What are Design Tokens in Figma?', ['Security credentials', 'Reusable design values like colors, spacing, and typography', 'A cryptocurrency', 'A file format'], 1, 'medium', 'Design tokens create a shared language between design and development.', ['design-systems']),
  scenario('figma', 'A developer says your design has inconsistent spacing. What is the best approach?', ['Ignore the feedback', 'Create a spacing system with 4px/8px grid and apply it consistently using Auto Layout', 'Use random spacing for creativity', 'Let the developer decide spacing'], 1, 'hard', 'A systematic spacing grid ensures consistency and developer-friendly handoff.', ['best-practices']),
];

// ============================================================
// BANK REGISTRY — maps normalized skill names to question pools
// ============================================================

const BANK_REGISTRY: Record<string, { category: string; questions: TestQuestion[] }> = {
  'javascript':       { category: 'Programming',          questions: JAVASCRIPT_QUESTIONS },
  'js':               { category: 'Programming',          questions: JAVASCRIPT_QUESTIONS },
  'python':           { category: 'Programming',          questions: PYTHON_QUESTIONS },
  'react':            { category: 'Web Development',      questions: REACT_QUESTIONS },
  'react.js':         { category: 'Web Development',      questions: REACT_QUESTIONS },
  'reactjs':          { category: 'Web Development',      questions: REACT_QUESTIONS },
  'typescript':       { category: 'Programming',          questions: TYPESCRIPT_QUESTIONS },
  'ts':               { category: 'Programming',          questions: TYPESCRIPT_QUESTIONS },
  'html':             { category: 'Web Development',      questions: HTML_CSS_QUESTIONS },
  'css':              { category: 'Web Development',      questions: HTML_CSS_QUESTIONS },
  'html/css':         { category: 'Web Development',      questions: HTML_CSS_QUESTIONS },
  'html & css':       { category: 'Web Development',      questions: HTML_CSS_QUESTIONS },
  'node':             { category: 'Programming',          questions: NODE_QUESTIONS },
  'node.js':          { category: 'Programming',          questions: NODE_QUESTIONS },
  'nodejs':           { category: 'Programming',          questions: NODE_QUESTIONS },
  'express':          { category: 'Web Development',      questions: NODE_QUESTIONS },
  'express.js':       { category: 'Web Development',      questions: NODE_QUESTIONS },
  'data science':     { category: 'Data Science',         questions: DATA_SCIENCE_QUESTIONS },
  'data-science':     { category: 'Data Science',         questions: DATA_SCIENCE_QUESTIONS },
  'git':              { category: 'DevOps',               questions: GIT_QUESTIONS },
  'github':           { category: 'DevOps',               questions: GIT_QUESTIONS },
  'sql':              { category: 'Database',             questions: SQL_QUESTIONS },
  'mysql':            { category: 'Database',             questions: SQL_QUESTIONS },
  'postgresql':       { category: 'Database',             questions: SQL_QUESTIONS },
  'postgres':         { category: 'Database',             questions: SQL_QUESTIONS },
  'communication':    { category: 'Communication',        questions: COMMUNICATION_QUESTIONS },
  'soft skills':      { category: 'Communication',        questions: COMMUNICATION_QUESTIONS },
  'docker':           { category: 'DevOps',               questions: DOCKER_QUESTIONS },
  'machine learning': { category: 'Machine Learning / AI', questions: MACHINE_LEARNING_QUESTIONS },
  'ml':               { category: 'Machine Learning / AI', questions: MACHINE_LEARNING_QUESTIONS },
  'deep learning':    { category: 'Machine Learning / AI', questions: MACHINE_LEARNING_QUESTIONS },
  'figma':            { category: 'UI / UX Design',       questions: FIGMA_QUESTIONS },
  'ui/ux':            { category: 'UI / UX Design',       questions: FIGMA_QUESTIONS },
  'ui/ux design':     { category: 'UI / UX Design',       questions: FIGMA_QUESTIONS },
};

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Returns the question bank for a given skill name.
 * Normalises the name to lowercase for lookup.
 * Returns null if no questions exist for this skill.
 */
export function getQuestionBank(skillName: string): SkillQuestionBank | null {
  const key = skillName.toLowerCase().trim();
  const entry = BANK_REGISTRY[key];
  if (!entry) return null;
  return {
    skillName: key,
    category: entry.category,
    questions: entry.questions,
    lastUpdated: '2026-03-03',
  };
}

/**
 * Check if a skill has verification questions available.
 */
export function hasVerificationQuestions(skillName: string): boolean {
  return BANK_REGISTRY[skillName.toLowerCase().trim()] !== undefined;
}

/**
 * Get all supported skill names (for UI listing).
 */
export function getSupportedSkills(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const [key, entry] of Object.entries(BANK_REGISTRY)) {
    // De-duplicate aliases (show one canonical name per question set)
    const qLen = entry.questions.length;
    const dedup = `${entry.category}_${qLen}`;
    if (!seen.has(dedup)) {
      seen.add(dedup);
      result.push(key);
    }
  }
  return result;
}
