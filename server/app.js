//TO-DOs
//A function that returns the current date and makes it the default value of the datepicker
//Implement authentication and enable users
//Create a landing page
//Implement an edit option for each journal entry


/**
 * Initializes the app with the passed in server options
 * @param {string} server [string with server information like ip and port]
 */
var App = function(server){
  this.server = server;
  this.entries = [];
};

/**
 * Fetch sends a get request to the server to retrieve all entries then makes a call to addEntry to append a journal entry html component to the page. Fetch also calls the clearEntries function to clear the entries div of any prior entries appended to the page
 * @var {array} dataArray [array containing the data retrieved from the get request in the form of stringified
 * JSON]
 * @var {array} entries [array containing the parsed, formatted data from dataArray]
 * @var {object} parsed [holds the parsed entry data for a single entry]
 * @var {array} temp [array that holds the topic and text of the current parsed entry data, so that the pluses in the strings are replaced with actual spaces]
 */
App.prototype.fetch = function(){
  var context = this;
  app.clearEntries();

  $.ajax({
    'url': '/entries',
    'datatype': 'json',
    'type': 'GET',
    'success': function(data) {
      var dataArray = data.split(",\n");
      var entries = [];

      dataArray.forEach(function(entry){
        if(entry){
          var parsed = JSON.parse(entry);
          var temp = [parsed.topic, parsed.text];
          parsed.text = temp[1].replace(/\+\+/, "[plus]").replace(/\+/gi, " ").replace("[plus]", " +");
          parsed.topic = temp[0].replace(/\+/gi, " ");
          entries.push(parsed); 
        }
      });

      context.entries = app.sortByDate(entries);

      entries.forEach(function(entryObj){
        app.addEntry(entryObj);
      });
    },
    'error': function(err) {
      console.log("There was an error fetching the data: ", err);
    }
  });
};

/**
 * handleSubmit will collect the data from the form inputs then send a post request to the server.
 * the information is then appended to the journal entries text file
 * @var {object} content [the content object contains the date, topic and text information from inputs]
 */
App.prototype.handleSubmit = function(){
  var content = {
    date: null,
    topic: null,
    text: null
  };

  content.date = $('#date').val();
  content.topic = $('#topic').val();
  content.text = $('textarea').val();

  this.entries.push(content);
  app.sortByDate(this.entries);

  var data = $("#journal-entry").serialize();
  $.ajax({
    'url': '/entry',
    'datatype': 'json',
    'type': 'POST',
    'data': data,
    'success': function(){
      app.appendEntry();
    },
    'error': function(err){
      console.log("There was an error saving the entry: ", err);
    }
  });
};

/**
 * addEntry will create the html for an entry using jQuery, then appends it to the entries div
 * @param {object} entry [contains date, topic and text information about entries retrieved from the journal
 * entries text file by the fetch function]
 * @var {jQuery object} $journalEntry [creates the div container for the entry components]
 * @var {jQuery object} $date [creates a strong html component for the entry date]
 * @var {jQuery object} $topic [creates a em html component for the entry topic]
 * @var {jQuery object} $thoughts [creates a paragraph html component for the entry text]
 * @var {array} elements [array containing all the entry html components to make appending to $journalEntry
 * easier, changing the order in which the jQuery object placed in the array will change the order in which they
 * are appended]
 */
App.prototype.addEntry = function(entry){
  var $journalEntry = $('<div class="well well-sm"></div>'),
      $date = $('<strong>' + " " + app.formatDate(entry.date) + '</strong>'),
      $removeIcon = $('<a class="remove-icon" onClick=app.removeEntry(event);><span class="glyphicon glyphicon-remove" aria-hidden="true" id="remove"></span></a><br>'),
      $topic = $('<em>' + entry.topic + '</em><br><br>'),
      $thoughts = $('<p>' + app.checkForNewLines(entry.text) + '</p>'),
      elements = [$date, $removeIcon, $topic, $thoughts];

  elements.forEach(function(item){
    item.appendTo($journalEntry);
  });

  $journalEntry.appendTo('div.entries');
};

/**
 * appendEntry clears current entries appended to the entries div, then appends entries to the entries after the entries property has been updated (when a new entry is added) or when the page is first loaded
 */
App.prototype.appendEntry = function(){
  app.clearEntries();
  this.entries.forEach(function(entry){
    app.addEntry(entry);
  });
};

/**
 * removeEntry removes the current entry from the front-end
 * @param  {object} event [object to get the current entry to be deleted]
 */
App.prototype.removeEntry = function(event){
  var currentEntry = $(event.target).parent().parent();
  var children = currentEntry.children().slice(0,7);
  var content = {
    date: null,
    topic: null,
    text: null
  };

  for(var index in children){
    if(index === '0'){
      content.date = app.revertDate(children[index].innerText.trim());
    } else if(index === '3'){
      content.topic = children[index].innerText;
    } else if(index === '6'){
      content.text = children[index].innerText.replace(/<br>/gi, "\n");
    }
  }

  currentEntry.remove();
  app.deleteEntry(content);
};

/**
 * deleteEntry will send an AJAX request to the server to delete the current entry
 * @param  {object} data [JSON data of the current entry to be deleted]
 */
App.prototype.deleteEntry = function(data){
  $.ajax({
    'url': '/deleteEntries',
    'datatype': 'json',
    'type': 'DELETE',
    'data': data,
    'success': function(data){
      console.log("Successfully deleted: ", data);
    },
    'error': function(data){
      console.log("There was an error deleting: ", data);
    }
  });
};

/**
 * formatDate will change the date format from mm/dd/yyyy to "May 5, 2016"
 * @param  {string} date [date information from entry data retrieved from fetch]
 * @return {string} dateStr [the formatted date string ie "May 5, 2016"]
 * @var {array} temp [array that holds the month, date, and year]
 * @var {string} dateStr [string that will hold the formatted date]
 * @var {object} months [object holding a mapping of the months]
 */
App.prototype.formatDate = function(date){
  var temp = date.split('-'),
   dateStr = '',
    months = {
    '01': 'January',
    '02': 'February',
    '03': 'March',
    '04': 'April',
    '05': 'May',
    '06': 'June',
    '07': 'July',
    '08': 'August',
    '09': 'September',
    '10': 'October',
    '11': 'November',
    '12': 'December'
    };

  if(months.hasOwnProperty(temp[1])){
    dateStr = months[temp[1]] + ' ' + temp[2] + ', ' + temp[0];
  }

  return dateStr;
};

/**
 * revertDate changes the date back to the yyyy-mm-dd format
 * @param  {string} date [date string of an entry in "month day, year" format]
 * @return {string} revertedDate [date string in yyyy-mm-dd format]
 */
App.prototype.revertDate = function(date){
      var temp = date.split(' '),
  revertedDate = '',
    monthToNum = {
    'January':'01',
    'February':'02',
    'March':'03',
    'April':'04',
    'May':'05',
    'June':'06',
    'July':'07',
    'August':'08',
    'September':'09',
    'October':'10',
    'November':'11',
    'December':'12'
    };

  if(monthToNum.hasOwnProperty(temp[0])){
    revertedDate = temp[2] + '-' + monthToNum[temp[0]] + '-' + temp[1].replace(/,/gi, '');
  }
  
  return revertedDate;
};

/**
 * sortByDate sorts entries by date in ascending order (oldest entries to newest entries)
 * @param  {array of objects} entries [array of entry objects, unsorted]
 * @return {array of objects}         [array of entry objects, sorted in ascending order]
 */
App.prototype.sortByDate = function(entries){
  var months = {
    '01': '00',
    '02': '01',
    '03': '02',
    '04': '03',
    '05': '04',
    '06': '05',
    '07': '06',
    '08': '07',
    '09': '08',
    '10': '09',
    '11': '10',
    '12': '11'
    }

  return entries.sort(function(a,b){
    var dateForA = a.date.split('-'),
        dateForB = b.date.split('-');

    return new Date(dateForA[0], months[dateForA[1]], dateForA[2]) - new Date(dateForB[0], months[dateForB[1]], dateForB[2]);
  });
};

/**
 * checkForNewLines will check entry text strings for \r\n and replace them with <br> tags to properly format
 * entry text (technically not semanticly correct html, each entry paragraph will have to be in <p> tags)
 * @param  {string} string [entry text information]
 * @return {string}        [returns the entry text information with <br> tags]
 */
App.prototype.checkForNewLines = function(string){
  return string.replace(/\r\n/g, "<br>");
};

/**
 * clearEntries clears entries from the entries div
 */
App.prototype.clearEntries = function(){
  $('div.entries').html('');
};

/**
 * checkFormValidity will return true or false to see if the form is valid, used to enable/disable the submit button. the submit button will only be enabled when this function returns true (when the form is valid)
 * @return {boolean} [returns true if the form is valid, false if the form is invalid]
 */
App.prototype.checkFormValidity = function(){
  var form = document.getElementById('journal-entry');
  return form.checkValidity();
};

$(document).ready(function() {

  $(window).load(function() {
    app.fetch();
  });
  
  $('#submit-btn').on('click', function(event){
    event.preventDefault();
    app.handleSubmit();
  });

  $('div.submit-btn-container').on('mouseover', function(){
    if(app.checkFormValidity()){
      $("#submit-btn").prop('disabled', false);
    } else {
      $("#submit-btn").prop('disabled', true);
    }
  });

});

var app = new App('http://127.0.0.1:8080/');