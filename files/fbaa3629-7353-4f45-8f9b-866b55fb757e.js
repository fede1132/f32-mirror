// dotenv config
require('dotenv').config()

// passport
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    done(null, {id: id})
})

// express
const express = require('express')
var app = express()

var session = require('express-session')
var MemoryStore = require('memorystore')(session)
var fileUpload = require('express-fileupload')
var path = require('path')

app.use(require('morgan')('combined'));
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(session({cookie: {maxAge: Date.now() + (30 * 86400 * 1000)}, secret: 'keyboard cat', store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  })}));
app.use(passport.initialize());
app.use(passport.session());
app.use(fileUpload({preserveExtension: true}));

passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    },
    (username, password, done) => {
        if (username===process.env.ADMIN_USERNAME && password ===process.env.ADMIN_PASSWORD) {
            return done(null, {id:0})
        }
        return done(null, falsen)
    }
));

// serve static dir
app.use(express.static(path.join(__dirname, 'static')))

// load files
var fs = require('fs')
var files = []
function reloadFiles() {
    fs.readdirSync('./files/').forEach(file => {
        if (file.endsWith('.json') && !file.includes("logos")) return
        if (!fs.existsSync(`./files/${file}.json`)) return
        var data = fs.readFileSync(`./files/${file}.json`)
        files.push({file: file, config: data})
    })
}
reloadFiles();

var connect = require('connect-ensure-login');

// serve loaded files
app.get('/files', (req, res) => {
    res.send(files)
})

// serve logo
app.get('/logo/:logo', (req, res) => {
    res.sendFile(path.join(__dirname, path.join('files', path.join('logos', req.params.logo.replace("..", "")))))
})

// serve a file
app.get('/files/:file', (req, res) => {
    var ok = false
    files.forEach(v => {
        if (v.file = req.params.file) ok = true
    });
    if (ok===false) {
        res.send('invalid file')
        return
    }
    res.sendFile(path.join(__dirname, 'files/' + req.params.file))
})

// handle file uploading
const { v4: uuidv4 } = require('uuid');
app.post('/upload', connect.ensureLoggedIn({redirectTo: '/login.html'}), async (req, res) => {
    var uuid = uuidv4()
    ok = false
    while (!ok) {
        uuid = uuidv4();
        var contains = false
        files.forEach(e => {
            if (e.file.startsWith(uuid)) contains = true
        })
        if (!contains) ok = true
    }
    var config = {name: req.body.displayname, desc: req.body.desc, version: req.body.version, tags: req.body.tags}
    req.files.fileUpload.mv(path.join(__dirname, path.join('files', `${uuid}.${req.files.fileUpload.name.split('.').pop()}`)), (err) => {
        if (err) console.log(err)
    })
    if (req.files.logoUpload===undefined) {
        config.logo = null;
    } else {
        req.files.logoUpload.mv(path.join(__dirname, path.join('files', path.join('logos', `${uuid}.${req.files.fileUpload.name.split('.').pop()}.${req.files.logoUpload.name.split('.').pop()}`))))
        config.logo = `${uuid}.${req.files.fileUpload.name.split('.').pop()}.${req.files.logoUpload.name.split('.').pop()}`
    }
    fs.writeFile(path.join(__dirname, path.join('files', `${uuid}.${req.files.fileUpload.name.split('.').pop()}.json`)), JSON.stringify(config), (err) => {
        if (err) console.log(err)
    })
    res.json(config)
    reloadFiles();
});

app.get('/isLogged', connect.ensureLoggedIn({redirectTo: '/login.html'}), (req, res) => {
    res.send(true)
})

// handle login request
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/login.html?failure=true'
}), (req, res) => {
    res.redirect('/')
})

// serve web server
const port = process.env.PORT || 3000
const host = process.env.HOSt || '127.0.0.1'
app.listen(port, host, () => console.log(`[APP] Listening on port ${port}`))