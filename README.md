# node-vantage

**node-vantage** is a dead simple Davis Vantage driver for Node.js.

## How to use
```js
var Driver = require("node-vantage");
var driver = new Driver();

driver.on("connect", function(error) {
	if (!error) {
        console.log("Connected to the Vantage");
        driver.on("loop", function(loop) {
            console.log(loop);
        });
	} else {
        console.log("Failed connecting to the Vantage: " + error);
	}
});
```

## TODO
- Custom settings
- Multiple unit systems
- Push commands (reset, alarms...)