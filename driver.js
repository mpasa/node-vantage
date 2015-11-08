var util         = require('util');
var conversor    = require('./conversor');
var EventEmitter = require('events').EventEmitter;
var SerialPort   = require('serialport').SerialPort;

/**
 * Parses a raw buffer from the Vantage an emits events depending on the nature of the buffer
 * To see the Vantage protocol:
 * http://www.davisnet.com/support/weather/download/VantageSerialProtocolDocs_v261.pdf
 * @param  {EventEmitter} emitter
 * @param  {Buffer}       buffer
 */
var parser = function(emitter, buffer) {

    /**
     * Checks if the buffer is a loop and also the first one
     * @return {Boolean}
     */
    var isFirstLoop = function() {
        return buffer.length === 100 && buffer.toString('utf8', 1, 4) === 'LOO';
    };

    /**
     * Checks if the buffer is a loop
     * @return {Boolean}
     */
    var isLoop = function() {
        return isFirstLoop(buffer) || buffer.length === 99 && buffer.toString('utf8', 0, 3) === 'LOO';
    };

    if (isLoop()) {
        var m = isFirstLoop(buffer) ? 1 : 0;
        emitter.emit('loop', {
            barometer:      buffer.readUInt16LE(7+m) / 1000,
            inTemperature:  buffer.readUInt16LE(9+m) / 10,
            inHumidity:     buffer.readInt8(11+m),
            outTemperature: buffer.readUInt16LE(12+m) / 10,
            windSpeed:      buffer.readInt8(14+m),
            windDirection:  buffer.readUInt16LE(16+m),
            outHumidity:    buffer.readInt8(33+m),
            dayRain:        buffer.readUInt16LE(50+m),
            rainRate:       buffer.readUInt16LE(41+m),
            forecast:       buffer.readInt8(89+m),
            crc:            buffer.readUInt16LE(97+m)
        });
    }
};

function Driver() {

    var driver    = this;
    var connected = false;
    var options   = {
        port:      '/dev/ttyUSB0',
        baudrate:  19200,
        loopEvery: 2500,
        units:     'metric'
    };

    var vantage   = new SerialPort(options.port, {
        baudrate: options.baudrate,
        parser:   parser
    }, false);

    /**
     * Sends a command through the serial port to the station
     * To see all available commands, see:
     * http://www.davisnet.com/support/weather/download/VantageSerialProtocolDocs_v261.pdf
     * @param  {String}   command
     */
    this.sendCommand = function(command) {
        if (!connected) throw new Exception('Cannot send commands to the Vantage if it is not connected');
        vantage.write(command + "\n");
    };

    /**
     * Sets the state of the station lamp
     * @param {Boolean} b
     */
    this.setLamp = function(b) {
        var state = b ? '1' : '0';
        this.sendCommand('LAMPS ' + state);
    };

    /**
     * Requests a data loop
     * @return {Promise}
     */
    this.requestLoop = function() {
        this.sendCommand('LOOP 1');
    };

    this.requestDump = function() {
        this.sendCommand('DMP');
    };

    /**
     * Opens the serial connection with the Vantage
     * A connect event is emitted afterwards, with an error as parameter or null
     */
    vantage.open(function(error) {
        if (!error) {
            connected = true;
            if (options.loopEvery) {
                setInterval(function() {
                    driver.requestLoop();
                }, options.loopEvery);
            }
            driver.emit('connect', null);
        } else {
            driver.emit('connect', error);
        }
    });

    /**
     * Event executed when a new loop arrives
     * Another loop event is emitted afterwards, with the final data (datetime and conversions applied)
     */
    vantage.on('loop', function(loop) {
        // @todo CRC check
        var data = {
            datetime:       new Date(),
            barometer:      conversor.convert('p', loop.barometer),
            inTemperature:  conversor.convert('t', loop.inTemperature),
            inHumidity:     loop.inHumidity,
            outTemperature: conversor.convert('t', loop.outTemperature),
            windSpeed:      conversor.convert('w', loop.windSpeed),
            windDirection:  loop.windDirection,
            outHumidity:    loop.outHumidity,
            dayRain:        conversor.convert('pp', loop.dayRain),
            rainRate:       conversor.convert('pp', loop.rainRate),
            forecast:       loop.forecast,
        };
        driver.emit('loop', data);
    });

}

util.inherits(Driver, EventEmitter);
module.exports = Driver;