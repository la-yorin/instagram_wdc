(function () {
    'use strict';

    var config = {
      // clientId: '7cba9e9293584569bbce7a4fe57345df',
      clientId: 'a9a99541b5a94530b7af76053e1b844b',
      redirectUri: 'https://la-yorin.github.io/instagram_wdc',
      authUrl: 'https://api.instagram.com'
    };


    $(document).ready(function () {
        var accessToken = ''

        if((window.location.href).indexOf('#') != -1) {
            var queryString = (window.location.href).substr((window.location.href).indexOf('?') + 1); 
            var value = (queryString.split('='))[1];
            accessToken = decodeURIComponent(value);
        }
        console.log(accessToken)
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
        var url = config.authUrl + '/oauth/authorize/?client_id=' + config.clientId +
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


        // if (tableau.phase == tableau.phaseEnum.authPhase) {
        //     $("#getvenuesbutton").css('display', 'none');
        // }

        // if (tableau.phase == tableau.phaseEnum.gatherDataPhase) {
        // If the API that WDC is using has an endpoint that checks
        // the validity of an access token, that could be used here.
        // Then the WDC can call tableau.abortForAuth if that access token
        // is invalid.
         // tableau.abortForAuth
        // call secured endpoint and check response.
       // }

        var accessToken = ''
        if((window.location.href).indexOf('#') != -1) {
            var queryString = (window.location.href).substr((window.location.href).indexOf('?') + 1); 
            var value = (queryString.split('='))[1];
            accessToken = decodeURIComponent(value);
        }

        console.log(accessToken)

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
        ];

        var tableInfo = {
            id : "instagramFeed",
            alias : "Instagram Feed",
            columns : cols
        };

        schemaCallback([tableInfo]);
    };

    myConnector.getData = function (table, doneCallback) {
        var data = [
            {
                'username': "Bart"
            }
        ]
        table.appendRows(data)


        // tableau.abortForAuth
        doneCallback()
    };

    tableau.registerConnector(myConnector);
})();
