// Hide alert modal
$("#success-alert").hide();

// Create arrays
var utellyResults = [];
var omdbResults = [];
var omdbIdArray = [];
var utellyIdArray = [];
var omdbPoster = [];

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
    getMovieByID: function (id) {
        return $.ajax({
            url: "api/utellyID",
            type: "GET"
        })
    },
    updateMovie: function (id, watched) {
        return $.ajax({
            url: "api/examples/" + id,
            type: "PUT",
            data: watched
        });
    },
    lovedMovie: function (id, loved) {
        return $.ajax({
            url: "api/loved/" + id,
            type: "PUT",
            data: loved
        })
    }
};

// Refreshes Watchlists
var refreshLists = function () {
    $("#watched-list").load(location.href + " #watched-list>*", "");
    $("#watch-list").load(location.href + " #watch-list>*", "");
    $("#loved-list").load(location.href + " #loved-list>*", "");
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

// Adds movie to Streamline table/watchlist
var addToWatchList = function (event) {
    event.preventDefault();
    var movieIndex = this.id;
    var imdbID = $(this).attr('value');
    var omdbIndex = omdbIdArray.indexOf(imdbID);
    var movieMatch = utellyResults[0].results[movieIndex];
    if (typeof omdbPoster[omdbIndex] !== 'undefined') {
        var moviePic = omdbPoster[omdbIndex];
    } else {
        var moviePic = movieMatch.picture;
    }
    if (!moviePic) {
        var moviePic = "https://php7.joblo.com/assets/images/movie-database/placeholder.jpg";
    }
    var movieTitle = movieMatch.name;
    var imdbLink = movieMatch.external_ids.imdb.url;
    var searchID = movieMatch.external_ids.imdb.id;
    // grab id in url
    var fullURL = window.location.pathname;
    var halfURL = fullURL.split('/', 2);
    var userID = halfURL[1];

    var addedMovie = {
        movie: movieTitle,
        image: moviePic,
        imdb: imdbLink,
        imdbID: searchID,
        watched: false,
        loved: false,
        UserId: userID
    };
    API.saveExample(addedMovie).then(function () {
        refreshLists();
        $('#movie-view').prepend('<div class="alert alert-success border-0" id="success-alert"><button type="button" class="close" data-dismiss="alert"><i class="fa fa-check-square-o text-white" aria-hidden="true"></i></button>Added to watchlist</div>');
        $("#success-alert").fadeTo(1000, 500).slideUp(500, function () {
        $("#success-alert").slideUp(500);
        });
    });
};

// Details button omdb call
var detailsModal = function () {
    $('#modal-title').hide();
    $('#modal-body').hide();
    var imdbID = $(this).attr('value');
    // Runs a new omdb search by id to get plot & ratings data
    var newURL = "https://www.omdbapi.com/?i=" + imdbID + "&plot=long&tomatoes&apikey=trilogy";
    $.ajax({
        url: newURL,
        method: "GET"
    }).then(function (response) {
        $('#modal-title').show();
        $('#modal-body').show();
        for (var i = 0; i < utellyIdArray.length; i++) {
            $('#modal-title' + [i]).html(response.Title + '<div class="year">' + response.Year + '</div');
            $('#modal-body' + [i]).html('<div class="col-12"><img class="img-fluid w-100" src="' + response.Poster + '"></div><div class="p-3">' + response.Plot + '</div>');
        }
    });
};

// Where to watch button click utelly search
var whereToWatch = function () {
    // clear out modal
    $('.modal-title').html("");
    $('.modal-body').html("");
    $('.modal-icon-div').html("");
    var imdbID = $(this).attr("data-id");
    var search = {
        search: imdbID
    };
    API.saveSearch(search).then(function () {
        API.getMovieByID(imdbID).then(function (response) {
            var locations = response.collection.locations;
            $('.modal-title').text(response.collection.name);
            $('.modal-body').html('<img class="img-fluid mb-3 rounded" src="' + response.collection.picture + '">');
            var modalIcons = $('<div class="modal-icon-div row">');
            for (var i = 0; i < locations.length; i++) {
                var location = locations[i].display_name;
                // Divides streaming subscriptions from rent/buy
                if (location === 'Netflix' || location === 'Amazon Prime Video' || location === 'Disney+' || location === 'HBO') {
                    $(modalIcons).append('<a target="_blank" class="modal-streaming" href=' +
                        locations[i].url + '><img class="modal-icons img-fluid" src=' +
                        locations[i].icon + '></a><br>');
                    // Gives Hulu a custom icon
                } else if (location === 'Hulu') {
                    $(modalIcons).append('<a target="_blank" class="modal-streaming" href=' +
                        locations[i].url + '><img class="modal-icons img-fluid" src="/images/hulu.png"></a><br>');
                    // Gives Vudu a custom icon
                } else if (location === 'VuduIVAUS') {
                    $(modalIcons).append('<a target="_blank" class="modal-streaming" href=' +
                        locations[i].url + '><img class="modal-icons img-fluid" src="/images/vudu.png"></a><br>');
                    // Uses text if icons don't exist
                } else if (location === 'AtomTicketsIVAUS' || location === 'NOT_SETIVAUS' || location === 'HBOMaxIVAUS' || location === 'HBOGoIVAUS') {
                    $(modalIcons).append('<a target="_blank" class="modal-rent-buy" href=' +
                        locations[i].url + '><img class="modal-icons img-fluid" src=' +
                        locations[i].display_name + '></a><br>');
                    // Returns rent/buy options
                } else {
                    $(modalIcons).append('<a target="_blank" class="modal-rent-buy" href=' +
                        locations[i].url + '><img class="modal-icons img-fluid" src=' +
                        locations[i].icon + '></a><br>');
                }
            }
            $('.modal-body').append(modalIcons);
        });
    });
};

// add to loved list
var markAsLoved = function () {
    var movieID = $(this).attr("data-id");
    var newLove = $(this).data("newlove");
    if (newLove === "true") {
        $("#loved").removeClass("fa-heart-o");
        $("#loved").addClass("fa-heart");
    } else {
        $("#loved").removeClass("fa-heart");
        $("#loved").addClass("fa-heart-o");
    }
    var newLoved = {
        loved: newLove
    };
    API.lovedMovie(movieID, newLoved).then(function () {
        refreshLists();
    });
};

// Find movie
$("#find-movie").on("click", function (event) {
    event.preventDefault();
    $('#find-movie').val("");
    $(".tabcontent").hide();
    $("#movie-view").empty();
    omdbResults = [];
    utellyResults = [];
    omdbIdArray = [];
    utellyIdArray = [];
    omdbPoster = [];

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
    });

    var search = {
        search: movie
    };

    // Utelly search
    API.saveSearch(search).then(function () {
        API.getMovie(movie).then(function (response) {
            utellyResults.push(response);
            var utelly = utellyResults[0].results;
            for (var i = 0; i < utelly.length; i++) {
                var imdbID = utelly[i].external_ids.imdb.id;
                utellyIdArray.push(imdbID);
                var omdbIndex = omdbIdArray.indexOf(imdbID);
                var omdbMatch = omdbResults[0].Search[omdbIndex];
                // adds year if available
                if (omdbMatch) {
                    omdbPoster.push(omdbMatch.Poster);
                    var movieTitle = '<div class="movie-header"><div class="movie-title">' + omdbMatch.Title + '</div><div class="movie-year">' + omdbMatch.Year + '</div></div>';
                } else {
                    var movieTitle = '<div class="movie-header"><div class="movie-title">' + utelly[i].name + '</div><div class="movie-year"></div></div>';
                }
                // creates html elements
                var movieDiv = $('<div class="movie-list">');
                var bgOverlay = $('<div class="bg-overlay">');
                $(movieDiv).attr('id', imdbID);
                $(movieDiv).attr('value', [i]);
                $(movieDiv).css('background-image', 'url(' + utelly[i].picture + ')');
                var imdbLink = '<a target="_blank" href=' + utelly[i].external_ids.imdb.url + '><img class="location-icon img-fluid" src="https://img.icons8.com/all/500/imdb.png"></a>';
                var buttonDiv = $('<div class="watch-details-buttons">');
                var watchButton = '<button id="' + [i] + '" value="' + imdbID + '" class="btn btn-primary watch-button" data-toggle="modal" data-target="#alertModal">Add to Watchlist</button>';
                var detailsButton = '<button id="movieDetails' + [i] + '" value="' + imdbID + '" class="btn btn-primary details-button" data-toggle="modal" data-target="#movieModal' + [i] + '">Details</button>';
                var locationList = $('<div class="location-list row">');
                var streamingIcons = $('<div class="streaming-list col-6"><div class="stream-heading" id="stream">Stream</div><div>');
                var locationIcons = $('<div class="rent-or-buy-list col-6"><div class="rent-heading" id="rent-buy">Rent | Buy</div><div>');
                // Goes through streaming providers
                for (var j = 0; j < utelly[i].locations.length; j++) {
                    var provider = utelly[i].locations[j].display_name;
                    // Divides streaming subscriptions from rent/buy
                    if (utelly[i].locations[j].icon) {
                        var locationName = utelly[i].locations[j].icon;
                    } else {
                        var locationName = utelly[i].locations[j].display_name;
                    }

                    if (provider === 'Netflix' || provider === 'Amazon Prime Video' || provider === 'Disney+' || provider === 'HBO') {
                        $(streamingIcons).append('<a target="_blank" class="streaming-link" href=' +
                            utelly[i].locations[j].url + '><img class="location-icon img-fluid" src=' +
                            locationName + '></a><br>');
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
                            locationName + '></a><br>');
                    }
                    $(locationList).append(streamingIcons, locationIcons);
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
            }
        });
    });
});

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

// Add event listeners to the update, delete, and details buttons
$(document).on("click", ".delete", handleDeleteBtnClick);
$(document).on("click", ".change-watch", changeWatch);
$(document).on("click", "#where-to-watch", whereToWatch);
$(document).on('click', '.watch-button', addToWatchList);
$(document).on("click", ".change-loved", markAsLoved);
$(document).on("click", ".details-button", detailsModal);