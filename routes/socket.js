'use strict';
let userNames = (function()
{
    let names = {};
    let claim = (name) => 
    {
        if (!name || names[name])
        {
            return false;
        }
        else
        {
            names[name] = true;
            return true;
        }
    };

    let getGuestName =  () => 
    {
        let name, 
        nextUserId = 1;
        do
        {
            name = 'Guest ' + nextUserId;
            nextUserId += 1;
        } while (!claim(name));
        return name;
    };

    let get = () => 
    {
        let res = [];
        for (let user in names)
        {
            res.push(user);
        }
        return res;
    };

    let free = (name) => 
    {
        if (names[name])
        {
            delete names[name];
        }
    };
    return {
    claim: claim,
    free: free,
    get: get,
    getGuestName: getGuestName
  };
}());

module.exports =  (socket) => 
{
    let name = userNames.getGuestName();

    socket.emit('init',
    {
        name, users: userNames.get()
    });

    socket.broadcast.emit('user:join',{name});
    socket.on('send:message',  (data) => 
    {
        socket.broadcast.emit('send:message',
        {
            user: name,
            text: data.text
        });
    });

    socket.on('change:name', (data, fn) => 
    {
        if (userNames.claim(data.name))
        {
            let oldName = name; 
            userNames.free(oldName);
            name = data.name;
            socket.broadcast.emit('change:name',
            {
                oldName, newName: name
            });
            fn(true);
        }
        else
        {
            fn(false);
        }
    });

    socket.on('disconnect', () => 
    {
        socket.broadcast.emit('user:left', {name});
        userNames.free(name);
    });
};
