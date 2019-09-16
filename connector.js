(function () {
    'use strict';

    var config = {
      clientId: '7cba9e9293584569bbce7a4fe57345df',
      // clientId: 'a9a99541b5a94530b7af76053e1b844b',
      redirectUri: 'https://la-yorin.github.io/instagram_wdc/',
      baseUrl: 'https://api.instagram.com'
    };


  $(document).ready(function() {

        if((window.location.href).indexOf('#') != -1) {
            var queryString = (window.location.href).substr((window.location.href).indexOf('?') + 1); 
            var value = (queryString.split('='))[1];
            var accessToken = decodeURIComponent(value);
        }
        var hasAuth = accessToken && accessToken.length > 0;
        updateUIWithAuthState(hasAuth);

        $("#login").click(function () {
            instagramLoginRedirect()
        });

        $("#get-data").click(function () {
            tableau.connectionName = "Instagram Feed";
            tableau.submit();    
        });
    });


    function instagramLoginRedirect() {
        var appId = config.clientId;
        if (tableau.authPurpose === tableau.authPurposeEnum.ephemerel) {
            appId = config.clientId;
        } else if (tableau.authPurpose === tableau.authPurposeEnum.enduring) {
            appId = config.clientId; // This should be the Tableau Server appID
        }

        var url = config.baseUrl + '/oauth/authorize/?client_id=' + config.clientId +
            '&redirect_uri=' + config.redirectUri +'&response_type=token&scope=basic';
      window.location.href = url;
    }

    function updateUIWithAuthState(hasAuth) {
      if (hasAuth) {
          $("#login").css('display', 'none');
          $("#get-data").css('display', 'block');
      } else {
          $("#login").css('display', 'block');
          $("#get-data").css('display', 'none');
      }
  }

    var myConnector = tableau.makeConnector();

    myConnector.init = function(initCallback) {
        tableau.authType = tableau.authTypeEnum.custom;


        if (tableau.phase == tableau.phaseEnum.gatherDataPhase) {
        // If the API that WDC is using has an endpoint that checks
        // the validity of an access token, that could be used here.
        // Then the WDC can call tableau.abortForAuth if that access token
        // is invalid.
        //  tableau.abortForAuth
        // call secured endpoint and check response.

        // .....?
       }

        var accessToken = ''
        if((window.location.href).indexOf('#') != -1) {
            var queryString = (window.location.href).substr((window.location.href).indexOf('?') + 1); 
            var value = (queryString.split('='))[1];
            accessToken = decodeURIComponent(value);
        }

        var hasAuth = (accessToken && accessToken.length > 0) || tableau.password.length > 0;
        updateUIWithAuthState(hasAuth);


        initCallback();

        if (tableau.phase == tableau.phaseEnum.interactivePhase || tableau.phase == tableau.phaseEnum.authPhase) {
          if (hasAuth) {
              tableau.password = accessToken;

              if (tableau.phase == tableau.phaseEnum.authPhase) {
                // Auto-submit here if we are in the auth phase
                tableau.submit()
              }

              return;
          }
      }
    }

    myConnector.getSchema = function (schemaCallback) {
        var cols = [
            { id: 'id', alias: 'id', dataType: tableau.dataTypeEnum.string},
            { id : "username", alias : "username", dataType : tableau.dataTypeEnum.string},
            { id : "filter", alias : "filter", dataType : tableau.dataTypeEnum.string },
            { id : "likes", alias : "Number of likes", dataType : tableau.dataTypeEnum.float },
            { id : "tags", alias : "tags", dataType : tableau.dataTypeEnum.string },
            { id : "created_time", alias : "Created Time", dataType : tableau.dataTypeEnum.datetime },
            { id : "link", alias : "Link", dataType : tableau.dataTypeEnum.string },
            { id : "location", alias : "location", dataType : tableau.dataTypeEnum.string },
            { id : "nr_comments", alias : "number of Comments", dataType : tableau.dataTypeEnum.float },
            { id : "text", alias : "Text", dataType : tableau.dataTypeEnum.string },
            { id : "image_url", alias : "Image URL", dataType : tableau.dataTypeEnum.string },
            { id: 'type', alias: 'Type', dataType: tableau.dataTypeEnum.string }
        ];

        var tableInfo = {
            id : "instagramFeed",
            alias : "Instagram Feed",
            columns : cols
        };

        schemaCallback([tableInfo]);
    };

    function formatPosts(posts) {
        var formattedPosts = []

        for (const post of posts) {
            var text = ''
            if (post.caption ) {
                text = post.caption.text.toString();
            }
            var date = new Date(parseInt(post.created_time) * 1000);

            formattedPosts.push({
                "username": post.user.username,
                "filter": post.filter,
                "likes": post.likes.count,
                "tags": post.tags.toString(),
                "created_time": date,
                "link": post.link,
                "nb_comments": post.comments.count,
                "text": text,
                "image_url": post.images.low_resolution.url,
            });
        }
        return formattedPosts
    }

    myConnector.getData = function (table, doneCallback) {
        var url = config.baseUrl + '/v1/users/self/media/recent' + '?access_token=' + tableau.password
        console.log(url)
        var request = $.get(url);

        request.done(function(data) {
            console.log(data)
            var posts = data.data

            var formattedPosts = formatPosts(posts)
            table.appendRows(formattedPosts)

            // tableau.abortForAuth
            doneCallback()
        });

        request.fail(function(error) {
            console.log(error)
        })

    };

    tableau.registerConnector(myConnector);
})();
