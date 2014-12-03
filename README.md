# node-vantage

**node-vantage** is a dead simple Davis Vantage driver for Node.js.

## How to use
```js
var driver = require('node-vantage')();
driver.on('connect', function() {
  console.log('Connected to the Vantage');
  driver.on('loop', function(loop) {
    console.log(loop);
  });
});
```

## TODO
- Custom settings
- Multiple unit systems
- Push commands (reset, alarms...)