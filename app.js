const express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    Sequelize = require("sequelize"),
    Op = Sequelize.Op,
    slug = require("slug"),
    multer = require("multer"),
    cloudinary = require('cloudinary'),
    path = require("path");
//     var fs = require('fs');
// var crypto = require('crypto');

app.set("view engine", "ejs");
app.set("views", "./views")
app.use(methodOverride("_method"));
app.use('/static', express.static(path.join(__dirname, 'public')));
// app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));


// var storage = multer.diskStorage({
//     destination: 'public/upload/',
//     filename: function (req, file, cb) {
//       crypto.pseudoRandomBytes(16, function (err, raw) {
//         if (err) return cb(err)
//         cb(null, Math.floor(Math.random()*9000000000) + 1000000000 + path.extname(file.originalname))
//       })
//     }
//   })
//   var upload = multer({ storage: storage });
//   app.get('/files', function (req, res) {
//     const images = fs.readdirSync('public/upload')
//     var sorted = []
//     for (let item of images){
//         if(item.split('.').pop() === 'png'
//         || item.split('.').pop() === 'jpg'
//         || item.split('.').pop() === 'jpeg'
//         || item.split('.').pop() === 'svg'){
//             var abc = {
//                   "image" : "/upload/"+item,
//                   "folder" : '/'
//             }
//             sorted.push(abc)
//         }
//     }
//     res.send(sorted);
//   })

//   app.post('/upload', upload.array('flFileUpload', 12), function (req, res, next) {
//       res.redirect('back')
//   });

//   app.post('/delete_file', function(req, res, next){
//   	var url_del = 'public' + req.body.url_del
//     console.log(url_del)
//   	if(fs.existsSync(url_del)){
//   		fs.unlinkSync(url_del)
//   	}
//   	res.redirect('back')
//   });

// mutel upload image

const storage = multer.diskStorage({
    filename: (req, file, callback) => {
        callback(null, file.originalname);
    }
});
const fileFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage, fileFilter });

cloudinary.config({
    cloud_name: 'vanhoa66',
    api_key: 991645918594578,
    api_secret: "Im8k1TkJkr_02wbaHXS5FmbB2p0"
});

// ---------pg-sequelizw------------

const db = new Sequelize({
    database: "keriuwyl",
    username: "keriuwyl",
    password: "970OMmCqXx1w4rSx9uBK8vxFdvKiA7FO",
    host: "stampy.db.elephantsql.com",
    port: 5432,
    dialect: "postgres",
    define: {
        freezeTableName: true
    },
    operatorsAliases: {
        $and: Op.and,
        $or: Op.or,
        $eq: Op.eq,
        $gt: Op.gt,
        $lt: Op.lt,
        $lte: Op.lte,
        $like: Op.like
    }
});

const Room = db.define("room", {
    name: { type: Sequelize.STRING },
    slugUrl: { type: Sequelize.STRING, unique: true },
    price: { type: Sequelize.INTEGER },
    image: { type: Sequelize.STRING },
    description: { type: Sequelize.STRING }
});

// db.authenticate()
//     .then(() => console.log("ok"))
//     .catch(err => console.log(err));

// Room.sync()
//     .then(() => console.log("them ok"))
//     .catch(err => console.log(err));

// Room.create({
//     name: 'Ghe van phong 01',
//     slugUrl: 'ghe-van-phong-01',
//     price: 1000000,
//     image: 'https://i.imgur.com/2UBJS8P.jpg',
//     description: 'Boc da vai ni'
// })

app.get("/", (req, res) => {
    Room.findAll({
        order: [
            ['id', 'ASC']
        ]
    })
        .then(rooms => {
            res.render("index", { rooms })
        })
        .catch(err => console.log(err))
});

app.get("/roomAdd", (req, res) => {
    res.render("roomAdd")
});

app.post("/roomAdd", upload.single('image'), (req, res) => {
    if (typeof (req.file) === "undefined") {
        res.redirect("/roomAdd")
    } else {
        cloudinary.uploader.upload(req.file.path)
            .then(result => {
                let image = result.secure_url;
                let { name, price } = req.body;
                let slugUrl = slug(name);
                let description = req.body.editor1;
                let newRoom = { name, slugUrl, price, image, description };
                Room.create(newRoom)
                    .then(() => res.redirect("/"))
                    .catch(err => res.redirect("/roomAdd"))
            })
            .catch(err => res.redirect("/roomAdd"))
    }
});

app.get("/room/:id/edit", (req, res) => {
    let id = req.params.id;
    Room.findById(id)
        .then(room => res.render("roomEdit", { room }))
        .catch(e => console.error(e))
});

app.route("/room/:id")
    .get((req, res) => {
        var id = req.params.id;
        Room.findById(id)
            .then(room => res.render("roomDetail", { room }))
            .catch(e => console.error(e))
    })
    .put(upload.single('image'), (req, res) => {
        let id = req.params.id;
        if (typeof (req.file) === "undefined") {
            let { name, price } = req.body;
            let description = req.body.editor1;
            let updateRoom = { name, price, description };
            Room.update(updateRoom, { where: { id: id } })
                .then(() => res.redirect("/"))
                .catch(err => console.log(err))
        } else {
            cloudinary.uploader.upload(req.file.path)
                .then(result => {
                    let image = result.secure_url;
                    let { name, price } = req.body;
                    let description = req.body.editor1;
                    let updateRoom = { name, price, image, description };
                    Room.update(updateRoom, { where: { id: id } })
                        .then(() => res.redirect("/"))
                        .catch(err => res.redirect("/"))
                })
                .catch(err => res.redirect("/"))
        }
    })
    .delete((req, res) => {
        var id = req.params.id;
        Room.destroy({ where: { id: id } })
            .then(() => res.redirect("/"))
            .catch(err => res.redirect("/"))
    });

app.listen(process.env.PORT || 3000, process.env.IP, function () {
    console.log("Server is running...");
});