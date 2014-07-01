Parse.Cloud.define("getRecommendedEvent", function(request, response) {

	var categories = new Array();
	var addresses = new Array();

	var data = request.params.data;

	// Number each category and the times it has been searched
	data.eventsCategory.forEach(function(item, index) {
	if (!categories.hasOwnProperty(item))
	{
	  categories.push({key: item});
	  categories[item] = 0;
	}
	categories[item]++;
	});

	// Sort from most searched category to least
	categories.sort(function(a, b) {
	  a = categories[a.key];
	  b = categories[b.key];

	  return a > b ? -1 : (a < b ? 1 : 0);
	});

	// Number each address and the times it has been searched
	data.addresses.forEach(function(item, index) {
	if (!addresses.hasOwnProperty(item))
	{
	  addresses.push({key: item});
	  addresses[item] = 0;
	}
	addresses[item]++;
	});

	// Sort from most searched addresses to least
	addresses.sort(function(a, b) {
	  a = addresses[a.key];
	  b = addresses[b.key];

	  return a > b ? -1 : (a < b ? 1 : 0);
	});

	// Get one of the top 3 searched categories
	var randomNum = Math.floor((Math.random() * 3) + 1);
	var searchCategory = categories[randomNum - 1].key;

	// Get one of the top 3 searched addresses
	randomNum = Math.floor((Math.random() * 3) + 1);
	var searchAddress = addresses[randomNum - 1].key;


	var events = Parse.Object.extend("Event");
	//set query for events objectr
	var query = new Parse.Query(events);

	//check the events within the specify point to search from
	if (searchAddress != "")
	query.withinKilometers("location", searchAddress, 10000);

	// Add category parameter
	if (searchCategory != undefined && searchCategory != "All")
	query.equalTo("category", searchCategory);

	query.find
	({
		success: function(results)
		{
			if (results.length > 0) 
            {
            	// Sort events to get the event 
            	// with the highest number of likes 
			  	results.sort(function(a, b) {
            		return (b._serverData.likes - a._serverData.likes);
          		});

			  	// Get a random number from top of 
			  	// the array to half it's length
			  	randomNum = Math.floor((Math.random() * Math.ceil((results.length - 1) / 2)) + 0);

				// Return the event object       
                response.success(JSON.stringify(results[randomNum]));
            }
		}
	});

});


////////////
//	JOBS  //
////////////


// Handles event deletion in the application
// Should be set to run hourly
Parse.Cloud.job("eventDeletionJob", function(request, status) 
{
  // Query all events
  var Event = Parse.Object.extend("Event");
  var query = new Parse.Query(Event);

  query.find(
  {
    success: function(results) 
    {
      results.forEach(function(eventObj, index) 
      {
        if (eventObj.deleteReqs >= 3)
        {
          // Set event as deleted
          eventObj.set("statusId", 99);
        }
        else if (eventObj.category == 'Sports')
        {
          var timeDiff = Math.abs(eventObj.createdAt - new Date().getTime());
          var diffHours = Math.ceil(timeDiff / (1000 * 3600 * 24 * 60));

          // Sports events expiration is 3 hours
          if (diffHours >= 3)
          {
            // Set event as deleted
            eventObj.set("statusId", 99);
          }
        }
        else if (eventObj.category == 'Hazrads')
        {
          var timeDiff = Math.abs(eventObj.createdAt - new Date().getTime());
          var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

          // Hazards events expiration is 1 day
          if (diffDays >= 1)
          {
            // Set event as deleted
            eventObj.set("statusId", 99);
          }
        }

        eventObj.save();
      });

      // Set the job's success status
      status.success("eventDeletionJob completed successfully.");
    },
    error: function(object, error) 
    {
      // Set the job's error status
      status.error("Uh oh, something went wrong in: eventDeletionJob.");
    } 
  });
});

