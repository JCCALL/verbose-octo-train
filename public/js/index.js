// Create arrays
var utellyResults = [];
var omdbResults = [];
var omdbIdArray = [];
var utellyIdArray = [];
var omdbFullData = [];

var $watchList = $(".watchlist");
var $watchedList = $("#watched-list");

// The API object contains methods for each kind of request we'll make
var API = {
    saveExample: function (example) {
        return $.ajax({
            headers: {
                "Content-Type": "application/json"
            },
            type: "POST",
            url: "api/examples",
            data: JSON.stringify(example)
        });
    },
    saveSearch: function (search) {
        return $.ajax({
            headers: {
                "Content-Type": "application/json"
            },
            type: "POST",
            url: "api/search",
            data: JSON.stringify(search)
        });
    },
    getExamples: function () {
        return $.ajax({
            url: "api/examples",
            type: "GET"
        });
    },
    deleteExample: function (id) {
        return $.ajax({
            url: "api/examples/" + id,
            type: "DELETE"
        });
    },
    getMovie: function (movie) {
        return $.ajax({
            url: "api/utelly",
            type: "GET"
        })
    },
    updateMovie: function (id, watched) {
        return $.ajax({
            url: "api/examples/" + id,
            type: "PUT",
            data: watched
        });
    }
};

// Refreshes Watchlists
var refreshLists = function () {
    $("#watched-list").load(location.href + " #watched-list>*","");
    $("#watch-list").load(location.href + " #watch-list>*","");
}

// Deletes item from database
var handleDeleteBtnClick = function () {
    var idToDelete = $(this)
        .parent()
        .attr("data-id");
    API.deleteExample(idToDelete).then(function () {
        refreshLists();
    });
};

// Mark as watched & refresh lists
var changeWatch = function () {
    var movieID = $(this)
        .parent()
        .attr("data-id");
        var newWatch = $(this).data("newwatch");
        var newWatched = {
          watched: newWatch
        };
    API.updateMovie(movieID, newWatched).then(function () {
        refreshLists();
    });
};

// Add event listeners to the update, delete, and details buttons
$(document).on("click", ".delete", handleDeleteBtnClick);
$(document).on("click", ".change-watch", changeWatch);
// $(document).on("click", ".details-button", omdbSearch);

// Find movie
$("#find-movie").on("click", function (event) {
    event.preventDefault();
    $(".tabcontent").hide();
    $("#movie-view").empty();
    omdbResults = [];
    utellyResults = [];
    omdbIdArray = [];
    utellyIdArray = [];
    omdbFullData = [];

    // Here we grab the text from the input box
    var movie = $("#movie-input").val();

    // OMDB
    var queryURL = "https://www.omdbapi.com/?s=" + movie + "&apikey=trilogy";

    // OMDB Call - saves to results array
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        omdbResults.push(response);
        var omdb = omdbResults[0].Search;
        for (i = 0; i < omdb.length; i++) {
            omdbIdArray.push(omdb[i].imdbID);
        }
        // console.log(omdbResults);
    });

    var search = {
        search: movie
    };

    // Utelly search
    API.saveSearch(search).then(function () {
        API.getMovie(movie).then(function (response) {
            utellyResults.push(response);
            console.log(utellyResults);
            var utelly = utellyResults[0].results;
            for (var i = 0; i < utelly.length; i++) {
                var imdbID = utelly[i].external_ids.imdb.id;
                utellyIdArray.push(imdbID);
                var omdbIndex = omdbIdArray.indexOf(imdbID);
                var omdbMatch = omdbResults[0].Search[omdbIndex];
                // Runs a new omdb search by id to get plot & ratings data
                var newURL = "https://www.omdbapi.com/?i=" + imdbID + "&plot=long&tomatoes&apikey=trilogy";
                $.ajax({
                    url: newURL,
                    method: "GET"
                }).then(function (response) {
                    console.log(response);
                    omdbFullData.push(response.Plot);
                    console.log(omdbFullData);       
                });
                // Takes out movies if they're not in OMDB
                if (omdbIndex > -1) {
                    var movieDiv = $('<div class="movie-list">');
                    var bgOverlay = $('<div class="bg-overlay">');
                    $(movieDiv).attr('id', imdbID);
                    $(movieDiv).attr('value', [i]);
                    $(movieDiv).css('background-image', 'url(' + utelly[i].picture + ')');
                    var movieTitle = '<div class="movie-header"><div class="movie-title">' + omdbMatch.Title + '</div><div class="movie-year">' + omdbMatch.Year + '</div></div>';
                    var moviePoster = '<img class="movie-poster img-fluid" src=' + omdbMatch.Poster + '>';
                    var movieYear = '<p class="year">' + omdbMatch.Year + '</p>';
                    var moviePicture = '<img class="movie-pic img-fluid" src=' + utelly[i].picture + '>';
                    var imdbLink = '<a target="_blank" href=' + utelly[i].external_ids.imdb.url + '><img class="location-icon img-fluid" src="https://img.icons8.com/all/500/imdb.png"></a>';
                    var buttonDiv = $('<div class="watch-details-buttons">');
                    var watchButton = '<button id="' + [i] + '" value="' + omdbIndex + '" class="btn btn-primary watch-button">Add to Watchlist</button>';
                    var detailsButton = '<button id="movieDetails' + [i] + '" value="' + imdbID + '" class="btn btn-primary details-button" data-toggle="modal" data-target="#movieModal' + [i] + '">Details</button>';
                    var locationList = $('<div class="location-list row">');
                    var streamingIcons = $('<div class="streaming-list col-6">');
                    var locationIcons = $('<div class="rent-or-buy-list col-6"><p id="stream">Rent | Buy</p><div>');
                    for (var j = 0; j < utelly[i].locations.length; j++) {
                        var provider = utelly[i].locations[j].display_name;
                        // Divides streaming subscriptions from rent/buy
                        if (provider === 'Netflix' || provider === 'Amazon Prime Video' || provider === 'Disney+' || provider === 'HBO') {
                            $(streamingIcons).append('<a target="_blank" class="streaming-link" href=' +
                                utelly[i].locations[j].url + '><img class="location-icon img-fluid" src=' +
                                utelly[i].locations[j].icon + '></a><br>');
                          // Gives Hulu a custom icon
                        } else if (provider === 'Hulu') {
                            $(streamingIcons).append('<a target="_blank" class="streaming-link" href=' +
                                utelly[i].locations[j].url + '><img class="location-icon img-fluid" src="/images/hulu.png"></a><br>');
                        // Excludes items without icons from search
                        } else if (provider === 'AtomTicketsIVAUS' || provider === 'NOT_SETIVAUS') {
                            // Returns rent/buy options
                        } else {
                            $(locationIcons).append('<a target="_blank" class="rent-or-buy-link" href=' +
                                utelly[i].locations[j].url + '><img class="location-icon img-fluid" src=' +
                                utelly[i].locations[j].icon + '></a><br>');
                        }
                        $(locationList).append(streamingIcons, locationIcons);
                        // Labels streaming column in results if they exist
                        
                    }

                    // Add to search
                    $(buttonDiv).append(detailsButton, watchButton);
                    $(streamingIcons).append(buttonDiv);
                    $(movieDiv).append(bgOverlay, movieTitle, locationList, buttonDiv);
                    $("#movie-view").append(movieDiv);
                    
                    //Clear out previous modal with same ID           
                    $('#modal-main' + [i]).html("");
                    $('#modal-header' + [i]).html("");
                    $('#modal-content' + [i]).html("");
                    $('#modal-title' + [i]).html("");
                    $('#modal-body' + [i]).html("");

                    // Create modal
                    $('#modal-create').append('<div class="modal fade" id="movieModal' + [i] + '" tabindex="-1" role="dialog" aria-labelledby="movieModalLabel" aria-hidden="true"><div id="modal-main' + [i] + '" class="modal-dialog modal-dialog-centered" role="document"></div></div>');
                    $('#modal-main' + [i]).append('<div class="modal-content" id="modal-content' + [i] + '"><div class="modal-header" id="modal-header' + [i] + '"></div></div>');
                    $('#modal-header' + [i]).append('<h4 class="modal-title" id="modal-title' + [i] + '"></h4><br><button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>');

                    $('#modal-content' + [i]).append('<div class="modal-body" id="modal-body' + [i] + '"></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button><button type="button" class="btn btn-primary watch-button" id=' + [i] + '>Add to Watchlist</button></div>');
                    $('#modal-title' + [i]).append(omdbMatch.Title + movieYear);
                    $('#modal-body' + [i]).append(moviePoster);
                    // $('#modal-body' + [i]).append('<p class="movie-description">' + omdbFullData[0] + '</p>');
                    // <br><p class="rating">' + omdbFullData[0].Rated + '</p>');
                }
            }
        });
    });
});

// Adds movie to Streamline table
var handleFormSubmit = function (event) {
    event.preventDefault();
    var movieIndex = this.id;
    var movieMatch = utellyResults[0].results[movieIndex];
    var moviePic = movieMatch.picture;
    var movieTitle = movieMatch.name;
    var imdbLink = movieMatch.external_ids.imdb.url;
    var searchID = movieMatch.external_ids.imdb.id;
    var addedMovie = {
        movie: movieTitle,
        image: moviePic,
        imdb: imdbLink,
        imdbID: searchID,
        watched: false
        //UserId: "/:id"
      };
      console.log(addedMovie);
    API.saveExample(addedMovie).then(function () {
        refreshLists();
        console.log("added");
    });
};

// Add to watchlist
$(document).on('click', '.watch-button', handleFormSubmit);

// Tabs function
function openTabs(evt, showName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(showName).style.display = "block";
    evt.currentTarget.className += " active";
}

//shows password for login and newuser pages
function showPassword() {
    var x = document.getElementById("myInput");
    if (x.type === "password") {
        x.type = "text";
    } else {
        x.type = "password";
    }
}