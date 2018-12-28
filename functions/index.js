
let functions = require('firebase-functions');
let admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

exports.anuncios_message = functions.firestore.document('alerta/{envia_mensaje}').onWrite((change, context) => {

    
     return loadUsers().then(users => {
 
        let tokens = [];
        for (let user of users) {
            tokens.push(user);
        }  


        loadMessage()
        .then((messageDB) => { 
            console.log(messageDB);
           message = messageDB;
           let payload = {
                notification: {
                    title: message.title,
                    body:  message.body,
                    sound: 'default',
                    badge: '1'
                }
            };

            const options = {
                collapseKey: "red",
                contentAvailable: true,
                priority: "high",
                timeToLive: 60 * 60 * 24
            };

            groupSend(tokens, payload, options)
                .then(() =>  console.log("Completado"))
                .catch((error) => console.log("Algo fallo por aqui:",  error));

        })
        .catch((error) => {
            console.log(error);
        })
          
    });

});


function groupSend(tokens, payload, options){

    return new Promise((resolve, reject) => {
    
        console.log("Funcion para enviar los mensaje");
        let countGroup = Math.ceil((tokens.length + 1 ) / 1000);      
        let tokenTotal = tokens;
        console.log(tokens.length); 
        console.log(countGroup);

        for( let j=0; j<=countGroup -1; j++){
            const devices = []
            for( let i=((j*1000)); i<((1000*j) + 1000); i++){     
                if(tokenTotal[i] != undefined){
                    devices.push(tokenTotal[i]);
                }               
            }
             
                admin.messaging().sendToDevice(devices, payload, options)
                    .then((response) =>  console.log("Successfully sent message:", response))
                    .catch((error) => console.log("Error sending message:", error))
            }

        resolve();    

    });
   
}

function loadMessage() {
    let dbRef = admin.firestore().collection('alerta').doc('envia_mensaje');
    return new Promise((resolve, reject) => {
        console.log("Agregando datos")
 
        let message = dbRef.get()
            .then(doc => {
                if (!doc.exists) {
                    console.log('No such document!');
                  } else {
                    // console.log('Document data:', doc.data());
                    resolve( doc.data());
                  }
                })
            .catch(err => {
                console.log('Error getting document', err);
                reject(err);
            });
    });
}




function loadUsers() {
    let dbRef = admin.firestore().collection('devices');
    return new Promise((resolve, reject) => {
        console.log("Agregando datos")
 
         dbRef.get()
        .then(snapshot => {
          let users = [];
          snapshot.forEach(doc => {
            users.push(doc.data().token)
            // console.log(users);
         });

         resolve(users);
        })
        .catch(err => {
            reject(err);
        });

    });
}
