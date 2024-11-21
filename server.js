const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/chatapp', { useNewUrlParser: true, useUnifiedTopology: true });



const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Replace with a secure key in production

// Set EJS as the view engine
/**
 * Initialise path to the views folder.
 * @const {String}
 */
const VIEWS_FOLDER = path.join(__dirname, "/views/");

app.set("view engine", "html");
app.set('views', VIEWS_FOLDER);
app.engine("html", ejs.renderFile)



app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json()); // To parse JSON bodies

// Routes for signup
app.post('/tan/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User(username, hashedPassword);
        await user.saveUser();

        res.status(201).redirect('/tan/login');
    } catch (err) {
        console.error('Error during signup:', err);
        res.status(500).send('Error signing up');
    }
});

app.get('/tan/signup', (req, res) => {
    //res.sendFile(path.join(__dirname, 'views', 'signup.html'));
    res.render('signup');
});

// Routes for login
app.post('/tan/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findByUsername(username);
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).send('Invalid username or password');
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        //res.sendFile(path.join(__dirname, 'public', 'index.html'));
        res.cookie('token', token, { httpOnly: true });
        res.render('index', { username: username });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('Error logging in');
    }
});

app.get('/tan/login', (req, res) => {
    //res.sendFile(path.join(__dirname, 'views', 'login.html'));
    res.render('login');
});

// Middleware to authenticate using JWT
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
      // Redirect to login page if token is missing
      return res.redirect('/tan/login');
  }
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        // Redirect to login page if the token is invalid or expired
        return res.redirect('/tan/login');
    }        
    req.user = user;
    next();
    });
}




app.get('/tan/logout', (req, res) => {
  // Clear the cookie by setting it to expire immediately
  res.clearCookie('token');  // Replace 'token' with the name of your cookie
  res.redirect('/tan/login');
});


// Protected route
app.get('/', authenticateToken, (req, res) => {
    //res.sendFile(path.join(__dirname, 'views', 'index.html'));
    res.render('index');
});

// Event handler for new connections
// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('message', (data) => {
    console.log('message: ', data);
    io.emit('message', data);
  });

  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer);
  });

  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);
  });

  socket.on('ice-candidate', (candidate) => {
    socket.broadcast.emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(8080, () => console.log('Server running on port 8080'));
