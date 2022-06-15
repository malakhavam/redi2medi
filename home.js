var bodyParser = require('body-parser');
var moment = require('moment');
var redi2medi = require('messagebird')(process.env.MESSAGEBIRD_API_KEY);
var ReminderDatabase = [];


// Display reminder page
app.get('/', function(req, res) {

    // Render login page

    var defaultDT = moment();
    res.render('login', {
        date : defaultDT.format('Y-MM-DD'),
        time : defaultDT.format('HH:mm')
    });
});

app.post('/reminder', function(req, res){

    var defaultDT = moment();
    res.render('home', {
          date : defaultDT.format('Y-MM-DD'),
          time : defaultDT.format('HH:mm') 
    });
  
  });
  


// Process an incoming reminder
app.post('/schedule', function(req, res) {
    
    // Check if User has provided input for all form fields
    if (!req.body.name || !req.body.medication || !req.body.remname || !req.body.number || !req.body.date || !req.body.time
        || req.body.name == '' || req.body.medication == '' || req.body.remname == '' || req.body.number == '' 
        || req.body.date == '' || req.body.time == '') {
            // If no, throw an error
            res.render('home', {
                error : "Please fill all required fields!",
                name : req.body.name,
                medication : req.body.medication,
                remname: req.body.remname,
                number: req.body.number,
                date : req.body.date,
                time : req.body.time
            });
            return;
    };

    // // Check if date/time is correct and at least 1 hour in the future
    var earliestPossibleDT = moment();
    var appointmentDT = moment(req.body.date+" "+req.body.time);
    if (appointmentDT.isBefore(earliestPossibleDT)) {
        // If not, show an error
        res.render('home', {
            error : "You can only schedule reminders that are at least 1 hour in the future!",
            name : req.body.name,
            medication : req.body.medication,
            remname: req.body.remname,
            date : req.body.date,
            time : req.body.time
        });
        return;
    }

    // Check if phone number is valid
    redi2medi.lookup.read(req.body.number, process.env.COUNTRY_CODE, function (err, response) {
      console.log(err);
      console.log(response);

      if (err && err.errors[0].code == 21) {
          // This error code indicates that the phone number has an unknown format
          res.render('home', {
              error : "You need to enter a valid phone number!",
              name : req.body.name,
              treatment : req.body.treatment,
              number: req.body.number,
              date : req.body.date,
              time : req.body.time
          });
          return;
      } else
      if (err) {
          // Some other error occurred
          res.render('home', {
              error : "Something went wrong while checking your phone number!",
              name : req.body.name,
              treatment : req.body.treatment,
              number: req.body.number,
              date : req.body.date,
              time : req.body.time
          });
      } else
      if (response.type != "fixed line or mobile") {
          // The number lookup was successful but it is not a mobile number
          res.render('home', {
              error : "You have entered a valid phone number, but it's not a mobile number! Provide a mobile number so we can contact you via SMS.",
              name : req.body.name,
              treatment : req.body.treatment,
              number: req.body.number,
              date : req.body.date,
              time : req.body.time
          });
      } else {
          // Everything OK
   

             // Schedule reminder 1 hour 
             var appDT = appointmentDT.clone().subtract({hours:1});

             // Send a reminder 
        
             redi2medi.messages.create({
                 originator : "REDI2MEDI",
                 recipients : [response.phoneNumber],
                 scheduledDatetime : appDT.format(),


                 body : req.body.name + ", here's a reminder that you have a " + req.body.remname + " scheduled for " + appointmentDT.format('hh:mm A') + ". Thank you for using Redi2Medi"

             }, function (err, response) {
                 if (err) {
                     // Request has failed
                     console.log(err);
                     res.send("Error occured while sending message!");
                 } else {
                     // Request was successful
                     console.log(response);

                     // Create and persist reminder object
                     var app = {
                         name : req.body.name,
                         medication : req.body.medication,
                         remname: req.body.remname,
                         number: req.body.number,


                         appointmentDT : appointmentDT.format('MM-DD-Y hh:mm A'),
                         appDT : appDT.format('MM-DD-Y hh:mm A')

                     }
                      ReminderDatabase.push(app);
    
                     // Render confirmation page
                     res.render('confirm', app);    
                    }
                  });
              }     
            });
      });
