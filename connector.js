(function () {
    'use strict';

    var config = {
      clientId: '7cba9e9293584569bbce7a4fe57345df',
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

        $('#login').click(function () {
            instagramLoginRedirect()
        });

        $('#get-data').click(function () {
            tableau.connectionName = 'Instagram Feed';
            tableau.submit();    
        });

        $('#change-token').click(function () {
            tableau.password = 'sadas';
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
          $('#login').css('display', 'none');
          $('#get-data').css('display', 'block');
      } else {
          $('#login').css('display', 'block');
          $('#get-data').css('display', 'none');
      }
  }

    var myConnector = tableau.makeConnector();

    myConnector.init = function(initCallback) {
        tableau.authType = tableau.authTypeEnum.custom;


        if (tableau.phase == tableau.phaseEnum.gatherDataPhase) {
            // Check if token is still valid
            getAccountInfo(function(error, data) {
                if (error) {
                    console.log(error)
                    // if status_code ==
                    // tableau.abortForAuth();
                }
            });
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
        var postsTableCols = [
            { id: 'id', alias: 'Id', dataType: tableau.dataTypeEnum.string },
            { id: 'type', alias: 'Type', dataType: tableau.dataTypeEnum.string },
            { id: 'username', alias: 'Username', dataType: tableau.dataTypeEnum.string },
            { id: 'created_time', alias: 'Created Time', dataType: tableau.dataTypeEnum.datetime },
            { id: 'text', alias: 'Text', dataType: tableau.dataTypeEnum.string },
            { id: 'image_count', alias: 'Image Count', dataType: tableau.dataTypeEnum.string },
            { id: 'likes', alias: 'Number of Likes', dataType: tableau.dataTypeEnum.int },
            { id: 'comments', alias: 'Number of Comments', dataType: tableau.dataTypeEnum.int },
            { id: 'tags', alias: 'Tags', dataType: tableau.dataTypeEnum.string },
            { id: 'filter', alias: 'Filter', dataType: tableau.dataTypeEnum.string },
            { id: 'link', alias: 'Link', dataType: tableau.dataTypeEnum.string }
        ];

        var postsTableInfo = {
            id: 'instagramPosts',
            alias: 'Instagram Posts',
            columns: postsTableCols
        };

        var instagramAccountInfoCols = [
            { id: 'bio', alias: 'Bio', dataType: tableau.dataTypeEnum.string },
            { id: 'media_count', alias: 'Media Count', dataType: tableau.dataTypeEnum.int },
            { id: 'follow_count', alias: 'Follow Count', dataType: tableau.dataTypeEnum.int},
            { id: 'follower_count', alias: 'Follower Count', dataType: tableau.dataTypeEnum.int }
        ];

        var accountInfoTableInfo = {
            id: 'instagramAccountInfo',
            alias: 'Instagram Account Info',
            columns: instagramAccountInfoCols
        };

        schemaCallback([postsTableInfo, accountInfoTableInfo]);
    };

    function formatPosts(posts) {
        var formattedPosts = []

        for (var i = 0; i < posts.length; i++) {
            formattedPosts.push({
                'id': posts[i].id,
                'type': posts[i].type,
                'username': posts[i].user.username,
                'created_time': new Date(parseInt(posts[i].created_time) * 1000),
                'text': posts[i].caption.text ? posts[i].caption.text : '',
                'image_count': posts[i].carousel_media ? posts[i].carousel_media.length : 1,
                'likes': posts[i].likes.count,
                'comments': posts[i].comments.count,
                'tags': posts[i].tags.toString(),
                'filter': posts[i].filter,
                'link': posts[i].link,
            });
        }
        return formattedPosts
    }

    function getPosts(url, callback) {
        var posts = []
        var request = $.get(url);

        request.done(function(data) {
            if (data.data) {
                posts = posts.concat(data.data)
            }

            if (data.pagination && data.pagination.next_url) {
                getPosts(data.pagination.next_url, function(error, data) {
                    if (error) {
                        return callback(error)
                    }
                    if (data) {
                        posts = posts.concat(data)
                    }
                })
            } 
            callback(null, posts);
        });

        request.fail(function(error) {
            callback(error);
        });
    }

    function formatAccountInfo(accountInfo) {
        return {
            bio: accountInfo.bio,
            media_count: accountInfo.counts.media,
            follow_count: accountInfo.counts.follows,
            follower_count: accountInfo.counts.followed_by
        };
    }

    function getAccountInfo(callback) {
        var url = config.baseUrl + '/v1/users/self' + '?access_token=' + tableau.password;
        var request = $.get(url);

        request.done(function(data) {
            callback(null, data.data);
        });

        request.fail(function(error) {
            callback(error);
        });
    }

    myConnector.getData = function (table, doneCallback) {
        if (table.tableInfo.id === 'instagramPosts') {
            var url = config.baseUrl + '/v1/users/self/media/recent' + '?access_token=' + tableau.password;
            getPosts(url, function(error, posts) {
                if (error) {
                    throw error;
                }
                console.log(posts);
                var formattedPosts = formatPosts(posts);
                table.appendRows(formattedPosts);
                doneCallback();
            })

        }
        
        if (table.tableInfo.id == 'instagramAccountInfo') {
            getAccountInfo(function(error, accountInfo) {
                if (error) {
                    throw error;
                }
                var formattedAccountInfo = formatAccountInfo(accountInfo);
                table.appendRows([formattedAccountInfo]);
                doneCallback();
            });
        }
    };

    tableau.registerConnector(myConnector);
})();
