var http = require('http');
const imageToBase64 = require('image-to-base64');
const express = require("express");
const bodyParser = require("body-parser");
const app = require("express")();
const server = require("http").createServer(app);
const fs = require("fs");
const qrcode = require("qrcode");
var qrpic = require('qr-image');
const io = require("socket.io")(server);
const axios = require("axios");
const moment = require("moment");
const port = "3000";
const session = port;
const {
  WAConnection,
  MessageType,
  Presence,
  MessageOptions,
  Mimetype,
  WALocationMessage,
  WA_MESSAGE_STUB_TYPES,
  ReconnectMode,
  ProxyAgent,
  waChatKey,
} = require("@adiwajshing/baileys");


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
 

var responseTemplate = {
    "succes" : "null",
    "response" : "null",
    "error" : "null",
    "data" : {}
}

async function connectToWhatsApp() {
  const conn = new WAConnection();
  conn.autoReconnect = ReconnectMode.onConnectionLost;
  // conn.connectOptions = { reconnectID: "reconnect" };
  conn.on('credentials-updated', () => {
    // save credentials whenever updated
           console.log(`credentials updated!`)
            const authInfo = conn.base64EncodedAuthInfo() // get all the auth info we need to restore this session
              fs.writeFileSync('session/'+ session +'.json', JSON.stringify(authInfo, null, '\t'))  
                 })
              fs.existsSync('session'+session +'.json') && conn.loadAuthInfo('session/'+ session +'.json')
          // uncomment the following line to proxy the connection; some random proxy I got off of: https://proxyscrape.com/free-proxy-list
              //conn.connectOptions.agent = ProxyAgent ('http://1.0.180.120:8080')

  async function connect() {
    fs.existsSync("session/"+ session +".json") && conn.loadAuthInfo("session/"+ session +".json");
    await conn.connect({ timeoutMs: 30 * 1000 });

    console.log("oh hello " + conn.user.name + " (" + conn.user.jid + ")");
  }

  connect().catch((err) => {
    console.log(err);
  });


    conn.on("credentials-updated", () => {
      // save credentials whenever updated
      console.log(`credentials updated`);
      const authInfo = conn.base64EncodedAuthInfo(); // get all the auth info we need to restore this session
      fs.writeFileSync("session/"+ session +".json", JSON.stringify(authInfo, null, "\t")); // save this info to a file
    });

    conn.on("close", async ({ reason, isReconnecting }) => {
      console.log(
        "Disconnected because " + reason + ", reconnecting: " + isReconnecting
      );
      if (!isReconnecting) {
        if (fs.existsSync("session/"+ session +".json")) {
          fs.unlinkSync("session/"+ session +".json");
        }
        conn.clearAuthInfo();
        await conn.connect({ timeoutMs: 30 * 1000 });
      }
    });

  let lastqr;
  conn.on('qr', qr => {
    lastqr = qr
  });

  
  app.get("/info", async (req, res, next) => {
    try {
      const potoprofile = await conn.getProfilePicture(conn.user.jid)
      if (conn.user.jid === "undefined") {
        console.log("error");
      } else {
        res.json({
          user: conn.user.name,
          jumlahchat: conn.chats.length,
          number: conn.user.jid,
          pp: potoprofile
        })
      }
    }
    catch (e) {
      console.log("error")
    }
  })

app.get('/check', async (req, res) => {
  let phone = req.query.number;
  let firstnumber = phone;
  //   console.log(firstnumber);
  if (phone == undefined) {
    res.send({
      status: "error",
      message: "please enter valid phone and message",
    });
    console.log("number and message undefined");
  } else {
    conn.isOnWhatsApp(phone + "@s.whatsapp.net").then((is) => {
      if (is) {
            res.send({
              status: "success",
              message:  phone +" Is whatsapp users",
            });
      } else {
        res.send({
          status: "error",
          message: phone + " is not a whatsapp user",
        });
        console.log(`${phone} is not a whatsapp number`);
      }
    });
  }
});

  app.get("/lastqr", (req, res) => {
    res.status(200).json({ lastqr })
  });
  app.get("/qr", (req, res) => {
    if (
      fs.existsSync("session/"+ session +".json") &&
      conn.loadAuthInfo("session/"+ session +".json")
    ) {
      res.send("Session Exist");
    } else {
      var code = qrpic.image(lastqr, { type: 'png', ec_level: 'H', size: 10, margin: 0 });
      res.setHeader('Content-type', 'image/png');

      code.pipe(res);
    }
  });

// Send Media
app.post('/msgmedia', function (req, res) {
    var response = JSON.parse(JSON.stringify(responseTemplate));
    var mediaType = null
  
  if (!req.body) {
    
        response.succes = false
        
    } else {
    
    if (req.body["messageType"] == "media/video") {
      mediaType = WhatsAppWeb.MessageType.video;
    } else if (req.body["messageType"] == "media/image") {
      mediaType = WhatsAppWeb.MessageType.image;
    } else if (req.body["messageType"] == "media/audio") {
      mediaType = WhatsAppWeb.MessageType.audio;
    } else if (req.body["messageType"] == "media/sticker") {
      mediaType = WhatsAppWeb.MessageType.sticker;
    }
    
    sendMediaMessage(req.body["contactID"], req.body["text"], req.body["mediaLocation"], req.body["isGif"], mediaType)
    response.succes = true
  
    }
  
  res.send(response)
    
})
//


  app.get('/msg', async (req, res) => {
    let phone = req.query.number;
    let message = req.query.message;
    let firstnumber = phone;
    //   console.log(firstnumber);
    if (phone == undefined || message == undefined) {
      res.send({
        status: "error",
        message: "please enter valid phone and message",
      });
      console.log("number and message undefined");
    } else {
      conn.isOnWhatsApp(phone + "@s.whatsapp.net").then((is) => {
        if (is) {
          conn
            .sendMessage(phone + "@s.whatsapp.net", message, MessageType.text)
            .then((response) => {
              res.send({
                status: "success",
                message: "Message successfully sent to " + phone,
              });
              console.log(`Message successfully sent to ${phone}`);
            });
        } else {
          res.send({
            status: "error",
            message: phone + " is not a whatsapp user",
          });
          console.log(`${phone} is not a whatsapp number`);
        }
      });
    }
  });
  app.get("/pic", async (req, res) => {
    let phone = req.query.number;
    const ppUrl = await conn.getProfilePicture(phone + "@s.whatsapp.net") // leave empty to get your own
    res.send(ppUrl)

  });
  conn.on('chats-received', async ({ hasNewChats }) => {
    app.get("/pesan-diterima", (req, res) => {
      console.log(`you have ${conn.chats.length} chats, new chats available: ${hasNewChats}`)
    });
  });
  app.get("/get-chats", (req, res) => {
    conn
      .getChats()
      .then((chats) => {
        res.send({ status: "success", message: chats });
      })
      .catch(() => {
        res.send({ status: "error", message: "getchatserror" });
      });
  });

app.get("/image", (req, res) => {
var cewek = req.query.image;
var id = req.query.number + "@s.whatsapp.net";
var caption = req.query.caption;
imageToBase64(cewek) // Path to the image
        .then(
            (response) => {
const options = { 
mimetype: Mimetype.jpeg,
caption: caption
 }
           var buf = Buffer.from(response, 'base64'); // Ta-da  
              conn.sendMessage(
            id,
              buf,MessageType.image , options)
console.log("sukses");
res.send("success");
}
        )
        .catch(
            (error) => {
                res.send("Something wrong"); // Logs an error if there was one
            }
        )
    
})



     conn.on('chat-update', async chat => {
      if (chat.presences) { // receive presence updates -- composing, available, etc.
          Object.values(chat.presences).forEach(presence => console.log( `${presence.name}'s presence is ${presence.lastKnownPresence} in ${chat.jid}`))
       
        }
      if(chat.imgUrl) {
          console.log('imgUrl of chat changed ', chat.imgUrl)
          return
      }
      // only do something when a new message is received
      if (!chat.hasNewMessage) {
          if(chat.messages) {
              console.log('updated message: ', chat.messages.first)
          }
      
      } 
      const m = chat.messages.all()[0] // pull the new message from the update
      const messageStubType = WA_MESSAGE_STUB_TYPES[m.messageStubType] ||  'MESSAGE'
      console.log('got notification of type: ' + messageStubType)
      let sender = m.key.remoteJid
     
      const messageContent = m.message
      // if it is not a regular text or media message
      if (!messageContent) return
      
      if (m.key.fromMe) {
          console.log('relayed my own message')
          return
      }

      let pengirim = m.key.remoteJid
      if (m.key.participant) {
          // participant exists if the message is in a group
          pengirim += ' (' + m.key.participant + ')'
      }
      const messageType = Object.keys (messageContent)[0] // message will always contain one key signifying what kind of message
      if (messageType === MessageType.text) {
          const text = m.message.conversation
          var user = conn.contacts[m.key.remoteJid];
          console.log(pengirim + ' sent: ' + text)
          var url = 'http://web.wabot.id/feature/cron_reply.php?key='+ text;
  axios.get(url)
     .then((result) =>
     {
       var y = result.data.replace(/sender_name/g, user.name);
       var x = y.replace(/nama_depan/g, user.name);
       var z = x.replace(/sapaan/g, user.name);
       if (pengirim.includes("@g.us")) {
       } else{
       if (result.data == ""){

       }else{
       conn.sendMessage(
        pengirim,
          z,MessageType.text)
       }  if(result.data.includes("gambar:")){
        var resu = result.data;
        var urlimage = resu.replace(/gambar:/ , "").split(" |")[0];
        var caption = resu.split("|")[1];
        imageToBase64(urlimage) // Path to the image
        .then(
            (response) => {
   const options = { 
   mimetype: Mimetype.jpeg,
   caption: caption
   }
           var buf = Buffer.from(response, 'base64'); // Ta-da  
              conn.sendMessage(
            id,
              buf,MessageType.image , options)
   console.log("sukses");
   res.send("success");
   }
        )
        .catch(
            (error) => {
            }
        )
    
      }
    }
      
        })
      
      } else if (messageType === MessageType.extendedText) {
          const text = m.message.extendedTextMessage.text
          console.log(pengirim + ' sent: ' + text + ' and quoted message: ' + JSON.stringify(m.message))
      } else if (messageType === MessageType.contact) {
          const contact = m.message.contactMessage
          console.log(pengirim + ' sent contact (' + contact.displayName + '): ' + contact.vcard)
      } else if (messageType === MessageType.location || messageType === MessageType.liveLocation) {
          const locMessage = m.message[messageType];
          var maps = `
           Alamat googlemaps :
          https://www.google.com/maps?q=${locMessage.degreesLatitude},${locMessage.degreesLongitude}&hl=ensent`;
          conn.sendMessage(
            pengirim,
              maps,MessageType.text)
          await conn.downloadAndSaveMediaMessage(m, './Media/media_loc_thumb_in_' + m.key.id) // save location thumbnail

          if (messageType === MessageType.liveLocation) {
              console.log(`${pengirim} sent live location for duration: ${m.duration/60}`)
          }
      } else {
          
          try {
              const savedFile = await conn.downloadAndSaveMediaMessage(m, './Media/media_in_' + m.key.id)
              console.log(pengirim + ' sent media, saved at: ' + savedFile)
          } catch (err) {
              console.log('error in decoding message: ' + err)
          }
      }
    })
}     
// Groups

server.listen(port, () => {
console.log("Server Running Live on Port : " + port);
connectToWhatsApp()
  .catch(err => console.log("unexpected error: " + err)) // catch any errors
});