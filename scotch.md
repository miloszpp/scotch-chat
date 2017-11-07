# Introduction
Angular is an amazing framework which lets you quickly create complex client-side applications. However, a web application is rarely useful without a server-side part (also known as *backend*). The backend usually serves as a central place where you can store data or authenticate users. Implementing the server yourself is a huge task that requires knowledge of technologies such as .NET, JVM or Rails.

However, with Firebase you don't need to implement the backend yourself! The platform makes common functionalities such as data storage or authentication available directly to JavaScript (and mobile) applications. As a result, you can *rapidly develop full-blown web applications without any expertise in server-side programming*.

What's more, the database offered by Firebase is not a traditional database. What makes it special is the fact that it's *realtime*. This means that you don't need to poll for data to get the latest version of it. Instead, Firebase automatically feeds your client-side app with the newest data.

In this tutorial we will build a fully functional realtime chat application. Chat client is a great use case for Firebase as it embraces the realtime aspect of its database.

Basic knowledge of the Angular framework is a pre-requisite for this course. If you're not familiar with it, please take a look at **this course** here.

# Firebase console
We're going to take advantage of two Firebase offerings:
* *Firebase Realtime Database* - it's a database to which you can connect directly from a JavaScript application; it stores JSON objects and it's realtime
* *Authentication* - it's a service that helps you authenticate your users; you can either ask users to register with their own emails and passwords or let them login with their Google, Facebook or Twitter (and others) accounts; we will go for the latter option as it's simpler to implement 

The great news is that Firebase has a free usage plan. It means that you can play with it (or host small applications) without having to pay for it. However, you will need a (free) Google account in order to use Firebase.

Let's start by going to the Firebase console.

TODO
- create app
- setup database rules
- enable Google authentication

# Initial setup
It's time to write some code. Firstly, let's use Angular CLI to generate the project skeleton. In case you are not familiar with Angular CLI - it's a command line tool which facilitates Angular development (read more [here](https://cli.angular.io/)). Thanks to the `minimal` flag it will generate only the necessary files. 
```
npm new scotch-chat --minimal
```
Next, we need to install a couple of dependencies:
```
npm install firebase angularfire2 ngx-bootstrap ngx-toastr
```
Let me explain each o them.
* `firebase` is a Firebase client for JavaScript
* `angularfire2` extends the `firebase` package with some nice Angular-specific functionality
* `ngx-bootstrap` introduces the Bootstrap CSS framework to Angular; we will use it only for the look and feel
* `ngx-toastr` is a useful library for displaying confirmations and error messages

# Angular CLI setup

Angular CLI is a complex tool which has its own configuration file called `.angular-cli.json`. We need to adjust it slightly.
* firstly, we need to load some CSS stylesheets for Bootstrap and Toastr
* secondly, the CLI will generate components with inlined templates by default; we'd rather have templates in separate files

For the CSS stylesheets, find `styles` key in the file and set it to the following:
```javascript
"styles": [
  "styles.css",
  "../node_modules/bootstrap/dist/css/bootstrap.min.css",
  "../node_modules/ngx-toastr/toastr.css"
],
```

For the latter, search for `inlineTemplate` key and change the value to `false`.

# AngularFire2 initialization
Since we're going to connect to Firebase from our app, we need to specify the connection details somewhere in our source code. Let's put them inside the `src/environments/environment.ts` file.
```javascript
export const environment = {
  production: false,
  firebase: {
    apiKey: '{{YOUR_API_KEY}}',
    authDomain: '{{YOUR_PROJECT_ID}}.firebaseapp.com',
    databaseURL: 'https://{{YOUR_PROJECT_ID}}.firebaseio.com',
    projectId: '{{YOUR_PROJECT_ID}}',
  }
};
```
Obviously, you need to replace the tokens with values specific to the project you've previously created. You can find them in the Firebase Console, as shown on the below screenshot.
![Firebase Console Project Settings](https://cdn.scotch.io/24101/dkVACMESEOyCFuIx7f8U_firebase_project_settings.png)
Once we've got this, let's proceed to the `app.module.ts` file. Here we will import the modules we've previously installed. When importing the `angularfire2` module we need to initialize it with the settings stored inside `environment.ts`.
```javascript
@NgModule({
  declarations: [ AppComponent ],
  imports: [
    BrowserModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```
Apart from the `AngularFireModule` we also import `AngularFireDatabaseModule` and `AngularFireAuthModule`. These are specific feature modules that we need to import if we want to make use of specific aspects (such as authentication and database) of the Firebase platform.

Note that `FormsModule` is also imported. We will use it as our application will contain a tiny form.

# Authentication

Let's start with setting up some authentication. It would be nice if our chat messages weren't sent anonymously, right? It's usually quite a tedious task to set up authentication from scratch and it requires a lot of work on the backend side. Fortunately, with Firebase it's much simpler.

To begin with, let's create a file called `model.ts` and put it inside the `app` directory. In this file we will store interfaces describing our (simple) domain model. For authentication we will need the the `User` interface which will only contain the user name.

```javascript
export interface User {
    name: string;
}
```

We're going to put all of the authentication logic inside a separate service called `AuthService`. It's a good idea to *hide* the `Angularfire2` API behind our own abstraction. This way we will make the application easier to test and less dependent on a specific library.
```
ng generate service auth
```

Our `AuthService` will have three methods: `login`, `logout` and `getUserStream`. The first two are pretty self-explanatory. However, `getUserStream` seems interesting. Thanks to the reactive nature of Firebase we'll be dealing with an `Observable` of users. Whenever an event related to authentication occurs (such as a user logging in or out) the `Observable` will emit a value. This approach might sound overcomplicated but it as we'll see it has it's own advantages.

```javascript
@Injectable()
export class AuthService {
  constructor(private afAuth: AngularFireAuth) { }

  getUserStream(): Observable<User> {
    return this.afAuth.authState.map(state => state ? <User>{ name: state.email } : null);
  }

  login() {
    this.afAuth.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  logout() {
    this.afAuth.auth.signOut();
  }
}
```

We inject `AngularFireAuth` into our service as it will be provided by `AngularFireAuthModule`. This object lets us implement authentication based on a 3-rd party provider (such as Google or Facebook) very easily. 

Note how we `map` values emited by `this.afAuth.authState` so that we get an `Observable` of our own `User` objects. We need to pay attention to `state` being `null` as it is emmited if there is no user currently logged in.

Finally, take a look at the `login` method. We pass `firebase.auth.GoogleAuthProvider()` to `signInWithPopup` which means that we're going to ask the users to log in with their Google accounts. Once they do `this.afAuth.authState` observable will emit a new value. Similarly, when the user logs out it will emit a `null`.

# User interface for authentication

Since we've got out `AuthService` ready, it's time to make use of it. We'll create a new component where we'll put sign-in and sign-out buttons. Since authentication controls are often part of site navigation, we'll call the component `navbar`.
```
ng generate component navbar
```

The component's code will be very simple. It will be basically a proxy to the `AuthService`. It will also expose the `userStream` observable to the template.
```javascript
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  userStream: Observable<User>;

  constructor(private authService: AuthService) {
    this.userStream = authService.getUserStream();
  }

  login() {
    this.authService.login();
  }

  logout() {
    this.authService.logout();
  }
}
```

The template is far more interesting.
```html
<nav class="navbar navbar-default">
  <div class="container-fluid">
    <a class="navbar-brand" href="#">ScotchChat</a>
    <span *ngIf="userStream | async; let user; else showLogin">
      <p class="navbar-text">Signed in as {{ user.name }}</p>
      <button (click)="logout()" type="button" class="btn btn-default navbar-btn">Sign out</button>
    </span>
    <ng-template #showLogin>
      <button (click)="login()" type="button" class="btn btn-default navbar-btn">Sign in</button>
    </ng-template>
  </div>
</nav>
```

There is of course a lot of HTML in order to comply with Bootstrap and make the application look nice. However, let's focus on Angular syntax.

Note that we need to implement some display logic here. If a user is logged in we want to show the username and a sign-out button. Otherwise, we need to show a sign-in button. Sounds very much like a use case for the `ngIf` directive...

However, remember that our component doesn't expose a plain `User` object but an `Observable<User>` instead. Thankfully, Angular gives us the `async` pipe which makes working with observables very simple. What's more, the special `ngIf` syntax lets us *unwrap* the observable (with `let` keyword) and also decide what to show when the `userStream` emits a `null` (with `else` keyword).
```
userStream | async; let user; else showLogin
```

What comes after `else` is a *template variable* which points to an `ng-template` which is a piece of HTML that is not initially attached to the DOM tree. However, if the `ngIf` condition evaluates to `false` the template will be attached in place of the original HTML inside the element decorated with `ngIf`.

Great, that was all that was needed to implement authentication in our app!

# Handling messages

It's time to implement the core of our chat application. Let's start by extending our model (inside `model.ts`) with `Message` interface.
```javascript
export interface Message {
    author: string;
    content: string;
    timestamp: number;
}
```

Next, we'll create another service. It's responsibility will be to manage `Message` objects.
```javascript
@Injectable()
export class MessageService {
  messages: AngularFireList<Message>;

  constructor(private db: MessageService) {
    this.messages = this.db.list<Message>(
      'messages', 
      ref => ref.orderByChild('timestamp').limitToLast(10)
    );
  }

  getMessagesStream(): Observable<Message[]> {
    return this.messages.valueChanges();
  }

  add(content: string, author: string): PromiseLike<any> {
    return this.messages.push(<Message>{
      author: author,
      content: content,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    });
  }
}
```

The service's constructor takes `MessageService` object as parameter. It comes from `angularfire2` and will help us talk to Firebase. Inside the constructor we bind the `messages` field to a remote collection of objects stored inside the Firebase Realtime Database names `messages`. Don't worry about the fact that the collection doesn't exist at this point - it will be created automatically!
```javascript
  this.messages = this.db.list<Message>(
    'messages', 
    ref => ref.orderByChild('timestamp').limitToLast(10)
  );
```

The second parameter to `list` is a function that describes a Firebase query. It's pretty self-explanatory - we want to show the 10 latest messages in our chat application.

Next, inside `getMessagesStream` we return a `valueChanges` stream of `Message[]`. Again, the reactive nature of Firebase manifests itself. This is where real magic happens - this observable will emit a new value whenever *anyone* makes a change to the observed collection *inside the remote database*. This means that we don't need to poll for the latest version of the collection manually. Instead, the latest version will be *pushed* to our application automatically!

Finally, we implement adding new messages inside `add` method. It's as simple as calling `push` on the `messages` object. We need to pass a `Message` object as argument. We do some cheating here though. Instead of settint the `timestamp` to a locally produced value (such as `Date.now`) we'd much prefer to use a server-generated value. We can achieve this by using `firebase.database.ServerValue.TIMESTAMP`. However, in such case the object will no longer comply to `Message` interface. Therefore, we need to explicitly cast it before passing it to `push`.

# Message list
We're getting there. We just need two more components:
* one for displaying the list of latest messages
* one for adding new messages

Let's generate these components with Angular CLI:
```
ng generate component message-list
ng generate component message-add
```

Since the heavy-lifting is done by the `MessageService` these components will be quite lightweight.

Let's start with the message list.
```javascript
@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.component.html'
})
export class MessageListComponent implements OnInit {
  @Input() user: User;
  
  messages: Observable<Message[]>;

  constructor(private messageService: MessageService) { }

  ngOnInit() {
    this.messages = this.messageService.getMessagesStream();
  }
}
```

As promised, the component doesn't do much. It simply exposes the message stream. Additionally, it takes the currently logged user as `Input`. This will be needed to highlight the messages posted by the current user.

```html
<div class="panel panel-default">
  <div class="panel-body">
    <div class="row message" 
         *ngFor="let message of messages | async" 
         [ngClass]="{ 'my-message': message.author === user.name }">
      <div class="col-sm-2">
        {{ message.author }}
      </div>
      <div class="col-sm-8">
        {{ message.content }}
      </div>
      <div class="col-sm-2">
        {{ message.timestamp | date:"short" }}
      </div>
    </div>
  </div>
</div>
```

Inside the template we simply iterate over the message list. Again, we use the `async` pipe in order to unwrap the `messages` observable. Additionally, we use the `ngClass` directive to mark messages authored by the current user. This is a good moment to add classes we're referencing in this template to `styles.css`.
```css
.message {
    border-bottom: solid 1px gray;
    padding-top: 10px;
    padding-bottom: 10px;
}

.message:last-child {
    border-bottom: none;
}

.my-message {
    font-weight: bold;
}
```

# Adding messages
Let's focus on the last component now. It will be a tiny form with a single input that will push new messages to the Firebase database.

```javascript
@Component({
  selector: 'app-message-add',
  templateUrl: './message-add.component.html'
})
export class MessageAddComponent {
  @Input() user: User;

  constructor(
    private messageService: MessageService,
    private toastr: ToastrService
  ) { }

  sendMessage(form: NgForm) {
    this.messageService.add(form.value.content, this.user.name).then(
      () => { form.resetForm(); this.toastr.success("Message sent!"); },
      () => { this.toastr.error("Sending message failed"); }
    );
  }
}
```

The constructor takes two dependencies:
* `MessageService` for communication with the database
* `ToastrService` which is provided by `ngx-toastr` library and which we will use for displaying information about successful/failed push

`sendMessage` method simply calls `add` on `messageService`. Since the method returns a `PromiseLike`, we get a chance to give some feedback to the user depending on whether the operation was succesful.
* on a successful add we reset the form and call `this.toastr.success`
* on a failed operation we call `this.toastr.error`

Finally, we need the template.
```html
<div class="panel panel-default">
  <div class="panel-body">
    <form #form="ngForm" (ngSubmit)="sendMessage(form)">
      <div class="row">
        <div class="col-sm-9">
          <input required
                 type="text" 
                 class="form-control" 
                 name="content"
                 placeholder="Type your message here..."
                 ngModel>
        </div>
        <div class="col-sm-3">
          <button [disabled]="form.invalid" type="submit" class="btn btn-block">Send</button>
        </div>
      </div>
    </form>
  </div>
</div>
```

It's just a regular Angular template-driven form and there isn't anything Firebase-related going on so I won't spend much time on it.

# Putting it all together

We've created three new components but we're not using them anywhere! Let's fix this. Go to the `app.component.ts` file and replace it with the following code.
```javascript
@Component({
  selector: 'app-root',
  template: `
<div class="container">
  <app-navbar></app-navbar>
  <div *ngIf="userStream | async; let user">
    <app-message-list [user]="user"></app-message-list>
    <app-message-add [user]="user"></app-message-add>
  </div>
</div>
  `
})
export class AppComponent {
  userStream: Observable<User>;

  constructor(private authService: AuthService) {
    this.userStream = authService.getUserStream();
  }
}
``` 

First, the template references the `navbar` component which will simply display the navigation bar with authentication.

Next, we use the same mechanism that we've used inside the `navbar` component to conditionally display `message-list` and `message-add`. Additionally, we pass the `user` variable as input to both these components using the property binding mechanism.

# Testing and deployment

In order to test your application locally all you need to do is type:
```
ng serve -o
```

The command will launch a local development server and present your application in your default browser.

Once you've played with your application, take a look at the Firebase console. The database will no longer be empty! You will be able to watch the structure of data created by your application.

**obrazek z konsoli**

Similarly, take a look at the Authentication section that will now display users that have signed-in to your application.

**obrazek z auth**

For production deployment refer to **this article** on scotch.io.

# Summary
In this tutorial we've developed a working, production-ready chat application. What's more, we took advantage of the realtime nature of Firebase which allowed us to ensure that all users always see the latest messages. 

I hope this tutorial made you interested in Firebase. I believe that Angular and Firebase are great tools when you need to rapidly build a prototype, an MVP or a small web application.